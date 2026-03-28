"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExtractPage() {
  const router = useRouter();
  const [bookText, setBookText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!bookText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookText }),
      });

      if (!extractRes.ok) {
        const err = await extractRes.json();
        throw new Error(err.error || "Extraction failed");
      }

      const caseData = await extractRes.json();

      const saveRes = await fetch("/api/case", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save case data");
      }

      router.push("/review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBookText(event.target?.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Extract a Case</h1>
      <p className="text-gray-400 mb-8">
        Upload a detective novel (.txt) and Claude will extract a playable mystery.
      </p>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          Upload a .txt file
        </label>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white file:text-black file:font-semibold hover:file:bg-gray-200 file:cursor-pointer"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          Or paste the text directly
        </label>
        <textarea
          value={bookText}
          onChange={(e) => setBookText(e.target.value)}
          rows={12}
          className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm resize-y focus:outline-none focus:border-gray-500"
          placeholder="Paste the full text of a detective novel here..."
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleExtract}
          disabled={loading || !bookText.trim()}
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Extracting..." : "Extract Case →"}
        </button>

        {bookText && (
          <span className="text-sm text-gray-500">
            {bookText.length.toLocaleString()} characters loaded
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-gray-300">
            Claude is reading the book and extracting the mystery structure...
          </p>
          <p className="text-gray-500 text-sm mt-1">
            This may take a minute for longer texts.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </main>
  );
}
