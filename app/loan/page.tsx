"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Landmark } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PriceInput from "@/components/PriceInput";
import ShareButton from "@/components/ShareButton";
import ThemeToggle from "@/components/ThemeToggle";

type RepaymentType = "equal-pi" | "equal-principal" | "graduated";

type YearlyData = {
  year: number;
  principal: number;
  interest: number;
};

type CalcResult = {
  firstMonthlyPayment: number;
  firstMonthlyPrincipal: number;
  firstMonthlyInterest: number;
  yearlyData: YearlyData[];
  lastMonthlyPayment?: number;
};

const REPAYMENT_OPTIONS: { key: RepaymentType; label: string }[] = [
  { key: "equal-pi", label: "원리금균등상환" },
  { key: "equal-principal", label: "원금균등상환" },
  { key: "graduated", label: "체증식상환" },
];

const QUICK_YEARS = [30, 40, 50];
const GRACE_OPTIONS = [0, 1, 2, 3];
const ESCALATION_OPTIONS = [2, 3, 5];

function LoanPageContent() {
  const searchParams = useSearchParams();
  const [repaymentType, setRepaymentType] = useState<RepaymentType>("equal-pi");
  const [loanAmountInput, setLoanAmountInput] = useState("");
  const [loanYears, setLoanYears] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [graceYears, setGraceYears] = useState(0);
  const [escalationRate, setEscalationRate] = useState(3);
  const [result, setResult] = useState<CalcResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [highlightRemaining, setHighlightRemaining] = useState(false);

  // ✅ 1. URL 쿼리 파라미터로 상태값(입력창) 채워주기
  useEffect(() => {
    const sharedAmount = searchParams.get("amount");
    const sharedRepaymentType = searchParams.get("repaymentType");
    const sharedYears = searchParams.get("years");
    const sharedRate = searchParams.get("rate");
    const sharedGrace = searchParams.get("grace");
    const sharedEscalation = searchParams.get("escalation");

    if (sharedAmount) {
      setLoanAmountInput(sharedAmount);
      if (!sharedYears || !sharedRate) setHighlightRemaining(true);
    }
    if (sharedRepaymentType) setRepaymentType(sharedRepaymentType as RepaymentType);
    if (sharedYears) setLoanYears(sharedYears);
    if (sharedRate) setInterestRate(sharedRate);
    if (sharedGrace) setGraceYears(Number(sharedGrace));
    if (sharedEscalation) setEscalationRate(Number(sharedEscalation));
  }, [searchParams]);

  // ✅ 2. 공유된 값이 다 채워져 있으면 다이렉트로 즉시 계산 (Stale State 버그 해결)
  useEffect(() => {
    const sharedAmount = searchParams.get("amount");
    const sharedYears = searchParams.get("years");
    const sharedRate = searchParams.get("rate");

    if (sharedAmount && sharedYears && sharedRate) {
      const t = setTimeout(() => {
        // 화면 상태(state)가 업데이트되는 걸 기다리지 않고, URL에서 뽑은 값을 계산기로 직행시킵니다.
        calculate({
          amount: sharedAmount,
          years: sharedYears,
          rate: sharedRate,
          repayType: (searchParams.get("repaymentType") as RepaymentType) || "equal-pi",
          grace: Number(searchParams.get("grace")) || 0,
          escalation: Number(searchParams.get("escalation")) || 3,
        });
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 3. 계산 함수 (URL에서 넘어온 overrideParams가 있으면 우선 적용, 없으면 화면 입력값 적용)
  const calculate = (overrideParams?: {
    amount: string;
    years: string;
    rate: string;
    repayType: RepaymentType;
    grace: number;
    escalation: number;
  }) => {
    const targetAmount = overrideParams ? overrideParams.amount : loanAmountInput;
    const targetYears = overrideParams ? overrideParams.years : loanYears;
    const targetRate = overrideParams ? overrideParams.rate : interestRate;
    const targetRepayType = overrideParams ? overrideParams.repayType : repaymentType;
    const targetGrace = overrideParams ? overrideParams.grace : graceYears;
    const targetEscalation = overrideParams ? overrideParams.escalation : escalationRate;

    const principalTotal = Number(targetAmount) * 10000;
    const years = Number(targetYears);
    const rate = Number(targetRate);

    // 이제 빈 값 경고가 잘못 뜨는 일이 없습니다!
    if (!principalTotal || !years || !rate) {
      alert("대출금액, 대출기간, 대출금리를 모두 입력해주세요.");
      return;
    }

    const months = years * 12;
    const monthlyRate = rate / 100 / 12;
    const graceMonths = Math.min(targetGrace * 12, months - 1);

    let firstMonthlyPayment = 0;
    let firstMonthlyPrincipal = 0;
    let firstMonthlyInterest = 0;
    let lastMonthlyPayment: number | undefined = undefined;
    const yearlyData: YearlyData[] = [];

    if (targetRepayType === "equal-pi") {
      const remainingMonths = months - graceMonths;
      const pmt =
        monthlyRate === 0
          ? principalTotal / remainingMonths
          : (principalTotal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
            (Math.pow(1 + monthlyRate, remainingMonths) - 1);

      let balance = principalTotal;
      for (let m = 1; m <= months; m++) {
        let interestPay = balance * monthlyRate;
        let principalPay = 0;
        let totalPay = 0;

        if (m <= graceMonths) {
          totalPay = interestPay;
        } else {
          totalPay = pmt;
          principalPay = totalPay - interestPay;
          balance -= principalPay;
        }

        if (m === 1) {
          firstMonthlyPayment = totalPay;
          firstMonthlyPrincipal = principalPay;
          firstMonthlyInterest = interestPay;
        }

        const yearIdx = Math.ceil(m / 12) - 1;
        if (!yearlyData[yearIdx]) {
          yearlyData[yearIdx] = { year: yearIdx + 1, principal: 0, interest: 0 };
        }
        yearlyData[yearIdx].principal += principalPay;
        yearlyData[yearIdx].interest += interestPay;
      }
    } else if (targetRepayType === "equal-principal") {
      const remainingMonths = months - graceMonths;
      const fixedPrincipal = principalTotal / remainingMonths;
      let balance = principalTotal;

      for (let m = 1; m <= months; m++) {
        const interestPay = balance * monthlyRate;
        let principalPay = 0;
        let totalPay = 0;

        if (m <= graceMonths) {
          totalPay = interestPay;
        } else {
          principalPay = fixedPrincipal;
          totalPay = fixedPrincipal + interestPay;
          balance -= fixedPrincipal;
        }

        if (m === 1) {
          firstMonthlyPayment = totalPay;
          firstMonthlyPrincipal = principalPay;
          firstMonthlyInterest = interestPay;
        }

        const yearIdx = Math.ceil(m / 12) - 1;
        if (!yearlyData[yearIdx]) {
          yearlyData[yearIdx] = { year: yearIdx + 1, principal: 0, interest: 0 };
        }
        yearlyData[yearIdx].principal += principalPay;
        yearlyData[yearIdx].interest += interestPay;
      }
    } else {
      const g = targetEscalation / 100;
      const totalYears = years;

      const yearMultiplier = (yr: number) => Math.pow(1 + g, yr - 1);

      const monthsInYear = (yr: number) => {
        const startMonth = (yr - 1) * 12 + 1;
        const endMonth = Math.min(yr * 12, months);
        return endMonth >= startMonth ? endMonth - startMonth + 1 : 0;
      };

      const presentValueOfPayments = (P0: number): number => {
        let pv = 0;
        for (let yr = 1; yr <= totalYears; yr++) {
          const nMonths = monthsInYear(yr);
          if (nMonths <= 0) break;
          const paymentThisYear = P0 * yearMultiplier(yr);
          for (let mm = 1; mm <= nMonths; mm++) {
            const globalMonth = (yr - 1) * 12 + mm;
            pv += paymentThisYear / Math.pow(1 + monthlyRate, globalMonth);
          }
        }
        return pv;
      };

      let lo = 1, hi = principalTotal;
      for (let iter = 0; iter < 60; iter++) {
        const mid = (lo + hi) / 2;
        const pv = presentValueOfPayments(mid);
        if (pv > principalTotal) hi = mid; else lo = mid;
      }
      const P0 = (lo + hi) / 2;

      let balance = principalTotal;
      for (let m = 1; m <= months; m++) {
        const yr = Math.ceil(m / 12);
        const totalPay = P0 * yearMultiplier(yr);
        const interestPay = balance * monthlyRate;
        let principalPay = totalPay - interestPay;
        if (m === months) principalPay = balance;
        balance -= principalPay;

        if (m === 1) {
          firstMonthlyPayment = totalPay;
          firstMonthlyPrincipal = principalPay;
          firstMonthlyInterest = interestPay;
        }
        if (m === months) {
          lastMonthlyPayment = principalPay + interestPay;
        }

        const yearIdx = yr - 1;
        if (!yearlyData[yearIdx]) {
          yearlyData[yearIdx] = { year: yearIdx + 1, principal: 0, interest: 0 };
        }
        yearlyData[yearIdx].principal += principalPay;
        yearlyData[yearIdx].interest += interestPay;
      }
    }

    setResult({
      firstMonthlyPayment,
      firstMonthlyPrincipal,
      firstMonthlyInterest,
      yearlyData,
      lastMonthlyPayment,
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const formatWon = (n: number) =>
    Math.round(n).toLocaleString("ko-KR") + "원";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <style jsx>{`
        @keyframes loanInputBreath {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press"
          >
            ← 메인으로
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
          <Landmark size={20} strokeWidth={1.75} className="text-emerald-600" />
          주택담보대출 계산기
        </h1>

        {/* 1. 상환방식 설정 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">상환방식</h2>
            <div className="grid grid-cols-3 gap-2">
              {REPAYMENT_OPTIONS.map((opt) => {
                const active = repaymentType === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setRepaymentType(opt.key)}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all btn-press ${
                      active
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(repaymentType === "equal-pi" || repaymentType === "equal-principal") && (
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">거치기간 (이 기간 동안은 이자만 납부)</label>
              <div className="flex gap-2">
                {GRACE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGraceYears(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      graceYears === g
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    {g === 0 ? "없음" : `${g}년`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {repaymentType === "graduated" && (
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">연간 원리금 증가율</label>
              <div className="flex gap-2">
                {ESCALATION_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEscalationRate(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      escalationRate === e
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    연 {e}%
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
                매년 원리금(원금+이자)이 선택한 비율만큼 늘어나는 방식입니다. 실제 상품의 정확한
                증가율은 취급 금융기관마다 다르므로, 본 계산은 참고용 모의 시뮬레이션입니다.
              </p>
            </div>
          )}
        </div>

        {/* 2. 대출정보 입력 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400">대출정보 입력</h2>

          {highlightRemaining && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300">
              총비용 계산기에서 대출한도가 자동으로 입력됐어요. 대출기간과 금리만 입력하면 월 원리금이 바로 계산돼요!
            </div>
          )}

          <PriceInput
            label="대출금액 (만원)"
            value={loanAmountInput}
            onChange={setLoanAmountInput}
            placeholder="예: 50000"
          />

          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출기간 (년)</label>
            <input
              type="number"
              value={loanYears}
              onChange={(e) => { setLoanYears(e.target.value); setHighlightRemaining(false); }}
              placeholder="예: 30"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 mb-2"
              style={highlightRemaining && !loanYears ? { animation: "loanInputBreath 1.4s ease-in-out infinite", borderColor: "#10b981" } : undefined}
            />
            <div className="flex gap-2">
              {QUICK_YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => { setLoanYears(String(y)); setHighlightRemaining(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    loanYears === String(y)
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출금리 (%, 연)</label>
            <input
              type="number"
              step="0.01"
              value={interestRate}
              onChange={(e) => { setInterestRate(e.target.value); setHighlightRemaining(false); }}
              placeholder="예: 4.2"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
              style={highlightRemaining && !interestRate ? { animation: "loanInputBreath 1.4s ease-in-out infinite", borderColor: "#10b981" } : undefined}
            />
          </div>

          <button
            onClick={() => calculate()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition btn-press"
          >
            계산하기
          </button>
        </div>

        {/* 3. 월 원리금 결과 */}
        {result && (
          <div ref={resultRef} className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center result-enter">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
              월 상환액 ({repaymentType === "graduated" ? "1년차 첫 회차" : "첫 회차"} 기준)
            </p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {formatWon(result.firstMonthlyPayment)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              원금 {formatWon(result.firstMonthlyPrincipal)} · 이자 {formatWon(result.firstMonthlyInterest)}
            </p>
            {result.lastMonthlyPayment !== undefined && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                만기 마지막 회차 원리금: {formatWon(result.lastMonthlyPayment)} (매년 {escalationRate}%씩 증가)
              </p>
            )}
            {loanAmountInput && loanYears && interestRate && (
              <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <Link
                  href={`/dsr?newAmount=${loanAmountInput}&newYears=${loanYears}&newRate=${interestRate}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition animate-pulse"
                >
                  내 소득으로 DSR 초과되지 않을까? →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 4. 시뮬레이션 그래프 및 공유 버튼 */}
        {result && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 result-enter">
            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">연차별 원금·이자 구성</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={result.yearlyData} barCategoryGap="20%">
                  <XAxis
                    dataKey="year"
                    tickFormatter={(y) => `${y}년`}
                    fontSize={11}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v / 10000).toLocaleString()}만`}
                    fontSize={11}
                    stroke="#94a3b8"
                  />
                  <Tooltip
                    formatter={(value) => formatWon(Number(value))}
                    labelFormatter={(y) => `${y}년차`}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "principal" ? "원금" : "이자"
                    }
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="principal" stackId="a" fill="#10b981" name="원금" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="interest" stackId="a" fill="#cbd5e1" name="이자" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
              <ShareButton
                title="주택담보대출 계산 결과 - 똑집"
                description={`대출금액 ${formatWon(Number(loanAmountInput) * 10000)}, 월 상환액 ${formatWon(result.firstMonthlyPayment)}`}
                params={{
                  repaymentType,
                  amount: loanAmountInput,
                  years: loanYears,
                  rate: interestRate,
                  grace: String(graceYears),
                  escalation: String(escalationRate),
                }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LoanPage() {
  return (
    <Suspense fallback={null}>
      <LoanPageContent />
    </Suspense>
  );
}
