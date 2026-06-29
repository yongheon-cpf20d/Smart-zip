import Link from 'next/link';
import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* 1. 상단 롤링 배너 (신고가 & 뉴스) */}
      <header className="bg-white border-b border-gray-100 p-4 space-y-2 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
          <span className="bg-red-100 px-2 py-0.5 rounded">🔥 신고가</span>
          <span className="animate-pulse">래미안원베일리 84㎡ 60억 갱신!</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
          <span className="bg-emerald-100 px-2 py-0.5 rounded">📰 뉴스</span>
          <span>정부, "내달 공시지가 현실화 가능성 시사"</span>
        </div>
      </header>

     {/* 2. 핵심 6대 메뉴 (조약돌 카드) */}
      <section className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { title: "주담대", icon: "💸", path: "/loan" },
          { title: "DSR", icon: "🏦", path: "/dsr" },
          { title: "취득세", icon: "🏠", path: "/tax-acq" },
          { title: "보유세", icon: "📜", path: "/tax-hold" },
          { title: "양도세", icon: "📈", path: "/tax-sell" },
          { title: "규제정책", icon: "⚖️", path: "/regulation" }
        ].map((item) => (
          <Link href={item.path} key={item.title}>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer text-center block h-full">
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="font-extrabold text-gray-800">{item.title}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* 3. 규제 지도 및 규제 요약 섹션 */}
      <section className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 규제 지도 영역 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-800">📍 부동산 규제 지도</h3>
          <div className="w-full h-64 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold border-2 border-dashed border-emerald-200">
            [전국 지도 SVG가 배치될 영역]
          </div>
        </div>

        {/* 규제 요약 박스 */}
        <div className="bg-emerald-900 p-8 rounded-3xl text-white shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xl mb-4">🛡️ 현행 부동산 규제 요약</h3>
            <div className="space-y-4 text-sm opacity-90">
              <p>• 스트레스 DSR: 3단계 적용 중</p>
              <p>• 수도권 LTV: 최대 50% ~ 70%</p>
              <p>• 실거주 의무: 분양가상한제 지역 해당</p>
            </div>
          </div>
          <button className="mt-8 w-full py-4 bg-emerald-600 rounded-2xl font-bold hover:bg-emerald-500 transition shadow-md">
            전체 규제정책 보기
          </button>
        </div>
      </section>
    </main>
  );
}