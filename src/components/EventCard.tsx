"use client";

import { useState } from "react";
import { MarathonEvent } from "@/lib/types";
import { daysUntil, formatShortDate, getDayOfWeek } from "@/lib/utils";

interface EventCardProps {
  event: MarathonEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const regEndDays = event.registrationEnd ? daysUntil(event.registrationEnd) : null;
  const [imgError, setImgError] = useState(false);

  const statusColor =
    event.registrationStatus === "접수중"
      ? "bg-green-100 text-green-700"
      : event.registrationStatus === "접수예정"
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-100 text-slate-500";

  const showPoster = event.posterUrl && !imgError;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 mb-1 leading-tight">
            {event.title}
          </h3>
          <p className="text-sm text-slate-500">{event.location}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {event.registrationStatus}
        </span>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 w-16 shrink-0">행사일</span>
            <span className="text-slate-700 font-medium">
              {formatShortDate(event.eventDate)} ({getDayOfWeek(event.eventDate)})
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 w-16 shrink-0">종목</span>
            <div className="flex flex-wrap gap-1">
              {event.distances.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {event.registrationStart && event.registrationEnd && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 w-16 shrink-0">접수기간</span>
              <span className="text-slate-700">
                {formatShortDate(event.registrationStart)} ~ {formatShortDate(event.registrationEnd)}
                {regEndDays !== null && regEndDays >= 0 && event.registrationStatus === "접수중" && (
                  <span
                    className={`ml-2 text-xs font-bold ${
                      regEndDays <= 3 ? "text-red-500" : regEndDays <= 7 ? "text-orange-500" : "text-slate-400"
                    }`}
                  >
                    (마감 D-{regEndDays})
                  </span>
                )}
              </span>
            </div>
          )}

          {event.fee && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-slate-400 w-16 shrink-0">참가비</span>
              <span className="text-slate-700">{event.fee}</span>
            </div>
          )}
        </div>

        {showPoster && (
          <div className="shrink-0 w-32 h-28 rounded-lg overflow-hidden border border-slate-100">
            <img
              src={event.posterUrl}
              alt={`${event.title} 포스터`}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          상세보기
        </a>
        {event.registrationStatus === "접수중" && event.registrationUrl ? (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            접수하기
          </a>
        ) : (
          <span className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed">
            접수하기
          </span>
        )}
      </div>
    </div>
  );
}
