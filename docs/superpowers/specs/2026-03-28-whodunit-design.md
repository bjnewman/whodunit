# Whodunit — Design Spec

**Date:** 2026-03-28
**Context:** Anthropic-focused hackathon, few-hour build window

## Overview

A tool that converts detective novels into playable mystery games. Three-phase pipeline:

1. **Extract** — Upload a `.txt` book, Claude API extracts structured case data
2. **Review** — Human inspects and edits the extracted data for accuracy
3. **Play** — Deterministic game engine runs off the approved JSON, zero API calls

Single Next.js app with three routes: `/extract`, `/review`, `/play`.

## Tech Stack

- Next.js (App Router)
- Tailwind CSS
- TypeScript
- Claude API (Anthropic SDK, extraction phase only)
- No database — single `case.json` file

## Data Model

```typescript
interface Case {
  title: string;              // Book title
  summary: string;            // One-paragraph summary (hidden from player)
  solution: Solution;
  characters: Character[];
  locations: Location[];
  clues: Clue[];
}

interface Solution {
  culprit: string;            // Character ID
  motive: string;             // Why they did it
  method: string;             // How they did it
  keyClues: string[];         // Clue IDs required to solve
  explanation: string;        // Full reveal text shown after solving
}

interface Character {
  id: string;
  name: string;
  description: string;        // Public info player sees upfront
  secrets: string[];          // Unlocked by discovering linked clues
}

interface Location {
  id: string;
  name: string;
  description: string;        // Scene-setting text
  interactables: string[];    // Clue IDs discoverable here
}

interface Clue {
  id: string;
  name: string;
  description: string;        // What the player sees when found
  keywords: string[];         // Triggers for free-text matching
  requires: string[];         // Clue IDs that must be found first (empty = available from start)
  location: string;           // Location ID where this clue lives
  linkedCharacter?: string;   // Character ID whose secret this unlocks
}
```

## Phase 1: Extract (`/extract`)

- File upload UI for `.txt` files
- Server-side API route (`/api/extract`) sends book text to Claude
- Prompt instructs Claude to output valid JSON conforming to the `Case` schema
- Uses Anthropic SDK with structured output
- On success, stores `case.json` in project directory and redirects to `/review`

## Phase 2: Review (`/review`)

- Loads `case.json` and renders as an editable form
- Sections: Characters, Locations, Clues, Solution
- Each entity rendered as a card with inline-editable fields
- Visual clue dependency graph showing the DAG (which clues unlock which)
- Add/remove entities
- "Approve & Play" button saves final JSON and redirects to `/play`

## Phase 3: Play (`/play`)

### Layout
- **Left panel:** Current location with clickable interactables (objects, characters present)
- **Right panel:** Clue journal (discovered clues, organized by location)
- **Bottom:** Free-text input for asking questions
- **Top:** Progress bar (clues found / total) and question counter

### Game Mechanics
- Player starts at the first location
- Clicking interactables checks if their `requires` are met; if so, reveals the clue
- Free-text input does substring/fuzzy matching against `keywords` arrays of all available (requirements-met) clues
- Discovering a clue linked to a character reveals that character's secret
- Navigation between locations via location list

### Endgame
- When all `keyClues` from `solution` are discovered, "Make Accusation" button appears
- Accusation screen: dropdown to pick culprit, pick motive and method from options
- **Success condition:** correct culprit + discovered all keyClues
- Motive/method scored as bonus points (not hard gates)
- **Score:** `(keyClues.length / totalQuestionsAsked) + motiveBonus + methodBonus`
- Reveal screen shows `solution.explanation` and final score

## Scope Cuts (for time)

- No auth, no persistence beyond the JSON file
- No multiplayer
- Single case at a time
- No fancy animations — functional Tailwind UI
- Clue graph visualization in review is nice-to-have; flat list is the fallback
