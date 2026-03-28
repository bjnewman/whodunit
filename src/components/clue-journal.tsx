"use client";

import type { Case } from "@/lib/types";
import { allCharacters } from "@/lib/types";
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
                const character = allCharacters(caseData).find((c) => c.id === charId);
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
