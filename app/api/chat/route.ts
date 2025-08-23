import { streamText, convertToModelMessages, type TextUIPart } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { chatId, messages } = await req.json() as {
      chatId: number;
      messages: { id: string; role: "user" | "assistant" | "system"; content: string }[];
    };

    // Validate chat exists
    const chatRecords = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));
    if (chatRecords.length !== 1) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const fileKey = chatRecords[0].fileKey;

    // Convert incoming messages to ModelMessage[]
    const modelMessages = convertToModelMessages(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }] as TextUIPart[],
      }))
    );

    const lastMessage = messages[messages.length - 1];

    const context = await getContext(lastMessage.content, fileKey);

    const systemPrompt = `
AI assistant is a powerful, human-like assistant.
START CONTEXT:
${context}
END CONTEXT:
Only answer based on the context or say "I'm sorry, but I don't know."
`;

    // Save user's message
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    // Stream response from AI
    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      system: systemPrompt,
      messages:modelMessages,
    });

    // Save full assistant response after streaming
    const fullText = await result.text;
    await db.insert(_messages).values({
      chatId,
      content: fullText,
      role: "system",
    });

    // Return streaming response to client
    return result.toTextStreamResponse();
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
