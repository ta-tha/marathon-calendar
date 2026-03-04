"use client";

import { Region, REGIONS } from "@/lib/types";

interface FilterBarProps {
  selected: Region[];
  onChange: (regions: Region[]) => void;
}

export default function FilterBar({ selected, onChange }: FilterBarProps) {
  const toggle = (r: Region) => {
    if (selected.includes(r)) {
      onChange(selected.filter((s) => s !== r));
    } else {
      onChange([...selected, r]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/90">지역 필터</h2>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            초기화
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r) => {
          const active = selected.includes(r);
          return (
            <button
              key={r}
              onClick={() => toggle(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active
                  ? "glass-chip-active"
                  : "glass-chip"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
