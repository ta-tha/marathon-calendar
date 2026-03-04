"use client";

import { useState, useRef } from "react";

function GlassButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [shine, setShine] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setShine({ x, y });
  };

  return (
    <a
      ref={btnRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-btn group relative flex-1 block text-center py-2.5 rounded-full text-sm font-semibold overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.35) 0%, transparent 60%)`,
        }}
      />
      <span className="relative z-10">{label}</span>
    </a>
  );
}

export default function Header() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            마라톤 캘린더
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-white/90 hover:text-white transition-colors cursor-pointer translate-y-1 -translate-x-[5px]"
          >
            who made this?
          </button>
        </div>
      </header>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className="relative max-w-md w-full p-6 rounded-2xl animate-modal-in glass-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>

            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">타타 (tatha)</h3>
            </div>

            <div className="text-sm text-white/80 text-center leading-relaxed mb-6">
              <p>안녕하세요 AI 바이브코더 타타입니다.</p>
              <p className="mt-1">
                매일 새벽 3시(KST) 자동 업데이트
              </p>
              <p className="mt-1">문의는 아래 링크로 주세요.</p>
            </div>

            <div className="flex gap-3">
              <GlassButton
                href="https://open.kakao.com/o/sBQR8q1h"
                label="카카오톡 문의"
              />
              <GlassButton
                href="mailto:heensbee@gmail.com"
                label="이메일 보내기"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
