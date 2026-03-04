"use client";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary tracking-tight">
          마라톤 캘린더
        </h1>
        <span className="text-sm text-slate-500">전국 마라톤 대회 일정</span>
      </div>
    </header>
  );
}
