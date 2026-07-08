// components/ThemeToggle.tsx
// ✅ 다크모드 토글 버튼 — localStorage에 선택 저장, 새로고침해도 유지
"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ddokzip_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved === "dark" || (!saved && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ddokzip_theme", next ? "dark" : "light");
  };

  // 마운트 전에는 렌더링 안 함 (서버-클라이언트 불일치 방지)
  if (!mounted) return <div style={{ width: 36, height: 36 }} />;

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      aria-label="다크모드 전환"
      title={isDark ? "라이트모드로 전환" : "다크모드로 전환"}
    >
      {isDark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
    </button>
  );
}