import RegulationMap from "../components/RegulationMap";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* 1. 기존에 만들어 두었던 똑집 메인 헤더 영역 */}
      <div className="max-w-4xl mx-auto pt-16 pb-8 px-4 text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          똑집 (DDokzip)
        </h1>
        <p className="text-slate-400 text-lg">
          똑똑한 부동산 가이드, 필수 규제와 대출 계산을 한눈에
        </p>
      </div>

      {/* 2. 새롭게 추가되는 전국 규제 지역 지도 영역 */}
      <div className="border-t border-slate-800">
        <RegulationMap />
      </div>
    </main>
  );
}