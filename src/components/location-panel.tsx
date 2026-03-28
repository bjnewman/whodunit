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
