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
