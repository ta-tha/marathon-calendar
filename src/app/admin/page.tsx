"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import type { MarathonEvent, Region, RegistrationStatus } from "@/lib/types";
import { REGIONS } from "@/lib/types";

const REGISTRATION_STATUSES: RegistrationStatus[] = [
  "접수중",
  "접수예정",
  "접수마감",
];

const DISTANCE_OPTIONS = ["풀코스", "하프", "10K", "5K", "울트라", "기타"];

function generateId(title: string, eventDate: string) {
  const slug = title
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")
    .toLowerCase();
  return `manual-${slug}-${eventDate}`;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<MarathonEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState<Region>("서울");
  const [distances, setDistances] = useState<string[]>([]);
  const [customDistance, setCustomDistance] = useState("");
  const [fee, setFee] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>("접수중");
  const [organizer, setOrganizer] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manual-events");
      const data = await res.json();
      setEvents(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) fetchEvents();
  }, [session, fetchEvents]);

  const resetForm = () => {
    setTitle("");
    setEventDate("");
    setRegistrationStart("");
    setRegistrationEnd("");
    setLocation("");
    setRegion("서울");
    setDistances([]);
    setCustomDistance("");
    setFee("");
    setRegistrationUrl("");
    setSourceUrl("");
    setRegistrationStatus("접수중");
    setOrganizer("");
    setPosterUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const allDistances = [...distances];
    if (customDistance.trim()) {
      allDistances.push(customDistance.trim());
    }

    const newEvent: MarathonEvent = {
      id: generateId(title, eventDate),
      title,
      eventDate,
      registrationStart: registrationStart || undefined,
      registrationEnd: registrationEnd || undefined,
      location,
      region,
      distances: allDistances,
      fee: fee || undefined,
      registrationUrl: registrationUrl || undefined,
      sourceUrl: sourceUrl || "",
      registrationStatus,
      organizer: organizer || undefined,
      posterUrl: posterUrl || undefined,
      source: "수동등록",
    };

    try {
      const res = await fetch("/api/manual-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });

      if (res.ok) {
        setMessage("등록 완료! Vercel 재배포 후 반영됩니다. (약 1~2분)");
        resetForm();
        fetchEvents();
      } else {
        const data = await res.json();
        setMessage(`오류: ${data.error}`);
      }
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, eventTitle: string) => {
    if (!confirm(`"${eventTitle}" 대회를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch("/api/manual-events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setMessage("삭제 완료!");
        fetchEvents();
      } else {
        const data = await res.json();
        setMessage(`오류: ${data.error}`);
      }
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
    }
  };

  const toggleDistance = (d: string) => {
    setDistances((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-bold text-white">관리자 로그인</h1>
          <p className="text-white/60 text-sm">
            허가된 Google 계정으로 로그인하세요.
          </p>
          <button
            onClick={() => signIn("google")}
            className="glass-btn-primary w-full px-6 py-3 rounded-xl text-sm font-semibold"
          >
            Google 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">대회 수동 등록</h1>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-xs">{session.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="glass-btn-outline px-3 py-1.5 rounded-lg text-xs"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {message && (
          <div className="glass-card rounded-xl p-3 text-sm text-white/90">
            {message}
          </div>
        )}

        {/* 등록 폼 */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white mb-2">
            새 대회 등록
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/60 mb-1">
                대회명 *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                placeholder="예: 포켓몬 런 2026 in Seoul"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                행사일 *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                지역 *
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r} className="text-black">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-white/60 mb-1">
                장소 *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                placeholder="예: 서울 뚝섬 한강공원 수변무대"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                접수 시작일
              </label>
              <input
                type="date"
                value={registrationStart}
                onChange={(e) => setRegistrationStart(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                접수 마감일
              </label>
              <input
                type="date"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-white/60 mb-1">
                종목 거리 *
              </label>
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDistance(d)}
                    className={
                      distances.includes(d)
                        ? "glass-chip-active px-3 py-1 rounded-full text-xs"
                        : "glass-chip px-3 py-1 rounded-full text-xs"
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customDistance}
                onChange={(e) => setCustomDistance(e.target.value)}
                className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                placeholder="기타 종목 직접 입력 (예: 8K)"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                접수 상태 *
              </label>
              <select
                value={registrationStatus}
                onChange={(e) =>
                  setRegistrationStatus(e.target.value as RegistrationStatus)
                }
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              >
                {REGISTRATION_STATUSES.map((s) => (
                  <option key={s} value={s} className="text-black">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                참가비
              </label>
              <input
                type="text"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                placeholder="예: 75,000원"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                접수 링크
              </label>
              <input
                type="url"
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                대회 정보 링크
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                주최 기관
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">
                포스터 이미지 URL
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                placeholder="https://..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-xl text-sm font-semibold ${
              saving ? "glass-btn-disabled" : "glass-btn-primary"
            }`}
          >
            {saving ? "저장 중..." : "대회 등록"}
          </button>
        </form>

        {/* 등록된 수동 대회 목록 */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">
            수동 등록 대회 ({events.length}건)
          </h2>

          {loading ? (
            <div className="text-white/40 text-sm">불러오는 중...</div>
          ) : events.length === 0 ? (
            <div className="text-white/40 text-sm">
              수동 등록된 대회가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="glass-event-card rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-white truncate">
                      {evt.title}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {evt.eventDate} · {evt.location} ·{" "}
                      {evt.distances.join(", ")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(evt.id, evt.title)}
                    className="glass-btn-outline px-3 py-1.5 rounded-lg text-xs shrink-0 hover:bg-red-500/20 hover:border-red-400/40"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
