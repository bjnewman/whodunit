# Whodunit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app that converts detective novels into playable mystery games via a three-phase pipeline: extract → review → play.

**Architecture:** Single Next.js App Router app with three routes. Claude API used only in the extract phase to parse book text into a structured `case.json`. Review phase renders an editable form. Play phase is a fully deterministic game engine driven by the approved JSON.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Anthropic SDK (`@anthropic-ai/sdk`)

---

## File Structure

```
whodunit/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with global styles
│   │   ├── page.tsx                   # Landing page with nav to /extract
│   │   ├── extract/
│   │   │   └── page.tsx               # Book upload UI
│   │   ├── review/
│   │   │   └── page.tsx               # Editable case form
│   │   ├── play/
│   │   │   └── page.tsx               # Game UI
│   │   └── api/
│   │       ├── extract/
│   │       │   └── route.ts           # POST: book text → Claude → case JSON
│   │       └── case/
│   │           └── route.ts           # GET/PUT: read/write case.json
│   ├── lib/
│   │   ├── types.ts                   # Case, Solution, Character, Location, Clue
│   │   ├── game-engine.ts             # Deterministic game logic
│   │   ├── game-engine.test.ts        # Game engine tests
│   │   └── prompt.ts                  # Claude extraction prompt template
│   └── components/
│       ├── character-card.tsx          # Display/edit a character
│       ├── location-panel.tsx         # Game location view with interactables
│       ├── clue-journal.tsx           # Right panel: discovered clues
│       ├── question-input.tsx         # Bottom panel: free-text input
│       └── accusation-modal.tsx       # Endgame accusation UI
├── data/
│   └── sample-case.json              # Pre-built Hound of the Baskervilles case
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/benjaminnewman/whodunit
bunx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Accept defaults. This creates the full scaffold.

- [ ] **Step 2: Install Anthropic SDK**

Run:
```bash
bun --cwd /Users/benjaminnewman/whodunit add @anthropic-ai/sdk
```

- [ ] **Step 3: Install vitest for testing**

Run:
```bash
bun --cwd /Users/benjaminnewman/whodunit add -d vitest
```

- [ ] **Step 4: Add vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5: Add test script to package.json**

Add to `scripts` in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Replace landing page**

Replace `src/app/page.tsx` with:
```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-5xl font-bold tracking-tight">Whodunit</h1>
      <p className="text-xl text-gray-400 max-w-md text-center">
        Turn any detective novel into a playable mystery game.
      </p>
      <Link
        href="/extract"
        className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
      >
        Upload a Book →
      </Link>
    </main>
  );
}
```

- [ ] **Step 7: Verify it runs**

Run:
```bash
bun --cwd /Users/benjaminnewman/whodunit run dev
```

Visit `http://localhost:3000`. Expected: landing page with "Whodunit" title and upload link.

- [ ] **Step 8: Commit**

```bash
cd /Users/benjaminnewman/whodunit
git add -A
git commit -m "feat: scaffold next.js project with tailwind and anthropic sdk"
```

---

### Task 2: Shared Types and Sample Data

**Files:**
- Create: `src/lib/types.ts`, `data/sample-case.json`

- [ ] **Step 1: Create type definitions**

Create `src/lib/types.ts`:
```typescript
export interface Case {
  title: string;
  summary: string;
  solution: Solution;
  characters: Character[];
  locations: Location[];
  clues: Clue[];
}

export interface Solution {
  culprit: string;
  motive: string;
  method: string;
  keyClues: string[];
  explanation: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  secrets: string[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  interactables: string[];
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  requires: string[];
  location: string;
  linkedCharacter?: string;
}
```

- [ ] **Step 2: Create sample case data**

Create `data/sample-case.json`:
```json
{
  "title": "The Hound of the Baskervilles",
  "summary": "Sir Charles Baskerville is found dead on the moor near his estate. A supernatural hound is said to curse the Baskerville family. Sherlock Holmes and Dr. Watson investigate, uncovering a plot by a distant relative to claim the inheritance.",
  "solution": {
    "culprit": "jack-stapleton",
    "motive": "Stapleton is a secret Baskerville heir who wants to inherit the estate by killing off the other heirs.",
    "method": "Trained a large hound and coated it with phosphorus to appear supernatural, using it to frighten Sir Charles to death and later to attack Sir Henry.",
    "keyClues": ["phosphorus-jar", "stapleton-lineage", "boot-theft", "hound-howl", "grimpen-path"],
    "explanation": "Jack Stapleton, posing as a naturalist neighbor, was in fact a Baskerville heir. He trained a massive hound, coated it with phosphorus to give it a ghostly glow, and used it to literally scare Sir Charles to death. He stole Sir Henry's boot to give the hound a scent. His wife, whom he forced to pose as his sister, nearly became another victim of his ruthless scheme."
  },
  "characters": [
    {
      "id": "sherlock-holmes",
      "name": "Sherlock Holmes",
      "description": "The famous consulting detective, engaged to investigate the Baskerville case.",
      "secrets": ["Holmes has been secretly living on the moor in a stone hut, conducting his own parallel investigation."]
    },
    {
      "id": "dr-watson",
      "name": "Dr. Watson",
      "description": "Holmes's trusted companion, sent to Baskerville Hall to observe and report.",
      "secrets": []
    },
    {
      "id": "sir-henry",
      "name": "Sir Henry Baskerville",
      "description": "The young heir who has arrived from Canada to claim Baskerville Hall.",
      "secrets": ["Sir Henry has been receiving anonymous warnings to stay away from the moor."]
    },
    {
      "id": "jack-stapleton",
      "name": "Jack Stapleton",
      "description": "A naturalist who lives at Merripit House on the moor, seemingly friendly and interested in butterflies.",
      "secrets": ["Stapleton is actually a Baskerville — the son of Roger Baskerville, the youngest brother. He has a direct claim to the estate."]
    },
    {
      "id": "beryl-stapleton",
      "name": "Beryl Stapleton",
      "description": "Introduced as Stapleton's sister, a beautiful woman who seems anxious around strangers.",
      "secrets": ["Beryl is actually Stapleton's wife, not his sister. He forces her to pose as his sister so he can use her to lure Sir Henry."]
    },
    {
      "id": "barrymore",
      "name": "Mr. Barrymore",
      "description": "The butler at Baskerville Hall, a loyal but secretive servant.",
      "secrets": ["Barrymore has been signaling to someone on the moor at night with a candle — his wife's brother, the escaped convict Selden."]
    }
  ],
  "locations": [
    {
      "id": "baskerville-hall",
      "name": "Baskerville Hall",
      "description": "A grand but gloomy manor house on the edge of the Dartmoor moor. Portraits of Baskerville ancestors line the dark corridors.",
      "interactables": ["boot-theft", "barrymore-signal", "portrait-clue"]
    },
    {
      "id": "grimpen-mire",
      "name": "Grimpen Mire",
      "description": "A vast, treacherous bog on the moor. One wrong step means being swallowed by the mud. Strange sounds echo across it at night.",
      "interactables": ["grimpen-path", "hound-howl", "phosphorus-jar"]
    },
    {
      "id": "merripit-house",
      "name": "Merripit House",
      "description": "Stapleton's modest residence near the mire. Butterfly nets and specimen cases fill the study.",
      "interactables": ["stapleton-lineage", "beryl-warning"]
    },
    {
      "id": "stone-hut",
      "name": "Stone Hut on the Moor",
      "description": "A crude prehistoric dwelling on the moor, seemingly abandoned. Empty tin cans and a blanket suggest someone has been living here recently.",
      "interactables": ["holmes-hideout"]
    }
  ],
  "clues": [
    {
      "id": "boot-theft",
      "name": "The Missing Boot",
      "description": "Sir Henry reports that one of his new boots was stolen from his hotel, then returned — but an older boot went missing instead. Why would someone want a worn boot?",
      "keywords": ["boot", "shoe", "stolen", "missing", "scent", "smell"],
      "requires": [],
      "location": "baskerville-hall",
      "linkedCharacter": "sir-henry"
    },
    {
      "id": "barrymore-signal",
      "name": "Barrymore's Midnight Signal",
      "description": "You catch Barrymore holding a candle to the window late at night, moving it back and forth as if signaling someone out on the moor.",
      "keywords": ["candle", "signal", "window", "night", "barrymore", "light"],
      "requires": [],
      "location": "baskerville-hall",
      "linkedCharacter": "barrymore"
    },
    {
      "id": "portrait-clue",
      "name": "The Family Portrait",
      "description": "A portrait of Hugo Baskerville bears a striking resemblance to someone you've met recently — if you cover the hat and wig, the face is unmistakably Stapleton's.",
      "keywords": ["portrait", "painting", "hugo", "resemblance", "face", "ancestor"],
      "requires": ["stapleton-lineage"],
      "location": "baskerville-hall",
      "linkedCharacter": "jack-stapleton"
    },
    {
      "id": "hound-howl",
      "name": "The Howling on the Moor",
      "description": "A terrible howling echoes across the mire at night — not quite a dog, not quite natural. The locals whisper about the spectral hound of the Baskervilles.",
      "keywords": ["howl", "howling", "sound", "cry", "hound", "dog", "night", "moor"],
      "requires": [],
      "location": "grimpen-mire"
    },
    {
      "id": "grimpen-path",
      "name": "The Secret Path Through the Mire",
      "description": "You observe Stapleton navigating the deadly Grimpen Mire with confidence, following a path marked by hidden stakes. He must come here often — but why?",
      "keywords": ["path", "trail", "stakes", "navigate", "mire", "bog", "swamp"],
      "requires": ["hound-howl"],
      "location": "grimpen-mire"
    },
    {
      "id": "phosphorus-jar",
      "name": "Jar of Phosphorus",
      "description": "Hidden near the edge of the mire, you find a jar containing a luminous, foul-smelling paste. This is phosphorus — it would glow in the dark when applied to something... or someone.",
      "keywords": ["phosphorus", "glow", "luminous", "paste", "jar", "shine", "paint", "ghost"],
      "requires": ["grimpen-path"],
      "location": "grimpen-mire"
    },
    {
      "id": "stapleton-lineage",
      "name": "Stapleton's True Identity",
      "description": "Research into the Baskerville family tree reveals that Jack Stapleton is actually the son of Roger Baskerville, the youngest brother who was believed to have died unmarried in South America. Stapleton has a direct claim to the estate.",
      "keywords": ["family", "tree", "lineage", "heir", "roger", "son", "relative", "inheritance"],
      "requires": ["beryl-warning"],
      "location": "merripit-house",
      "linkedCharacter": "jack-stapleton"
    },
    {
      "id": "beryl-warning",
      "name": "Beryl's Whispered Warning",
      "description": "Beryl Stapleton catches you alone and urgently whispers: 'Go back to London. Leave this place. For the love of God, do not go out on the moor at night.' Her eyes are full of genuine terror.",
      "keywords": ["beryl", "warning", "whisper", "sister", "wife", "afraid", "terror", "danger"],
      "requires": [],
      "location": "merripit-house",
      "linkedCharacter": "beryl-stapleton"
    },
    {
      "id": "holmes-hideout",
      "name": "Holmes's Secret Camp",
      "description": "Inside the stone hut you find evidence of habitation: tinned food, fresh tobacco ash, and a note in familiar handwriting. Holmes has been here the whole time, watching from the shadows.",
      "keywords": ["hut", "camp", "tobacco", "tin", "note", "hiding", "secret", "holmes"],
      "requires": ["barrymore-signal"],
      "location": "stone-hut",
      "linkedCharacter": "sherlock-holmes"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/benjaminnewman/whodunit
git add src/lib/types.ts data/sample-case.json
git commit -m "feat: add case schema types and sample hound of the baskervilles data"
```

---

### Task 3: Game Engine (TDD)

**Files:**
- Create: `src/lib/game-engine.ts`, `src/lib/game-engine.test.ts`
- Read: `src/lib/types.ts`, `data/sample-case.json`

The game engine is a pure-function state machine. No React, no DOM — just logic.

- [ ] **Step 1: Write game state type and initial failing tests**

Create `src/lib/game-engine.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  createGameState,
  discoverClue,
  askQuestion,
  canDiscoverClue,
  makeAccusation,
  getAvailableClues,
  getScore,
} from "./game-engine";
import type { Case } from "./types";

const miniCase: Case = {
  title: "Test Case",
  summary: "A test mystery.",
  solution: {
    culprit: "suspect-a",
    motive: "Greed",
    method: "Poison",
    keyClues: ["clue-1", "clue-3"],
    explanation: "Suspect A did it for the money.",
  },
  characters: [
    { id: "suspect-a", name: "Suspect A", description: "Shady person.", secrets: ["Secret A revealed."] },
    { id: "suspect-b", name: "Suspect B", description: "Friendly person.", secrets: [] },
  ],
  locations: [
    { id: "loc-1", name: "Kitchen", description: "A messy kitchen.", interactables: ["clue-1", "clue-2"] },
    { id: "loc-2", name: "Garden", description: "A quiet garden.", interactables: ["clue-3"] },
  ],
  clues: [
    { id: "clue-1", name: "Knife", description: "A bloody knife.", keywords: ["knife", "blade", "weapon"], requires: [], location: "loc-1" },
    { id: "clue-2", name: "Note", description: "A threatening note.", keywords: ["note", "letter", "paper", "threat"], requires: ["clue-1"], location: "loc-1", linkedCharacter: "suspect-a" },
    { id: "clue-3", name: "Footprint", description: "A muddy footprint.", keywords: ["footprint", "track", "mud", "shoe"], requires: [], location: "loc-2" },
  ],
};

describe("createGameState", () => {
  it("initializes with first location and empty discovered clues", () => {
    const state = createGameState(miniCase);
    expect(state.currentLocation).toBe("loc-1");
    expect(state.discoveredClues).toEqual(new Set());
    expect(state.questionsAsked).toBe(0);
    expect(state.revealedSecrets).toEqual(new Map());
  });
});

describe("getAvailableClues", () => {
  it("returns clues with no requirements at start", () => {
    const state = createGameState(miniCase);
    const available = getAvailableClues(miniCase, state);
    expect(available.map((c) => c.id).sort()).toEqual(["clue-1", "clue-3"]);
  });

  it("unlocks clue-2 after clue-1 is discovered", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    const available = getAvailableClues(miniCase, state);
    expect(available.map((c) => c.id)).toContain("clue-2");
  });
});

describe("canDiscoverClue", () => {
  it("returns true for a clue with no requirements", () => {
    const state = createGameState(miniCase);
    expect(canDiscoverClue(miniCase, state, "clue-1")).toBe(true);
  });

  it("returns false for a clue with unmet requirements", () => {
    const state = createGameState(miniCase);
    expect(canDiscoverClue(miniCase, state, "clue-2")).toBe(false);
  });

  it("returns false for an already-discovered clue", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    expect(canDiscoverClue(miniCase, state, "clue-1")).toBe(false);
  });
});

describe("discoverClue", () => {
  it("adds clue to discovered set", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    expect(state.discoveredClues.has("clue-1")).toBe(true);
  });

  it("reveals linked character secret", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    state = discoverClue(state, "clue-2");
    expect(state.revealedSecrets.get("suspect-a")).toEqual(["Secret A revealed."]);
  });
});

describe("askQuestion", () => {
  it("matches keyword and discovers the clue", () => {
    const state = createGameState(miniCase);
    const result = askQuestion(miniCase, state, "Is there a knife here?");
    expect(result.discoveredClues).toContain("clue-1");
    expect(result.state.questionsAsked).toBe(1);
    expect(result.state.discoveredClues.has("clue-1")).toBe(true);
  });

  it("matches across all available clues regardless of location", () => {
    const state = createGameState(miniCase);
    const result = askQuestion(miniCase, state, "I see a muddy footprint");
    expect(result.discoveredClues).toContain("clue-3");
  });

  it("returns no clues for unmatched question", () => {
    const state = createGameState(miniCase);
    const result = askQuestion(miniCase, state, "What about the weather?");
    expect(result.discoveredClues).toEqual([]);
    expect(result.state.questionsAsked).toBe(1);
  });

  it("does not re-discover already found clues", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    const result = askQuestion(miniCase, state, "knife");
    expect(result.discoveredClues).toEqual([]);
  });

  it("does not discover clues with unmet requirements", () => {
    const state = createGameState(miniCase);
    const result = askQuestion(miniCase, state, "threatening note");
    expect(result.discoveredClues).not.toContain("clue-2");
  });
});

describe("makeAccusation", () => {
  it("returns correct when culprit matches and all key clues found", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    state = discoverClue(state, "clue-3");
    const result = makeAccusation(miniCase, state, "suspect-a");
    expect(result.correct).toBe(true);
    expect(result.explanation).toBe("Suspect A did it for the money.");
  });

  it("returns incorrect for wrong culprit", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    state = discoverClue(state, "clue-3");
    const result = makeAccusation(miniCase, state, "suspect-b");
    expect(result.correct).toBe(false);
  });

  it("returns incorrect when key clues are missing", () => {
    const state = createGameState(miniCase);
    const result = makeAccusation(miniCase, state, "suspect-a");
    expect(result.correct).toBe(false);
  });
});

describe("getScore", () => {
  it("calculates score based on efficiency", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1");
    state = discoverClue(state, "clue-3");
    state = { ...state, questionsAsked: 4 };
    const score = getScore(miniCase, state);
    expect(score.cluesFound).toBe(2);
    expect(score.totalClues).toBe(3);
    expect(score.questionsAsked).toBe(4);
    expect(score.efficiency).toBeCloseTo(2 / 4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
bun --cwd /Users/benjaminnewman/whodunit run test
```

Expected: FAIL — module `./game-engine` not found.

- [ ] **Step 3: Implement the game engine**

Create `src/lib/game-engine.ts`:
```typescript
import type { Case, Clue } from "./types";

export interface GameState {
  currentLocation: string;
  discoveredClues: Set<string>;
  questionsAsked: number;
  revealedSecrets: Map<string, string[]>;
}

export interface QuestionResult {
  state: GameState;
  discoveredClues: string[];
  message: string;
}

export interface AccusationResult {
  correct: boolean;
  explanation: string;
}

export interface Score {
  cluesFound: number;
  totalClues: number;
  questionsAsked: number;
  efficiency: number;
}

export function createGameState(caseData: Case): GameState {
  return {
    currentLocation: caseData.locations[0].id,
    discoveredClues: new Set(),
    questionsAsked: 0,
    revealedSecrets: new Map(),
  };
}

export function getAvailableClues(caseData: Case, state: GameState): Clue[] {
  return caseData.clues.filter(
    (clue) =>
      !state.discoveredClues.has(clue.id) &&
      clue.requires.every((req) => state.discoveredClues.has(req))
  );
}

export function canDiscoverClue(
  caseData: Case,
  state: GameState,
  clueId: string
): boolean {
  if (state.discoveredClues.has(clueId)) return false;
  const clue = caseData.clues.find((c) => c.id === clueId);
  if (!clue) return false;
  return clue.requires.every((req) => state.discoveredClues.has(req));
}

export function discoverClue(state: GameState, clueId: string, caseData?: Case): GameState {
  const newDiscovered = new Set(state.discoveredClues);
  newDiscovered.add(clueId);

  const newSecrets = new Map(state.revealedSecrets);

  if (caseData) {
    const clue = caseData.clues.find((c) => c.id === clueId);
    if (clue?.linkedCharacter) {
      const character = caseData.characters.find(
        (ch) => ch.id === clue.linkedCharacter
      );
      if (character && character.secrets.length > 0) {
        newSecrets.set(character.id, [...character.secrets]);
      }
    }
  }

  return {
    ...state,
    discoveredClues: newDiscovered,
    revealedSecrets: newSecrets,
  };
}

export function askQuestion(
  caseData: Case,
  state: GameState,
  question: string
): QuestionResult {
  const lowerQuestion = question.toLowerCase();
  const available = getAvailableClues(caseData, state);
  const matched: string[] = [];

  let newState = { ...state, questionsAsked: state.questionsAsked + 1 };

  for (const clue of available) {
    const hit = clue.keywords.some((kw) => lowerQuestion.includes(kw.toLowerCase()));
    if (hit) {
      matched.push(clue.id);
      newState = discoverClue(newState, clue.id, caseData);
    }
  }

  const message =
    matched.length > 0
      ? `You discovered: ${matched.map((id) => caseData.clues.find((c) => c.id === id)?.name).join(", ")}`
      : "Your investigation turned up nothing new.";

  return { state: newState, discoveredClues: matched, message };
}

export function makeAccusation(
  caseData: Case,
  state: GameState,
  culpritId: string
): AccusationResult {
  const allKeyCluesFound = caseData.solution.keyClues.every((id) =>
    state.discoveredClues.has(id)
  );
  const correctCulprit = culpritId === caseData.solution.culprit;

  return {
    correct: allKeyCluesFound && correctCulprit,
    explanation: caseData.solution.explanation,
  };
}

export function getScore(caseData: Case, state: GameState): Score {
  const cluesFound = state.discoveredClues.size;
  const totalClues = caseData.clues.length;
  const questionsAsked = state.questionsAsked;
  const efficiency = questionsAsked > 0 ? cluesFound / questionsAsked : 0;

  return { cluesFound, totalClues, questionsAsked, efficiency };
}
```

- [ ] **Step 4: Fix discoverClue to accept caseData for linked character reveals**

The tests for `discoverClue` call it without `caseData` in some cases and with it implicitly through `askQuestion`. Update the tests to pass `caseData` where needed:

In the test file, update the `discoverClue` describe block:
```typescript
describe("discoverClue", () => {
  it("adds clue to discovered set", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    expect(state.discoveredClues.has("clue-1")).toBe(true);
  });

  it("reveals linked character secret", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    state = discoverClue(state, "clue-2", miniCase);
    expect(state.revealedSecrets.get("suspect-a")).toEqual(["Secret A revealed."]);
  });
});
```

And update `getAvailableClues` test:
```typescript
  it("unlocks clue-2 after clue-1 is discovered", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    const available = getAvailableClues(miniCase, state);
    expect(available.map((c) => c.id)).toContain("clue-2");
  });
```

And `canDiscoverClue` test:
```typescript
  it("returns false for an already-discovered clue", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    expect(canDiscoverClue(miniCase, state, "clue-1")).toBe(false);
  });
```

And `makeAccusation` tests:
```typescript
  it("returns correct when culprit matches and all key clues found", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    state = discoverClue(state, "clue-3", miniCase);
    const result = makeAccusation(miniCase, state, "suspect-a");
    expect(result.correct).toBe(true);
    expect(result.explanation).toBe("Suspect A did it for the money.");
  });

  it("returns incorrect for wrong culprit", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    state = discoverClue(state, "clue-3", miniCase);
    const result = makeAccusation(miniCase, state, "suspect-b");
    expect(result.correct).toBe(false);
  });
```

And `getScore` test:
```typescript
  it("calculates score based on efficiency", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    state = discoverClue(state, "clue-3", miniCase);
    state = { ...state, questionsAsked: 4 };
    const score = getScore(miniCase, state);
    expect(score.cluesFound).toBe(2);
    expect(score.totalClues).toBe(3);
    expect(score.questionsAsked).toBe(4);
    expect(score.efficiency).toBeCloseTo(2 / 4);
  });
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
bun --cwd /Users/benjaminnewman/whodunit run test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/benjaminnewman/whodunit
git add src/lib/game-engine.ts src/lib/game-engine.test.ts
git commit -m "feat: implement deterministic game engine with tests"
```

---

### Task 4: Extract Phase — Claude Prompt and API Route

**Files:**
- Create: `src/lib/prompt.ts`, `src/app/api/extract/route.ts`, `src/app/extract/page.tsx`
- Read: `src/lib/types.ts`

- [ ] **Step 1: Create the extraction prompt**

Create `src/lib/prompt.ts`:
```typescript
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
```

- [ ] **Step 2: Create the extract API route**

Create `src/app/api/extract/route.ts`:
```typescript
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
```

- [ ] **Step 3: Create the extract page**

Create `src/app/extract/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExtractPage() {
  const router = useRouter();
  const [bookText, setBookText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!bookText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookText }),
      });

      if (!extractRes.ok) {
        const err = await extractRes.json();
        throw new Error(err.error || "Extraction failed");
      }

      const caseData = await extractRes.json();

      const saveRes = await fetch("/api/case", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save case data");
      }

      router.push("/review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBookText(event.target?.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Extract a Case</h1>
      <p className="text-gray-400 mb-8">
        Upload a detective novel (.txt) and Claude will extract a playable mystery.
      </p>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          Upload a .txt file
        </label>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white file:text-black file:font-semibold hover:file:bg-gray-200 file:cursor-pointer"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          Or paste the text directly
        </label>
        <textarea
          value={bookText}
          onChange={(e) => setBookText(e.target.value)}
          rows={12}
          className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm resize-y focus:outline-none focus:border-gray-500"
          placeholder="Paste the full text of a detective novel here..."
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleExtract}
          disabled={loading || !bookText.trim()}
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Extracting..." : "Extract Case →"}
        </button>

        {bookText && (
          <span className="text-sm text-gray-500">
            {bookText.length.toLocaleString()} characters loaded
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-gray-300">
            Claude is reading the book and extracting the mystery structure...
          </p>
          <p className="text-gray-500 text-sm mt-1">
            This may take a minute for longer texts.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/benjaminnewman/whodunit
git add src/lib/prompt.ts src/app/api/extract/route.ts src/app/extract/page.tsx
git commit -m "feat: add extract phase — claude prompt, api route, and upload ui"
```

---

### Task 5: Case API Route (Read/Write JSON)

**Files:**
- Create: `src/app/api/case/route.ts`

- [ ] **Step 1: Create case API route**

Create `src/app/api/case/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const CASE_PATH = path.join(process.cwd(), "data", "current-case.json");

export async function GET() {
  try {
    const data = await readFile(CASE_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(
      { error: "No case data found. Extract a book first." },
      { status: 404 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const caseData = await request.json();

    await mkdir(path.dirname(CASE_PATH), { recursive: true });
    await writeFile(CASE_PATH, JSON.stringify(caseData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add current-case.json to .gitignore**

Append to `.gitignore`:
```
data/current-case.json
```

- [ ] **Step 3: Commit**

```bash
cd /Users/benjaminnewman/whodunit
git add src/app/api/case/route.ts .gitignore
git commit -m "feat: add case api route for reading and writing case json"
```

---

### Task 6: Review Phase

**Files:**
- Create: `src/app/review/page.tsx`, `src/components/character-card.tsx`
- Read: `src/lib/types.ts`

- [ ] **Step 1: Create the CharacterCard component**

Create `src/components/character-card.tsx`:
```tsx
"use client";

import type { Character } from "@/lib/types";

interface CharacterCardProps {
  character: Character;
  onChange: (updated: Character) => void;
  onRemove: () => void;
}

export function CharacterCard({ character, onChange, onRemove }: CharacterCardProps) {
  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <input
          value={character.name}
          onChange={(e) => onChange({ ...character, name: e.target.value })}
          className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-white focus:outline-none"
        />
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 text-sm">
          Remove
        </button>
      </div>
      <label className="block text-xs text-gray-500 mb-1">ID: {character.id}</label>
      <label className="block text-xs text-gray-500 mb-1 mt-3">Description</label>
      <textarea
        value={character.description}
        onChange={(e) => onChange({ ...character, description: e.target.value })}
        rows={2}
        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
      />
      <label className="block text-xs text-gray-500 mb-1 mt-3">Secrets (one per line)</label>
      <textarea
        value={character.secrets.join("\n")}
        onChange={(e) =>
          onChange({ ...character, secrets: e.target.value.split("\n").filter(Boolean) })
        }
        rows={2}
        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the review page**

Create `src/app/review/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Case, Character, Location, Clue } from "@/lib/types";
import { CharacterCard } from "@/components/character-card";

export default function ReviewPage() {
  const router = useRouter();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/case")
      .then((res) => {
        if (!res.ok) throw new Error("No case data found");
        return res.json();
      })
      .then(setCaseData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove() {
    if (!caseData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/case", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/play");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateCharacter(index: number, updated: Character) {
    if (!caseData) return;
    const characters = [...caseData.characters];
    characters[index] = updated;
    setCaseData({ ...caseData, characters });
  }

  function removeCharacter(index: number) {
    if (!caseData) return;
    const characters = caseData.characters.filter((_, i) => i !== index);
    setCaseData({ ...caseData, characters });
  }

  function updateLocation(index: number, field: keyof Location, value: string | string[]) {
    if (!caseData) return;
    const locations = [...caseData.locations];
    locations[index] = { ...locations[index], [field]: value };
    setCaseData({ ...caseData, locations });
  }

  function updateClue(index: number, field: keyof Clue, value: string | string[]) {
    if (!caseData) return;
    const clues = [...caseData.clues];
    clues[index] = { ...clues[index], [field]: value };
    setCaseData({ ...caseData, clues });
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-400">Loading case data...</p>
      </main>
    );
  }

  if (error || !caseData) {
    return (
      <main className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || "No case data found."}</p>
        <a href="/extract" className="text-blue-400 hover:underline">
          ← Go extract a book first
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">{caseData.title}</h1>
          <p className="text-gray-400 mt-1">Review and edit the extracted case data.</p>
        </div>
        <button
          onClick={handleApprove}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Approve & Play →"}
        </button>
      </div>

      {/* Solution */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Solution</h2>
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Culprit (character ID)</label>
            <input
              value={caseData.solution.culprit}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, culprit: e.target.value } })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Motive</label>
            <input
              value={caseData.solution.motive}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, motive: e.target.value } })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Method</label>
            <input
              value={caseData.solution.method}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, method: e.target.value } })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Key Clues (comma-separated IDs)</label>
            <input
              value={caseData.solution.keyClues.join(", ")}
              onChange={(e) =>
                setCaseData({
                  ...caseData,
                  solution: {
                    ...caseData.solution,
                    keyClues: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Explanation</label>
            <textarea
              value={caseData.solution.explanation}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, explanation: e.target.value } })
              }
              rows={3}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </section>

      {/* Characters */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Characters ({caseData.characters.length})</h2>
        <div className="grid gap-4">
          {caseData.characters.map((char, i) => (
            <CharacterCard
              key={char.id}
              character={char}
              onChange={(updated) => updateCharacter(i, updated)}
              onRemove={() => removeCharacter(i)}
            />
          ))}
        </div>
      </section>

      {/* Locations */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Locations ({caseData.locations.length})</h2>
        <div className="grid gap-4">
          {caseData.locations.map((loc, i) => (
            <div key={loc.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <input
                value={loc.name}
                onChange={(e) => updateLocation(i, "name", e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-white focus:outline-none mb-2"
              />
              <label className="block text-xs text-gray-500 mb-1">ID: {loc.id}</label>
              <label className="block text-xs text-gray-500 mb-1 mt-2">Description</label>
              <textarea
                value={loc.description}
                onChange={(e) => updateLocation(i, "description", e.target.value)}
                rows={2}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
              />
              <label className="block text-xs text-gray-500 mb-1 mt-2">Interactables (comma-separated clue IDs)</label>
              <input
                value={loc.interactables.join(", ")}
                onChange={(e) =>
                  updateLocation(i, "interactables", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Clues */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Clues ({caseData.clues.length})</h2>
        <div className="grid gap-4">
          {caseData.clues.map((clue, i) => (
            <div key={clue.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <input
                value={clue.name}
                onChange={(e) => updateClue(i, "name", e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-white focus:outline-none mb-2"
              />
              <label className="block text-xs text-gray-500 mb-1">ID: {clue.id} | Location: {clue.location}</label>
              <label className="block text-xs text-gray-500 mb-1 mt-2">Description</label>
              <textarea
                value={clue.description}
                onChange={(e) => updateClue(i, "description", e.target.value)}
                rows={2}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
              />
              <label className="block text-xs text-gray-500 mb-1 mt-2">Keywords (comma-separated)</label>
              <input
                value={clue.keywords.join(", ")}
                onChange={(e) =>
                  updateClue(i, "keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
              />
              <label className="block text-xs text-gray-500 mb-1 mt-2">Requires (comma-separated clue IDs)</label>
              <input
                value={clue.requires.join(", ")}
                onChange={(e) =>
                  updateClue(i, "requires", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
              />
              {clue.linkedCharacter && (
                <>
                  <label className="block text-xs text-gray-500 mb-1 mt-2">Linked Character</label>
                  <input
                    value={clue.linkedCharacter}
                    onChange={(e) => updateClue(i, "linkedCharacter", e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom approve button */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleApprove}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Approve & Play →"}
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/benjaminnewman/whodunit
git add src/components/character-card.tsx src/app/review/page.tsx
git commit -m "feat: add review phase — editable case form with character, location, clue cards"
```

---

### Task 7: Play Phase — Game UI

**Files:**
- Create: `src/components/location-panel.tsx`, `src/components/clue-journal.tsx`, `src/components/question-input.tsx`, `src/components/accusation-modal.tsx`, `src/app/play/page.tsx`
- Read: `src/lib/types.ts`, `src/lib/game-engine.ts`

- [ ] **Step 1: Create LocationPanel component**

Create `src/components/location-panel.tsx`:
```tsx
"use client";

import type { Case, Location, Clue } from "@/lib/types";
import type { GameState } from "@/lib/game-engine";
import { canDiscoverClue } from "@/lib/game-engine";

interface LocationPanelProps {
  caseData: Case;
  state: GameState;
  location: Location;
  onClickClue: (clueId: string) => void;
  onNavigate: (locationId: string) => void;
}

export function LocationPanel({ caseData, state, location, onClickClue, onNavigate }: LocationPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-2">{location.name}</h2>
      <p className="text-gray-400 mb-6">{location.description}</p>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Things to investigate
      </h3>
      <div className="grid gap-2 mb-6">
        {location.interactables.map((clueId) => {
          const clue = caseData.clues.find((c) => c.id === clueId);
          if (!clue) return null;

          const discovered = state.discoveredClues.has(clueId);
          const available = canDiscoverClue(caseData, state, clueId);

          return (
            <button
              key={clueId}
              onClick={() => available && onClickClue(clueId)}
              disabled={discovered || !available}
              className={`text-left p-3 rounded-lg border transition ${
                discovered
                  ? "bg-green-900/20 border-green-700 text-green-400"
                  : available
                    ? "bg-gray-800 border-gray-600 hover:border-white cursor-pointer"
                    : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              {discovered ? `✓ ${clue.name}` : available ? `? ${clue.name}` : "🔒 ???"}
            </button>
          );
        })}
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Locations
      </h3>
      <div className="grid gap-2">
        {caseData.locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => onNavigate(loc.id)}
            className={`text-left p-2 rounded border transition ${
              loc.id === location.id
                ? "bg-white/10 border-white text-white"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ClueJournal component**

Create `src/components/clue-journal.tsx`:
```tsx
"use client";

import type { Case } from "@/lib/types";
import type { GameState } from "@/lib/game-engine";

interface ClueJournalProps {
  caseData: Case;
  state: GameState;
}

export function ClueJournal({ caseData, state }: ClueJournalProps) {
  const discoveredClues = caseData.clues.filter((c) => state.discoveredClues.has(c.id));

  const byLocation = caseData.locations.map((loc) => ({
    location: loc,
    clues: discoveredClues.filter((c) => c.location === loc.id),
  })).filter((group) => group.clues.length > 0);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-bold mb-4">
        Clue Journal ({discoveredClues.length}/{caseData.clues.length})
      </h2>

      {discoveredClues.length === 0 ? (
        <p className="text-gray-500 text-sm">No clues discovered yet. Start investigating!</p>
      ) : (
        <div className="space-y-4 overflow-y-auto">
          {byLocation.map(({ location, clues }) => (
            <div key={location.id}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {location.name}
              </h3>
              {clues.map((clue) => (
                <div key={clue.id} className="p-3 bg-gray-900 border border-gray-700 rounded-lg mb-2">
                  <p className="font-medium text-sm">{clue.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{clue.description}</p>
                </div>
              ))}
            </div>
          ))}

          {/* Revealed secrets */}
          {state.revealedSecrets.size > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-yellow-500 uppercase tracking-wide mb-2">
                Secrets Revealed
              </h3>
              {Array.from(state.revealedSecrets.entries()).map(([charId, secrets]) => {
                const character = caseData.characters.find((c) => c.id === charId);
                return (
                  <div key={charId} className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg mb-2">
                    <p className="font-medium text-sm text-yellow-400">{character?.name}</p>
                    {secrets.map((secret, i) => (
                      <p key={i} className="text-yellow-200/70 text-xs mt-1">{secret}</p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create QuestionInput component**

Create `src/components/question-input.tsx`:
```tsx
"use client";

import { useState } from "react";

interface QuestionInputProps {
  onAsk: (question: string) => string;
  disabled?: boolean;
}

export function QuestionInput({ onAsk, disabled }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || disabled) return;

    const result = onAsk(question);
    setLastResult(result);
    setQuestion("");
  }

  return (
    <div>
      {lastResult && (
        <p className={`text-sm mb-2 ${lastResult.includes("discovered") ? "text-green-400" : "text-gray-500"}`}>
          {lastResult}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question to investigate..."
          disabled={disabled}
          className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !question.trim()}
          className="px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create AccusationModal component**

Create `src/components/accusation-modal.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { Case } from "@/lib/types";
import type { AccusationResult } from "@/lib/game-engine";

interface AccusationModalProps {
  caseData: Case;
  onAccuse: (culpritId: string) => AccusationResult;
  score: { cluesFound: number; totalClues: number; questionsAsked: number; efficiency: number };
}

export function AccusationModal({ caseData, onAccuse, score }: AccusationModalProps) {
  const [selectedCulprit, setSelectedCulprit] = useState("");
  const [result, setResult] = useState<AccusationResult | null>(null);
  const [open, setOpen] = useState(false);

  function handleAccuse() {
    if (!selectedCulprit) return;
    const accusationResult = onAccuse(selectedCulprit);
    setResult(accusationResult);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition animate-pulse"
      >
        Make Accusation
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full">
        {!result ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Make Your Accusation</h2>
            <p className="text-gray-400 mb-4">Who committed the crime?</p>

            <select
              value={selectedCulprit}
              onChange={(e) => setSelectedCulprit(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg mb-4 focus:outline-none focus:border-gray-500"
            >
              <option value="">Select a suspect...</option>
              {caseData.characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={handleAccuse}
                disabled={!selectedCulprit}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition disabled:opacity-50"
              >
                Accuse!
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={`text-3xl font-bold mb-4 ${result.correct ? "text-green-400" : "text-red-400"}`}>
              {result.correct ? "Case Solved!" : "Wrong Accusation!"}
            </h2>

            <p className="text-gray-300 mb-6">{result.explanation}</p>

            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Your Score</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Clues Found:</span>
                <span>{score.cluesFound}/{score.totalClues}</span>
                <span className="text-gray-500">Questions Asked:</span>
                <span>{score.questionsAsked}</span>
                <span className="text-gray-500">Efficiency:</span>
                <span>{(score.efficiency * 100).toFixed(0)}%</span>
              </div>
            </div>

            <a
              href="/"
              className="inline-block px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Play Again
            </a>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create the Play page**

Create `src/app/play/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import type { Case } from "@/lib/types";
import {
  createGameState,
  discoverClue,
  askQuestion,
  makeAccusation,
  getScore,
  canDiscoverClue,
  type GameState,
} from "@/lib/game-engine";
import { LocationPanel } from "@/components/location-panel";
import { ClueJournal } from "@/components/clue-journal";
import { QuestionInput } from "@/components/question-input";
import { AccusationModal } from "@/components/accusation-modal";

export default function PlayPage() {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/case")
      .then((res) => {
        if (!res.ok) throw new Error("No case data found");
        return res.json();
      })
      .then((data: Case) => {
        setCaseData(data);
        setGameState(createGameState(data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading case...</p>
      </main>
    );
  }

  if (error || !caseData || !gameState) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || "No case data."}</p>
        <a href="/extract" className="text-blue-400 hover:underline">← Extract a book first</a>
      </main>
    );
  }

  const currentLocation = caseData.locations.find((l) => l.id === gameState.currentLocation)!;
  const allKeyCluesFound = caseData.solution.keyClues.every((id) =>
    gameState.discoveredClues.has(id)
  );
  const score = getScore(caseData, gameState);

  function handleClickClue(clueId: string) {
    if (!caseData || !gameState) return;
    if (!canDiscoverClue(caseData, gameState, clueId)) return;
    setGameState(discoverClue(gameState, clueId, caseData));
  }

  function handleNavigate(locationId: string) {
    if (!gameState) return;
    setGameState({ ...gameState, currentLocation: locationId });
  }

  function handleAsk(question: string): string {
    if (!caseData || !gameState) return "";
    const result = askQuestion(caseData, gameState, question);
    setGameState(result.state);
    return result.message;
  }

  function handleAccuse(culpritId: string) {
    if (!caseData || !gameState) return { correct: false, explanation: "" };
    return makeAccusation(caseData, gameState, culpritId);
  }

  return (
    <main className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <h1 className="font-bold">{caseData.title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Clues: {score.cluesFound}/{score.totalClues}
          </span>
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(score.cluesFound / score.totalClues) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">
            Questions: {score.questionsAsked}
          </span>
          {allKeyCluesFound && (
            <AccusationModal caseData={caseData} onAccuse={handleAccuse} score={score} />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Location */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-gray-800">
          <LocationPanel
            caseData={caseData}
            state={gameState}
            location={currentLocation}
            onClickClue={handleClickClue}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Right: Journal */}
        <div className="w-80 p-6 overflow-y-auto">
          <ClueJournal caseData={caseData} state={gameState} />
        </div>
      </div>

      {/* Bottom: Question input */}
      <div className="px-6 py-4 border-t border-gray-800">
        <QuestionInput onAsk={handleAsk} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/benjaminnewman/whodunit
git add src/components/location-panel.tsx src/components/clue-journal.tsx src/components/question-input.tsx src/components/accusation-modal.tsx src/app/play/page.tsx
git commit -m "feat: add play phase — game ui with location panel, clue journal, question input, and accusation"
```

---

### Task 8: Integration — Wire Up and Smoke Test

**Files:**
- Read: all route and page files
- Modify: `src/app/layout.tsx` (if needed for dark theme)

- [ ] **Step 1: Ensure dark theme in layout**

In `src/app/layout.tsx`, ensure the `<body>` has dark background classes:
```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
```

- [ ] **Step 2: Copy sample data as current case for testing**

Run:
```bash
cp /Users/benjaminnewman/whodunit/data/sample-case.json /Users/benjaminnewman/whodunit/data/current-case.json
```

- [ ] **Step 3: Run the dev server and verify all routes**

Run:
```bash
bun --cwd /Users/benjaminnewman/whodunit run dev
```

Verify:
- `http://localhost:3000` — Landing page with "Upload a Book" link
- `http://localhost:3000/extract` — Upload page with textarea and file input
- `http://localhost:3000/review` — Loads sample case, shows editable cards
- `http://localhost:3000/play` — Game UI with Baskerville Hall, clickable interactables, question input

- [ ] **Step 4: Run all tests**

Run:
```bash
bun --cwd /Users/benjaminnewman/whodunit run test
```

Expected: All game engine tests pass.

- [ ] **Step 5: Commit layout changes**

```bash
cd /Users/benjaminnewman/whodunit
git add src/app/layout.tsx
git commit -m "fix: set dark theme on body element"
```
