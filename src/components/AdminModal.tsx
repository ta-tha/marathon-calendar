"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import type { MarathonEvent, Region, RegistrationStatus } from "@/lib/types";
import { REGIONS } from "@/lib/types";

type ModalStep = "closed" | "choose" | "url" | "manual" | "preview";

const REGISTRATION_STATUSES: RegistrationStatus[] = ["접수중", "접수예정", "접수마감"];
const DISTANCE_OPTIONS = ["풀코스", "하프", "10K", "5K", "울트라"];

function generateId(title: string, eventDate: string) {
  const slug = title.replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "").toLowerCase();
  return `manual-${slug}-${eventDate}`;
}

export default function AdminModal({ onEventAdded }: { onEventAdded: () => void }) {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const [step, setStep] = useState<ModalStep>("closed");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // URL 등록
  const [scrapeUrl, setScrapeUrl] = useState("");

  // 직접 등록 폼
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
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>("접수중");
  const [organizer, setOrganizer] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  // 관리자가 아니면 버튼 자체를 숨김
  if (status === "loading" || !isAdmin) return null;

  const handleOpen = () => { setError(""); setStep("choose"); };

  const handleScrape = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: scrapeUrl }),
    });
    const data = await res.json();
    if (res.ok) {
      const evt = data.event;
      setTitle(evt.title || "");
      setEventDate(evt.eventDate || "");
      setRegistrationStart(evt.registrationStart || "");
      setRegistrationEnd(evt.registrationEnd || "");
      setLocation(evt.location || "");
      setRegion(evt.region || "서울");
      setDistances(evt.distances || []);
      setFee(evt.fee || "");
      setRegistrationUrl(evt.registrationUrl || "");
      setSourceUrl(evt.sourceUrl || "");
      setRegistrationStatus(evt.registrationStatus || "접수중");
      setOrganizer(evt.organizer || "");
      setPosterUrl(evt.posterUrl || "");
      setStep("preview");
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    const allDistances = [...distances];
    if (customDistance.trim()) allDistances.push(customDistance.trim());

    const newEvent: MarathonEvent = {
      id: generateId(title, eventDate),
      title,
      eventDate,
      registrationStart: registrationStart || undefined,
      registrationEnd: registrationEnd || undefined,
      location,
      region,
      distances: allDistances.length > 0 ? allDistances : ["기타"],
      fee: fee || undefined,
      registrationUrl: registrationUrl || undefined,
      sourceUrl: sourceUrl || "",
      registrationStatus,
      organizer: organizer || undefined,
      posterUrl: posterUrl || undefined,
      source: "수동등록",
    };

    const res = await fetch("/api/manual-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    });

    if (res.ok) {
      resetForm();
      setStep("closed");
      onEventAdded();
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setEventDate(""); setRegistrationStart(""); setRegistrationEnd("");
    setLocation(""); setRegion("서울"); setDistances([]); setCustomDistance("");
    setFee(""); setRegistrationUrl(""); setSourceUrl(""); setRegistrationStatus("접수중");
    setOrganizer(""); setPosterUrl(""); setScrapeUrl(""); setError("");
  };

  const close = () => { setStep("closed"); resetForm(); };

  const toggleDistance = (d: string) => {
    setDistances((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  if (step === "closed") {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full glass-btn-primary flex items-center justify-center text-2xl font-light shadow-lg z-50 hover:scale-105 transition-transform"
        title="대회 등록"
      >
        +
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={close}>
      <div className="glass-modal rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-modal-in" onClick={(e) => e.stopPropagation()}>

        {/* 등록 방식 선택 */}
        {step === "choose" && (
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">새 대회 등록</h2>
            <button
              onClick={() => { setError(""); setStep("url"); }}
              className="w-full glass-card rounded-xl p-4 text-left hover:bg-white/20 transition-colors"
            >
              <div className="font-semibold text-white text-sm">URL로 자동 등록</div>
              <div className="text-white/50 text-xs mt-1">대회 링크만 넣으면 자동으로 정보를 추출합니다</div>
            </button>
            <button
              onClick={() => { setError(""); setStep("manual"); }}
              className="w-full glass-card rounded-xl p-4 text-left hover:bg-white/20 transition-colors"
            >
              <div className="font-semibold text-white text-sm">직접 등록</div>
              <div className="text-white/50 text-xs mt-1">대회 정보를 직접 입력합니다</div>
            </button>
            <button onClick={close} className="w-full glass-btn-outline px-4 py-2.5 rounded-xl text-sm">닫기</button>
          </div>
        )}

        {/* URL 등록 */}
        {step === "url" && (
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">URL로 자동 등록</h2>
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              placeholder="https://마라톤대회사이트.com/..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
              autoFocus
            />
            {error && <p className="text-red-300 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("choose")} className="flex-1 glass-btn-outline px-4 py-2.5 rounded-xl text-sm">뒤로</button>
              <button onClick={handleScrape} disabled={loading || !scrapeUrl} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold ${loading || !scrapeUrl ? "glass-btn-disabled" : "glass-btn-primary"}`}>
                {loading ? "분석 중..." : "정보 추출"}
              </button>
            </div>
          </div>
        )}

        {/* 프리뷰 (URL 추출 결과 확인/수정) */}
        {step === "preview" && (
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">추출 결과 확인</h2>
            <p className="text-white/50 text-xs">자동 추출된 정보입니다. 수정 후 등록하세요.</p>
            {renderForm()}
            {error && <p className="text-red-300 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("url")} className="flex-1 glass-btn-outline px-4 py-2.5 rounded-xl text-sm">뒤로</button>
              <button onClick={handleSave} disabled={loading || !title || !eventDate} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold ${loading || !title || !eventDate ? "glass-btn-disabled" : "glass-btn-primary"}`}>
                {loading ? "저장 중..." : "등록"}
              </button>
            </div>
          </div>
        )}

        {/* 직접 등록 */}
        {step === "manual" && (
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">직접 등록</h2>
            {renderForm()}
            {error && <p className="text-red-300 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("choose")} className="flex-1 glass-btn-outline px-4 py-2.5 rounded-xl text-sm">뒤로</button>
              <button onClick={handleSave} disabled={loading || !title || !eventDate} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold ${loading || !title || !eventDate ? "glass-btn-disabled" : "glass-btn-primary"}`}>
                {loading ? "저장 중..." : "등록"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderForm() {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">대회명 *</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">행사일 *</label>
            <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">지역 *</label>
            <select value={region} onChange={(e) => setRegion(e.target.value as Region)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40">
              {REGIONS.map((r) => <option key={r} value={r} className="text-black">{r}</option>)}
              <option value="기타" className="text-black">기타</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">장소</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">접수 시작일</label>
            <input type="date" value={registrationStart} onChange={(e) => setRegistrationStart(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">접수 마감일</label>
            <input type="date" value={registrationEnd} onChange={(e) => setRegistrationEnd(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">종목</label>
          <div className="flex flex-wrap gap-2">
            {DISTANCE_OPTIONS.map((d) => (
              <button key={d} type="button" onClick={() => toggleDistance(d)}
                className={`${distances.includes(d) ? "glass-chip-active" : "glass-chip"} px-3 py-1 rounded-full text-xs`}>{d}</button>
            ))}
          </div>
          <input type="text" value={customDistance} onChange={(e) => setCustomDistance(e.target.value)} placeholder="기타 (예: 8K)"
            className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">접수 상태</label>
            <select value={registrationStatus} onChange={(e) => setRegistrationStatus(e.target.value as RegistrationStatus)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40">
              {REGISTRATION_STATUSES.map((s) => <option key={s} value={s} className="text-black">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">참가비</label>
            <input type="text" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="예: 75,000원"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">접수/대회 링크</label>
          <input type="url" value={registrationUrl} onChange={(e) => { setRegistrationUrl(e.target.value); if (!sourceUrl) setSourceUrl(e.target.value); }}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" placeholder="https://..." />
        </div>
      </div>
    );
  }
}
