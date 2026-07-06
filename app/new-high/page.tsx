"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Trophy, ArrowUpRight, MapPin } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ new_high_view (Supabase SQL 뷰)에서 실시간 조회
// 백필이 진행 중이어도 현재까지 쌓인 데이터 기준으로 항상 최신 결과가 반영됨
type NewHighRecord = {
  id: string; // complex_name+dong+area 조합으로 생성 (뷰에는 PK가 없어서)
  complexName: string;
  dong: string;
  regionName: string;
  area: number;
  floor: number;
  price: number;
  buildYear: number | null;
  previousHighPrice: number | null;
  priceDiff: number | null;
  dealDate: string;
};

// SAMPLE_DATA 제거 — 이제 Supabase new_high_view에서 실시간 조회

const SEOUL_DISTRICTS = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구",
  "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구",
  "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구"
];

const GYEONGGI_CITIES = [
  "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시",
  "안산시", "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시",
  "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시", "김포시", "화성시",
  "광주시", "양주시", "포천시", "여주시", "연천군", "가평군", "양평군"
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

  const diffPct = record.previousHighPrice && record.priceDiff !== null
    ? ((record.priceDiff / record.previousHighPrice) * 100).toFixed(1)
    : null;

  const download = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc, clonedElement) => {
          const badgeText = clonedElement.querySelector(".badge-text") as HTMLElement | null;
          if (badgeText) badgeText.style.top = "3px";
        },
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

  // ✅ 카드 클릭 시 이미지 다운로드 여부를 confirm으로 물어봄 (기존 네이버 자동이동은 불편해서 제거)
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (confirm("이 신고가 카드를 이미지로 저장하시겠습니까?")) {
      download();
    }
  };

  return (
    <div className="relative group hover-lift" onClick={handleCardClick} style={{ cursor: "pointer" }} title="클릭하면 이미지로 저장할 수 있습니다">
      {/* 포스터 본체 (캡처 대상) */}
      <div
        ref={cardRef}
        style={{
          background: "#ffffff",
          border: "1.5px solid #10b981",
          borderRadius: "16px",
          padding: "28px 24px 22px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 배경 장식 (은은하게) */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(16,185,129,0.05)", pointerEvents: "none" }} />
        {/* 헤더: 뱃지 + 날짜 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            /* ✅ 투명도 없는 완전 불투명한 6자리 헥스코드 적용 */
            background: "#ffffff", // 연한 핑크색 등 원하는 색
            border: "1px solid #000000", // 테두리 색
            borderRadius: 999, padding: "0 10px",
            height: 20,
          }}>
            <span className="badge-text" style={{
              color: "#000000", fontWeight: 800, fontSize: 10, letterSpacing: "0.05em",
              position: "relative",
              top: 0,
            }}>신고가</span>
          </div>
          <span style={{ color: "#000000", fontSize: 10 }}>{record.dealDate}</span>
        </div>

        {/* 지역 */}
        <p style={{ color: "#64748b", fontSize: 10, marginBottom: 3 }}>
          {record.regionName} · {record.dong}
        </p>

        {/* 단지명 · 평형 · 타입 (검은색) */}
        <p style={{ color: "#0f172a", fontWeight: 900, fontSize: record.complexName.length > 9 ? 18 : 22, marginBottom: 3, lineHeight: 1.2 }}>
          {record.complexName}
        </p>

        {/* 면적/층/준공년도 (검은색 계열) */}
        <p style={{ color: "#334155", fontSize: 10, marginBottom: 18 }}>
          전용 {record.area}㎡ (약 {toPyeong(record.area)}평) · {record.floor}층
          {record.buildYear && ` · ${record.buildYear}년 준공`}
        </p>

        {/* 구분선 */}
        <div style={{ borderTop: "1px solid #f1f5f9", marginBottom: 16 }} />

        {/* 신고가 (빨간색) */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: "#000000", fontSize: 10, marginBottom: 3, letterSpacing: "0.1em" }}>실거래가</p>
          <p style={{ color: "#ef4444", fontWeight: 900, fontSize: 26, lineHeight: 1 }}>
            {fmtPriceFull(record.price)}
          </p>
        </div>

        {/* 직전 신고가(연한 빨강) + 상승률(빨강) */}
        {record.previousHighPrice && record.priceDiff && (
          <>
            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
              <div>
                <p style={{ color: "#94a3b8", fontSize: 9, marginBottom: 2 }}>직전 신고가</p>
                <p style={{ color: "#fca5a5", fontWeight: 700, fontSize: 12 }}>
                  {fmtPriceFull(record.previousHighPrice)}
                </p>
              </div>
              <div>
                <p style={{ color: "#94a3b8", fontSize: 9, marginBottom: 2 }}>직전 대비 상승률</p>
                <p style={{ color: "#ef4444", fontWeight: 800, fontSize: 12 }}>
                  +{diffPct}%
                </p>
              </div>
            </div>

            {/* 상승액(갭) 강조 — 빨간색 */}
            <div style={{
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 10, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 18,
            }}>
              <ArrowUpRight size={16} strokeWidth={2} color="#ef4444" />
              <div>
                <p style={{ color: "#94a3b8", fontSize: 8, marginBottom: 1 }}>직전 신고가 대비 상승</p>
                <p style={{ color: "#ef4444", fontWeight: 900, fontSize: 16 }}>
                  {fmtPriceFull(record.priceDiff)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 푸터: 로고 + 슬로건 */}
        <div style={{
          borderTop: "1px solid #f1f5f9", paddingTop: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* ✅ 로고를 <img src="/logo.svg">가 아닌 인라인 SVG로 직접 삽입.
                html2canvas가 외부 이미지 파일 로딩을 기다리지 못하고 캡처해버려서
                다운로드한 이미지에서 로고만 사라지는 문제가 있었음. 인라인으로 넣으면
                이미지 로딩 자체가 필요 없어서 항상 안정적으로 캡처됨. */}
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 18, width: 18 }}>
              <path d="M50 14 L14 44 V86 C14 88.2 15.8 90 18 90 H82 C84.2 90 86 88.2 86 86 V44 Z" fill="#ebfbf5" />
              <path d="M50 14 L14 44 V86 C14 88.2 15.8 90 18 90 H82 C84.2 90 86 88.2 86 86 V44 Z" stroke="#10b981" strokeWidth="7.5" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M31 59 L45 73 L69 49" stroke="#10b981" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ color: "#334155", fontSize: 9, fontWeight: 700 }}>
              똑집<span style={{ color: "#94a3b8", fontWeight: 400 }}>, 똑똑한 부동산 길잡이</span>
            </span>
          </div>
          <span style={{ color: "#94a3b8", fontSize: 8 }}>국토교통부 실거래가 기반</span>
        </div>
      </div>

      {/* 다운로드 버튼 (캡처 제외 — 포스터 밖에 위치) */}
      <button
        onClick={download}
        disabled={downloading}
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-lg"
        style={{
          background: "#10b981",
          color: "#ffffff",
          zIndex: 10,
          border: "1px solid #059669",
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
  const [records, setRecords] = useState<NewHighRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ "수도권 외 지역 구현중" 안내 토스트 — 페이지 진입 후 잠깐 나타났다가 자동으로 사라짐
  const [showRegionToast, setShowRegionToast] = useState(false);
  useEffect(() => {
    const showTimer = setTimeout(() => setShowRegionToast(true), 600); // 0.6초 후 등장
    const hideTimer = setTimeout(() => setShowRegionToast(false), 4000); // 4초간 노출 후 사라짐
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // ✅ Supabase new_high_view에서 조회 — 백필 진행 중에도 현재까지 쌓인 데이터로 작동
  useEffect(() => {
    const fetchNewHighs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("new_high_view")
        .select("*")
        .order("price_diff", { ascending: false })
        .limit(150); // 상승액 큰 순 상위 150건만 (전체 기간 기준이라 개수 제한)

      if (!error && data) {
        const mapped: NewHighRecord[] = data.map((d: any) => ({
          id: `${d.complex_name}__${d.dong}__${d.area}`,
          complexName: d.complex_name,
          dong: d.dong,
          regionName: d.region_name,
          area: d.area,
          floor: d.floor,
          price: d.price,
          buildYear: d.build_year ?? null,
          previousHighPrice: d.previous_high_price,
          priceDiff: d.price_diff,
          dealDate: d.deal_date,
        }));
        setRecords(mapped);
      }
      setLoading(false);
    };
    fetchNewHighs();
  }, []);


  const switchView = (view: RegionView) => {
    setIsAnimating(true);
    setSelectedDistrict(null);
    setTimeout(() => {
      setRegionView(view);
      setIsAnimating(false);
    }, 300);
  };

  // ✅ "성남시"(버튼 목록) vs "성남 분당구"(실제 DB) 처럼 "시/군" 접미사 유무가 달라도
  //    매칭되도록, 비교 전에 접미사를 제거해서 핵심 지역명만 비교
  const normalizeCity = (s: string) => s.replace(/(시|군|구)$/, "");

  const filteredData = records.filter(d => {
    if (regionView === "top") return true;
    // ✅ 실제 DB region_name 형식이 지역마다 다를 수 있어(예: "가평군" vs "서울 강남구"),
    //    "서울로 시작하는지"만으로 서울/경기를 구분 (대장아파트 페이지와 동일 패턴)
    const isSeoulRegion = d.regionName.startsWith("서울");
    if (regionView === "seoul") {
      if (!isSeoulRegion) return false;
      if (selectedDistrict) return d.regionName.includes(selectedDistrict);
      return true;
    }
    if (regionView === "gyeonggi") {
      if (isSeoulRegion) return false;
      if (selectedDistrict) {
        // "성남시" 선택 시 실제 DB의 "성남 분당구", "성남 수정구" 등도 모두 매칭되도록
        // 접미사를 뗀 핵심 지역명("성남")이 포함되는지로 비교
        return d.regionName.includes(normalizeCity(selectedDistrict));
      }
      return true;
    }
    return true;
  }); // 이미 price_diff desc로 정렬되어 옴

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Trophy size={20} strokeWidth={1.75} className="text-emerald-600" />
            오늘의 신고가
          </h1>
          <p className="text-xs text-slate-400 mt-1">국토교통부 실거래가 기반 · 매일 자동 갱신 · 카드에 마우스 올리면 저장 버튼이 나타납니다</p>
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
                  className="py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                  서울
                  <span className="block text-[11px] font-normal text-slate-400 mt-0.5">25개 자치구</span>
                </button>
                <button onClick={() => switchView("gyeonggi")}
                  className="py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                  경기도
                  <span className="block text-[11px] font-normal text-slate-400 mt-0.5">31개 시군</span>
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm space-y-2">
            <p>해당 지역의 신고가 데이터가 없습니다.</p>
            <p className="text-xs text-slate-300">
              실거래가 데이터를 매일 수집 중입니다. 데이터가 쌓일수록 더 많은 신고가가 표시돼요.
            </p>
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

      {/* ✅ 수도권 외 지역 구현중 안내 토스트 — 잠깐 나타났다가 자동으로 사라짐 */}
      <div
        style={{
          position: "fixed",
          bottom: showRegionToast ? 24 : -80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          background: "#1e293b",
          color: "#f1f5f9",
          padding: "10px 18px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          opacity: showRegionToast ? 1 : 0,
          transition: "bottom 0.4s ease, opacity 0.4s ease",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MapPin size={13} strokeWidth={2} />
          전 지역 서비스를 빠른 시간 내에 제공할 예정입니다.
        </span>
      </div>
    </div>
  );
}