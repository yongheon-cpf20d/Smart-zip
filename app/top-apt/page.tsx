"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Crown, ArrowLeft, MapPin, X } from "lucide-react";
import NaverMap, { MapMarker } from "@/components/NaverMap";
import ShareButton from "@/components/ShareButton"; // ✅ 1. 공유 버튼 컴포넌트 임포트
import ThemeToggle from "@/components/ThemeToggle";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TopApt = {
  complex_name: string;
  dong: string;
  region_name: string;
  area: number;
  area_group: string;
  floor: number;
  price: number;
  deal_date: string;
  region_rank: number;
};

type SidoView = "top" | "seoul" | "gyeonggi";

// ✅ 평형대 그룹 — DB 뷰(top_apt_by_area_view)의 area_group과 정확히 일치해야 함
const AREA_GROUPS = [
  "20평형대", "25평형대", "30평형대", "34평형대(국민평형)",
  "38평형대", "40평형대", "45평형대", "50평형대", "60평형대 이상",
];

const fmtPrice = (won: number): string => {
  const uk = Math.floor(won / 100_000_000);
  const man = Math.round((won % 100_000_000) / 10_000);
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${man.toLocaleString()}만원`;
};

function TopAptByAreaPageContent() {
  const searchParams = useSearchParams();

  const [allRegions, setAllRegions] = useState<string[]>([]);
  const [regionLoading, setRegionLoading] = useState(true);

  const [sidoView, setSidoView] = useState<SidoView>("top");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("34평형대(국민평형)");
  const [results, setResults] = useState<TopApt[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ 단지 클릭 시 팝업으로 지도 표시
  const [mapModalComplex, setMapModalComplex] = useState<TopApt | null>(null);
  const [mapMarker, setMapMarker] = useState<MapMarker | null>(null);
  const [mapModalLoading, setMapModalLoading] = useState(false);

  // ✅ 2. 공유 링크로 접근 시 URL에서 지역과 평형대 읽어와서 화면 상태에 세팅 (Hydration)
  useEffect(() => {
    const spRegion = searchParams.get("region");
    const spGroup = searchParams.get("group");

    if (spRegion) {
      setSelectedRegion(spRegion);
      // 서울/경기 탭 자동 전환
      if (spRegion.startsWith("서울")) setSidoView("seoul");
      else setSidoView("gyeonggi");
    }
    if (spGroup) {
      setSelectedGroup(spGroup);
    }
  }, [searchParams]);

  // 최초 전체 지역 목록 불러오기
  useEffect(() => {
    supabase
      .rpc("get_distinct_regions")
      .then(({ data, error }) => {
        if (error) console.error("지역 목록 조회 실패:", error.message);
        if (data) setAllRegions(data.map((d: any) => d.region_name));
        setRegionLoading(false);
      });
  }, []);

  const seoulRegions = allRegions.filter((r) => r.startsWith("서울")).sort();
  const gyeonggiRegions = allRegions.filter((r) => !r.startsWith("서울")).sort();

  // ✅ 3. 선택된 지역과 평형대가 변경되면 (또는 URL 파라미터로 세팅되면) 자동으로 DB 쿼리 실행
  useEffect(() => {
    if (!selectedRegion || !selectedGroup) return;
    setLoading(true);
    supabase
      .from("top_apt_by_area_view")
      .select("*")
      .eq("region_name", selectedRegion)
      .eq("area_group", selectedGroup)
      .order("region_rank", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setResults((data as TopApt[]) ?? []);
        setLoading(false);
      });
  }, [selectedRegion, selectedGroup]);

  const openMapModal = async (complex: TopApt) => {
    setMapModalComplex(complex);
    setMapMarker(null);
    setMapModalLoading(true);

    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complexes: [{
            complexName: complex.complex_name,
            dong: complex.dong,
            regionName: complex.region_name,
          }],
        }),
      });
      const data = await res.json();
      const loc = data.locations?.[0];
      if (loc?.latitude && loc?.longitude) {
        setMapMarker({
          id: complex.complex_name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          title: `${complex.complex_name} ${complex.area}㎡`,
          subtitle: fmtPrice(complex.price),
        });
      }
    } finally {
      setMapModalLoading(false);
    }
  };

  const closeMapModal = () => {
    setMapModalComplex(null);
    setMapMarker(null);
  };

  const currentList = sidoView === "seoul" ? seoulRegions : sidoView === "gyeonggi" ? gyeonggiRegions : [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press">
            ← 메인으로
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
          <Crown size={20} strokeWidth={1.75} className="text-amber-500" />
          지역별 대장아파트
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">{new Date().getFullYear()}년 실거래 기준, 같은 지역·같은 평형대끼리 최고가 TOP 10</p>

        {/* 지역 선택 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-2 block">지역 선택</label>

            {regionLoading ? (
              <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ) : sidoView === "top" ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSidoView("seoul")}
                  className="py-3.5 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-900/40 dark:hover:border-emerald-700 transition-all"
                >
                  서울
                  <span className="block text-[11px] font-normal text-emerald-500 dark:text-emerald-400 mt-0.5">{seoulRegions.length}개 지역</span>
                </button>
                <button
                  onClick={() => setSidoView("gyeonggi")}
                  className="py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 hover:border-slate-400 dark:hover:bg-slate-600 transition-all"
                >
                  경기도
                  <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">{gyeonggiRegions.length}개 지역</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => { setSidoView("top"); setSelectedRegion(""); setResults([]); }}
                  className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  <ArrowLeft size={12} strokeWidth={2} />
                  {sidoView === "seoul" ? "서울" : "경기도"} 다시 선택
                </button>
                <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {currentList.map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRegion(r)}
                      className={`py-2 px-1.5 rounded-lg text-[11px] font-bold border transition ${
                        selectedRegion === r
                          ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-600"
                      }`}
                    >
                      {r.replace(/^서울\s*/, "")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedRegion && (
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">평형대 선택</label>
              <div className="grid grid-cols-3 gap-2">
                {AREA_GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGroup(g)}
                    className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition ${
                      selectedGroup === g
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-600"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 랭킹 리스트 */}
        {!selectedRegion ? (
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
            지역과 평형대를 선택하면 TOP 10 순위가 나타납니다.
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
            해당 지역·평형대의 실거래 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-2 result-enter">
            <p className="text-xs text-slate-400 dark:text-slate-500 px-1">{selectedRegion} · {selectedGroup} TOP {results.length}</p>
            {results.map((r) => {
              const isTop3 = r.region_rank <= 3;
              const medalColor = r.region_rank === 1 ? "#f59e0b" : r.region_rank === 2 ? "#94a3b8" : r.region_rank === 3 ? "#d97706" : "#cbd5e1";
              return (
                <div
                  key={`${r.complex_name}-${r.dong}-${r.area}`}
                  onClick={() => openMapModal(r)}
                  className={`flex items-center gap-3 rounded-xl p-3.5 border transition cursor-pointer ${
                    isTop3
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  } hover-lift`}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-sm shrink-0"
                    style={{ background: medalColor }}
                  >
                    {r.region_rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{r.complex_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{r.dong} · 전용{r.area}㎡ · {r.floor}층 · {r.deal_date}</p>
                  </div>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 shrink-0">{fmtPrice(r.price)}</p>
                </div>
              );
            })}

            {/* ✅ 4. 공유하기 버튼 추가 — 랭킹 리스트 하단 */}
            <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <ShareButton
                title={`${selectedRegion} 대장아파트 TOP 10 - 똑집`}
                description={`${selectedRegion} ${selectedGroup} 실거래가 순위입니다. (1위: ${results[0]?.complex_name} ${fmtPrice(results[0]?.price)})`}
                params={{
                  region: selectedRegion,
                  group: selectedGroup,
                }}
              />
            </div>

          </div>
        )}

        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-700">
          국토교통부 실거래가 공개시스템 기준. <strong>{new Date().getFullYear()}년 거래 중</strong> 최고가 기준으로 TOP 10을 산정합니다.
          평형대는 시장 관행상 통용되는 범위(예: 34평형대=82~86㎡)로 묶은 것이며, 단지별 정확한 전용면적은 목록에 함께 표시됩니다.
        </p>
      </div>

      {/* ✅ 단지 클릭 시 뜨는 지도 팝업 */}
      {mapModalComplex && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeMapModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <MapPin size={15} strokeWidth={1.75} className="text-rose-400" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{mapModalComplex.complex_name}</h3>
              </div>
              <button onClick={closeMapModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {mapModalLoading ? (
              <div className="h-[300px] bg-slate-100 dark:bg-slate-700 animate-pulse" />
            ) : mapMarker ? (
              <NaverMap markers={[mapMarker]} height={300} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 px-6 text-center">
                위치 정보를 찾을 수 없습니다.
              </div>
            )}

            <div className="p-4 space-y-1">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {mapModalComplex.dong} · 전용 {mapModalComplex.area}㎡ · {mapModalComplex.floor}층
              </p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{fmtPrice(mapModalComplex.price)}</p>
              <a
                href={`https://search.naver.com/search.naver?query=${encodeURIComponent(mapModalComplex.complex_name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                네이버에서 더 알아보기 →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ 5. Next.js App Router용 안전한 Suspense 컴포넌트 처리
export default function TopAptByAreaPage() {
  return (
    <Suspense fallback={null}>
      <TopAptByAreaPageContent />
    </Suspense>
  );
}
