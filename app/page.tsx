import Link from "next/link";
import RegulationMap from "../components/RegulationMap";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-16">
      
      {/* 1. 타이틀 영역 */}
      <div className="max-w-4xl mx-auto pt-10 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          똑집 (DDokzip)
        </h1>
        <p className="text-slate-400 text-lg">
          똑똑한 부동산 가이드, 필수 규제와 대출 계산을 한눈에
        </p>
      </div>

      {/* 2. 소중한 계산기 바로가기 버튼 영역 (완벽 복구!) */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/loan" 
          className="p-8 bg-slate-900 rounded-3xl border border-slate-800 hover:border-teal-500 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center space-y-3 group shadow-lg"
        >
          <span className="text-4xl group-hover:scale-110 transition-transform">💰</span>
          <h2 className="text-2xl font-bold text-slate-100 group-hover:text-teal-400 transition-colors">주담대 계산기</h2>
          <p className="text-sm text-slate-400">내 예산에 맞는 대출 한도와 이자 계산</p>
        </Link>
        
        <Link 
          href="/dsr" 
          className="p-8 bg-slate-900 rounded-3xl border border-slate-800 hover:border-teal-500 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center space-y-3 group shadow-lg"
        >
          <span className="text-4xl group-hover:scale-110 transition-transform">📊</span>
          <h2 className="text-2xl font-bold text-slate-100 group-hover:text-teal-400 transition-colors">DSR 계산기</h2>
          <p className="text-sm text-slate-400">총부채원리금상환비율 정확하게 확인</p>
        </Link>
      </div>

      {/* 3. 전국 규제 지역 지도 영역 */}
      <div className="max-w-6xl mx-auto pt-8 border-t border-slate-800">
        <RegulationMap />
      </div>

    </main>
  );
}