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
3. update_client - Update existing client details
4. get_client - Get client details (if multiple found, lists them)
5. select_client - Select client by number from list
6. create_task - Add tasks
7. query - Answer questions about data
8. help - Show what you can do

RESPONSE FORMAT (JSON only):
{
  "action": "create_note" | "create_client" | "update_client" | "get_client" | "select_client" | "create_task" | "query" | "help" | "unknown",
  "data": {
    // For create_note:
    "title": "optional short title",
    "content": "full note text",
    "tags": ["tag1", "tag2"],
    "color": "yellow" | "pink" | "blue" | "green" | "purple",
    "isPinned": false
    
    // For create_client:
    "name": "REQUIRED - Client/Company Name",
    "email": "optional",
    "phone": "optional",
    "website": "optional"
    
    // For update_client:
    "clientName": "REQUIRED - Name to search for",
    "updates": {
      "email": "new email",
      "phone": "new phone", 
      "website": "new website"
    }
    
    // For get_client:
    "clientName": "REQUIRED - Name to search for"
    
    // For select_client:
    "clientNumber": "REQUIRED - Number from list (1, 2, 3, etc)"
    
    // For create_task:
    "name": "Task name",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "dueDate": "YYYY-MM-DD or null"
  },
  "message": "Friendly confirmation or question to send user"
}

IMPORTANT:
- If user sends just a number (1, 2, 3), use select_client action
- Get client searches by name, if multiple found lists them

EXAMPLES:
"show me details for Acme" → get_client (might list multiple if ambiguous)
"1" → select_client (after seeing a list)
"update Acme Corp: add email info@acme.com" → update_client
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

      case "update_client":
        await updateClient(result.data, user.agencyId);
        await sendMessage(chatId, `✏️ *Client Updated!*\n\n${result.message}`);
        break;

      case "get_client":
        const clientInfo = await getClient(result.data, user.agencyId, chatId);
        await sendMessage(chatId, clientInfo);
        break;

      case "select_client":
        const selectedClientInfo = await selectClient(result.data, user.agencyId, chatId);
        await sendMessage(chatId, selectedClientInfo);
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
  // Generate friendly client ID from name
  const baseSlug = (data.name || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let clientId = `client-${baseSlug}`;
  let counter = 1;
  while (await prisma.client.findUnique({ where: { id: clientId } })) {
    clientId = `client-${baseSlug}-${counter}`;
    counter++;
  }

  const client = await prisma.client.create({
    data: {
      id: clientId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      agencies: {
        create: {
          agencyId: agencyId || "",
        },
      },
    },
  });

  // Auto-add creator to client team
  await prisma.clientTeamMember.create({
    data: {
      clientId: client.id,
      userId: userId,
    },
  });

  // Auto-create "Admin/Operations" default project via raw SQL
  // (avoids Prisma enum type mismatch with PricingModel)
  try {
    const projId = `proj-${clientId}-default`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO projects (id, name, description, "clientId", "serviceType", status, is_default, "createdAt", "updatedAt")
       VALUES ($1, 'Admin/Operations', 'General administrative tasks and operations', $2, 'CONSULTING'::service_type, 'IN_PROGRESS'::project_status, true, NOW(), NOW())`,
      projId,
      client.id
    );
  } catch (projError) {
    console.error("Warning: Jarvis failed to create default project:", projError);
  }
}

// Update client in database
async function updateClient(data: any, agencyId: string | null | undefined) {
  // Find client by name
  const client = await prisma.client.findFirst({
    where: {
      name: {
        contains: data.clientName,
        mode: 'insensitive',
      },
      agencies: {
        some: {
          agencyId: agencyId || "",
        },
      },
    },
  });

  if (!client) {
    throw new Error(`Client "${data.clientName}" not found`);
  }

  // Update with provided fields
  await prisma.client.update({
    where: { id: client.id },
    data: data.updates,
  });
}

// Get client details
// Store recent client searches per chat (in-memory, simple approach)
const clientSearchCache: { [chatId: number]: any[] } = {};

async function getClient(data: any, agencyId: string | null | undefined, chatId: number): Promise<string> {
  // Find clients by name (partial match)
  const clients = await prisma.client.findMany({
    where: {
      name: {
        contains: data.clientName,
        mode: 'insensitive',
      },
      agencies: {
        some: {
          agencyId: agencyId || "",
        },
      },
    },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      tasks: {
        where: {
          status: {
            not: "COMPLETED",
          },
        },
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
        },
        take: 5,
      },
    },
    take: 10, // Max 10 results
  });

  if (clients.length === 0) {
    return `❌ No clients found matching "${data.clientName}".`;
  }

  // If multiple clients found, list them
  if (clients.length > 1) {
    // Store in cache for selection
    clientSearchCache[chatId] = clients;
    
    let response = `❓ *Found ${clients.length} clients:*\n\n`;
    clients.forEach((client, index) => {
      response += `${index + 1}. ${client.name}`;
      if (client.company && client.company !== client.name) {
        response += ` (${client.company})`;
      }
      response += `\n`;
    });
    response += `\nReply with the number to see details.`;
    
    return response;
  }

  // Single match - show details
  const client = clients[0];
  return formatClientDetails(client);
}

// Select client from numbered list
async function selectClient(data: any, agencyId: string | null | undefined, chatId: number): Promise<string> {
  const clientNumber = parseInt(data.clientNumber);
  
  if (!clientSearchCache[chatId] || clientSearchCache[chatId].length === 0) {
    return `❌ No recent client search. Try searching for a client first.`;
  }
  
  if (clientNumber < 1 || clientNumber > clientSearchCache[chatId].length) {
    return `❌ Invalid number. Please choose between 1 and ${clientSearchCache[chatId].length}.`;
  }
  
  const client = clientSearchCache[chatId][clientNumber - 1];
  
  // Clear cache after selection
  delete clientSearchCache[chatId];
  
  return formatClientDetails(client);
}

// Format client details for display
function formatClientDetails(client: any): string {
  let response = `📋 *${client.name}*\n\n`;
  
  if (client.email) response += `📧 Email: ${client.email}\n`;
  if (client.phone) response += `📞 Phone: ${client.phone}\n`;
  if (client.website) response += `🌐 Website: ${client.website}\n`;
  if (client.company) response += `🏢 Company: ${client.company}\n`;
  if (client.industry) response += `🏭 Industry: ${client.industry}\n`;
  if (client.status) response += `📊 Status: ${client.status}\n`;
  
  if (client.projects && client.projects.length > 0) {
    response += `\n*Projects (${client.projects.length}):*\n`;
    client.projects.slice(0, 3).forEach((p: any) => {
      response += `• ${p.name} (${p.status})\n`;
    });
    if (client.projects.length > 3) {
      response += `• ...and ${client.projects.length - 3} more\n`;
    }
  }
  
  if (client.tasks && client.tasks.length > 0) {
    response += `\n*Active Tasks (${client.tasks.length}):*\n`;
    client.tasks.forEach((t: any) => {
      response += `• ${t.name} - ${t.priority} (${t.status})\n`;
    });
  }
  
  response += `\n🔗 [View in Omnixia](https://wick.omnixia.ai/clients)`;
  
  return response;
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
