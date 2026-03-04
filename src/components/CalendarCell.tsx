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
      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative ${
        isSelected
          ? "bg-primary text-white font-bold"
          : isToday
          ? "border-2 border-primary text-primary font-semibold"
          : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      {day}
      {eventCount > 0 && (
        <span
          className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
            isSelected ? "bg-white" : "bg-primary"
          }`}
        />
      )}
    </button>
  );
}
