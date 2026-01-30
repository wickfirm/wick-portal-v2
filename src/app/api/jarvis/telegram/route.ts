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
2. create_client - Add new clients
3. create_task - Add tasks
4. query - Answer questions about data
5. help - Show what you can do

RESPONSE FORMAT (JSON only):
{
  "action": "create_note" | "create_client" | "create_task" | "query" | "help" | "unknown",
  "data": {
    // For create_note:
    "title": "optional short title",
    "content": "full note text",
    "tags": ["tag1", "tag2"],
    "color": "yellow" | "pink" | "blue" | "green" | "purple",
    "isPinned": false
    
    // For create_client:
    "name": "Client Name",
    "company": "Company Name",
    "email": "email@example.com",
    "phone": "optional",
    "website": "optional"
    
    // For create_task:
    "name": "Task name",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "dueDate": "YYYY-MM-DD or null"
  },
  "message": "Friendly confirmation to send user"
}

EXAMPLES:
"add note: meeting went well" → create_note with content
"create client Acme Corp, email info@acme.com" → create_client
"what tasks do I have?" → query
"help" → help`,
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
        await sendMessage(chatId, `📋 *${result.message}*\n\n(Client creation coming in Phase 2!)`);
        break;

      case "create_task":
        await sendMessage(chatId, `✅ *${result.message}*\n\n(Task creation coming in Phase 2!)`);
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
        await sendMessage(
          chatId,
          "🎤 *Voice notes coming soon!*\n\nFor now, send text like:\n'Add a note: your note here'"
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

export async function GET() {
  return NextResponse.json({ status: "Jarvis online ✓" });
}
