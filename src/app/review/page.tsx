"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Case, Character, Location, Clue } from "@/lib/types";
import { CharacterCard } from "@/components/character-card";

export default function ReviewPage() {
  const router = useRouter();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/case")
      .then((res) => {
        if (!res.ok) throw new Error("No case data found");
        return res.json();
      })
      .then(setCaseData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove() {
    if (!caseData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/case", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/play");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateCharacter(index: number, updated: Character) {
    if (!caseData) return;
    const characters = [...caseData.characters];
    characters[index] = updated;
    setCaseData({ ...caseData, characters });
  }

  function removeCharacter(index: number) {
    if (!caseData) return;
    const characters = caseData.characters.filter((_, i) => i !== index);
    setCaseData({ ...caseData, characters });
  }

  function updateLocation(index: number, field: keyof Location, value: string | string[]) {
    if (!caseData) return;
    const locations = [...caseData.locations];
    locations[index] = { ...locations[index], [field]: value };
    setCaseData({ ...caseData, locations });
  }

  function updateClue(index: number, field: keyof Clue, value: string | string[]) {
    if (!caseData) return;
    const clues = [...caseData.clues];
    clues[index] = { ...clues[index], [field]: value };
    setCaseData({ ...caseData, clues });
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-400">Loading case data...</p>
      </main>
    );
  }

  if (error || !caseData) {
    return (
      <main className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || "No case data found."}</p>
        <a href="/extract" className="text-blue-400 hover:underline">
          ← Go extract a book first
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">{caseData.title}</h1>
          <p className="text-gray-400 mt-1">Review and edit the extracted case data.</p>
        </div>
        <button
          onClick={handleApprove}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Approve & Play →"}
        </button>
      </div>

      {/* Solution */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Solution</h2>
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Culprit (character ID)</label>
            <input
              value={caseData.solution.culprit}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, culprit: e.target.value } })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Motive</label>
            <input
              value={caseData.solution.motive}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, motive: e.target.value } })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Method</label>
            <input
              value={caseData.solution.method}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, method: e.target.value } })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Key Clues (comma-separated IDs)</label>
            <input
              value={caseData.solution.keyClues.join(", ")}
              onChange={(e) =>
                setCaseData({
                  ...caseData,
                  solution: {
                    ...caseData.solution,
                    keyClues: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Explanation</label>
            <textarea
              value={caseData.solution.explanation}
              onChange={(e) =>
                setCaseData({ ...caseData, solution: { ...caseData.solution, explanation: e.target.value } })
              }
              rows={3}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </section>

      {/* Characters */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Characters ({caseData.characters.length})</h2>
        <div className="grid gap-4">
          {caseData.characters.map((char, i) => (
            <CharacterCard
              key={char.id}
              character={char}
              onChange={(updated) => updateCharacter(i, updated)}
              onRemove={() => removeCharacter(i)}
            />
          ))}
        </div>
      </section>

      {/* Locations */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Locations ({caseData.locations.length})</h2>
        <div className="grid gap-4">
          {caseData.locations.map((loc, i) => (
            <div key={loc.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <input
                value={loc.name}
                onChange={(e) => updateLocation(i, "name", e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-white focus:outline-none mb-2"
              />
              <label className="block text-xs text-gray-500 mb-1">ID: {loc.id}</label>
              <label className="block text-xs text-gray-500 mb-1 mt-2">Description</label>
              <textarea
                value={loc.description}
                onChange={(e) => updateLocation(i, "description", e.target.value)}
                rows={2}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
              />
              <label className="block text-xs text-gray-500 mb-1 mt-2">Interactables (comma-separated clue IDs)</label>
              <input
                value={loc.interactables.join(", ")}
                onChange={(e) =>
                  updateLocation(i, "interactables", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Clues */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Clues ({caseData.clues.length})</h2>
        <div className="grid gap-4">
          {caseData.clues.map((clue, i) => (
            <div key={clue.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <input
                value={clue.name}
                onChange={(e) => updateClue(i, "name", e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-white focus:outline-none mb-2"
              />
              <label className="block text-xs text-gray-500 mb-1">ID: {clue.id} | Location: {clue.location}</label>
              <label className="block text-xs text-gray-500 mb-1 mt-2">Description</label>
              <textarea
                value={clue.description}
                onChange={(e) => updateClue(i, "description", e.target.value)}
                rows={2}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm resize-y focus:outline-none focus:border-gray-500"
              />
              <label className="block text-xs text-gray-500 mb-1 mt-2">Keywords (comma-separated)</label>
              <input
                value={clue.keywords.join(", ")}
                onChange={(e) =>
                  updateClue(i, "keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
              />
              <label className="block text-xs text-gray-500 mb-1 mt-2">Requires (comma-separated clue IDs)</label>
              <input
                value={clue.requires.join(", ")}
                onChange={(e) =>
                  updateClue(i, "requires", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
              />
              {clue.linkedCharacter && (
                <>
                  <label className="block text-xs text-gray-500 mb-1 mt-2">Linked Character</label>
                  <input
                    value={clue.linkedCharacter}
                    onChange={(e) => updateClue(i, "linkedCharacter", e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom approve button */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleApprove}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Approve & Play →"}
        </button>
      </div>
    </main>
  );
}
