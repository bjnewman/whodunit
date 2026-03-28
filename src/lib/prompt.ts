export const EXTRACTION_PROMPT = `You are a mystery game designer. Given the full text of a detective novel, extract a structured case file for an interactive mystery game.

You MUST output valid JSON conforming to this exact schema:

{
  "title": "string — the book title",
  "summary": "string — one paragraph summary of the plot (this is hidden from the player)",
  "solution": {
    "culprit": "string — character ID of the guilty party (lowercase-kebab-case)",
    "motive": "string — why they did it",
    "method": "string — how they did it",
    "keyClues": ["array of clue IDs that are essential to solving the case"],
    "explanation": "string — the full reveal, shown after the player solves it"
  },
  "characters": [
    {
      "id": "string — lowercase-kebab-case",
      "name": "string — display name",
      "description": "string — what the player knows upfront, no spoilers",
      "secrets": ["strings — hidden info revealed when linked clues are found"]
    }
  ],
  "locations": [
    {
      "id": "string — lowercase-kebab-case",
      "name": "string — display name",
      "description": "string — atmospheric scene-setting text",
      "interactables": ["clue IDs that can be found at this location"]
    }
  ],
  "clues": [
    {
      "id": "string — lowercase-kebab-case",
      "name": "string — display name",
      "description": "string — what the player sees when they discover this clue",
      "keywords": ["5-8 lowercase words/phrases that should trigger discovery of this clue when the player types them"],
      "requires": ["clue IDs that must be discovered first — empty array if available from the start"],
      "location": "string — location ID where this clue is found",
      "linkedCharacter": "string or omit — character ID whose secret is revealed by this clue"
    }
  ]
}

Guidelines:
- Extract 4-6 characters (major players only)
- Extract 3-5 locations (key settings)
- Extract 8-12 clues that form a logical investigation path
- The "requires" fields should form a DAG — some clues available from the start, others unlocked by finding earlier clues
- "keyClues" in the solution should be 4-6 of the most critical clues
- Keywords should be intuitive words a player might type when investigating
- Keep descriptions atmospheric and in-character
- Do NOT include the detective/protagonist as the culprit
- Every clue must belong to exactly one location
- Every location's interactables must match the clue IDs assigned to it

Output ONLY the JSON object, no markdown fences, no explanation.`;
