"use client";

import { useState } from "react";

interface QuestionInputProps {
  onAsk: (question: string) => string;
  disabled?: boolean;
}

export function QuestionInput({ onAsk, disabled }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || disabled) return;

    const result = onAsk(question);
    setLastResult(result);
    setQuestion("");
  }

  return (
    <div>
      {lastResult && (
        <p className={`text-sm mb-2 ${lastResult.includes("discovered") ? "text-green-400" : "text-gray-500"}`}>
          {lastResult}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question to investigate..."
          disabled={disabled}
          className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !question.trim()}
          className="px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
