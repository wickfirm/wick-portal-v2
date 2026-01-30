// src/app/api/jarvis/telegram/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Send message to Telegram
async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

// Process message with Claude
async function processMessage(chatId: number, text: string, telegramUserId: number) {
  try {
    // HARDCODED FOR TESTING - Your user ID
    const user = {
      id: "cmjr6w9gx0001h2g0tta6h37g",
      agencyId: "agency-wick", // Update with your actual agency ID if needed
      name: "MBzle",
    };

    await sendMessage(chatId, "🤔 *Jarvis is thinking...*");

    // Use Claude to understand intent
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are Jarvis, an AI assistant for Omnixia (a project management platform for digital agencies).

Parse user requests and extract structured data.

SUPPORTED ACTIONS:
1. create_note - Add sticky notes
2. create_client - Add new clients (asks for missing required info)
3. create_task - Add tasks
4. query - Answer questions about data
5. help - Show what you can do

RESPONSE FORMAT (JSON only):
{
  "action": "create_note" | "create_client" | "create_task" | "query" | "help" | "unknown" | "needs_info",
  "data": {
    // For create_note:
    "title": "optional short title",
    "content": "full note text",
    "tags": ["tag1", "tag2"],
    "color": "yellow" | "pink" | "blue" | "green" | "purple",
    "isPinned": false
    
    // For create_client - extract ALL available info:
    "name": "REQUIRED - Client/Company Name",
    "nickname": "optional short name",
    "email": "optional",
    "phone": "optional",
    "company": "optional if different from name",
    "website": "optional",
    "industry": "optional",
    "primaryContact": "optional contact person name",
    "primaryEmail": "optional contact person email",
    "monthlyRetainer": "optional decimal",
    "status": "LEAD" | "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED" (default: LEAD),
    "pricingModel": "FIXED_FEE" | "TIME_AND_MATERIALS" (default: TIME_AND_MATERIALS),
    "revenueModel": "CLIENT_LEVEL" | "PROJECT_BASED" (default: PROJECT_BASED),
    "notes": "optional internal notes"
    
    // For create_task:
    "name": "Task name",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "dueDate": "YYYY-MM-DD or null"
  },
  "missing_fields": ["field1", "field2"],  // Only for needs_info action
  "message": "Friendly confirmation or question to send user"
}

IMPORTANT FOR CLIENTS:
- If user provides name → create client immediately with available data
- Don't ask for optional fields unless user seems to have the info
- Extract everything mentioned (email, phone, website, etc.)
- Use smart defaults: status=LEAD, pricingModel=TIME_AND_MATERIALS

EXAMPLES:
"add note: meeting went well" → create_note
"create client Acme Corp, email info@acme.com, website acme.com, retainer 5000" → create_client with all fields
"add client Tech Startup" → create_client with just name
"what tasks do I have?" → query`,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }
    
    // Strip markdown code blocks if present
    let aiText = textBlock.text;
    aiText = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const result = JSON.parse(aiText);

    // Execute the action
    switch (result.action) {
      case "create_note":
        await createNote(result.data, user.id, user.agencyId);
        await sendMessage(chatId, `✅ *Note Created!*\n\n${result.message}`);
        break;

      case "create_client":
        await createClient(result.data, user.id, user.agencyId);
        await sendMessage(chatId, `👥 *Client Created!*\n\n${result.message}`);
        break;

      case "create_task":
        await sendMessage(chatId, `✅ *Task Creation Coming Soon!*\n\nTasks require a client. We'll add this next with:\n"Create task for [client name]: [task details]"`);
        break;

      case "query":
        await sendMessage(chatId, `🔍 *${result.message}*\n\n(Queries coming in Phase 3!)`);
        break;

      case "help":
        await sendMessage(
          chatId,
          `🤖 *Jarvis - Your Omnixia Assistant*\n\n` +
            `*What I can do:*\n` +
            `✅ Create notes from text\n` +
            `🚧 Create clients (coming soon)\n` +
            `🚧 Create tasks (coming soon)\n` +
            `🚧 Answer questions (coming soon)\n\n` +
            `*Try saying:*\n` +
            `• "Add a note: follow up with client"\n` +
            `• "Create client Acme Corp, email info@acme.com"\n` +
            `• "What tasks do I have today?"`
        );
        break;

      default:
        await sendMessage(chatId, `❓ ${result.message || "I didn't understand. Try 'help' to see what I can do."}`);
    }
  } catch (error) {
    console.error("Jarvis error:", error);
    await sendMessage(chatId, "❌ Sorry, I encountered an error. Please try again.");
  }
}

// Create note in database
async function createNote(data: any, userId: string, agencyId: string | null | undefined) {
  await prisma.note.create({
    data: {
      title: data.title || null,
      content: data.content,
      color: data.color || "yellow",
      isPinned: data.isPinned || false,
      tags: data.tags || [],
      createdBy: userId,
      agencyId: agencyId || null,
    },
  });
}

// Create client in database
async function createClient(data: any, userId: string, agencyId: string | null | undefined) {
  await prisma.client.create({
    data: {
      // Required
      name: data.name,
      
      // Optional fields - use what's provided
      nickname: data.nickname || data.company || null,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      website: data.website || null,
      industry: data.industry || null,
      primaryContact: data.primaryContact || null,
      primaryEmail: data.primaryEmail || null,
      monthlyRetainer: data.monthlyRetainer ? parseFloat(data.monthlyRetainer) : null,
      
      // Relation
      agencies: {
        create: {
          agencyId: agencyId || "",
        },
      },
    },
  });
}

// Webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Telegram webhook:", JSON.stringify(body, null, 2));

    if (body.message) {
      const chatId = body.message.chat.id;
      const telegramUserId = body.message.from.id;
      const text = body.message.text;

      if (text) {
        // Handle /start command
        if (text === "/start") {
          await sendMessage(
            chatId,
            `👋 *Welcome to Jarvis!*\n\nI'm your Omnixia AI assistant.\n\nTry:\n• "Add a note: meeting notes"\n• "help" for more commands`
          );
          return NextResponse.json({ ok: true });
        }

        // Process the message
        await processMessage(chatId, text, telegramUserId);
      }

      // Voice messages
      if (body.message.voice) {
        await sendMessage(chatId, "🎤 *Transcribing your voice message...*");
        
        try {
          // Get voice file from Telegram
          const fileId = body.message.voice.file_id;
          const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
          const fileData = await fileRes.json();
          
          if (!fileData.ok) {
            throw new Error("Failed to get file from Telegram");
          }
          
          // Download the audio file
          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
          const audioRes = await fetch(fileUrl);
          const audioBuffer = await audioRes.arrayBuffer();
          
          // Transcribe with OpenAI Whisper
          const transcript = await transcribeAudio(audioBuffer);
          
          await sendMessage(chatId, `📝 *Transcribed:*\n"${transcript}"\n\n_Processing..._`);
          
          // Process with Claude
          const telegramUserId = body.message.from.id;
          await processMessage(chatId, transcript, telegramUserId);
        } catch (error) {
          console.error("Voice transcription error:", error);
          await sendMessage(chatId, "❌ Failed to transcribe voice message. Please try again or send text.");
        }
        
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }
  
  // Convert ArrayBuffer to File/Blob
  const blob = new Blob([audioBuffer], { type: "audio/ogg" });
  
  // Create FormData for Whisper API
  const formData = new FormData();
  formData.append("file", blob, "voice.ogg");
  formData.append("model", "whisper-1");
  
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("Whisper API error:", error);
    throw new Error("Failed to transcribe audio");
  }
  
  const data = await response.json();
  return data.text;
}

export async function GET() {
  return NextResponse.json({ status: "Jarvis online ✓" });
}
