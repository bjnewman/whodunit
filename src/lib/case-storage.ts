import type { Case } from "./types";

const STORAGE_KEY = "whodunit-case";

export function saveCase(caseData: Case): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(caseData));
  }
}

export function loadCase(): Case | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
