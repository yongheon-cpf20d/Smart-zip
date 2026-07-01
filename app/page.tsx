"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import RegulationMap from "../components/RegulationMap";
import RollingWidget from "../components/RollingWidget";

// 하드코딩 신고가 (나중에 Supabase 연동으로 교체 예정)
const todayRecords = [
  { name: "반포자이 84㎡", price: "39.5억", diff: "▲ 1.2억" },
  { name: "잠실 엘스 59㎡", price: "21.0억", diff: "▲ 5천만" },
  { name: "마포 래미안 푸르지오 84㎡", price: "18.5억", diff: "▲ 3천만" },
];

const regulations = [
  {
    zone: "투기과열지구",
    borderColor: "#fca5a5",
    bgColor: "#fef2f2",
    textColor: "#991b1b",
    dotColor: "#ef4444",
    areas: ["강남구", "서초구", "송파구", "용산구"],
    rules: ["LTV 40%", "DSR 40%", "2년 실거주 의무", "분양권 전매 제한"],
  },
  {
    zone: "조정대상지역",
    borderColor: "#fcd34d",
    bgColor: "#fffbeb",
    textColor: "#92400e",
    dotColor: "#f59e0b",
    areas: ["성동구", "마포구", "영등포구", "광진구"],
    rules: ["LTV 50%", "DSR 40%", "다주택 양도세 중과"],
  },
  {
    zone: "일반지역",
    borderColor: "#6ee7b7",
    bgColor: "#f0fdf4",
    textColor: "#065f46",
    dotColor: "#10b981",
    areas: ["그 외 서울·경기 지역"],
    rules: ["LTV 70%", "DSR 40%", "규제 없음"],
  },
];

const navItems = [
  { name: "주담대", href: "/loan", icon: "💰" },
  { name: "DSR", href: "/dsr", icon: "📊" },
  { name: "취득세", href: "/tax-acq", icon: "🏠" },
  { name: "보유세", href: "/tax-hold", icon: "🏢" },
  { name: "양도세", href: "/tax-sell", icon: "📈" },
  { name: "규제정보", href: "/regulation", icon: "📜" },
  { name: "혜택모아보기", href: "/benefits", icon: "🎁" },
  { name: "총비용", href: "/total-cost", icon: "🧮" },
];

type NewsItem = {
  title: string;
  link: string;
  source: string;
};

type PolicyItem = {
  title: string;
  link: string;
  source: string;
  label: string;
};

export default function Home() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [policyItems, setPolicyItems] = useState<PolicyItem[]>([]);
  const [policyLoading, setPolicyLoading] = useState(true);

  useEffect(() => {
    // 뉴스 fetch
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

    // 정책발표 fetch
    fetch("/api/policy")
      .then((r) => r.json())
      .then((data) => { if (data.items) setPolicyItems(data.items); })
      .catch(() => {
        setPolicyItems([
          { title: "국토교통부, 기흥·동탄·구리 토지거래허가구역 지정", link: "#", source: "국토교통부", label: "국토부" },
          { title: "금융위원회, 스트레스 DSR 3단계 시행", link: "#", source: "금융위원회", label: "금융위" },
        ]);
      })
      .finally(() => setPolicyLoading(false));
  }, []);

  // 신고가 롤링 데이터 변환
  const highItems = todayRecords.map((r) => ({
    text: r.name,
    sub: r.price,
    highlight: r.diff,
  }));

  // 뉴스 롤링 데이터 변환
  const newsRollingItems = newsItems.map((n) => ({
    text: n.title,
    sub: n.source || undefined,
    href: n.link !== "#" ? n.link : undefined,
  }));

  // 정책발표 롤링 데이터 변환
  const policyRollingItems = policyItems.map((p) => ({
    text: p.title,
    sub: p.label,  // "국토부" or "금융위" 뱃지
    href: p.link !== "#" ? p.link : undefined,
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">

        {/* ① 로고 */}
        <header>
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logo.svg"
              alt="똑집 DDokzip"
              width={200}
              height={200}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </header>

        {/* ② + ③ + ④ 롤링 위젯 3개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* ② 오늘의 신고가 */}
          <RollingWidget
            items={highItems}
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

          {/* ④ 공식 정책발표 */}
          {policyLoading ? (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4"
              style={{ height: "56px" }}>
              <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-1 rounded shrink-0">
                정책발표
              </span>
              <span className="text-sm text-blue-500 animate-pulse">불러오는 중...</span>
            </div>
          ) : (
            <RollingWidget
              items={policyRollingItems.length > 0 ? policyRollingItems : [{ text: "정책발표를 불러올 수 없습니다." }]}
              badge="정책발표"
              badgeStyle="bg-blue-500 text-white"
              containerStyle="bg-blue-50 border border-blue-200 text-blue-900"
              displayMs={4500}
              transitionMs={400}
            />
          )}
        </div>

        {/* ④ 네비게이션 버튼 */}
        <nav className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {navItems.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all"
            >
              <span className="text-lg">{m.icon}</span>
              <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{m.name}</span>
            </Link>
          ))}
        </nav>

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
              <p className="text-xs text-slate-400 mt-0.5">2025년 기준 · 강남3구·용산구 투기과열지구 유지</p>
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
                <Link href="/regulation" className="text-xs text-emerald-600 font-semibold hover:underline">
                  전체 규제 내역 보기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}