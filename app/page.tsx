"use client";

import Link from "next/link";
import RegulationMap from "../components/RegulationMap";

const todayRecords = [
  { name: "반포자이 84㎡", price: "39.5억", diff: "▲ 1.2억" },
  { name: "잠실 엘스 59㎡", price: "21.0억", diff: "▲ 5천만" },
  { name: "마포 래미안 푸르지오 84㎡", price: "18.5억", diff: "▲ 3천만" },
];

const todayNews = [
  "국토부, 수도권 규제지역 해제 검토 착수",
  "내년부터 아파트 관리비 공개 의무화 확대",
  "서울 아파트 거래량 3개월 연속 증가세",
];

const regulations = [
  {
    zone: "투기과열지구",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
    areas: ["강남구", "서초구", "송파구", "용산구"],
    rules: ["LTV 40%", "DSR 40%", "2년 실거주 의무"],
  },
  {
    zone: "조정대상지역",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    areas: ["성동구", "마포구", "영등포구", "광진구"],
    rules: ["LTV 50%", "DSR 40%", "다주택 양도세 중과"],
  },
  {
    zone: "일반지역",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
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
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">

        {/* ① 로고 */}
        <header>
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-black text-emerald-600 tracking-tight">
            🏠 똑집
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              DDokzip
            </span>
          </Link>
        </header>

        {/* ② + ③ 롤링 위젯 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ② 오늘의 신고가 */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 h-14 overflow-hidden">
            <span className="shrink-0 text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-1 rounded">
              오늘의 신고가
            </span>
            <div className="overflow-hidden flex-1 h-full relative">
              <div className="animate-rolling absolute w-full">
                {[...todayRecords, ...todayRecords].map((r, i) => (
                  <div key={i} className="h-14 flex items-center text-sm gap-2">
                    <span className="font-medium truncate">{r.name}</span>
                    <span className="text-red-600 font-bold shrink-0">{r.price}</span>
                    <span className="text-red-500 text-xs shrink-0">{r.diff}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ③ 부동산 뉴스 */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 h-14 overflow-hidden">
            <span className="shrink-0 text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded">
              부동산 뉴스
            </span>
            <div className="overflow-hidden flex-1 h-full relative">
              <div className="animate-rolling absolute w-full">
                {[...todayNews, ...todayNews].map((n, i) => (
                  <div key={i} className="h-14 flex items-center text-sm">
                    <span className="truncate">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ④ 네비게이션 버튼 */}
        <nav className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {navItems.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all"
            >
              <span className="text-lg">{m.icon}</span>
              <span className="text-xs font-semibold text-slate-700">{m.name}</span>
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
            <div className="h-[420px]">
              <RegulationMap />
            </div>
          </div>

          {/* ⑥ 규제 요약 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700">📋 현행 규제 요약</h2>
              <p className="text-xs text-slate-400 mt-0.5">2025년 기준 · 강남3구·용산구 투기과열지구 유지</p>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto h-[420px]">
              {regulations.map((reg) => (
                <div key={reg.zone} className={`border rounded-xl p-4 ${reg.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${reg.dot}`} />
                    <span className="font-bold text-sm">{reg.zone}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {reg.areas.map((a) => (
                      <span key={a} className="text-xs bg-white/60 border border-current/20 px-2 py-0.5 rounded-full">
                        {a}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1">
                    {reg.rules.map((r) => (
                      <li key={r} className="text-xs flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="mt-2 text-center">
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