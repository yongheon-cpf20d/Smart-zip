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
};

const REPAYMENT_OPTIONS: { key: RepaymentType; label: string }[] = [
  { key: "equal-pi", label: "원리금균등상환" },
  { key: "equal-principal", label: "원금균등상환" },
  { key: "graduated", label: "체증식상환" },
];

const QUICK_YEARS = [30, 40, 50];

function LoanPageContent() {
  const searchParams = useSearchParams();
  const [repaymentType, setRepaymentType] = useState<RepaymentType>("equal-pi");
  const [loanAmountInput, setLoanAmountInput] = useState("");
  const [loanYears, setLoanYears] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ✅ 총비용 계산기에서 "?amount=5000" (만원 단위) 형태로 넘어오면 자동 입력
  //    이 경우 남은 입력(금리·기간)을 채우도록 유도하는 강조 표시(highlightRemaining)를 켬
  const [highlightRemaining, setHighlightRemaining] = useState(false);
  useEffect(() => {
    const amountFromUrl = searchParams.get("amount");
    if (amountFromUrl) {
      setLoanAmountInput(amountFromUrl);
      setHighlightRemaining(true);
    }
  }, [searchParams]);

  const calculate = () => {
    const principalTotal = Number(loanAmountInput) * 10000;
    const years = Number(loanYears);
    const rate = Number(interestRate);

    if (!principalTotal || !years || !rate) {
      alert("대출금액, 대출기간, 대출금리를 모두 입력해주세요.");
      return;
    }

    const months = years * 12;
    const monthlyRate = rate / 100 / 12;

    let firstMonthlyPayment = 0;
    let firstMonthlyPrincipal = 0;
    let firstMonthlyInterest = 0;
    const yearlyData: YearlyData[] = [];

    if (repaymentType === "equal-pi") {
      const pmt =
        monthlyRate === 0
          ? principalTotal / months
          : (principalTotal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);

      let balance = principalTotal;
      for (let m = 1; m <= months; m++) {
        const interestPay = balance * monthlyRate;
        const principalPay = pmt - interestPay;
        balance -= principalPay;

        if (m === 1) {
          firstMonthlyPayment = pmt;
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
    } else if (repaymentType === "equal-principal") {
      const fixedPrincipal = principalTotal / months;
      let balance = principalTotal;

      for (let m = 1; m <= months; m++) {
        const interestPay = balance * monthlyRate;
        const totalPay = fixedPrincipal + interestPay;
        balance -= fixedPrincipal;

        if (m === 1) {
          firstMonthlyPayment = totalPay;
          firstMonthlyPrincipal = fixedPrincipal;
          firstMonthlyInterest = interestPay;
        }

        const yearIdx = Math.ceil(m / 12) - 1;
        if (!yearlyData[yearIdx]) {
          yearlyData[yearIdx] = { year: yearIdx + 1, principal: 0, interest: 0 };
        }
        yearlyData[yearIdx].principal += fixedPrincipal;
        yearlyData[yearIdx].interest += interestPay;
      }
    } else {
      const gracePeriodMonths = Math.min(60, Math.floor(months * 0.2));
      const remainingMonths = months - gracePeriodMonths;

      const pmtAfterGrace =
        remainingMonths > 0
          ? monthlyRate === 0
            ? principalTotal / remainingMonths
            : (principalTotal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
              (Math.pow(1 + monthlyRate, remainingMonths) - 1)
          : principalTotal;

      let balance = principalTotal;

      for (let m = 1; m <= months; m++) {
        let principalPay = 0;
        let interestPay = balance * monthlyRate;
        let totalPay = 0;

        if (m <= gracePeriodMonths) {
          totalPay = interestPay;
          principalPay = 0;
        } else {
          totalPay = pmtAfterGrace;
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
    }

    setResult({
      firstMonthlyPayment,
      firstMonthlyPrincipal,
      firstMonthlyInterest,
      yearlyData,
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const formatWon = (n: number) =>
    Math.round(n).toLocaleString("ko-KR") + "원";

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <style jsx>{`
        @keyframes loanInputBreath {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press"
        >
          ← 메인으로
        </Link>

        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Landmark size={20} strokeWidth={1.75} className="text-emerald-600" />
          주택담보대출 계산기
        </h1>

        {/* 1. 상환방식 설정 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-600 mb-3">상환방식</h2>
          <div className="grid grid-cols-3 gap-2">
            {REPAYMENT_OPTIONS.map((opt) => {
              const active = repaymentType === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setRepaymentType(opt.key)}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all btn-press ${
                    active
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 대출정보 입력 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-600">대출정보 입력</h2>

          {highlightRemaining && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-700">
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
            <label className="text-xs text-slate-400 mb-1 block">대출기간 (년)</label>
            <input
              type="number"
              value={loanYears}
              onChange={(e) => { setLoanYears(e.target.value); setHighlightRemaining(false); }}
              placeholder="예: 30"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 mb-2"
              style={highlightRemaining && !loanYears ? { animation: "loanInputBreath 1.4s ease-in-out infinite", borderColor: "#10b981" } : undefined}
            />
            <div className="flex gap-2">
              {QUICK_YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => { setLoanYears(String(y)); setHighlightRemaining(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    loanYears === String(y)
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">대출금리 (%, 연)</label>
            <input
              type="number"
              step="0.01"
              value={interestRate}
              onChange={(e) => { setInterestRate(e.target.value); setHighlightRemaining(false); }}
              placeholder="예: 4.2"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              style={highlightRemaining && !interestRate ? { animation: "loanInputBreath 1.4s ease-in-out infinite", borderColor: "#10b981" } : undefined}
            />
          </div>

          <button
            onClick={calculate}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition btn-press"
          >
            계산하기
          </button>
        </div>

        {/* 3. 월 원리금 결과 */}
        {result && (
          <div ref={resultRef} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center result-enter">
            <p className="text-xs text-emerald-600 font-semibold mb-1">월 상환액 (첫 회차 기준)</p>
            <p className="text-3xl font-black text-emerald-700">
              {formatWon(result.firstMonthlyPayment)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              원금 {formatWon(result.firstMonthlyPrincipal)} · 이자 {formatWon(result.firstMonthlyInterest)}
            </p>
          </div>
        )}

        {/* 4. 시뮬레이션 그래프 */}
        {result && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 result-enter">
            <h2 className="text-sm font-bold text-slate-600 mb-4">연차별 원금·이자 구성</h2>
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
          </div>
        )}

      </div>
    </div>
  );
}

// ✅ useSearchParams는 Next.js App Router에서 Suspense 경계 안에서 사용해야 함
export default function LoanPage() {
  return (
    <Suspense fallback={null}>
      <LoanPageContent />
    </Suspense>
  );
}