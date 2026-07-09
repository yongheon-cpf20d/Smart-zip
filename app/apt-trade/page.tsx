"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Search, Building2, TrendingUp, Users, Activity, X } from "lucide-react";

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
  아파트: string; 거래금액: string;
  년: number | string; 월: number | string; 일: number | string;
  전용면적: string; 층: string;
}
interface MonthData { ym: string; items: TradeRaw[]; }
interface AptInfo {
  kaptName?: string; doroJuso?: string;
  kaptTotCnt?: number | string;
  privArea?: string;
  kaptBcompany?: string; kaptUsedate?: string;
}

// ─── 헬퍼 ─────────────────────────────────────────────────────
function fmtEok(억: number | null | undefined): string {
  if (억 == null) return "-";
  if (억 >= 10) return `${억}억`;
  return `${억}억`;
}

/** privArea 문자열에서 targetArea(㎡) 근처 세대수 파싱 */
function parsePrivArea(privArea: string | undefined, targetArea: number): number | null {
  if (!privArea) return null;
  const lines = privArea.split(/[\n,;·]+/).map(s => s.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/(\d+\.?\d*)\s*[㎡A]?\s*[\/\s]+\s*(\d+)/);
    if (m) {
      const area = parseFloat(m[1]);
      const cnt = parseInt(m[2]);
      if (Math.abs(area - targetArea) <= 3) return cnt;
    }
  }
  return null;
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
  const [dataLoading, setDataLoading] = useState(false);
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
      .then(d => setAptList(Array.isArray(d) ? d : []))
      .catch(() => setAptList([]))
      .finally(() => setAptListLoading(false));
  }, [selectedDistrict]);

  // 단지 선택 → 정보 + 거래 이력 로드
  useEffect(() => {
    if (!selectedApt || !selectedDistrict) return;
    setDataLoading(true);
    setAptInfo(null); setTradeHistory([]); setSelectedArea("");

    Promise.all([
      fetch(`/api/apt-info?kaptCode=${selectedApt.kaptCode}`).then(r => r.json()),
      fetch(`/api/apt-trade-history?sigunguCode=${selectedDistrict.code}&aptName=${encodeURIComponent(selectedApt.kaptName)}&months=24`).then(r => r.json()),
    ])
      .then(([info, history]: [AptInfo, MonthData[]]) => {
        setAptInfo(info);
        setTradeHistory(history);
        // 거래 많은 평형 자동 선택
        const counts: Record<string, number> = {};
        history.flatMap(h => h.items).forEach(item => {
          const k = Math.floor(parseFloat(item.전용면적 || "0")).toString();
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
        .map(item => Math.floor(parseFloat(item.전용면적 || "0")).toString())
        .filter(a => a !== "0")
    );
    return Array.from(s).sort((a, b) => parseInt(a) - parseInt(b));
  }, [tradeHistory]);

  // 차트 데이터
  const chartData = useMemo(() =>
    tradeHistory.map(({ ym, items }) => {
      const filtered = selectedArea
        ? items.filter(item => Math.floor(parseFloat(item.전용면적 || "0")).toString() === selectedArea)
        : items;
      const prices = filtered
        .map(item => parseInt(item.거래금액?.replace(/,/g, "") || "0"))
        .filter(v => v > 0);
      const count = filtered.length;
      return {
        month: `${ym.slice(0, 4)}.${ym.slice(4)}`,
        거래건수: count,
        평균가: count > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / count / 10000) : null,
        최고가: count > 0 ? Math.round(Math.max(...prices) / 10000) : null,
        최저가: count > 0 ? Math.round(Math.min(...prices) / 10000) : null,
      };
    }),
  [tradeHistory, selectedArea]);

  // 통계
  const stats = useMemo(() => {
    const active = chartData.filter(d => d.거래건수 > 0);
    if (!active.length) return null;
    const total = active.reduce((s, d) => s + d.거래건수, 0);
    const avgMonthly = total / active.length;
    const maxPrice = Math.max(...active.map(d => d.최고가 ?? 0));
    const minPrice = Math.min(...active.filter(d => d.최저가 != null).map(d => d.최저가!));
    const latestAvg = [...active].reverse()[0]?.평균가 ?? null;

    let unitCount: number | null = null;
    if (aptInfo) {
      const target = selectedArea ? parseInt(selectedArea) : null;
      if (target && aptInfo.privArea) unitCount = parsePrivArea(aptInfo.privArea, target);
      if (!unitCount && aptInfo.kaptTotCnt)
        unitCount = typeof aptInfo.kaptTotCnt === "string" ? parseInt(aptInfo.kaptTotCnt) : aptInfo.kaptTotCnt;
    }
    const liquidity = unitCount && avgMonthly > 0
      ? parseFloat(((avgMonthly / unitCount) * 100).toFixed(2))
      : null;

    return {
      total, avgMonthly: parseFloat(avgMonthly.toFixed(1)),
      maxPrice, minPrice, latestAvg, unitCount, liquidity,
    };
  }, [chartData, aptInfo, selectedArea]);

  const districts = region === "서울" ? SEOUL_DISTRICTS : GYEONGGI_DISTRICTS;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-6">
        <div className="max-w-4xl mx-auto">
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
                  <div className="text-right text-xs text-gray-400 shrink-0 space-y-0.5">
                    {aptInfo.kaptUsedate && <div>준공 {aptInfo.kaptUsedate}</div>}
                    {aptInfo.kaptBcompany && <div>{aptInfo.kaptBcompany}</div>}
                    {aptInfo.kaptTotCnt && <div>총 {Number(aptInfo.kaptTotCnt).toLocaleString()}세대</div>}
                  </div>
                </div>
              </div>
            )}

            {/* 통계 카드 4개 */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="24개월 총 거래"
                  value={`${stats.total}건`}
                  sub={`월평균 ${stats.avgMonthly}건`}
                  icon={<Activity className="w-4 h-4 text-blue-500" />}
                />
                <StatCard
                  label="동일평형 세대수"
                  value={stats.unitCount ? `${stats.unitCount.toLocaleString()}세대` : "-"}
                  sub={selectedArea ? `전용 ${selectedArea}㎡` : "전체"}
                  icon={<Users className="w-4 h-4 text-purple-500" />}
                />
                <StatCard
                  label="환금성"
                  value={stats.liquidity != null ? `${stats.liquidity}%` : "-"}
                  sub="월평균 거래 ÷ 세대수"
                  icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                  highlight={stats.liquidity != null}
                />
                <StatCard
                  label="최근 평균가"
                  value={stats.latestAvg != null ? `${fmtEok(stats.latestAvg)}` : "-"}
                  sub={`최고 ${fmtEok(stats.maxPrice)} · 최저 ${fmtEok(stats.minPrice)}`}
                  icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
                />
              </div>
            )}

            {/* 월별 거래건수 차트 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                월별 거래건수 {selectedArea && <span className="text-blue-500">· {selectedArea}㎡</span>}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [`${v ?? 0}건`, "거래건수"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="거래건수" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 가격 추이 차트 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                가격 추이 (억원) {selectedArea && <span className="text-blue-500">· {selectedArea}㎡</span>}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} unit="억" />
                  <Tooltip
                    formatter={(v, name) => [`${v ?? 0}억`, name]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="최고가" stroke="#ef4444" strokeWidth={1.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="평균가" stroke="#3b82f6" strokeWidth={2}   dot={false} connectNulls />
                  <Line type="monotone" dataKey="최저가" stroke="#10b981" strokeWidth={1.5} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 환금성 안내 */}
            {stats?.liquidity != null && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 text-sm text-emerald-700 dark:text-emerald-400">
                <strong>{selectedApt.kaptName}</strong> {selectedArea}㎡의 월평균 환금성은{" "}
                <strong>{stats.liquidity}%</strong>예요.{" "}
                {stats.liquidity >= 2
                  ? "거래가 활발해 매도 시 유리한 편이에요."
                  : stats.liquidity >= 0.5
                  ? "일반적인 수준의 환금성이에요."
                  : "거래가 드물어 매도 시 시간이 걸릴 수 있어요."}
              </div>
            )}
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
