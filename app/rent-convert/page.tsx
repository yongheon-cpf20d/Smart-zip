"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import ShareButton from "@/components/ShareButton";

// ✅ 법정 전월세전환율: 기준금리 + 2%p (주택임대차보호법 제7조의2)
// 2026.07 기준 한국은행 기준금리 2.75% → 법정 상한 4.75%
// 시장 관행상 실제 전환 협의는 5~6%대 많음 → 기본값 5.5%

type Mode = "to-monthly" | "to-jeonse";

const fmtResult = (won: number): string => {
  if (won <= 0) return "-";
  const uk = Math.floor(won / 100_000_000);
  const man = Math.round((won % 100_000_000) / 10_000);
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${man.toLocaleString()}만원`;
};

const toWon = (manwon: string): number => {
  const n = parseFloat(manwon.replace(/,/g, ""));
  return isNaN(n) || n < 0 ? 0 : Math.round(n) * 10_000;
};

export default function RentConvertPage() {
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>("to-monthly");

  // 전세→월세 입력
  const [jeonseAmt, setJeonseAmt] = useState(""); // 만원 단위
  const [depositAmt, setDepositAmt] = useState(""); // 보증금 (만원)

  // 월세→전세 입력
  const [monthlyDeposit, setMonthlyDeposit] = useState(""); // 보증금 (만원)
  const [monthlyRent, setMonthlyRent] = useState("");       // 월세 (만원)

  // 전환율
  const [rate, setRate] = useState("5.5"); // %

  // URL 파라미터로 공유된 상태 복원
  useEffect(() => {
    const p = (k: string) => searchParams.get(k);
    if (p("mode")) setMode(p("mode") as Mode);
    if (p("jeonseAmt")) setJeonseAmt(p("jeonseAmt")!);
    if (p("depositAmt")) setDepositAmt(p("depositAmt")!);
    if (p("monthlyDeposit")) setMonthlyDeposit(p("monthlyDeposit")!);
    if (p("monthlyRent")) setMonthlyRent(p("monthlyRent")!);
    if (p("rate")) setRate(p("rate")!);
  }, [searchParams]);

  // ── 계산 ──────────────────────────────────────────────────
  const rateNum = parseFloat(rate) || 0;

  // 전세→월세: 월세 = (전세금 - 보증금) × 전환율 / 12
  const jeonse = toWon(jeonseAmt);
  const deposit = toWon(depositAmt);
  const diffAmt = jeonse - deposit;
  const calcMonthly = diffAmt > 0 && rateNum > 0
    ? Math.round((diffAmt * (rateNum / 100)) / 12 / 10_000) * 10_000
    : 0;

  // 월세→전세: 전세금 = 보증금 + 월세 × 12 / 전환율
  const mDeposit = toWon(monthlyDeposit);
  const mRent = toWon(monthlyRent);
  const calcJeonse = mRent > 0 && rateNum > 0
    ? mDeposit + Math.round((mRent * 12) / (rateNum / 100) / 10_000) * 10_000
    : 0;

  const isToMonthly = mode === "to-monthly";

  const hasResult = isToMonthly
    ? jeonse > 0 && rateNum > 0 && diffAmt > 0
    : mRent > 0 && rateNum > 0;

  const switchMode = useCallback(() => {
    setMode(prev => prev === "to-monthly" ? "to-jeonse" : "to-monthly");
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
            ← 메인으로
          </Link>
          <ThemeToggle />
        </div>

        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
            <ArrowLeftRight size={20} strokeWidth={1.75} className="text-emerald-600" />
            전월세 전환 계산기
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            전세 ↔ 월세 금액을 즉시 환산해 드립니다
          </p>
        </div>

        {/* 모드 전환 탭 */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode("to-monthly")}
            className={`flex-1 py-2.5 text-sm font-bold transition ${
              isToMonthly
                ? "bg-emerald-500 text-white"
                : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            전세 → 월세
          </button>
          <button
            onClick={() => setMode("to-jeonse")}
            className={`flex-1 py-2.5 text-sm font-bold transition ${
              !isToMonthly
                ? "bg-emerald-500 text-white"
                : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            월세 → 전세
          </button>
        </div>

        {/* 입력 카드 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">

          {isToMonthly ? (
            <>
              {/* 전세 → 월세 */}
              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">현재 전세금</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={jeonseAmt}
                    onChange={e => setJeonseAmt(e.target.value)}
                    placeholder="예) 30000"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">만원</span>
                </div>
                {jeonse > 0 && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-1">{fmtResult(jeonse)}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">
                  희망 보증금 <span className="text-slate-300 dark:text-slate-600">(월세 계약 시 남길 보증금)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={depositAmt}
                    onChange={e => setDepositAmt(e.target.value)}
                    placeholder="예) 5000"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">만원</span>
                </div>
                {deposit > 0 && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-1">{fmtResult(deposit)}</p>}
              </div>

              {/* 전환 대상 금액 미리보기 */}
              {jeonse > 0 && deposit >= 0 && diffAmt > 0 && (
                <div className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  전환 대상 금액 (전세금 − 보증금) = <span className="font-bold text-slate-600 dark:text-slate-300">{fmtResult(diffAmt)}</span>
                </div>
              )}
              {jeonse > 0 && deposit > jeonse && (
                <p className="text-[11px] text-rose-500">보증금이 전세금보다 클 수 없습니다.</p>
              )}
            </>
          ) : (
            <>
              {/* 월세 → 전세 */}
              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">현재 보증금</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={monthlyDeposit}
                    onChange={e => setMonthlyDeposit(e.target.value)}
                    placeholder="예) 5000"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">만원</span>
                </div>
                {mDeposit > 0 && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-1">{fmtResult(mDeposit)}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">월세</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(e.target.value)}
                    placeholder="예) 100"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">만원</span>
                </div>
              </div>
            </>
          )}

          {/* 전환율 */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400 dark:text-slate-500">전월세 전환율</label>
              <span className="text-[11px] text-slate-300 dark:text-slate-600">법정 상한 4.75% (2026.07)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="12"
                step="0.25"
                value={rateNum || 5.5}
                onChange={e => setRate(e.target.value)}
                className="flex-1 accent-emerald-500"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  step="0.25"
                  min="0.25"
                  max="20"
                  className="w-16 text-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">%</span>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-300 dark:text-slate-600 mt-0.5 px-0.5">
              <span>1%</span>
              <span>6%</span>
              <span>12%</span>
            </div>
          </div>
        </div>

        {/* 결과 박스 */}
        {hasResult && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 result-enter">
            {isToMonthly ? (
              <>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">환산 월세</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-300">
                  월 {fmtResult(calcMonthly)}
                </p>
                <p className="text-[11px] text-emerald-500 dark:text-emerald-400 mt-2">
                  보증금 {fmtResult(deposit)} + 월세 {Math.round(calcMonthly / 10_000).toLocaleString()}만원
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-800/60 text-[11px] text-emerald-600 dark:text-emerald-400 space-y-0.5">
                  <p>계산식: ({fmtResult(jeonse)} − {fmtResult(deposit)}) × {rateNum}% ÷ 12</p>
                  <p>= {fmtResult(diffAmt)} × {rateNum}% ÷ 12</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">환산 전세금</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-300">
                  {fmtResult(calcJeonse)}
                </p>
                {mDeposit > 0 && (
                  <p className="text-[11px] text-emerald-500 dark:text-emerald-400 mt-2">
                    보증금 {fmtResult(mDeposit)} + 전환분 {fmtResult(calcJeonse - mDeposit)}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-800/60 text-[11px] text-emerald-600 dark:text-emerald-400 space-y-0.5">
                  <p>계산식: {fmtResult(mDeposit)} + ({Math.round(mRent / 10_000).toLocaleString()}만 × 12 ÷ {rateNum}%)</p>
                </div>
              </>
            )}
            <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800/60">
              <ShareButton
                title="전월세 전환 계산 결과 - 똑집"
                description={
                  isToMonthly
                    ? `전세 ${fmtResult(jeonse)} → 월세 ${fmtResult(calcMonthly)} (전환율 ${rateNum}%)`
                    : `보증금 ${fmtResult(mDeposit)} + 월세 ${fmtResult(mRent)} → 전세 ${fmtResult(calcJeonse)}`
                }
                params={{
                  mode,
                  jeonseAmt,
                  depositAmt,
                  monthlyDeposit,
                  monthlyRent,
                  rate,
                }}
              />
            </div>
          </div>
        )}

        {/* 법정 전환율 안내 */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300">💡 전월세전환율이란?</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
            전세금을 월세로 전환할 때 적용하는 비율입니다.
            <strong> 주택임대차보호법 제7조의2</strong>에 따라 법정 상한이 정해져 있으며,
            <strong> 기준금리 + 2%p</strong>를 초과할 수 없습니다.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white/70 dark:bg-slate-800/60 rounded-lg px-3 py-2">
              <p className="text-blue-500 dark:text-blue-400 font-bold">법정 상한 (2026.07)</p>
              <p className="text-blue-700 dark:text-blue-300 font-black text-base">4.75%</p>
              <p className="text-blue-400 dark:text-blue-500">기준금리 2.75% + 2%</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/60 rounded-lg px-3 py-2">
              <p className="text-blue-500 dark:text-blue-400 font-bold">시장 관행</p>
              <p className="text-blue-700 dark:text-blue-300 font-black text-base">5~7%</p>
              <p className="text-blue-400 dark:text-blue-500">당사자 간 협의 가능</p>
            </div>
          </div>
          <p className="text-[10px] text-blue-400 dark:text-blue-500">
            ※ 법정 상한 초과 시 임차인은 초과분 반환 청구 가능 (주택임대차보호법 제7조의2)
          </p>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-700">
          본 계산기는 주택임대차보호법 제7조의2 및 同法 시행령 기준으로 산출됩니다.
          실제 전환 조건은 임대인·임차인 간 협의에 따라 달라질 수 있으며, 계산 결과는 참고용입니다.
        </p>

      </div>
    </div>
  );
}
