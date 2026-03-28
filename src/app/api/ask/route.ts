import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Case, Character, Clue } from "@/lib/types";

export const maxDuration = 30;

interface AskRequest {
  question: string;
  characterId: string;
  caseData: Case;
  currentLocation: string;
  discoveredClueIds: string[];
  availableClueIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AskRequest = await request.json();
    const { question, characterId, caseData, currentLocation, discoveredClueIds, availableClueIds } = body;

    const allChars = [caseData.detective, ...caseData.victims, ...caseData.suspects];
    const character = allChars.find((c) => c.id === characterId);
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 400 });
    }

    const location = caseData.locations.find((l) => l.id === currentLocation);
    const availableClues = caseData.clues.filter((c) => availableClueIds.includes(c.id));
    const discoveredClues = caseData.clues.filter((c) => discoveredClueIds.includes(c.id));

    const prompt = buildPrompt(character, question, location?.name ?? "", availableClues, discoveredClues, caseData);

    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from Claude" }, { status: 500 });
    }

    const parsed = parseResponse(textBlock.text, availableClueIds);

    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildPrompt(
  character: Character,
  question: string,
  locationName: string,
  availableClues: Clue[],
  discoveredClues: Clue[],
  caseData: Case
): string {
  const clueDescriptions = availableClues.map(
    (c) => `- CLUE_ID: "${c.id}" — ${c.name}: ${c.description}`
  ).join("\n");

  const discoveredDescriptions = discoveredClues.map(
    (c) => `- ${c.name}: ${c.description}`
  ).join("\n");

  return `You are playing the character "${character.name}" in an interactive mystery game based on "${caseData.title}".

CHARACTER INFO:
- Name: ${character.name}
- Description: ${character.description}
- Secrets (hidden from player, inform your evasiveness): ${character.secrets.length > 0 ? character.secrets.join("; ") : "None"}

CURRENT LOCATION: ${locationName}

CLUES THE PLAYER HAS ALREADY FOUND:
${discoveredDescriptions || "None yet."}

AVAILABLE CLUES AT THIS LOCATION (can be triggered by this conversation):
${clueDescriptions || "None available."}

THE PLAYER ASKS YOU: "${question}"

INSTRUCTIONS:
1. Respond in character as ${character.name}. Stay atmospheric and in-character for the story's time period and tone.
2. Keep your response to 2-4 sentences.
3. If the player's question is relevant to any of the AVAILABLE CLUES listed above, naturally weave that clue's information into your response. Characters with secrets should be evasive but may slip up or reveal hints under pressure.
4. After your in-character response, on a new line write EXACTLY:
   TRIGGERED_CLUES: [comma-separated clue IDs that were revealed, or "none"]

For example:
"I assure you, I was nowhere near the mire that evening. Though I confess the howling does unsettle me..."
TRIGGERED_CLUES: hound-howl

Or if no clues are triggered:
"I'm afraid I can't help you with that, detective."
TRIGGERED_CLUES: none

IMPORTANT: Only trigger a clue if the player's question is genuinely relevant to that clue's content. Do not trigger clues just because they exist. Be a fair game — make the player work for it.`;
}

function parseResponse(text: string, availableClueIds: string[]): { dialogue: string; triggeredClueIds: string[] } {
  const lines = text.trim().split("\n");
  const triggerLine = lines.find((l) => l.startsWith("TRIGGERED_CLUES:"));

  let dialogue: string;
  let triggeredClueIds: string[] = [];

  if (triggerLine) {
    dialogue = lines
      .filter((l) => !l.startsWith("TRIGGERED_CLUES:"))
      .join("\n")
      .trim()
      .replace(/^["']|["']$/g, "");

    const cluesPart = triggerLine.replace("TRIGGERED_CLUES:", "").trim();
    if (cluesPart !== "none") {
      triggeredClueIds = cluesPart
        .split(",")
        .map((s) => s.trim())
        .filter((id) => availableClueIds.includes(id));
    }
  } else {
    dialogue = text.trim();
  }

  return { dialogue, triggeredClueIds };
}
