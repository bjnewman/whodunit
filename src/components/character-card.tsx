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
          className="flex-1 min-w-0 text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-white focus:outline-none"
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
        rows={3}
        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
      />
      <label className="block text-xs text-gray-500 mb-1 mt-3">Secrets (one per line)</label>
      <textarea
        value={character.secrets.join("\n")}
        onChange={(e) =>
          onChange({ ...character, secrets: e.target.value.split("\n").filter(Boolean) })
        }
        rows={3}
        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
      />
    </div>
  );
}
