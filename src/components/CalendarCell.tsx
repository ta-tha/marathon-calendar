"use client";

interface CalendarCellProps {
  day: number | null;
  isToday: boolean;
  isSelected: boolean;
  eventCount: number;
  onClick: () => void;
}

export default function CalendarCell({
  day,
  isToday,
  isSelected,
  eventCount,
  onClick,
}: CalendarCellProps) {
  if (day === null) {
    return <div className="aspect-square" />;
  }

  return (
    <button
      onClick={onClick}
      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${
        isSelected
          ? "bg-white/30 text-white font-bold border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          : isToday
          ? "border-2 border-white/50 text-white font-semibold"
          : "hover:bg-white/10 text-white/80"
      }`}
    >
      {day}
      {eventCount > 0 && (
        <span
          className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
            isSelected ? "bg-white" : "bg-white/70"
          }`}
        />
      )}
    </button>
  );
}
