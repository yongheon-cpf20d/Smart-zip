"use client";

import Link from "next/link";
import RegulationMap from "../components/RegulationMap";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased selection:bg-emerald-100">
      
      {/* 상단 바: 돌아가기 버튼 & 로고 */}
      <header className="max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
        {/* 좌측 상단: 돌아가기 버튼과 똑집 로고 */}
        <div className="flex items-center space-y-2 md:space-y-0 md:space-x-4 flex-col md:flex-row">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-all"
          >
            ← 돌아가기
          </button>
          <Link href="/" className="text-2xl font-black text-emerald-600 tracking-tight flex items-center">
            🏠 똑집 <span className="text-xs font-semibold text-emerald-400 ml-1.5 bg-emerald-50 px-2 py-0.5 rounded">DDokzip</span>
          </Link>
        </div>
      </header>

      {/* 정보 위젯 영역: 오늘의 신고가 & 정책 뉴스 */}
      <section className="max-w-7xl mx-auto px-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 오늘의 신고가 위젯 */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-3 text-sm">
          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-xs shrink-0">실시간 신고가</span>
          <div className="overflow-hidden h-5 text-slate-600 w-full">
            {/* 아파트 이름은 검은색, 가격과 상승액은 빨간색 */}
            <span>
              <strong className="text-black font-semibold">반포자이 84㎡</strong>{" "}
              <span className="text-red-500 font-bold">39억 5천만 원</span>{" "}
              <span className="text-red-500 text-xs">▲ 1억 2천만 원</span>
            </span>
          </div>
        </div>

        {/* 오늘의 정책 뉴스 위젯 */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-3 text-sm">
          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs shrink-0">부동산 뉴스</span>
          <div className="text-slate-600 truncate">
            <span>[속보] 국토부, 수도권 신규 규제 지역 해제 검토 착수... 다음 달 발표</span>
          </div>
        </div>
      </section>

      {/* 핵심 기능 메뉴 영역: 1행 6열 배치 */}
      <nav className="max-w-7xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: "주담대 계산기", href: "/loan", icon: "💰" },
            { name: "DSR 계산기", href: "/dsr", icon: "📊" },
            { name: "취득세 계산기", href: "/acquisition", icon: "🏠" },
            { name: "보유세 계산기", href: "/holding", icon: "🏢" },
            { name: "양도세 계산기", href: "/transfer", icon: "📈" },
            { name: "규제내역 조회", href: "/regulation", icon: "📜" },
          ].map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="p-5 bg-white border border-emerald-100 rounded-2xl flex flex-col items-center justify-center space-y-2 text-center shadow-sm shadow-emerald-100 hover:shadow-md hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{menu.icon}</span>
              <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                {menu.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 하단 메인 본문: 반반 분할 (좌 지도 / 우 요약) */}
      <main className="max-w-7xl mx-auto px-6 mt-12 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
          
          {/* 좌측: 규제지도 공간 */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800">대한민국 규제지역 지도</h3>
              <p className="text-xs text-slate-400">지역을 클릭하면 상세 현황이 동기화됩니다.</p>
            </div>
            <div className="w-full flex items-center justify-center">
              <RegulationMap />
            </div>
          </div>

          {/* 우측: 현재 규제상황 요약 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 border-b-2 border-emerald-400 pb-2 inline-block">
                현재 규제상황 요약
              </h3>
              <p className="text-sm text-slate-500 mt-2">수도권 및 주요 과열 지역을 중심으로 규제 정책이 집중 적용 중입니다.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                <h4 className="font-bold text-red-700 text-sm flex items-center">🚨 투기과열지구</h4>
                <p className="text-xs text-red-600 mt-1">LTV 50% 제한, 정비사업 조합원 지위양도 제한, 청약 1순위 자격 제한 등 강력 규제</p>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <h4 className="font-bold text-amber-700 text-sm flex items-center">⚠️ 조정대상지역</h4>
                <p className="text-xs text-amber-600 mt-1">다주택자 양도세 중과, 주택담보대출 세대당 1건 제한, 분양권 전매제한</p>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-700 text-sm flex items-center">✅ 비규제지역</h4>
                <p className="text-xs text-emerald-600 mt-1">기본 대출 규제(LTV 70%) 적용, 세제 및 청약 조건 완화 지역</p>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}