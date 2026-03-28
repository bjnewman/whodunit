"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Mode = "choose" | "sample" | "json" | "api";

const EXTRACTION_STEPS = [
  "Opening the case file...",
  "Reading the first chapter...",
  "Identifying suspects...",
  "Mapping crime scenes...",
  "Cataloging evidence...",
  "Tracing motives...",
  "Reconstructing the timeline...",
  "Cross-referencing alibis...",
  "Building the clue graph...",
  "Connecting the dots...",
  "Preparing the investigation...",
];

function ExtractionProgress() {
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i + 1) % EXTRACTION_STEPS.length);
    }, 3500);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <div className="mt-8 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span className="text-white font-medium">Extracting mystery{dots}</span>
      </div>
      <div className="space-y-2">
        {EXTRACTION_STEPS.slice(0, stepIndex + 1).map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-2 text-sm transition-opacity duration-500 ${
              i === stepIndex ? "text-white" : "text-gray-600"
            }`}
          >
            <span>{i < stepIndex ? "✓" : "›"}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExtractPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [bookText, setBookText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAndRedirect(caseData: unknown) {
    const res = await fetch("/api/case", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(caseData),
    });
    if (!res.ok) throw new Error("Failed to save case data");
    router.push("/review");
  }

  async function handleLoadSample() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/sample-case.json");
      if (!res.ok) throw new Error("Failed to load sample case");
      const caseData = await res.json();
      await saveAndRedirect(caseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadJson() {
    setError(null);
    try {
      const caseData = JSON.parse(jsonText);
      await saveAndRedirect(caseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  function handleJsonFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result as string);
    };
    reader.readAsText(file);
  }

  async function handleExtractWithApi() {
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
      await saveAndRedirect(caseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleBookFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
      <h1 className="text-4xl font-bold mb-2">Load a Case</h1>
      <p className="text-gray-400 mb-8">
        Choose how to load a mystery case into the game.
      </p>

      {mode === "choose" && (
        <div className="grid gap-4 max-w-xl">
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="text-left p-6 bg-gray-900 border border-gray-700 rounded-lg hover:border-white transition"
          >
            <h3 className="text-lg font-semibold mb-1">
              {loading ? "Loading..." : "The Hound of the Baskervilles"}
            </h3>
            <p className="text-gray-400 text-sm">
              Play the pre-built sample case based on the classic Sherlock Holmes mystery.
            </p>
          </button>

          <button
            onClick={() => setMode("json")}
            className="text-left p-6 bg-gray-900 border border-gray-700 rounded-lg hover:border-white transition"
          >
            <h3 className="text-lg font-semibold mb-1">Upload Case JSON</h3>
            <p className="text-gray-400 text-sm">
              Load a pre-generated case file (.json) — paste it or upload a file.
            </p>
          </button>

          <button
            onClick={() => setMode("api")}
            className="text-left p-6 bg-gray-900 border border-gray-700 rounded-lg hover:border-white transition"
          >
            <h3 className="text-lg font-semibold mb-1">Extract from Book</h3>
            <p className="text-gray-400 text-sm">
              Upload a detective novel (.txt) and Claude will extract a playable case.
            </p>
          </button>
        </div>
      )}

      {mode === "json" && (
        <div>
          <button onClick={() => setMode("choose")} className="text-gray-400 hover:text-white text-sm mb-6">
            ← Back
          </button>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Upload a .json case file</label>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonFileUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white file:text-black file:font-semibold hover:file:bg-gray-200 file:cursor-pointer"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Or paste the JSON directly</label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm resize-y focus:outline-none focus:border-gray-500"
              placeholder='{"title": "...", "solution": {...}, "characters": [...], ...}'
            />
          </div>

          <button
            onClick={handleLoadJson}
            disabled={!jsonText.trim()}
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load Case →
          </button>
        </div>
      )}

      {mode === "api" && (
        <div>
          <button onClick={() => setMode("choose")} className="text-gray-400 hover:text-white text-sm mb-6">
            ← Back
          </button>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Upload a .txt file</label>
            <input
              type="file"
              accept=".txt"
              onChange={handleBookFileUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white file:text-black file:font-semibold hover:file:bg-gray-200 file:cursor-pointer"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Or paste the text directly</label>
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
              onClick={handleExtractWithApi}
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

          {loading && <ExtractionProgress />}
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
