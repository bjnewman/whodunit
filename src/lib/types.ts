export interface Case {
  title: string;
  summary: string;
  solution: Solution;
  detective: Character;
  victims: Character[];
  suspects: Character[];
  locations: Location[];
  clues: Clue[];
}

export function allCharacters(caseData: Case): Character[] {
  return [caseData.detective, ...caseData.victims, ...caseData.suspects];
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
