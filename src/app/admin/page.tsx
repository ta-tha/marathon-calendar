"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import type { MarathonEvent, Region, RegistrationStatus } from "@/lib/types";
import { REGIONS } from "@/lib/types";

const REGISTRATION_STATUSES: RegistrationStatus[] = ["접수중", "접수예정", "접수마감"];
const DISTANCE_OPTIONS = ["풀코스", "하프", "10K", "5K", "울트라"];

function generateId(title: string, eventDate: string) {
  const slug = title.replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "").toLowerCase();
  return `manual-${slug}-${eventDate}`;
}

type Step = "menu" | "url" | "manual" | "preview" | "list";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const [step, setStep] = useState<Step>("menu");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // 등록된 이벤트 목록
  const [manualEvents, setManualEvents] = useState<MarathonEvent[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const resetForm = () => {
    setTitle(""); setEventDate(""); setRegistrationStart(""); setRegistrationEnd("");
    setLocation(""); setRegion("서울"); setDistances([]); setCustomDistance("");
    setFee(""); setRegistrationUrl(""); setSourceUrl(""); setRegistrationStatus("접수중");
    setOrganizer(""); setPosterUrl(""); setScrapeUrl(""); setError(""); setSuccess("");
  };

  const handleScrape = async () => {
    setLoading(true);
    setError("");
    try {
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
        setError(data.error || "추출 실패");
      }
    } catch {
      setError("네트워크 오류");
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

    try {
      const res = await fetch("/api/manual-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        resetForm();
        setSuccess("등록 완료!");
        setStep("menu");
      } else {
        const data = await res.json();
        setError(data.error || "저장 실패");
      }
    } catch {
      setError("네트워크 오류");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch("/api/manual-events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setManualEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const loadManualEvents = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/data/manual-events.json");
      const data = await res.json();
      setManualEvents(data);
    } catch {
      setManualEvents([]);
    }
    setListLoading(false);
  };

  const toggleDistance = (d: string) => {
    setDistances((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  // 로딩 중
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-sm">로딩 중...</div>
      </div>
    );
  }

  // 로그인 안 됨
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-bold text-white">관리자 로그인</h1>
          <p className="text-white/50 text-sm">관리자 계정으로 로그인하세요.</p>
          <button
            onClick={() => signIn("google")}
            className="w-full glass-btn-primary px-6 py-3 rounded-xl text-sm font-semibold"
          >
            Google 로그인
          </button>
          <a href="/" className="block text-white/40 text-xs hover:text-white/60 transition-colors">
            메인으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  // 관리자가 아닌 계정
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <h1 className="text-xl font-bold text-white">접근 권한 없음</h1>
          <p className="text-white/50 text-sm">
            {session.user?.email} 계정은 관리자가 아닙니다.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full glass-btn-outline px-6 py-3 rounded-xl text-sm"
          >
            로그아웃
          </button>
          <a href="/" className="block text-white/40 text-xs hover:text-white/60 transition-colors">
            메인으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  // 관리자 메인
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">대회 관리</h1>
            <p className="text-white/40 text-xs mt-1">{session.user?.email}</p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="glass-btn-outline px-3 py-2 rounded-lg text-xs">메인</a>
            <button onClick={() => signOut()} className="glass-btn-outline px-3 py-2 rounded-lg text-xs">로그아웃</button>
          </div>
        </div>

        {success && (
          <div className="glass-card rounded-xl p-3 mb-4 border border-green-500/30 bg-green-500/10">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}

        {/* 메뉴 */}
        {step === "menu" && (
          <div className="space-y-3">
            <button
              onClick={() => { resetForm(); setStep("url"); }}
              className="w-full glass-card rounded-xl p-5 text-left hover:bg-white/20 transition-colors"
            >
              <div className="font-semibold text-white text-sm">URL로 자동 등록</div>
              <div className="text-white/50 text-xs mt-1">대회 링크만 넣으면 자동으로 정보를 추출합니다</div>
            </button>
            <button
              onClick={() => { resetForm(); setStep("manual"); }}
              className="w-full glass-card rounded-xl p-5 text-left hover:bg-white/20 transition-colors"
            >
              <div className="font-semibold text-white text-sm">직접 등록</div>
              <div className="text-white/50 text-xs mt-1">대회 정보를 직접 입력합니다</div>
            </button>
            <button
              onClick={() => { setStep("list"); loadManualEvents(); }}
              className="w-full glass-card rounded-xl p-5 text-left hover:bg-white/20 transition-colors"
            >
              <div className="font-semibold text-white text-sm">등록된 대회 관리</div>
              <div className="text-white/50 text-xs mt-1">수동 등록된 대회를 확인하고 삭제할 수 있습니다</div>
            </button>
          </div>
        )}

        {/* URL 등록 */}
        {step === "url" && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
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
              <button onClick={() => setStep("menu")} className="flex-1 glass-btn-outline px-4 py-2.5 rounded-xl text-sm">뒤로</button>
              <button
                onClick={handleScrape}
                disabled={loading || !scrapeUrl}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold ${loading || !scrapeUrl ? "glass-btn-disabled" : "glass-btn-primary"}`}
              >
                {loading ? "분석 중..." : "정보 추출"}
              </button>
            </div>
          </div>
        )}

        {/* 프리뷰 */}
        {step === "preview" && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">추출 결과 확인</h2>
            <p className="text-white/50 text-xs">자동 추출된 정보입니다. 수정 후 등록하세요.</p>
            {renderForm()}
            {error && <p className="text-red-300 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("url")} className="flex-1 glass-btn-outline px-4 py-2.5 rounded-xl text-sm">뒤로</button>
              <button
                onClick={handleSave}
                disabled={loading || !title || !eventDate}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold ${loading || !title || !eventDate ? "glass-btn-disabled" : "glass-btn-primary"}`}
              >
                {loading ? "저장 중..." : "등록"}
              </button>
            </div>
          </div>
        )}

        {/* 직접 등록 */}
        {step === "manual" && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">직접 등록</h2>
            {renderForm()}
            {error && <p className="text-red-300 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("menu")} className="flex-1 glass-btn-outline px-4 py-2.5 rounded-xl text-sm">뒤로</button>
              <button
                onClick={handleSave}
                disabled={loading || !title || !eventDate}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold ${loading || !title || !eventDate ? "glass-btn-disabled" : "glass-btn-primary"}`}
              >
                {loading ? "저장 중..." : "등록"}
              </button>
            </div>
          </div>
        )}

        {/* 등록된 대회 목록 */}
        {step === "list" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">등록된 대회 ({manualEvents.length}건)</h2>
              <button onClick={() => setStep("menu")} className="glass-btn-outline px-3 py-2 rounded-lg text-xs">뒤로</button>
            </div>
            {listLoading ? (
              <div className="text-white/40 text-sm text-center py-8">불러오는 중...</div>
            ) : manualEvents.length === 0 ? (
              <div className="text-white/40 text-sm text-center py-8">수동 등록된 대회가 없습니다.</div>
            ) : (
              manualEvents.map((evt) => (
                <div key={evt.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white text-sm">{evt.title}</div>
                      <div className="text-white/50 text-xs mt-1">
                        {evt.eventDate} | {evt.region} {evt.location} | {evt.distances.join(", ")}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="text-red-400/70 hover:text-red-300 text-xs shrink-0"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
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
          <label className="block text-xs text-white/60 mb-1">주최</label>
          <input type="text" value={organizer} onChange={(e) => setOrganizer(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">접수/대회 링크</label>
          <input type="url" value={registrationUrl} onChange={(e) => { setRegistrationUrl(e.target.value); if (!sourceUrl) setSourceUrl(e.target.value); }}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">포스터 이미지 URL</label>
          <input type="url" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40" placeholder="https://..." />
        </div>
      </div>
    );
  }
}
