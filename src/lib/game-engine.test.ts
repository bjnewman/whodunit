import { describe, it, expect } from "vitest";
import {
  createGameState,
  discoverClue,
  applyDiscoveries,
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
  detective: { id: "detective", name: "Detective", description: "The investigator.", secrets: [] },
  victims: [{ id: "victim", name: "Victim", description: "The deceased.", secrets: [] }],
  suspects: [
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
    state = discoverClue(state, "clue-1", miniCase);
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
    state = discoverClue(state, "clue-1", miniCase);
    expect(canDiscoverClue(miniCase, state, "clue-1")).toBe(false);
  });
});

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

describe("applyDiscoveries", () => {
  it("discovers specified clues and increments question count", () => {
    const state = createGameState(miniCase);
    const newState = applyDiscoveries(miniCase, state, ["clue-1"]);
    expect(newState.discoveredClues.has("clue-1")).toBe(true);
    expect(newState.questionsAsked).toBe(1);
  });

  it("discovers multiple clues at once", () => {
    const state = createGameState(miniCase);
    const newState = applyDiscoveries(miniCase, state, ["clue-1", "clue-3"]);
    expect(newState.discoveredClues.has("clue-1")).toBe(true);
    expect(newState.discoveredClues.has("clue-3")).toBe(true);
    expect(newState.questionsAsked).toBe(1);
  });

  it("reveals linked character secrets", () => {
    let state = createGameState(miniCase);
    state = discoverClue(state, "clue-1", miniCase);
    const newState = applyDiscoveries(miniCase, state, ["clue-2"]);
    expect(newState.revealedSecrets.get("suspect-a")).toEqual(["Secret A revealed."]);
  });

  it("handles empty clue array (no discoveries)", () => {
    const state = createGameState(miniCase);
    const newState = applyDiscoveries(miniCase, state, []);
    expect(newState.discoveredClues.size).toBe(0);
    expect(newState.questionsAsked).toBe(1);
  });
});

describe("makeAccusation", () => {
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

  it("returns incorrect when key clues are missing", () => {
    const state = createGameState(miniCase);
    const result = makeAccusation(miniCase, state, "suspect-a");
    expect(result.correct).toBe(false);
  });
});

describe("getScore", () => {
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
});
