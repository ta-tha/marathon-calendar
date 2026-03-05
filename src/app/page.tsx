"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { MarathonEvent, Region } from "@/lib/types";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import AlertPanel from "@/components/AlertPanel";
import Calendar from "@/components/Calendar";
import EventList from "@/components/EventList";
import EventCard from "@/components/EventCard";
import { getEventsForMonth } from "@/lib/utils";

function searchEvents(events: MarathonEvent[], query: string): MarathonEvent[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return events.filter((e) =>
    terms.every((term) =>
      e.title.toLowerCase().includes(term) ||
      e.location.toLowerCase().includes(term) ||
      e.region.toLowerCase().includes(term) ||
      e.eventDate.includes(term) ||
      e.distances.some((d) => d.toLowerCase().includes(term)) ||
      (e.organizer && e.organizer.toLowerCase().includes(term))
    )
  );
}

export default function Home() {
  const [allEvents, setAllEvents] = useState<MarathonEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const searchResults = useMemo(
    () => searchEvents(filteredEvents, searchQuery),
    [filteredEvents, searchQuery]
  );

  const isSearching = searchQuery.trim().length > 0;

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
        <div className="text-white/60 text-sm">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterBar selected={selectedRegions} onChange={setSelectedRegions} />

        {isSearching ? (
          <div>
            <h2 className="text-sm font-semibold text-white/90 mb-3">
              검색 결과 <span className="text-white/60">{searchResults.length}건</span>
            </h2>
            {searchResults.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  );
}
