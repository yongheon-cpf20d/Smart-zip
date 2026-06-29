"use client";

import Link from "next/link";
import RegulationMap from "../components/RegulationMap";

// 나중에 봇이 이 데이터들을 자동으로 업데이트하게 됩니다!
const todayRecords = [
  { name: "반포자이 84㎡", price: "39.5억", diff: "▲ 1.2억" },
  { name: "잠실 엘스 59㎡", price: "21.0억", diff: "▲ 5천만" },
];

const todayNews = [
  "국토부, 수도권 규제지역 해제 검토 착수",
  "내년부터 아파트 관리비 공개 의무화 확대",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* 1. 헤더: 뒤로가기 버튼 제거 */}
      <header className="max-w-7xl mx-auto px-6 py-6 border-b border-slate-100">
        <Link href="/" className="text-2xl font-black text-emerald-600 tracking-tight">
          🏠 똑집 <span className="text-xs font-semibold text-emerald-400 bg-emerald-50 px-2 py-0.5 rounded">DDokzip</span>
        </Link>
      </header>

      {/* 2. 롤링 위젯 영역 */}
      <section className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-slate-50 rounded-xl overflow-hidden h-12 flex items-center">
          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] mr-3 whitespace-nowrap">오늘의 신고가</span>
          <div className="animate-rolling space-y-1 w-full">
            {todayRecords.map((r, i) => (
              <p key={i} className="text-sm font-medium">{r.name} <span className="text-red-500 font-bold">{r.price}</span> <span className="text-red-500 text-[10px]">{r.diff}</span></p>
            ))}
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl overflow-hidden h-12 flex items-center">
          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] mr-3 whitespace-nowrap">부동산 뉴스</span>
          <div className="animate-rolling space-y-1 w-full text-sm">
            {todayNews.map((n, i) => <p key={i} className="truncate">{n}</p>)}
          </div>
        </div>
      </section>

      {/* 3. 규제 현황 요약 섹션 */}
      <section className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-emerald-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-lg">
          <div>
            <h2 className="text-lg font-bold">현재 부동산 규제 현황</h2>
            <p className="text-emerald-200 text-sm mt-1">강남 3구 및 용산구 투기과열지구 유지 중</p>
          </div>
          <Link href="/regulation" className="mt-4 md:mt-0 bg-white text-emerald-900 px-6 py-2 rounded-full text-sm font-bold hover:bg-emerald-50 transition">
            전체 규제 보기
          </Link>
        </div>
      </section>

      {/* 4. 네비게이션 버튼 (404 경로 수정 반영) */}
      <nav className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: "주담대", href: "/loan", icon: "💰" },
            { name: "DSR", href: "/dsr", icon: "📊" },
            { name: "취득세", href: "/tax-acq", icon: "🏠" },
            { name: "보유세", href: "/tax-hold", icon: "🏢" },
            { name: "양도세", href: "/tax-sell", icon: "📈" },
            { name: "규제내역", href: "/regulation", icon: "📜" },
          ].map((m) => (
            <Link key={m.href} href={m.href} className="p-4 bg-white border rounded-2xl flex flex-col items-center hover:bg-emerald-50 transition-all border-slate-200">
              <span className="text-xl mb-1">{m.icon}</span>
              <span className="text-xs font-bold">{m.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 5. 지도 영역 */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <RegulationMap />
      </main>
    </div>
  );
}