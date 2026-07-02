"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

// ✅ 샘플 데이터 — 백필 완료 후 Supabase DB 조회로 교체 예정
type NewHighRecord = {
  id: number;
  complexName: string;
  dong: string;
  regionName: string;
  area: number;
  floor: number;
  price: number;
  previousHighPrice: number | null;
  priceDiff: number | null;
  dealDate: string;
};

const SAMPLE_DATA: NewHighRecord[] = [
  { id: 1, complexName: "반포자이", dong: "반포동", regionName: "서울 서초구", area: 84.97, floor: 15, price: 3_950_000_000, previousHighPrice: 3_830_000_000, priceDiff: 120_000_000, dealDate: "2026-07-02" },
  { id: 2, complexName: "아크로리버파크", dong: "반포동", regionName: "서울 서초구", area: 59.92, floor: 20, price: 3_200_000_000, previousHighPrice: 3_100_000_000, priceDiff: 100_000_000, dealDate: "2026-07-02" },
  { id: 3, complexName: "잠실 엘스", dong: "잠실동", regionName: "서울 송파구", area: 84.94, floor: 8, price: 2_350_000_000, previousHighPrice: 2_280_000_000, priceDiff: 70_000_000, dealDate: "2026-07-02" },
  { id: 4, complexName: "헬리오시티", dong: "가락동", regionName: "서울 송파구", area: 84.99, floor: 25, price: 2_150_000_000, previousHighPrice: 2_080_000_000, priceDiff: 70_000_000, dealDate: "2026-07-02" },
  { id: 5, complexName: "래미안 퍼스티지", dong: "반포동", regionName: "서울 서초구", area: 114.97, floor: 12, price: 4_800_000_000, previousHighPrice: 4_650_000_000, priceDiff: 150_000_000, dealDate: "2026-07-02" },
  { id: 6, complexName: "대치 래미안", dong: "대치동", regionName: "서울 강남구", area: 84.88, floor: 7, price: 3_050_000_000, previousHighPrice: 2_950_000_000, priceDiff: 100_000_000, dealDate: "2026-07-02" },
  { id: 7, complexName: "은마아파트", dong: "대치동", regionName: "서울 강남구", area: 76.79, floor: 5, price: 2_650_000_000, previousHighPrice: 2_580_000_000, priceDiff: 70_000_000, dealDate: "2026-07-02" },
  { id: 8, complexName: "마포 래미안 푸르지오", dong: "아현동", regionName: "서울 마포구", area: 84.97, floor: 11, price: 1_850_000_000, previousHighPrice: 1_790_000_000, priceDiff: 60_000_000, dealDate: "2026-07-02" },
  { id: 9, complexName: "판교 알파리움", dong: "백현동", regionName: "경기 성남시 분당구", area: 84.83, floor: 18, price: 1_850_000_000, previousHighPrice: 1_790_000_000, priceDiff: 60_000_000, dealDate: "2026-07-02" },
  { id: 10, complexName: "광교 중흥S클래스", dong: "이의동", regionName: "경기 수원시 영통구", area: 84.97, floor: 22, price: 1_450_000_000, previousHighPrice: 1_390_000_000, priceDiff: 60_000_000, dealDate: "2026-07-02" },
  { id: 11, complexName: "위례 중흥S클래스", dong: "학암동", regionName: "경기 하남시", area: 59.94, floor: 10, price: 1_050_000_000, previousHighPrice: 1_010_000_000, priceDiff: 40_000_000, dealDate: "2026-07-02" },
  { id: 12, complexName: "과천 푸르지오 써밋", dong: "별양동", regionName: "경기 과천시", area: 84.97, floor: 15, price: 2_100_000_000, previousHighPrice: 2_030_000_000, priceDiff: 70_000_000, dealDate: "2026-07-02" },
];

const SEOUL_DISTRICTS = [
  "종로구","중구","용산구","성동구","광진구","동대문구","중랑구","성북구",
  "강북구","도봉구","노원구","은평구","서대문구","마포구","양천구","강서구",
  "구로구","금천구","영등포구","동작구","관악구","서초구","강남구","송파구","강동구"
];

const GYEONGGI_CITIES = [
  "수원시","성남시","의정부시","안양시","부천시","광명시","평택시","동두천시",
  "안산시","고양시","과천시","구리시","남양주시","오산시","시흥시","군포시",
  "의왕시","하남시","용인시","파주시","이천시","안성시","김포시","화성시",
  "광주시","양주시","포천시","여주시","연천군","가평군","양평군"
];

const fmtPriceFull = (n: number): string => {
  const uk = Math.floor(n / 100_000_000);
  const man = Math.round((n % 100_000_000) / 10_000);
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${man.toLocaleString()}만원`;
};

const toPyeong = (sqm: number): number => Math.round(sqm / 3.3);

type RegionView = "top" | "seoul" | "gyeonggi";

// ── 개별 포스터 카드 ──────────────────────────────────────────
function PosterCard({ record }: { record: NewHighRecord }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const diffPct = record.previousHighPrice && record.priceDiff
    ? ((record.priceDiff / record.previousHighPrice) * 100).toFixed(1)
    : null;

  const download = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `똑집_신고가_${record.complexName}_${record.dealDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      alert("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
    }
  }, [record, downloading]);

  return (
    <div className="relative group">
      {/* 포스터 본체 (캡처 대상) */}
      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(145deg, #0f172a 0%, #1a2744 45%, #0f1f35 100%)",
          borderRadius: "16px",
          padding: "28px 24px 22px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 장식 */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(16,185,129,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 130, height: 130, borderRadius: "50%", background: "rgba(59,130,246,0.05)", pointerEvents: "none" }} />

        {/* 헤더: 뱃지 + 날짜 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 999, padding: "3px 10px",
          }}>
            <span style={{ fontSize: 11 }}>🏆</span>
            <span style={{ color: "#10b981", fontWeight: 800, fontSize: 10, letterSpacing: "0.05em" }}>신고가 달성</span>
          </div>
          <span style={{ color: "#334155", fontSize: 9 }}>{record.dealDate}</span>
        </div>

        {/* 지역 */}
        <p style={{ color: "#475569", fontSize: 10, marginBottom: 3 }}>
          {record.regionName} · {record.dong}
        </p>

        {/* 단지명 */}
        <p style={{ color: "#ffffff", fontWeight: 900, fontSize: record.complexName.length > 9 ? 18 : 22, marginBottom: 3, lineHeight: 1.2 }}>
          {record.complexName}
        </p>

        {/* 면적/층 */}
        <p style={{ color: "#334155", fontSize: 10, marginBottom: 18 }}>
          전용 {record.area}㎡ (약 {toPyeong(record.area)}평) · {record.floor}층
        </p>

        {/* 구분선 */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }} />

        {/* 신고가 */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: "#334155", fontSize: 9, marginBottom: 3, letterSpacing: "0.1em" }}>신 고 가</p>
          <p style={{ color: "#ffffff", fontWeight: 900, fontSize: 26, lineHeight: 1 }}>
            {fmtPriceFull(record.price)}
          </p>
        </div>

        {/* 직전 신고가 + 상승률 */}
        {record.previousHighPrice && record.priceDiff && (
          <>
            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
              <div>
                <p style={{ color: "#1e293b", fontSize: 9, marginBottom: 2 }}>직전 신고가</p>
                <p style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>
                  {fmtPriceFull(record.previousHighPrice)}
                </p>
              </div>
              <div>
                <p style={{ color: "#1e293b", fontSize: 9, marginBottom: 2 }}>직전 대비 상승률</p>
                <p style={{ color: "#f87171", fontWeight: 800, fontSize: 12 }}>
                  +{diffPct}%
                </p>
              </div>
            </div>

            {/* 상승액 강조 */}
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 18,
            }}>
              <span style={{ color: "#ef4444", fontSize: 14 }}>🔺</span>
              <div>
                <p style={{ color: "#475569", fontSize: 8, marginBottom: 1 }}>직전 신고가 대비 상승</p>
                <p style={{ color: "#ef4444", fontWeight: 900, fontSize: 16 }}>
                  {fmtPriceFull(record.priceDiff)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 푸터: 로고 */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          {/* SVG 로고 이미지 */}
          <img
            src="/logo.svg"
            alt="똑집 DDokzip"
            style={{ height: 18, width: "auto", objectFit: "contain" }}
            crossOrigin="anonymous"
          />
          <span style={{ color: "#1e293b", fontSize: 8 }}>국토교통부 실거래가 기반</span>
        </div>
      </div>

      {/* 다운로드 버튼 (캡처 제외 — 포스터 밖에 위치) */}
      <button
        onClick={download}
        disabled={downloading}
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-lg"
        style={{
          background: "rgba(255,255,255,0.92)",
          color: "#1e293b",
          backdropFilter: "blur(4px)",
          zIndex: 10,
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {downloading ? <span className="animate-pulse">저장 중...</span> : <>⬇️ 저장</>}
      </button>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function NewHighPage() {
  const [regionView, setRegionView] = useState<RegionView>("top");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const switchView = (view: RegionView) => {
    setIsAnimating(true);
    setSelectedDistrict(null);
    setTimeout(() => {
      setRegionView(view);
      setIsAnimating(false);
    }, 300);
  };

  const filteredData = SAMPLE_DATA.filter(d => {
    if (regionView === "top") return true;
    if (regionView === "seoul") {
      if (!d.regionName.startsWith("서울")) return false;
      if (selectedDistrict) return d.regionName.includes(selectedDistrict);
      return true;
    }
    if (regionView === "gyeonggi") {
      if (!d.regionName.startsWith("경기")) return false;
      if (selectedDistrict) return d.regionName.includes(selectedDistrict);
      return true;
    }
    return true;
  }).sort((a, b) => (b.priceDiff ?? 0) - (a.priceDiff ?? 0));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div>
          <h1 className="text-xl font-bold text-slate-800">🏆 오늘의 신고가</h1>
          <p className="text-xs text-slate-400 mt-1">2026.07.02 · 국토교통부 실거래가 · 카드에 마우스 올리면 저장 버튼이 나타납니다</p>
        </div>

        {/* 지역 선택 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          {regionView !== "top" && (
            <button onClick={() => switchView("top")}
              className="text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition">
              ← 전체 보기
            </button>
          )}

          <div className={`transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}>
            {regionView === "top" && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => switchView("seoul")}
                  className="py-3.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 hover:border-emerald-400 transition-all">
                  🗺️ 서울
                  <span className="block text-[11px] font-normal text-emerald-500 mt-0.5">25개 자치구</span>
                </button>
                <button onClick={() => switchView("gyeonggi")}
                  className="py-3.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 hover:border-blue-400 transition-all">
                  🗺️ 경기도
                  <span className="block text-[11px] font-normal text-blue-500 mt-0.5">31개 시군</span>
                </button>
              </div>
            )}

            {regionView === "seoul" && (
              <div>
                <p className="text-xs text-slate-400 mb-2">구를 선택하면 해당 구만 보여요</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSelectedDistrict(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${!selectedDistrict ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    전체
                  </button>
                  {SEOUL_DISTRICTS.map(d => (
                    <button key={d} onClick={() => setSelectedDistrict(d === selectedDistrict ? null : d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${selectedDistrict === d ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {regionView === "gyeonggi" && (
              <div>
                <p className="text-xs text-slate-400 mb-2">시·군을 선택하면 해당 지역만 보여요</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSelectedDistrict(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${!selectedDistrict ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    전체
                  </button>
                  {GYEONGGI_CITIES.map(d => (
                    <button key={d} onClick={() => setSelectedDistrict(d === selectedDistrict ? null : d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${selectedDistrict === d ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 건수 */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-bold text-slate-600">
            {selectedDistrict ?? (regionView === "seoul" ? "서울" : regionView === "gyeonggi" ? "경기" : "전체")} 신고가
            <span className="text-emerald-500 ml-1">({filteredData.length}건)</span>
          </p>
          <p className="text-[10px] text-slate-400">상승액 큰 순 정렬</p>
        </div>

        {/* 포스터 그리드 */}
        {filteredData.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            해당 지역의 신고가 데이터가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map(record => (
              <PosterCard key={record.id} record={record} />
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-200">
          출처: 국토교통부 아파트매매 실거래가 공개 API. 신고가는 당사 DB에 누적된 과거 거래 중
          동일 단지·면적의 최고가를 경신한 거래를 의미합니다. 실거래 신고 기한(계약 후 30일)에 따라
          실제 거래일과 공개일 사이에 차이가 있을 수 있습니다.
        </p>

      </div>
    </div>
  );
}