"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { MarathonEvent } from "@/lib/types";
import { daysUntil, formatShortDate, getUpcomingDeadlines, getUpcomingRegistrations } from "@/lib/utils";

interface AlertPanelProps {
  events: MarathonEvent[];
  onEventClick: (event: MarathonEvent) => void;
}

function DeadlineBadge({ days }: { days: number }) {
  if (days <= 0) {
    return (
      <span className="shrink-0 whitespace-nowrap inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/80 text-white">
        D-Day
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="shrink-0 whitespace-nowrap inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/80 text-white">
        D-{days}
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="shrink-0 whitespace-nowrap inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/80 text-white">
        D-{days}
      </span>
    );
  }
  return (
    <span className="shrink-0 whitespace-nowrap inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white/80">
      D-{days}
    </span>
  );
}

function useScrollArrows(ref: React.RefObject<HTMLDivElement | null>) {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [ref, updateArrows]);

  const scrollBy = (direction: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return { showLeft, showRight, scrollBy };
}

interface ScrollSectionProps {
  title: string;
  dotColor: string;
  children: React.ReactNode;
}

function ScrollSection({ title, dotColor, children }: ScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showLeft, showRight, scrollBy } = useScrollArrows(scrollRef);

  return (
    <div className="glass-card rounded-xl p-4">
      <h2 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`} />
        {title}
      </h2>
      <div className="relative">
        {showLeft && (
          <button
            onClick={() => scrollBy("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-10 w-8 h-8 flex items-center justify-center rounded-full glass-scroll-arrow"
            aria-label="이전"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-1"
        >
          {children}
        </div>
        {showRight && (
          <button
            onClick={() => scrollBy("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-10 w-8 h-8 flex items-center justify-center rounded-full glass-scroll-arrow"
            aria-label="다음"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertPanel({ events, onEventClick }: AlertPanelProps) {
  const deadlines = getUpcomingDeadlines(events);
  const upcoming = getUpcomingRegistrations(events);

  if (deadlines.length === 0 && upcoming.length === 0) return null;

  return (
    <div className="space-y-4">
      {deadlines.length > 0 && (
        <ScrollSection title="접수중 (마감 임박)" dotColor="bg-red-400">
          {deadlines.map((evt) => {
            const days = daysUntil(evt.registrationEnd!);
            return (
              <button
                key={evt.id}
                onClick={() => onEventClick(evt)}
                className="flex-shrink-0 w-56 text-left glass-alert-card rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-white line-clamp-1">
                    {evt.title}
                  </span>
                  <DeadlineBadge days={days} />
                </div>
                <p className="text-xs text-white/60 mb-1">{evt.location}</p>
                <p className="text-xs text-white/45">
                  행사일 {formatShortDate(evt.eventDate)} | 마감 {formatShortDate(evt.registrationEnd!)}
                </p>
              </button>
            );
          })}
        </ScrollSection>
      )}

      {upcoming.length > 0 && (
        <ScrollSection title="곧 접수 시작" dotColor="bg-blue-400">
          {upcoming.map((evt) => {
            const days = daysUntil(evt.registrationStart!);
            return (
              <button
                key={evt.id}
                onClick={() => onEventClick(evt)}
                className="flex-shrink-0 w-56 text-left glass-alert-card rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-white line-clamp-1">
                    {evt.title}
                  </span>
                  <span className="shrink-0 whitespace-nowrap inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/60 text-white">
                    D-{days}
                  </span>
                </div>
                <p className="text-xs text-white/60 mb-1">{evt.location}</p>
                <p className="text-xs text-white/45">
                  행사일 {formatShortDate(evt.eventDate)} | 접수시작 {formatShortDate(evt.registrationStart!)}
                </p>
              </button>
            );
          })}
        </ScrollSection>
      )}
    </div>
  );
}
