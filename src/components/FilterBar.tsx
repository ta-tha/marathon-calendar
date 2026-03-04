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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">지역 필터</h2>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-primary transition-colors"
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
