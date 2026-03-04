"use client";

import { MarathonEvent } from "@/lib/types";
import { formatShortDate, getDayOfWeek, getEventsForDate } from "@/lib/utils";
import EventCard from "./EventCard";

interface EventListProps {
  events: MarathonEvent[];
  selectedDate: string | null;
}

export default function EventList({ events, selectedDate }: EventListProps) {
  if (!selectedDate) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        날짜를 선택하면 해당 일자의 대회 정보를 확인할 수 있습니다.
      </div>
    );
  }

  const dayEvents = getEventsForDate(events, selectedDate);

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 mb-3">
        {formatShortDate(selectedDate)} ({getDayOfWeek(selectedDate)}) 대회
        <span className="ml-2 text-primary">{dayEvents.length}건</span>
      </h2>
      {dayEvents.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          해당 날짜에 예정된 대회가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {dayEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}
