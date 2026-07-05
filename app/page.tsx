"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import {
  Landmark, BarChart3, Home as HomeIcon, Building2, TrendingUp,
  ShieldCheck, Gift, Calculator, Trophy, ArrowLeftRight, LineChart, Crown,
  MapPin, FileText, Megaphone, MessageSquare, ThumbsUp, ChevronRight,
} from "lucide-react";
import RegulationMap from "../components/RegulationMap";
import RollingWidget from "../components/RollingWidget";
import { useVisitorTracking } from "../hooks/useVisitorTracking";
import { REGULATION_STYLE, groupByType, NATIONAL_POLICY_CARDS } from "../lib/regulationData";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ new_high_view에서 실시간 조회 (하드코딩 제거)
// "오늘"은 국토부 API 마지막 실제 수집일 기준 — 주말/공휴일에도 최근 데이터 유지
type HighRecord = {
  complex_name: string;
  area: number;
  price: number;
  price_diff: number | null;
};

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

// ✅ 네비게이션 — 이모지 대신 lucide-react 라인 아이콘, 라벨은 명확한 명사형으로 통일
const navItems = [
  { name: "총비용 계산기", href: "/total-cost", icon: Calculator },
  { name: "주담대 계산기", href: "/loan", icon: Landmark },
  { name: "DSR 계산기", href: "/dsr", icon: BarChart3 },
  { name: "취득세 계산기", href: "/tax-acq", icon: HomeIcon },
  { name: "보유세 계산기", href: "/tax-hold", icon: Building2 },
  { name: "양도세 계산기", href: "/tax-sell", icon: TrendingUp },
  { name: "갈아타기 계산기", href: "/switch-sim", icon: ArrowLeftRight },
  { name: "순수익 계산기", href: "/asset-sim", icon: LineChart },
  { name: "오늘의 신고가", href: "/new-high", icon: Trophy },
  { name: "대장 아파트", href: "/top-apt", icon: Crown },
  { name: "규제 현황", href: "/regulation", icon: ShieldCheck },
  { name: "정책 지원", href: "/benefits", icon: Gift },
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
  display_date: string;
};

export default function Home() {
  useVisitorTracking("/");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [latestPolicies, setLatestPolicies] = useState<LatestPolicy[]>([]);
  const [highRecords, setHighRecords] = useState<HighRecord[]>([]);
  const [highLoading, setHighLoading] = useState(true);

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

    // ✅ 정책발표 최신 3개 — display_date(관리자 지정 표시일) 기준 정렬
    supabase
      .from("policies")
      .select("slug, title, tag, display_date")
      .order("display_date", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setLatestPolicies(data);
      });

    // ✅ 신고가 최신 3개 — new_high_view는 "국토부 API 마지막 수집일" 기준으로 항상 최신 유지
    supabase
      .from("new_high_view")
      .select("complex_name, area, price, price_diff")
      .order("price_diff", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setHighRecords(data as HighRecord[]);
        setHighLoading(false);
      });
  }, []);

  const fmtEok = (won: number): string => {
    const eok = won / 100_000_000;
    return eok >= 1 ? `${eok.toFixed(1)}억` : `${Math.round(won / 10_000).toLocaleString()}만`;
  };
  const fmtDiff = (won: number): string => {
    if (won >= 100_000_000) return `▲ ${(won / 100_000_000).toFixed(1)}억`;
    return `▲ ${Math.round(won / 10_000).toLocaleString()}만`;
  };

  const highItems = highRecords.map((r) => ({
    text: `${r.complex_name} ${r.area}㎡`,
    sub: fmtEok(r.price),
    highlight: r.price_diff ? fmtDiff(r.price_diff) : undefined,
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
        <header className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-0.5 link-press">
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
                color: "#000000",
              }}
            >
              똑집
            </span>
          </Link>
        </header>

        {/* ② + ③ 롤링 위젯 2개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* ② 오늘의 신고가 — 클릭 시 신고가 페이지로 이동 */}
          {highLoading ? (
            <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-4"
              style={{ height: "56px" }}>
              <span className="text-[10px] font-bold bg-slate-500 text-white px-2 py-1 rounded shrink-0">
                실거래 신고가
              </span>
              <span className="text-sm text-slate-400 animate-pulse">불러오는 중</span>
            </div>
          ) : (
            <RollingWidget
              items={
                highItems.length > 0
                  ? highItems.map(i => ({ ...i, href: "/new-high" }))
                  : [{ text: "최근 신고가 데이터를 준비 중입니다.", href: "/new-high" }]
              }
              badge="실거래 신고가"
              badgeStyle="bg-rose-500 text-white"
              containerStyle="bg-rose-50 border border-rose-200 text-rose-900"
              displayMs={3500}
              transitionMs={400}
            />
          )}

          {/* ③ 부동산 뉴스 */}
          {newsLoading ? (
            <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-4"
              style={{ height: "56px" }}>
              <span className="text-[10px] font-bold bg-slate-500 text-white px-2 py-1 rounded shrink-0">
                부동산 뉴스
              </span>
              <span className="text-sm text-slate-400 animate-pulse">불러오는 중</span>
            </div>
          ) : (
            <RollingWidget
              items={newsRollingItems.length > 0 ? newsRollingItems : [{ text: "뉴스를 불러올 수 없습니다." }]}
              badge="부동산 뉴스"
              badgeStyle="bg-emerald-600 text-white"
              containerStyle="bg-emerald-50 border border-emerald-200 text-emerald-900"
              displayMs={4000}
              transitionMs={400}
            />
          )}
        </div>

        {/* ③.5 정책발표 박스 — Supabase 최신 3개 자동 반영 */}
        <Link href="/policy" className="block group">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all hover-lift nav-link">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone size={15} strokeWidth={1.75} className="text-amber-400" />
                <span className="text-sm font-bold text-slate-700">최신 정책 발표</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-600">국토부 · 금융위</span>
              </div>
              <span className="flex items-center gap-0.5 text-xs text-slate-400 group-hover:text-emerald-600 transition">
                전체 보기
                <ChevronRight size={13} strokeWidth={1.75} />
              </span>
            </div>
            <div className="space-y-2">
              {latestPolicies.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">등록된 정책 발표가 없습니다.</p>
              ) : (
                latestPolicies.map((item) => (
                  <div key={item.slug} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">{item.tag}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(item.display_date).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{item.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Link>

        {/* ④ 네비게이션 버튼 */}
        <nav className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {navItems.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all hover-lift nav-link"
              >
                <Icon size={18} strokeWidth={1.75} className="text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">{m.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* 피드백 + 업데이트 배너 */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <Link href="/changelog" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition link-press">
            <ThumbsUp size={13} strokeWidth={1.75} className="text-emerald-400" />
            반영된 피드백 확인하기
            <ChevronRight size={13} strokeWidth={1.75} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/feedback/board" className="text-xs text-slate-400 hover:text-emerald-600 transition link-press">
              내 피드백 확인
            </Link>
            <Link href="/feedback" className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition link-press">
              <MessageSquare size={13} strokeWidth={1.75} />
              의견 남기기
            </Link>
          </div>
        </div>

        {/* ⑤ + ⑥ 지도 + 규제 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ⑤ 규제 지도 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <MapPin size={15} strokeWidth={1.75} className="text-rose-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-700">규제지역 현황 지도</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">수도권 기본 표시 · 전국 보기 전환 가능</p>
              </div>
            </div>
            <div className="h-[460px]">
              <RegulationMap />
            </div>
          </div>

          {/* ⑥ 규제 요약 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <FileText size={15} strokeWidth={1.75} className="text-orange-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-700">현행 규제 요약</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">2026년 기준 · 서울 전역 투기과열지구</p>
              </div>
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
                  <ul className="space-y-1">
                    {reg.rules.map((r) => (
                      <li key={r} style={{ color: reg.textColor, fontSize: 12, display: "flex", gap: 6 }}>
                        <span>·</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

             

              {NATIONAL_POLICY_CARDS.map((card) => (
                <div key={card.title} style={{
                  background: card.bgColor,
                  border: `1px solid ${card.borderColor}`,
                  borderRadius: "12px",
                  padding: "16px",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: card.dotColor, display: "inline-block", flexShrink: 0,
                    }} />
                    <span style={{ color: card.textColor, fontWeight: 700, fontSize: 14 }}>
                      {card.title}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {card.rules.map((r) => (
                      <li key={r} style={{ color: card.textColor, fontSize: 12, display: "flex", gap: 6 }}>
                        <span>·</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="text-center pt-2">
                <Link href="/regulation" className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline link-press">
                  전체 규제 내역 보기
                  <ChevronRight size={13} strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}