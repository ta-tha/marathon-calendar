"use client";

import { MarathonEvent } from "@/lib/types";
import { getCalendarDays, getEventsForDate, getToday } from "@/lib/utils";
import CalendarCell from "./CalendarCell";

interface CalendarProps {
  year: number;
  month: number;
  events: MarathonEvent[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({
  year,
  month,
  events,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarProps) {
  const weeks = getCalendarDays(year, month);
  const today = getToday();

  const toDateStr = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          aria-label="이전 달"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {year}년 {month}월
          </h2>
          <button
            onClick={onToday}
            className="text-xs px-2.5 py-1 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            오늘
          </button>
        </div>

        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          aria-label="다음 달"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-2 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day, idx) => {
          const dateStr = day ? toDateStr(day) : "";
          const eventsForDay = day ? getEventsForDate(events, dateStr) : [];
          return (
            <CalendarCell
              key={idx}
              day={day}
              isToday={dateStr === today}
              isSelected={dateStr === selectedDate}
              eventCount={eventsForDay.length}
              onClick={() => day && onDateSelect(dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}
