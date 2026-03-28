"use client";

import { useState } from "react";
import type { Character } from "@/lib/types";

interface DialogueEntry {
  character: string;
  question: string;
  response: string;
  cluesFound: string[];
}

interface QuestionInputProps {
  characters: Character[];
  onAsk: (characterId: string, question: string) => Promise<{ dialogue: string; clueNames: string[] }>;
  disabled?: boolean;
}

export function QuestionInput({ characters, onAsk, disabled }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<DialogueEntry[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !selectedCharacter || disabled || loading) return;

    const q = question;
    setQuestion("");
    setLoading(true);

    try {
      const result = await onAsk(selectedCharacter, q);
      const charName = characters.find((c) => c.id === selectedCharacter)?.name ?? "Unknown";
      setHistory((prev) => [
        {
          character: charName,
          question: q,
          response: result.dialogue,
          cluesFound: result.clueNames,
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Dialogue history */}
      {history.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-3">
          {history.map((entry, i) => (
            <div key={i} className="text-sm">
              <p className="text-gray-500">
                You asked <span className="text-white">{entry.character}</span>: &ldquo;{entry.question}&rdquo;
              </p>
              <p className="text-gray-300 mt-1 italic">&ldquo;{entry.response}&rdquo;</p>
              {entry.cluesFound.length > 0 && (
                <p className="text-green-400 mt-1 text-xs">
                  New clue{entry.cluesFound.length > 1 ? "s" : ""} discovered: {entry.cluesFound.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-500 italic">
          {characters.find((c) => c.id === selectedCharacter)?.name} is thinking...
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <select
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value)}
          disabled={disabled || loading}
          className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
        >
          {characters.map((char) => (
            <option key={char.id} value={char.id}>
              {char.name}
            </option>
          ))}
        </select>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask them a question..."
          disabled={disabled || loading}
          className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || loading || !question.trim()}
          className="px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
