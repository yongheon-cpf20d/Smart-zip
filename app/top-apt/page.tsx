"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Crown, ChevronDown } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TopApt = {
  complex_name: string;
  dong: string;
  region_name: string;
  area: number;
  floor: number;
  price: number;
  deal_date: string;
  region_rank: number;
};

// 자주 쓰이는 평형 옵션 (전용면적 ㎡ 기준)
const AREA_OPTIONS = [
  { label: "국민평형 84㎡ (34평)", value: 84 },
  { label: "59㎡ (25평)", value: 59 },
  { label: "114㎡ (46평)", value: 114 },
  { label: "135㎡ (54평)", value: 135 },
  { label: "49㎡ (20평)", value: 49 },
];

const fmtPrice = (won: number): string => {
  const uk = Math.floor(won / 100_000_000);
  const man = Math.round((won % 100_000_000) / 10_000);
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${man.toLocaleString()}만원`;
};

export default function TopAptByAreaPage() {
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<number>(84);
  const [customArea, setCustomArea] = useState("");
  const [results, setResults] = useState<TopApt[]>([]);
  const [loading, setLoading] = useState(false);
  const [regionLoading, setRegionLoading] = useState(true);

  // 지역 목록 최초 로드 (distinct region_name)
  useEffect(() => {
    supabase
      .from("top_apt_by_area_view")
      .select("region_name")
      .then(({ data }) => {
        if (data) {
          const unique = Array.from(new Set(data.map((d: any) => d.region_name))).sort();
          setRegions(unique as string[]);
          if (unique.length > 0) setSelectedRegion(unique[0] as string);
        }
        setRegionLoading(false);
      });
  }, []);

  const effectiveArea = customArea ? Number(customArea) : selectedArea;

  useEffect(() => {
    if (!selectedRegion || !effectiveArea) return;
    setLoading(true);
    supabase
      .from("top_apt_by_area_view")
      .select("*")
      .eq("region_name", selectedRegion)
      .eq("area", effectiveArea)
      .order("region_rank", { ascending: true })
      .limit(20)
      .then(({ data }) => {
        setResults((data as TopApt[]) ?? []);
        setLoading(false);
      });
  }, [selectedRegion, effectiveArea]);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press">
          ← 메인으로
        </Link>

        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Crown size={20} strokeWidth={1.75} className="text-amber-500" />
          지역별 대장아파트
        </h1>
        <p className="text-xs text-slate-400 -mt-2">같은 지역, 같은 평형끼리 실거래 최고가로 줄세우기</p>

        {/* 지역 + 평형 선택 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">지역 선택</label>
            {regionLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 appearance-none bg-white"
                >
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">평형 선택</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {AREA_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => { setSelectedArea(a.value); setCustomArea(""); }}
                  className={`py-2 rounded-lg text-xs font-bold border transition ${
                    !customArea && selectedArea === a.value
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              placeholder="직접 입력 (전용면적 ㎡)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 랭킹 리스트 */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
            해당 지역·평형의 실거래 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-2 result-enter">
            {results.map((r, idx) => {
              const isTop3 = r.region_rank <= 3;
              const medalColor = r.region_rank === 1 ? "#f59e0b" : r.region_rank === 2 ? "#94a3b8" : r.region_rank === 3 ? "#d97706" : "#cbd5e1";
              return (
                <div
                  key={`${r.complex_name}-${r.dong}`}
                  className={`flex items-center gap-3 rounded-xl p-3.5 border transition ${
                    isTop3 ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200"
                  } hover-lift`}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-sm shrink-0"
                    style={{ background: medalColor }}
                  >
                    {r.region_rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{r.complex_name}</p>
                    <p className="text-xs text-slate-400">{r.dong} · {r.area}㎡ · {r.floor}층 · {r.deal_date}</p>
                  </div>
                  <p className="text-base font-black text-emerald-600 shrink-0">{fmtPrice(r.price)}</p>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
          국토교통부 실거래가 공개시스템 기준(2019.01~ 누적 데이터). 동일 단지·동일 평형의 역대 최고 거래가 기준으로 순위를 산정합니다.
          평형 구분은 전용면적(㎡) 기준이며, 동일 평형 표기라도 실제 면적은 단지별로 소폭 차이가 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
}