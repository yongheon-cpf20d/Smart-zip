"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Scale, ChevronDown, ChevronUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import ShareButton from "@/components/ShareButton";

// ✅ 출처: 지방세법 제11조(취득세), 공인중개사법 시행규칙 별표1(중개보수),
//    지방세법 제110조~제112조(재산세), 소득세법 제95조·제104조(양도세)
// 2026.07 기준. 실제 세액은 개인 상황에 따라 다를 수 있습니다.

// ── 헬퍼 ─────────────────────────────────────────────────────
function fmtWon(won: number): string {
  const sign = won < 0 ? "-" : "";
  const abs = Math.abs(won);
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`;
  return `${sign}${abs.toLocaleString()}원`;
}

function fmtWonSigned(won: number): string {
  if (won > 0) return `+${fmtWon(won)}`;
  return fmtWon(won);
}

// 취득세 (1주택 기준, 원 단위)
function calcAcqTax(w: number): number {
  if (w <= 60_000_000) return Math.round(w * 0.011);
  if (w <= 90_000_000) {
    const r = 0.011 + ((w - 60_000_000) / 30_000_000) * (0.03 - 0.011);
    return Math.round(w * r);
  }
  return Math.round(w * 0.03); // 9억 초과 3%
}

// 중개보수 (원 단위)
function calcBrokerage(w: number): number {
  let rate: number, maxFee: number;
  if (w < 50_000_000)        { rate = 0.006; maxFee = 250_000; }
  else if (w < 200_000_000)  { rate = 0.005; maxFee = 800_000; }
  else if (w < 900_000_000)  { rate = 0.004; maxFee = 5_000_000; }
  else if (w < 1_200_000_000){ rate = 0.005; maxFee = 6_000_000; }
  else                        { rate = 0.006; maxFee = 9_000_000; }
  return Math.min(Math.round(w * rate), maxFee);
}

// 재산세 (연간, 원 단위) — 지방교육세 포함
function calcPropertyTax(w: number): number {
  const base = w * 0.6 * 0.6; // 공시가율 60% × 공정시장가액비율 60%
  let tax: number;
  if (base <= 60_000_000)        tax = base * 0.001;
  else if (base <= 150_000_000)  tax = 60_000 + (base - 60_000_000) * 0.0015;
  else if (base <= 300_000_000)  tax = 195_000 + (base - 150_000_000) * 0.0025;
  else                           tax = 570_000 + (base - 300_000_000) * 0.004;
  return Math.round(tax * 1.2); // 지방교육세·도시지역분 합산
}

// 양도세 (원 단위)
function calcCapitalGainTax(buyW: number, sellW: number, oneHouse: boolean, years: number): number {
  const gain = sellW - buyW;
  if (gain <= 0) return 0;

  if (oneHouse && sellW <= 1_200_000_000) return 0; // 12억 이하 1주택 비과세

  let taxable = gain;
  if (oneHouse && sellW > 1_200_000_000) {
    const overRatio = (sellW - 1_200_000_000) / sellW;
    taxable = gain * overRatio;
    const ltdc = Math.min(years * 0.04, 0.8); // 장기보유특별공제 (2년거주 가정)
    taxable *= (1 - ltdc);
  }
  // 다주택: 장특공 미적용, 기본세율 (2026 중과 한시 완화 중)
  const income = Math.max(taxable - 2_500_000, 0);
  if (income <= 14_000_000)   return Math.round(income * 0.06);
  if (income <= 50_000_000)   return Math.round(840_000   + (income - 14_000_000) * 0.15);
  if (income <= 88_000_000)   return Math.round(6_240_000 + (income - 50_000_000) * 0.24);
  if (income <= 150_000_000)  return Math.round(15_360_000 + (income - 88_000_000) * 0.35);
  if (income <= 300_000_000)  return Math.round(37_060_000 + (income - 150_000_000) * 0.38);
  if (income <= 500_000_000)  return Math.round(94_060_000 + (income - 300_000_000) * 0.40);
  if (income <= 1_000_000_000)return Math.round(174_060_000 + (income - 500_000_000) * 0.42);
  return Math.round(384_060_000 + (income - 1_000_000_000) * 0.45);
}

type YearRow = {
  year: number;
  sellPrice: number;
  appreciation: number;
  acqTax: number;
  buyBroker: number;
  annualInterest: number;
  annualPropTax: number;
  capitalGainTax: number;
  sellBroker: number;
  buyCumCost: number;   // 매매 누적 순비용 (비용합 - 집값상승)
  rentCumCost: number;  // 전세 누적 기회비용
  diff: number;         // rentCumCost - buyCumCost (양수=매매유리)
};

export default function ComparePage() {
  const searchParams = useSearchParams();

  const [buyPrice, setBuyPrice]   = useState("60000");
  const [loanAmt, setLoanAmt]     = useState("30000");
  const [loanRate, setLoanRate]   = useState("4.0");
  const [jeonseAmt, setJeonseAmt] = useState("45000");
  const [oppRate, setOppRate]     = useState("3.5");
  const [growthRate, setGrowthRate] = useState("2.0");
  const [holdYears, setHoldYears] = useState(5);
  const [oneHouse, setOneHouse]   = useState(true);
  const [showTable, setShowTable] = useState(false);

  // URL 파라미터로 공유된 상태 복원
  useEffect(() => {
    const p = (k: string) => searchParams.get(k);
    if (p("buyPrice"))   setBuyPrice(p("buyPrice")!);
    if (p("loanAmt"))    setLoanAmt(p("loanAmt")!);
    if (p("loanRate"))   setLoanRate(p("loanRate")!);
    if (p("jeonseAmt"))  setJeonseAmt(p("jeonseAmt")!);
    if (p("oppRate"))    setOppRate(p("oppRate")!);
    if (p("growthRate")) setGrowthRate(p("growthRate")!);
    if (p("holdYears"))  setHoldYears(Number(p("holdYears")));
    if (p("oneHouse"))   setOneHouse(p("oneHouse") === "true");
  }, [searchParams]);

  const p = (s: string) => parseFloat(s) || 0;

  const calc = useMemo(() => {
    const buyW    = p(buyPrice) * 10_000;
    const loanW   = p(loanAmt) * 10_000;
    const jeonseW = p(jeonseAmt) * 10_000;
    const loan    = p(loanRate) / 100;
    const opp     = p(oppRate) / 100;
    const growth  = p(growthRate) / 100;

    if (buyW <= 0 || jeonseW <= 0) return null;

    const acqTax       = calcAcqTax(buyW);
    const buyBroker    = calcBrokerage(buyW);
    const annualInt    = loanW * loan;
    const annualProp   = calcPropertyTax(buyW);
    const annualRent   = jeonseW * opp;

    let breakevenYear: number | null = null;
    const rows: YearRow[] = [];

    for (let y = 1; y <= 20; y++) {
      const sellW = Math.round(buyW * Math.pow(1 + growth, y));
      const appreciation = sellW - buyW;
      const capTax   = calcCapitalGainTax(buyW, sellW, oneHouse, y);
      const sellBkr  = calcBrokerage(sellW);

      // 매매 순비용 = 초기 + 보유 + 매도 - 상승차익
      const buyCost = acqTax + buyBroker
        + annualInt * y + annualProp * y
        + capTax + sellBkr
        - appreciation;

      const rentCost = annualRent * y;
      const diff = rentCost - buyCost;

      if (breakevenYear === null && diff > 0) breakevenYear = y;

      rows.push({
        year: y,
        sellPrice: sellW,
        appreciation,
        acqTax,
        buyBroker,
        annualInterest: annualInt,
        annualPropTax: annualProp,
        capitalGainTax: capTax,
        sellBroker: sellBkr,
        buyCumCost: buyCost,
        rentCumCost: rentCost,
        diff,
      });
    }

    return {
      acqTax, buyBroker,
      annualInt, annualProp, annualRent,
      rows, breakevenYear,
      selected: rows[holdYears - 1],
    };
  }, [buyPrice, loanAmt, loanRate, jeonseAmt, oppRate, growthRate, holdYears, oneHouse]);

  const sel = calc?.selected;

  const inputClass =
    "w-full rounded-lg border border-slate-200 dark:border-slate-600 " +
    "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 " +
    "text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400";

  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-5">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
            ← 메인으로
          </Link>
          <ThemeToggle />
        </div>

        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
            <Scale size={20} strokeWidth={1.75} className="text-emerald-600" />
            전세 vs 매매 비교
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            취득세·이자·재산세·양도세 반영 풀 시뮬레이션 · 2026.07 기준
          </p>
        </div>

        {/* ─── 입력 ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 매매 조건 */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">🏠 매매 조건</p>

            <div>
              <label className={labelClass}>매매가 (만원)</label>
              <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                className={inputClass} placeholder="60000" />
            </div>
            <div>
              <label className={labelClass}>대출금액 (만원)</label>
              <input type="number" value={loanAmt} onChange={e => setLoanAmt(e.target.value)}
                className={inputClass} placeholder="30000" />
            </div>
            <div>
              <label className={labelClass}>대출금리 (%)</label>
              <input type="number" step="0.1" value={loanRate} onChange={e => setLoanRate(e.target.value)}
                className={inputClass} placeholder="4.0" />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setOneHouse(!oneHouse)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  oneHouse ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  oneHouse ? "left-5" : "left-0.5"
                }`} />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                1세대 1주택 (양도세 비과세 적용)
              </span>
            </div>
          </div>

          {/* 전세·비교 조건 */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">🔑 전세·비교 조건</p>

            <div>
              <label className={labelClass}>전세가 (만원)</label>
              <input type="number" value={jeonseAmt} onChange={e => setJeonseAmt(e.target.value)}
                className={inputClass} placeholder="45000" />
            </div>
            <div>
              <label className={labelClass}>전세금 운용 기대수익률 (%)</label>
              <input type="number" step="0.1" value={oppRate} onChange={e => setOppRate(e.target.value)}
                className={inputClass} placeholder="3.5" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                전세금을 예금·투자에 넣었을 때 기대수익률입니다.<br />
                예금 수준이면 3~4%, 주식 등 투자 시 5~7% 입력하세요.
              </p>
            </div>
            <div>
              <label className={labelClass}>
                연간 집값 상승률 (%)
                <span className="ml-1 font-normal text-slate-400">매매 자산 가치 증가 기대값</span>
              </label>
              <input type="number" step="0.1" value={growthRate} onChange={e => setGrowthRate(e.target.value)}
                className={inputClass} placeholder="2.0" />
            </div>
          </div>
        </div>

        {/* 보유 기간 슬라이더 */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300">보유·거주 기간</label>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{holdYears}년</span>
          </div>
          <input
            type="range" min={1} max={20} value={holdYears}
            onChange={e => setHoldYears(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            <span>1년</span><span>5년</span><span>10년</span><span>15년</span><span>20년</span>
          </div>
        </div>

        {/* ─── 결과 ─── */}
        {sel && calc && (
          <>
            {/* 메인 결론 */}
            <div className={`rounded-2xl p-5 border ${
              sel.diff > 0
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
            }`}>
              <p className={`text-xs font-bold mb-1 ${
                sel.diff > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400"
              }`}>
                {holdYears}년 보유 기준 분석 결과
              </p>
              <p className={`text-xl font-bold ${
                sel.diff > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"
              }`}>
                {sel.diff > 0
                  ? `매매가 ${fmtWon(Math.abs(sel.diff))} 유리`
                  : `전세가 ${fmtWon(Math.abs(sel.diff))} 유리`}
              </p>
              <p className={`text-xs mt-1 ${
                sel.diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
              }`}>
                {sel.diff > 0
                  ? `매도 후 순비용 ${fmtWon(sel.buyCumCost)} vs 전세 기회비용 ${fmtWon(sel.rentCumCost)}`
                  : `전세 기회비용 ${fmtWon(sel.rentCumCost)} vs 매매 순비용 ${fmtWon(sel.buyCumCost)}`}
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800/50">
                <ShareButton
                  title={`전세 vs 매매 비교 결과 (${holdYears}년 기준) - 똑집`}
                  description={
                    sel.diff > 0
                      ? `매매가 ${fmtWon(Math.abs(sel.diff))} 유리 · 매매가 ${fmtWon(p(buyPrice) * 10_000)} / 전세 ${fmtWon(p(jeonseAmt) * 10_000)}`
                      : `전세가 ${fmtWon(Math.abs(sel.diff))} 유리 · 매매가 ${fmtWon(p(buyPrice) * 10_000)} / 전세 ${fmtWon(p(jeonseAmt) * 10_000)}`
                  }
                  params={{
                    buyPrice,
                    loanAmt,
                    loanRate,
                    jeonseAmt,
                    oppRate,
                    growthRate,
                    holdYears: String(holdYears),
                    oneHouse: String(oneHouse),
                  }}
                />
              </div>
            </div>

            {/* 비용 상세 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* 매매 비용 상세 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">🏠 매매 비용 상세</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">취득세</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{fmtWon(calc.acqTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">매수 중개보수</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{fmtWon(calc.buyBroker)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">대출이자 ({holdYears}년)</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{fmtWon(calc.annualInt * holdYears)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">재산세 ({holdYears}년)</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{fmtWon(calc.annualProp * holdYears)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">양도세</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{fmtWon(sel.capitalGainTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">매도 중개보수</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{fmtWon(sel.sellBroker)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-600 pt-2">
                    <span className="text-slate-500 dark:text-slate-400">집값 상승 차익</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtWon(-sel.appreciation)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">순 비용 합계</span>
                    <span className={`font-bold ${
                      sel.buyCumCost < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {sel.buyCumCost < 0
                        ? `🟢 순이익 ${fmtWon(-sel.buyCumCost)} (차익이 비용 초과)`
                        : fmtWon(sel.buyCumCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 전세 비용 상세 */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">🔑 전세 기회비용 상세</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">전세 보증금</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{fmtWon(p(jeonseAmt) * 10_000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">기회비용률</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{oppRate}% / 년</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">연간 기회비용</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{fmtWon(calc.annualRent)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-600 pt-2">
                    <span className="text-slate-500 dark:text-slate-400">기간({holdYears}년) 누적</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{fmtWon(sel.rentCumCost)}</span>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      💡 전세금은 나중에 돌려받지만, 그 기간 동안 예금·투자에 굴리지 못한 손실이 생깁니다.
                      예) 전세금 4.5억 × 3.5% = 연 <strong>1,575만원</strong>을 못 버는 셈 — 이게 전세의 실질 주거비용입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 손익분기 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">📈 손익분기 분석</p>
              {calc.breakevenYear ? (
                <div className="flex items-start gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{calc.breakevenYear}년</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">매매 유리해지는 시점</p>
                  </div>
                  <div className="flex-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    {calc.breakevenYear}년 이상 보유하면 집값 상승 효과가 초기 비용(취득세·이자 등)을 초과해 매매가 전세보다 유리해집니다.
                    {holdYears >= calc.breakevenYear
                      ? ` 현재 설정(${holdYears}년)은 손익분기를 넘어 매매 유리 구간입니다.`
                      : ` 현재 설정(${holdYears}년)은 아직 전세가 유리한 구간입니다.`}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  현재 조건에서는 20년 이내에 손익분기가 발생하지 않습니다. 집값 상승률을 높이거나 대출금리를 낮춰보세요.
                </p>
              )}
            </div>

            {/* 연도별 테이블 (토글) */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowTable(!showTable)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">📊 연도별 시뮬레이션 (20년)</span>
                {showTable
                  ? <ChevronUp size={16} className="text-slate-400" />
                  : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {showTable && (
                <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700">
                        <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400 font-semibold">년차</th>
                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400 font-semibold">예상 매도가</th>
                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400 font-semibold">매매 순비용</th>
                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400 font-semibold">전세 기회비용</th>
                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400 font-semibold">차이</th>
                        <th className="px-3 py-2 text-center text-slate-500 dark:text-slate-400 font-semibold">유리한 쪽</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.rows.map((r) => {
                        const isSelected = r.year === holdYears;
                        const isBuy = r.diff > 0;
                        return (
                          <tr
                            key={r.year}
                            className={`border-t border-slate-100 dark:border-slate-700 ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                : "hover:bg-slate-50 dark:hover:bg-slate-750"
                            }`}
                          >
                            <td className={`px-3 py-2 font-semibold ${
                              isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"
                            }`}>
                              {r.year}년{isSelected ? " ◀" : ""}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">
                              {fmtWon(r.sellPrice)}
                            </td>
                            <td className={`px-3 py-2 text-right font-semibold ${
                              r.buyCumCost < 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-500 dark:text-red-400"
                            }`}>
                              {r.buyCumCost < 0 ? `순이익 ${fmtWon(-r.buyCumCost)}` : fmtWon(r.buyCumCost)}
                            </td>
                            <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400 font-semibold">
                              {fmtWon(r.rentCumCost)}
                            </td>
                            <td className={`px-3 py-2 text-right font-semibold ${
                              isBuy ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                            }`}>
                              {fmtWon(Math.abs(r.diff))}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isBuy
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              }`}>
                                {isBuy ? "매매" : "전세"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* 주의사항 */}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 leading-relaxed border-t border-slate-100 dark:border-slate-700">
          ※ 재산세는 시가 기준 간략 산정이며, 취득세는 1주택·일반과세 기준입니다. 양도세는 2년 거주 요건 충족 가정 시 기준이며
          실제와 차이가 있을 수 있습니다. 종합부동산세·전세대출이자 등은 포함되지 않습니다.
          대출이자는 이자만 납부하는 방식(만기일시상환)으로 가정합니다.
          본 계산기는 참고용이며 실제 투자·거주 결정 전 세무사·금융전문가와 상담하시기 바랍니다.
        </p>

      </div>
    </div>
  );
}
