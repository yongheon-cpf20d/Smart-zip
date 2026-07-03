"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import RegulationMap from "../components/RegulationMap";
import RollingWidget from "../components/RollingWidget";
import { REGULATION_STYLE, groupByType } from "../lib/regulationData";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 하드코딩 신고가 (나중에 Supabase 연동으로 교체 예정)
const todayRecords = [
  { name: "반포자이 84㎡", price: "39.5억", diff: "▲ 1.2억" },
  { name: "잠실 엘스 59㎡", price: "21.0억", diff: "▲ 5천만" },
  { name: "마포 래미안 푸르지오 84㎡", price: "18.5억", diff: "▲ 3천만" },
];

// ✅ lib/regulationData.ts 에서 자동 생성 — 그 파일만 수정하면 여기 자동 반영
const groupedByType = groupByType();
const regulations = (["투기과열지구", "조정대상지역", "토지거래허가구역"] as const).map((type) => {
  const style = REGULATION_STYLE[type];
  const areas = groupedByType[type]?.map((a) => a.name) ?? [];
  return {
    zone: type,
    borderColor: style.borderColor,
    bgColor: style.bgColor,
    textColor: style.textColor,
    dotColor: style.dotColor,
    areas: areas.length > 0 ? areas : ["해당 지역 없음"],
    rules: style.rules,
  };
});


const navItems = [
  { name: "주담대", href: "/loan", icon: "💰" },
  { name: "DSR", href: "/dsr", icon: "📊" },
  { name: "취득세", href: "/tax-acq", icon: "🏠" },
  { name: "보유세", href: "/tax-hold", icon: "🏢" },
  { name: "양도세", href: "/tax-sell", icon: "📈" },
  { name: "규제정보", href: "/regulation", icon: "📜" },
  { name: "혜택모아보기", href: "/benefits", icon: "🎁" },
  { name: "총비용", href: "/total-cost", icon: "🧮" },
  { name: "신고가", href: "/new-high", icon: "🏆" },
  { name: "갈아타기", href: "/switch-sim", icon: "🔄" },
  { name: "자산시뮬", href: "/asset-sim", icon: "🚀" },
];

type NewsItem = {
  title: string;
  link: string;
  source: string;
};

type LatestPolicy = {
  slug: string;
  title: string;
  tag: string;
  created_at: string;
};

export default function Home() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [latestPolicies, setLatestPolicies] = useState<LatestPolicy[]>([]);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => { if (data.items) setNewsItems(data.items); })
      .catch(() => {
        setNewsItems([
          { title: "국토부, 수도권 규제지역 해제 검토 착수", link: "#", source: "" },
          { title: "내년부터 아파트 관리비 공개 의무화 확대", link: "#", source: "" },
          { title: "서울 아파트 거래량 3개월 연속 증가세", link: "#", source: "" },
        ]);
      })
      .finally(() => setNewsLoading(false));

    // ✅ 정책발표 최신 3개 — Supabase에서 실시간 조회
    supabase
      .from("policies")
      .select("slug, title, tag, created_at")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setLatestPolicies(data);
      });
  }, []);

  const highItems = todayRecords.map((r) => ({
    text: r.name,
    sub: r.price,
    highlight: r.diff,
  }));

  const newsRollingItems = newsItems.map((n) => ({
    text: n.title,
    sub: n.source || undefined,
    href: n.link !== "#" ? n.link : undefined,
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">

        {/* ① 로고 */}
        <header>
          <Link href="/" className="inline-flex items-center gap-1 link-press">
            <Image
              src="/logo.svg"
              alt="똑집 DDokzip"
              width={200}
              height={200}
              className="h-10 w-auto"
              priority
            />
            <span
              className="font-brand text-2xl tracking-tight leading-none select-none"
              style={{
                color: "#10b981",
                WebkitTextStroke: "0.1px #047857",
              }}
            >
              똑집
            </span>
          </Link>
        </header>

        {/* ② + ③ 롤링 위젯 2개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* ② 오늘의 신고가 — 클릭 시 신고가 페이지로 이동 */}
          <RollingWidget
            items={highItems.map(i => ({ ...i, href: "/new-high" }))}
            badge="오늘의 신고가"
            badgeStyle="bg-amber-400 text-amber-900"
            containerStyle="bg-amber-50 border border-amber-200 text-amber-900"
            displayMs={3500}
            transitionMs={400}
          />

          {/* ③ 부동산 뉴스 */}
          {newsLoading ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4"
              style={{ height: "56px" }}>
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded shrink-0">
                부동산 뉴스
              </span>
              <span className="text-sm text-emerald-500 animate-pulse">불러오는 중...</span>
            </div>
          ) : (
            <RollingWidget
              items={newsRollingItems.length > 0 ? newsRollingItems : [{ text: "뉴스를 불러올 수 없습니다." }]}
              badge="부동산 뉴스"
              badgeStyle="bg-emerald-500 text-white"
              containerStyle="bg-emerald-50 border border-emerald-200 text-emerald-900"
              displayMs={4000}
              transitionMs={400}
            />
          )}
        </div>

        {/* ④ 네비게이션 버튼 */}
        <nav className="grid grid-cols-4 md:grid-cols-11 gap-2">
          {navItems.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all hover-lift nav-link"
            >
              <span className="text-lg">{m.icon}</span>
              <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{m.name}</span>
            </Link>
          ))}
        </nav>

        {/* 피드백 + 업데이트 배너 */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <Link href="/changelog" className="text-xs text-slate-500 hover:text-emerald-600 transition link-press">
            🙌 여러분의 의견이 반영되었어요! →
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/feedback/board" className="text-xs text-slate-400 hover:text-emerald-600 transition link-press">
              내 피드백 확인
            </Link>
            <Link href="/feedback" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition link-press">
              💬 피드백 보내기
            </Link>
          </div>
        </div>

        {/* ⑤ + ⑥ 지도 + 규제 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ⑤ 규제 지도 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700">📍 규제지역 현황 지도</h2>
            </div>
            <div className="h-[460px]">
              <RegulationMap />
            </div>
          </div>

          {/* ⑥ 규제 요약 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700">📋 현행 규제 요약</h2>
              <p className="text-xs text-slate-400 mt-0.5">2026년 기준 · 서울 전역 투기과열지구</p>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto h-[460px]">
              {regulations.map((reg) => (
                <div key={reg.zone} style={{
                  background: reg.bgColor,
                  border: `1px solid ${reg.borderColor}`,
                  borderRadius: "12px",
                  padding: "16px",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: reg.dotColor, display: "inline-block", flexShrink: 0,
                    }} />
                    <span style={{ color: reg.textColor, fontWeight: 700, fontSize: 14 }}>
                      {reg.zone}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {reg.areas.map((a) => (
                      <span key={a} style={{
                        color: reg.textColor, fontSize: 11,
                        background: "rgba(255,255,255,0.6)",
                        border: `1px solid ${reg.borderColor}`,
                        borderRadius: 999, padding: "2px 8px",
                      }}>{a}</span>
                    ))}
                  </div>
                  <ul className="space-y-1">
                    {reg.rules.map((r) => (
                      <li key={r} style={{ color: reg.textColor, fontSize: 12, display: "flex", gap: 6 }}>
                        <span>•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="text-center pt-2">
                <Link href="/regulation" className="text-xs text-emerald-600 font-semibold hover:underline link-press">
                  전체 규제 내역 보기 →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ⑦ 정책발표 박스 — Supabase 최신 3개 자동 반영 */}
        <Link href="/policy" className="block group">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:bg-blue-50 transition-all hover-lift nav-link">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">📢 최신 정책발표</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">국토부 · 금융위</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-blue-500 transition">전체보기 →</span>
            </div>
            <div className="space-y-2">
              {latestPolicies.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">등록된 정책발표가 없습니다.</p>
              ) : (
                latestPolicies.map((item) => (
                  <div key={item.slug} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">{item.tag}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(item.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{item.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}