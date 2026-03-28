import type { Case, Clue } from "./types";
import { allCharacters } from "./types";

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
      const character = allCharacters(caseData).find(
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
