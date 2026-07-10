"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Search, Building2, TrendingUp, Users, Activity, X, ChevronLeft } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import ShareButton from "../../components/ShareButton";

// ─── 지역 코드 ────────────────────────────────────────────────
const SEOUL_DISTRICTS = [
  { name: "강남구", code: "11680" }, { name: "강동구", code: "11740" },
  { name: "강북구", code: "11305" }, { name: "강서구", code: "11500" },
  { name: "관악구", code: "11620" }, { name: "광진구", code: "11215" },
  { name: "구로구", code: "11530" }, { name: "금천구", code: "11545" },
  { name: "노원구", code: "11350" }, { name: "도봉구", code: "11320" },
  { name: "동대문구", code: "11230" }, { name: "동작구", code: "11590" },
  { name: "마포구", code: "11440" }, { name: "서대문구", code: "11410" },
  { name: "서초구", code: "11650" }, { name: "성동구", code: "11200" },
  { name: "성북구", code: "11290" }, { name: "송파구", code: "11710" },
  { name: "양천구", code: "11470" }, { name: "영등포구", code: "11560" },
  { name: "용산구", code: "11170" }, { name: "은평구", code: "11380" },
  { name: "종로구", code: "11110" }, { name: "중구", code: "11140" },
  { name: "중랑구", code: "11260" },
];

const GYEONGGI_DISTRICTS = [
  { name: "고양시 덕양구", code: "41281" }, { name: "고양시 일산동구", code: "41285" },
  { name: "고양시 일산서구", code: "41287" }, { name: "과천시", code: "41290" },
  { name: "광명시", code: "41210" }, { name: "광주시", code: "41610" },
  { name: "구리시", code: "41310" }, { name: "군포시", code: "41410" },
  { name: "김포시", code: "41570" }, { name: "남양주시", code: "41360" },
  { name: "부천시", code: "41190" }, { name: "성남시 분당구", code: "41135" },
  { name: "성남시 수정구", code: "41131" }, { name: "성남시 중원구", code: "41133" },
  { name: "수원시 권선구", code: "41113" }, { name: "수원시 영통구", code: "41117" },
  { name: "수원시 장안구", code: "41111" }, { name: "수원시 팔달구", code: "41115" },
  { name: "시흥시", code: "41390" }, { name: "안산시 단원구", code: "41273" },
  { name: "안산시 상록구", code: "41271" }, { name: "안양시 동안구", code: "41173" },
  { name: "안양시 만안구", code: "41171" }, { name: "양주시", code: "41630" },
  { name: "오산시", code: "41370" }, { name: "용인시 기흥구", code: "41463" },
  { name: "용인시 수지구", code: "41465" }, { name: "용인시 처인구", code: "41461" },
  { name: "의왕시", code: "41430" }, { name: "의정부시", code: "41150" },
  { name: "이천시", code: "41500" }, { name: "파주시", code: "41480" },
  { name: "평택시", code: "41220" }, { name: "하남시", code: "41450" },
  { name: "화성시", code: "41590" },
];

// ─── 타입 ─────────────────────────────────────────────────────
interface AptItem { kaptCode: string; kaptName: string; }
interface TradeRaw {
  aptNm: string;
  dealAmount: string;
  dealYear: number | string;
  dealMonth: number | string;
  dealDay: number | string;
  excluUseAr: string;
  floor: string;
  dong?: string;
}
interface MonthData { ym: string; items: TradeRaw[]; }

interface JeonseRaw {
  aptNm: string;
  deposit: string;
  dealYear: number | string;
  dealMonth: number | string;
  dealDay: number | string;
  excluUseAr: string;
  floor: string;
  dong?: string;
  monthlyRent?: string | number;
}
interface JeonseMonthData { ym: string; items: JeonseRaw[]; }
interface AptInfo {
  kaptName?: string; doroJuso?: string;
  kaptdaCnt?: number | string;   // 총 세대수
  kaptMparea60?: number | string;  // 전용 60㎡ 이하 세대수
  kaptMparea85?: number | string;  // 전용 60~85㎡ 세대수
  kaptMparea135?: number | string; // 전용 85~135㎡ 세대수
  kaptMparea136?: number | string; // 전용 135㎡ 초과 세대수
  kaptBcompany?: string; kaptUsedate?: string;
  kaptDongCnt?: string; kaptTopFloor?: number;
}

// ─── 헬퍼 ─────────────────────────────────────────────────────
function fmtEok(억: number | null | undefined): string {
  if (억 == null) return "-";
  return `${억}억`;
}

function fmtDealAmount(dealAmountStr: string): string {
  const manwon = parseInt(dealAmountStr.replace(/,/g, "") || "0");
  if (!manwon) return "-";
  const eok = Math.floor(manwon / 10000);
  const man = manwon % 10000;
  if (man === 0) return `${eok}억`;
  return `${eok}억 ${man.toLocaleString()}만`;
}

/** 선택 평형에 해당하는 세대수 반환 (구조화 필드 사용) */
function getAreaUnitCount(aptInfo: AptInfo | null, selectedArea: string): number | null {
  if (!aptInfo) return null;
  const area = parseInt(selectedArea);
  const toNum = (v: number | string | undefined) => {
    const n = Number(v);
    return n > 0 ? n : null;
  };
  if (area <= 60) return toNum(aptInfo.kaptMparea60);
  if (area <= 85) return toNum(aptInfo.kaptMparea85);
  if (area <= 135) return toNum(aptInfo.kaptMparea135);
  return toNum(aptInfo.kaptMparea136);
}

/** 선택 면적 → API 구간 레이블 */
function getAreaBucketLabel(selectedArea: string): string {
  const area = parseInt(selectedArea);
  if (area <= 60) return "60㎡ 이하 기준";
  if (area <= 85) return "60~85㎡ 기준";
  if (area <= 135) return "85~135㎡ 기준";
  return "135㎡ 초과 기준";
}

/** 환금성 → 등급 문자 */
function getLiquidityGradeLetter(v: number): string {
  if (v >= 0.8) return "S";
  if (v >= 0.4) return "A";
  if (v >= 0.2) return "B";
  return "C";
}

/** 준공일 포맷 "20210806" → "2021.08.06" */
function fmtUsedate(s: string | undefined): string {
  if (!s || s.length < 8) return s ?? "";
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

// ─── 통계 카드 ─────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, highlight = false,
}: { label: string; value: string; sub: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border p-4 ${
      highlight ? "border-emerald-300 dark:border-emerald-700" : "border-gray-100 dark:border-gray-800"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        {icon}
      </div>
      <div className={`text-xl font-bold ${
        highlight ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
      }`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
export default function AptTradePage() {
  const [region, setRegion] = useState<"서울" | "경기">("서울");
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string; code: string } | null>(null);
  const [aptList, setAptList] = useState<AptItem[]>([]);
  const [aptListLoading, setAptListLoading] = useState(false);
  const [aptSearch, setAptSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedApt, setSelectedApt] = useState<AptItem | null>(null);
  const [aptInfo, setAptInfo] = useState<AptInfo | null>(null);
  const [tradeHistory, setTradeHistory] = useState<MonthData[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [jeonseHistory, setJeonseHistory] = useState<JeonseMonthData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [tableType, setTableType] = useState<"매매" | "전세">("매매");
  const searchRef = useRef<HTMLDivElement>(null);

  // 지역 탭 변경 → 초기화
  useEffect(() => {
    setSelectedDistrict(null); setAptList([]);
    setSelectedApt(null); setAptInfo(null);
    setTradeHistory([]); setAptSearch("");
  }, [region]);

  // 구/시군 선택 → 단지 목록 로드
  useEffect(() => {
    if (!selectedDistrict) return;
    setAptListLoading(true);
    setAptList([]); setSelectedApt(null);
    setAptInfo(null); setTradeHistory([]); setAptSearch("");

    fetch(`/api/apt-list?sigunguCode=${selectedDistrict.code}`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setAptList(list);
        if (list.length > 0) setShowDropdown(true);
      })
      .catch(() => setAptList([]))
      .finally(() => setAptListLoading(false));
  }, [selectedDistrict]);

  // 단지 선택 → 정보 + 매매/전세 이력 로드
  useEffect(() => {
    if (!selectedApt || !selectedDistrict) return;
    setDataLoading(true);
    setAptInfo(null); setTradeHistory([]); setJeonseHistory([]); setSelectedArea(""); setTableType("매매");

    const base = `/api/apt-trade-history?sigunguCode=${selectedDistrict.code}&aptName=${encodeURIComponent(selectedApt.kaptName)}&months=24`;
    const jeonseBase = `/api/apt-jeonse-history?sigunguCode=${selectedDistrict.code}&aptName=${encodeURIComponent(selectedApt.kaptName)}&months=24`;

    Promise.all([
      fetch(`/api/apt-info?kaptCode=${selectedApt.kaptCode}`).then(r => r.json()),
      fetch(base).then(r => r.json()),
      fetch(jeonseBase).then(r => r.json()),
    ])
      .then(([info, history, jeonse]: [AptInfo, MonthData[], JeonseMonthData[]]) => {
        setAptInfo(info);
        setTradeHistory(history);
        setJeonseHistory(Array.isArray(jeonse) ? jeonse : []);
        // 거래 많은 평형 자동 선택
        const counts: Record<string, number> = {};
        history.flatMap(h => h.items).forEach(item => {
          const k = Math.floor(parseFloat(item.excluUseAr || "0")).toString();
          if (k !== "0") counts[k] = (counts[k] || 0) + 1;
        });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (top) setSelectedArea(top);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [selectedApt, selectedDistrict]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 검색 필터
  const filteredApts = useMemo(() => {
    const q = aptSearch.trim();
    if (!q) return aptList.slice(0, 80);
    return aptList.filter(a => a.kaptName.includes(q));
  }, [aptList, aptSearch]);

  // 사용 가능한 평형 목록
  const availableAreas = useMemo(() => {
    const s = new Set(
      tradeHistory.flatMap(h => h.items)
        .map(item => Math.floor(parseFloat(item.excluUseAr || "0")).toString())
        .filter(a => a !== "0")
    );
    return Array.from(s).sort((a, b) => parseInt(a) - parseInt(b));
  }, [tradeHistory]);

  // 차트 데이터 (매매 + 전세 합산)
  const chartData = useMemo(() =>
    tradeHistory.map(({ ym, items }) => {
      const filtered = selectedArea
        ? items.filter(item => Math.floor(parseFloat(item.excluUseAr || "0")).toString() === selectedArea)
        : items;
      const prices = filtered
        .map(item => parseInt(item.dealAmount?.replace(/,/g, "") || "0"))
        .filter(v => v > 0);
      const count = filtered.length;

      // 전세 데이터 (같은 ym)
      const jeonseMonth = jeonseHistory.find(h => h.ym === ym);
      const jeonseFiltered = jeonseMonth
        ? (selectedArea
            ? jeonseMonth.items.filter(item => Math.floor(parseFloat(item.excluUseAr || "0")).toString() === selectedArea)
            : jeonseMonth.items)
        : [];
      const jeonsePrices = jeonseFiltered
        .map(item => parseInt(String(item.deposit || "0").replace(/,/g, "")))
        .filter(v => v > 0);

      return {
        ym,
        month: `${ym.slice(0, 4)}.${ym.slice(4)}`,
        거래건수: count,
        매매평균가: count > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / count / 100) / 100 : null,
        전세평균가: jeonsePrices.length > 0 ? Math.round(jeonsePrices.reduce((a, b) => a + b, 0) / jeonsePrices.length / 100) / 100 : null,
      };
    }),
  [tradeHistory, jeonseHistory, selectedArea]);

  // 거래 내역 표 데이터
  const tableRows = useMemo(() => {
    const sortByDate = <T extends { dealYear: number | string; dealMonth: number | string; dealDay: number | string }>(arr: T[]) =>
      [...arr].sort((a, b) => {
        const da = `${a.dealYear}${String(a.dealMonth).padStart(2, "0")}${String(a.dealDay).padStart(2, "0")}`;
        const db = `${b.dealYear}${String(b.dealMonth).padStart(2, "0")}${String(b.dealDay).padStart(2, "0")}`;
        return db.localeCompare(da);
      });

    if (tableType === "매매") {
      const all = tradeHistory.flatMap(h => h.items);
      const filtered = selectedArea
        ? all.filter(item => Math.floor(parseFloat(item.excluUseAr || "0")).toString() === selectedArea)
        : all;
      return sortByDate(filtered).map(item => ({
        년월: `${item.dealYear}.${String(item.dealMonth).padStart(2, "0")}`,
        일: String(item.dealDay),
        가격: fmtDealAmount(item.dealAmount || ""),
        전용면적: `${Math.floor(parseFloat(item.excluUseAr || "0"))}㎡`,
        동: item.dong || "-",
        층수: `${item.floor}층`,
      }));
    } else {
      const all = jeonseHistory.flatMap(h => h.items);
      const filtered = selectedArea
        ? all.filter(item => Math.floor(parseFloat(item.excluUseAr || "0")).toString() === selectedArea)
        : all;
      return sortByDate(filtered).map(item => ({
        년월: `${item.dealYear}.${String(item.dealMonth).padStart(2, "0")}`,
        일: String(item.dealDay),
        가격: fmtDealAmount(String(item.deposit || "")),
        전용면적: `${Math.floor(parseFloat(item.excluUseAr || "0"))}㎡`,
        동: item.dong || "-",
        층수: `${item.floor}층`,
      }));
    }
  }, [tableType, tradeHistory, jeonseHistory, selectedArea]);

  // 통계 (거래건수·환금성은 최근 12개월 기준 / 최근평균가는 최근 3개월 기준)
  const stats = useMemo(() => {
    if (!chartData.length) return null;

    // ── 최근 12개월 기준 ──────────────────────────────────────
    const last12 = chartData.slice(-12);
    const active12 = last12.filter(d => d.거래건수 > 0);
    if (!active12.length) return null;
    const total = active12.reduce((s, d) => s + d.거래건수, 0);
    const avgMonthly = total / 12; // 12개월 전체 기준 월평균

    // ── 최근 3개월 평균가 (거래 없으면 거래 있는 마지막 달까지 소급) ──
    const withPrice = chartData.filter(d => d.매매평균가 != null);
    const recent3 = withPrice.slice(-3);
    const latestAvg = recent3.length > 0
      ? Math.round(recent3.reduce((s, d) => s + (d.매매평균가 ?? 0), 0) / recent3.length * 100) / 100
      : null;

    // ── 24개월 최고/최저 (차트 전체 범위) ────────────────────
    const allPrices = tradeHistory.flatMap(h => {
      const filtered = selectedArea
        ? h.items.filter(item => Math.floor(parseFloat(item.excluUseAr || "0")).toString() === selectedArea)
        : h.items;
      return filtered.map(item => parseInt(item.dealAmount?.replace(/,/g, "") || "0")).filter(v => v > 0);
    });
    const maxPrice = allPrices.length > 0 ? Math.round(Math.max(...allPrices) / 100) / 100 : null;
    const minPrice = allPrices.length > 0 ? Math.round(Math.min(...allPrices) / 100) / 100 : null;

    // ── 세대수·환금성 ─────────────────────────────────────────
    let unitCount: number | null = null;
    let unitCountType: "area" | "total" | null = null;
    if (aptInfo) {
      const areaCount = selectedArea ? getAreaUnitCount(aptInfo, selectedArea) : null;
      if (areaCount != null) {
        unitCount = areaCount;
        unitCountType = "area";
      } else {
        const total = Number(aptInfo.kaptdaCnt) || null;
        unitCount = total;
        unitCountType = total ? "total" : null;
      }
    }
    const liquidity = unitCount && avgMonthly > 0
      ? parseFloat(((avgMonthly / unitCount) * 100).toFixed(2))
      : null;

    return {
      total, avgMonthly: parseFloat(avgMonthly.toFixed(1)),
      maxPrice, minPrice, latestAvg, unitCount, unitCountType, liquidity,
    };
  }, [chartData, tradeHistory, aptInfo, selectedArea]);

  const districts = region === "서울" ? SEOUL_DISTRICTS : GYEONGGI_DISTRICTS;

  function getLiquidityGrade(v: number) {
    if (v >= 0.8) return <span>S등급. 매도자 우위의 초고도 환금성이에요.</span>;
    if (v >= 0.4) return <span>A등급. 건강한 실수요 시장의 환금성이에요.<br/>가장 이상적이고 정상적인 회전율입니다.</span>;
    if (v >= 0.2) return <span>B등급. 주의. 매수자 우위의 환금성이에요. 때때로 가격조정이 필요할 수 있어요.</span>;
    return <span>C등급. 위험. 매수자 우위의 저조한 환금성이에요. 가격조정이 필요할 수 있어요.</span>;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              메인으로
            </Link>
            <ThemeToggle />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            아파트 실거래 분석
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            단지별 거래 추이 · 평형별 환금성 · 국토교통부 실거래가 데이터
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">

        {/* STEP 1: 서울 / 경기 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">지역</p>
          <div className="flex gap-2">
            {(["서울", "경기"] as const).map(r => (
              <button key={r} onClick={() => setRegion(r)}
                className={`px-5 py-2 rounded-xl font-medium text-sm transition-all ${
                  region === r
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: 구/시군 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {region === "서울" ? "구" : "시군구"}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {districts.map(d => (
              <button key={d.code} onClick={() => setSelectedDistrict(d)}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium transition-all text-center leading-tight ${
                  selectedDistrict?.code === d.code
                    ? "bg-blue-500 text-white"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600"
                }`}>
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 3: 단지 검색 */}
        {selectedDistrict && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">단지</p>
            {aptListLoading ? (
              <div className="text-sm text-gray-400 text-center py-6 animate-pulse">단지 목록 불러오는 중…</div>
            ) : aptList.length === 0 ? (
              <div className="text-sm text-red-400 text-center py-6">
                단지 목록을 불러오지 못했습니다.<br/>
                <span className="text-xs text-gray-400">API 키 설정을 확인해 주세요.</span>
              </div>
            ) : (
              <div className="relative" ref={searchRef}>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-400">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder={`${selectedDistrict.name} 단지명 검색 (${aptList.length}개)`}
                    value={aptSearch}
                    onChange={e => { setAptSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                  />
                  {aptSearch && (
                    <button onClick={() => { setAptSearch(""); setSelectedApt(null); setShowDropdown(false); }}>
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {showDropdown && filteredApts.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {filteredApts.map(apt => (
                      <button key={apt.kaptCode}
                        onClick={() => { setSelectedApt(apt); setAptSearch(apt.kaptName); setShowDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedApt?.kaptCode === apt.kaptCode
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}>
                        {apt.kaptName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: 평형 선택 */}
        {selectedApt && !dataLoading && availableAreas.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">전용면적</p>
            <div className="flex flex-wrap gap-2">
              {availableAreas.map(area => (
                <button key={area} onClick={() => setSelectedArea(area)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedArea === area
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  }`}>
                  {area}㎡
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 */}
        {dataLoading && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-14 text-center shadow-sm">
            <div className="text-sm text-gray-400 animate-pulse">실거래 데이터 불러오는 중…</div>
          </div>
        )}

        {/* ─── 결과 ─── */}
        {!dataLoading && selectedApt && chartData.length > 0 && (
          <>
            {/* 단지 기본 정보 */}
            {aptInfo?.kaptName && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{aptInfo.kaptName}</h2>
                    {aptInfo.doroJuso && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{aptInfo.doroJuso}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-400 shrink-0 space-y-1">
                    {aptInfo.kaptdaCnt && (
                      <div className="font-medium text-gray-600 dark:text-gray-300">
                        총 {Number(aptInfo.kaptdaCnt).toLocaleString()}세대
                      </div>
                    )}
                    {aptInfo.kaptUsedate && <div>준공 {fmtUsedate(aptInfo.kaptUsedate)}</div>}
                    {aptInfo.kaptBcompany && <div>{aptInfo.kaptBcompany}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* 통계 카드 4개 */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="최근 12개월 거래"
                  value={`${stats.total}건`}
                  sub={`월평균 ${stats.avgMonthly}건`}
                  icon={<Activity className="w-4 h-4 text-blue-500" />}
                />
                <StatCard
                  label="동일평형 세대수"
                  value={stats.unitCount ? `${stats.unitCount.toLocaleString()}세대` : "-"}
                  sub={
                    stats.unitCountType === "area" ? getAreaBucketLabel(selectedArea ?? "")
                    : stats.unitCountType === "total" ? "전체 단지 기준"
                    : "세대수 정보 없음"
                  }
                  icon={<Users className="w-4 h-4 text-purple-500" />}
                />
                <StatCard
                  label="환금성"
                  value={stats.liquidity != null ? `${getLiquidityGradeLetter(stats.liquidity)}등급` : "-"}
                  sub={stats.liquidity != null ? `${stats.liquidity}% 월평균 거래율` : "월평균 거래 ÷ 세대수"}
                  icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                  highlight={stats.liquidity != null}
                />
                <StatCard
                  label="최근 3개월 평균가"
                  value={stats.latestAvg != null ? `${fmtEok(stats.latestAvg)}` : "-"}
                  sub={`24개월 최고 ${fmtEok(stats.maxPrice)} · 최저 ${fmtEok(stats.minPrice)}`}
                  icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
                />
              </div>
            )}

            {/* 통합 차트: 매매가(꺾은선) + 전세가(꺾은선) + 거래건수(막대) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  실거래가 추이 {selectedArea && <span className="text-blue-500">· {selectedArea}㎡</span>}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="inline-block w-6 h-0.5 bg-blue-500 rounded" />매매</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-6 h-0.5 bg-amber-400 rounded" />전세</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900" />건수</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis yAxisId="price" tick={{ fontSize: 10 }} unit="억" />
                  <YAxis yAxisId="count" hide />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value, name) => {
                      if (name === "거래건수") return [`${value}건`, "매매 거래건수"];
                      if (name === "매매평균가") return [`${value}억`, "매매 평균가"];
                      if (name === "전세평균가") return [`${value}억`, "전세 평균가"];
                      return [value, name];
                    }}
                  />
                  <Bar yAxisId="count" dataKey="거래건수" fill="#bfdbfe" radius={[2, 2, 0, 0]} maxBarSize={28} opacity={0.8} />
                  <Line yAxisId="price" type="monotone" dataKey="매매평균가" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
                  <Line yAxisId="price" type="monotone" dataKey="전세평균가" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 거래 내역 표 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {/* 탭 */}
              <div className="flex border-b border-gray-100 dark:border-gray-800">
                {(["매매", "전세"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTableType(t)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      tableType === t
                        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    {t} 실거래가
                    <span className="ml-1.5 text-xs text-gray-400">
                      ({tableType === t ? tableRows.length : (t === "매매"
                        ? tradeHistory.flatMap(h => selectedArea ? h.items.filter(i => Math.floor(parseFloat(i.excluUseAr||"0")).toString()===selectedArea) : h.items).length
                        : jeonseHistory.flatMap(h => selectedArea ? h.items.filter(i => Math.floor(parseFloat(i.excluUseAr||"0")).toString()===selectedArea) : h.items).length
                      )}건)
                    </span>
                  </button>
                ))}
              </div>

              {/* 테이블 헤더 */}
              <div className="grid grid-cols-6 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400 font-medium">
                <span>년월</span>
                <span className="text-center">일</span>
                <span className="text-right">가격</span>
                <span className="text-center">면적</span>
                <span className="text-center">동</span>
                <span className="text-center">층</span>
              </div>

              {/* 테이블 바디 */}
              {tableRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">거래 내역이 없습니다.</div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-96 overflow-y-auto">
                  {tableRows.map((row, i) => (
                    <div key={i} className="grid grid-cols-6 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <span className="text-gray-500 dark:text-gray-400">{row.년월}</span>
                      <span className="text-center text-gray-400">{row.일}</span>
                      <span className="text-right font-semibold text-gray-900 dark:text-white">{row.가격}</span>
                      <span className="text-center text-gray-500 dark:text-gray-400">{row.전용면적}</span>
                      <span className="text-center text-gray-400">{row.동}</span>
                      <span className="text-center text-gray-400">{row.층수}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 환금성 안내 */}
            {stats?.liquidity != null &&
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 text-sm text-emerald-700 dark:text-emerald-400">
                <strong>{selectedApt.kaptName}</strong> {selectedArea}㎡의 월평균 환금성은{" "}
                <strong>{stats.liquidity}%</strong>예요.{" "}
                {getLiquidityGrade(stats.liquidity)}
              </div>
            }

            {/* 공유 버튼 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-3">공유하기</p>
              <ShareButton
                title={`${selectedApt.kaptName} 실거래 분석 | 똑집`}
                description={`${selectedApt.kaptName}의 최근 24개월 실거래 추이와 환금성을 확인해보세요.`}
                params={{}}
              />
            </div>
          </>
        )}

        {/* 빈 상태 */}
        {!selectedDistrict && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
            <Building2 className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400">지역과 단지를 선택하면 실거래 분석이 시작돼요</p>
          </div>
        )}
      </div>
    </main>
  );
}
