"use client";

import type { Case, Location } from "@/lib/types";
import { allCharacters } from "@/lib/types";
import type { GameState } from "@/lib/game-engine";

interface LocationPanelProps {
  caseData: Case;
  state: GameState;
  location: Location;
  onNavigate: (locationId: string) => void;
}

export function LocationPanel({ caseData, state, location, onNavigate }: LocationPanelProps) {
  // Show characters linked to clues at this location
  const characterIdsHere = new Set(
    caseData.clues
      .filter((c) => c.location === location.id && c.linkedCharacter)
      .map((c) => c.linkedCharacter!)
  );
  const charactersHere = allCharacters(caseData).filter((c) => characterIdsHere.has(c.id));

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-2">{location.name}</h2>
      <p className="text-gray-300 leading-relaxed mb-6">{location.description}</p>

      {charactersHere.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            People here
          </h3>
          <div className="grid gap-2 mb-6">
            {charactersHere.map((char) => {
              const hasRevealedSecret = state.revealedSecrets.has(char.id);
              return (
                <div
                  key={char.id}
                  className={`p-3 rounded-lg border ${
                    hasRevealedSecret
                      ? "bg-yellow-900/10 border-yellow-700/30"
                      : "bg-gray-900 border-gray-700"
                  }`}
                >
                  <p className="font-medium text-sm">{char.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{char.description}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-auto">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Travel to
        </h3>
        <div className="grid gap-2">
          {caseData.locations
            .filter((loc) => loc.id !== location.id)
            .map((loc) => (
              <button
                key={loc.id}
                onClick={() => onNavigate(loc.id)}
                className="text-left p-2 rounded border bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition"
              >
                {loc.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
