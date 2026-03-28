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
