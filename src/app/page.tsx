"use client";

import { useEffect, useState, useCallback } from "react";
import { MarathonEvent, Region } from "@/lib/types";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import AlertPanel from "@/components/AlertPanel";
import Calendar from "@/components/Calendar";
import EventList from "@/components/EventList";
import { getEventsForMonth } from "@/lib/utils";

export default function Home() {
  const [allEvents, setAllEvents] = useState<MarathonEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    fetch("/data/events.json")
      .then((res) => res.json())
      .then((data: MarathonEvent[]) => {
        setAllEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredEvents =
    selectedRegions.length === 0
      ? allEvents
      : allEvents.filter((e) => selectedRegions.includes(e.region));

  const monthEvents = getEventsForMonth(filteredEvents, year, month);

  const handlePrevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
    setSelectedDate(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
    setSelectedDate(null);
  }, []);

  const handleToday = useCallback(() => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    const todayStr = d.toISOString().split("T")[0];
    setSelectedDate(todayStr);
  }, []);

  const handleAlertEventClick = useCallback((event: MarathonEvent) => {
    const [y, m] = event.eventDate.split("-").map(Number);
    setYear(y);
    setMonth(m);
    setSelectedDate(event.eventDate);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <FilterBar selected={selectedRegions} onChange={setSelectedRegions} />
        <AlertPanel events={filteredEvents} onEventClick={handleAlertEventClick} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Calendar
            year={year}
            month={month}
            events={monthEvents}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
          <div>
            <EventList events={monthEvents} selectedDate={selectedDate} />
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-slate-200 text-center text-sm text-slate-400">
        <a
          href="https://open.kakao.com/o/sBQR8q1h"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-600 transition-colors"
        >
          개발자에게 문의하기
        </a>
      </footer>
    </div>
  );
}
