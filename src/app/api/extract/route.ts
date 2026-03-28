import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_PROMPT } from "@/lib/prompt";

export async function POST(request: NextRequest) {
  try {
    const { bookText } = await request.json();

    if (!bookText || typeof bookText !== "string") {
      return NextResponse.json(
        { error: "bookText is required and must be a string" },
        { status: 400 }
      );
    }

    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nHere is the full text of the detective novel:\n\n${bookText}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 500 }
      );
    }

    const caseData = JSON.parse(textBlock.text);

    return NextResponse.json(caseData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
