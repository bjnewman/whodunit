"use client";

import type { Case, Location } from "@/lib/types";

interface LocationPanelProps {
  caseData: Case;
  location: Location;
  onNavigate: (locationId: string) => void;
}

export function LocationPanel({ caseData, location, onNavigate }: LocationPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-2">{location.name}</h2>
      <p className="text-gray-300 leading-relaxed mb-6">{location.description}</p>

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
