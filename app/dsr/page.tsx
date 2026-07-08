"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { BarChart3, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ShareButton from "@/components/ShareButton";
import ThemeToggle from "@/components/ThemeToggle";
type RepayType = "equal-pi" | "equal-principal" | "bullet" | "graduated";
type RateType = "variable" | "mixed" | "cyclic" | "fixed";
// ✅ 스트레스 DSR 3단계 (2025.7.1 시행) + 10.15 대책(2025.10.16 시행) 반영
// 출처: 금융위원회 「3단계 스트레스 DSR 시행방안」(2025.5.20),
//       전국은행연합회 소비자포털 스트레스금리 공시(portal.kfb.or.kr/compare/stress_loan.php)
//
// - 수도권·규제지역 주담대: 기준 스트레스금리 3.0%p (2025.10.16~) × 유형별비율(3단계: 변동100%/혼합80%/주기40%)
// - 지방(서울·경기·인천 제외) 주담대: 2단계 스트레스 DSR 유예 적용 중
//   → 기준 스트레스금리는 이미 0.75%p로 축소된 값이며, 유형별비율도 2단계 기준(변동100%/혼합60%/주기30%) 적용
//   ⚠️ "1.5% × 비율"이 아니라 "0.75%(이미 축소된 값) × 비율"이 정확한 산식
//   유예기한은 최초 2025.12.31 → 2026.6월 → 2026.12.31로 수차례 연장됨(2026.6.30 은행연합회 발표 기준)
// - 순수 고정금리(만기 전체 고정)는 스트레스금리 미적용
const BASE_STRESS_RATE_METRO = 3.0;  // 수도권·규제지역
const BASE_STRESS_RATE_LOCAL = 0.75; // 지방 (2단계 유예, ~2026.12.31)
const RATE_TYPE_RATIO: Record<RateType, { metro: number; local: number }> = {
  variable: { metro: 1.0, local: 1.0 }, // 변동형: 100% (공통)
  mixed: { metro: 0.8, local: 0.6 },    // 혼합형: 수도권 3단계 80% / 지방 2단계 60%
  cyclic: { metro: 0.4, local: 0.3 },   // 주기형: 수도권 3단계 40% / 지방 2단계 30%
  fixed: { metro: 0, local: 0 },        // 순수 고정형: 미적용
};
function getStressRate(rateType: RateType, isMetro: boolean): number {
  const base = isMetro ? BASE_STRESS_RATE_METRO : BASE_STRESS_RATE_LOCAL;
  const ratio = isMetro ? RATE_TYPE_RATIO[rateType].metro : RATE_TYPE_RATIO[rateType].local;
  return base * ratio;
}
// ✅ DSR 산정 만기 상한 40년
// 출처: 금융위원회 「가계대출 관리 강화 방안」(2023.9.13)
// 원칙: 은행 자체 50년 만기 상품은 "전 기간 상환능력이 입증"되지 않으면 DSR 산정 만기를 40년으로 제한.
//       상환능력 입증은 소득·은퇴시점·퇴직연금 등을 종합한 은행 자체 심사이며, 나이만으로 자동 면제되지 않음.
// 예외: 정부 정책모기지(디딤돌대출·보금자리론 등)는 상품 설계상 만 34세 이하 무주택청년·신혼부부 등에게
//       50년 만기를 그 자체로 허용하므로, 이 경우 실제 만기를 그대로 인정
const DSR_MAX_YEARS = 40;
const FUTURE_INCOME_TABLE: Record<string, Record<number, number>> = {
  "20-24": { 10: 21.6, 15: 32.0, 20: 40.8, 30: 51.6 },
  "25-29": { 10: 16.8, 15: 23.6, 20: 28.4, 30: 31.4 },
  "30-34": { 10: 12.6, 15: 16.1, 20: 17.7, 30: 13.1 },
  "35-39": { 10: 6.2, 15: 6.8, 20: 5.3, 30: 0 },
};
function getAgeBand(age: number): keyof typeof FUTURE_INCOME_TABLE | null {
  if (age >= 20 && age <= 24) return "20-24";
  if (age >= 25 && age <= 29) return "25-29";
  if (age >= 30 && age <= 34) return "30-34";
  if (age >= 35 && age <= 39) return "35-39";
  return null;
}
function getFutureIncomeRate(age: number, years: number): number {
  const band = getAgeBand(age);
  if (!band || years < 10) return 0;
  const row = FUTURE_INCOME_TABLE[band];
  if (years >= 10 && years < 15) return row[10];
  if (years >= 15 && years < 20) return row[15];
  if (years === 20) return row[20];
  if (years > 20) return Math.max(row[20], row[30] || 0);
  return 0;
}
// ✅ 신용대출 등 DSR 산정만기 특례 (출처: 금융위원회 가계부채 관리방안 2022, 뱅크몰/올크레딧 DSR 가이드)
// - 만기일시상환(마이너스통장 등 한도대출 포함): 상환방식과 무관하게 산정만기 5년으로 간주, 원금을 5년(60개월) 분할한 것으로 계산
// - 순수 분할상환(원리금균등/원금균등): 실제만기를 인정하되 최장 10년으로 상한
const CREDIT_LOAN_BULLET_MONTHS = 60; // 만기일시상환 산정만기 5년
const CREDIT_LOAN_MAX_YEARS = 10;     // 분할상환 신용대출 산정만기 상한
function calcMonthlyPI(
  principal: number,
  years: number,
  ratePct: number,
  type: "equal-pi" | "equal-principal" | "bullet",
  applyDsrCap: boolean = false, // true면 심사용 만기 40년 상한 적용 (신규 주담대용)
  isCreditLoan: boolean = false // true면 신용대출 산정만기 특례 적용 (기존대출용)
): number {
  if (!principal || !years || !ratePct) return 0;
  const mr = ratePct / 100 / 12;
  if (type === "bullet") {
    // 만기일시상환: 상환방식과 무관하게 산정만기 5년으로 간주, 원금 분할 반영
    if (isCreditLoan) {
      const assumedPrincipal = principal / CREDIT_LOAN_BULLET_MONTHS;
      return assumedPrincipal + principal * mr;
    }
    return principal * mr; // 신용대출이 아닌 경우(예: 정보 부족)는 기존처럼 이자만
  }
  let dsrYears = applyDsrCap ? Math.min(years, DSR_MAX_YEARS) : years;
  if (isCreditLoan) dsrYears = Math.min(dsrYears, CREDIT_LOAN_MAX_YEARS); // 신용대출 분할상환 10년 상한
  const months = dsrYears * 12;
  if (type === "equal-principal") {
    const fixedPrincipal = principal / months;
    return fixedPrincipal + principal * mr;
  }
  return mr === 0
    ? principal / months
    : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1);
}
const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";
const EXIST_LOAN_TYPES = ["신용대출", "마이너스통장", "중고차대출", "카드론", "기타대출"];
const STRESS_DSR_STAGES = [
  { stage: "1단계", date: "2024.02 ~", add: "+0.25%p" },
  { stage: "2단계", date: "2024.09 ~", add: "+0.75%p" },
  { stage: "3단계", date: "2025.07 ~", add: "+1.50%p" },
];
const CURRENT_STAGE_INDEX = 2;
type ExistLoan = {
  id: string;
  loanType: string;
  repayType: RepayType;
  amount: string; // 만원
  years: string;
  rate: string;
};
function makeEmptyLoan(): ExistLoan {
  return {
    id: Math.random().toString(36).slice(2),
    loanType: EXIST_LOAN_TYPES[0],
    repayType: "equal-pi",
    amount: "",
    years: "",
    rate: "",
  };
}

function DSRPageContent() {
  const [todayStr, setTodayStr] = useState("");
  const [showTable, setShowTable] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  // ✅ 기존대출은 여러 개 보유 가능 (신용대출+마이너스통장+자동차할부 등 동시 보유가 현실적)
  const [existLoans, setExistLoans] = useState<ExistLoan[]>([makeEmptyLoan()]);
  const [newRepayType, setNewRepayType] = useState<RepayType>("equal-pi");
  const [newAmount, setNewAmount] = useState("");
  const [newYears, setNewYears] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newRateType, setNewRateType] = useState<RateType>("variable");
  const [isMetroArea, setIsMetroArea] = useState(true); // 수도권·규제지역 여부
  const [isPolicyMortgage, setIsPolicyMortgage] = useState(false); // 정책모기지(디딤돌·보금자리론 등) 여부
  const [income, setIncome] = useState("");
  const [age, setAge] = useState("");
  const [result, setResult] = useState<{ dsrPlain: number; dsrFuture: number } | null>(null);

  const searchParams = useSearchParams();

  // ✅ 공유된 링크로 들어오면 URL 쿼리파라미터에서 값을 읽어와 자동 입력
  useEffect(() => {
    const sharedIncome = searchParams.get("income");
    const sharedAge = searchParams.get("age");
    const sharedNewAmount = searchParams.get("newAmount");
    const sharedNewYears = searchParams.get("newYears");
    const sharedNewRate = searchParams.get("newRate");
    const sharedNewRateType = searchParams.get("newRateType");
    const sharedIsMetroArea = searchParams.get("isMetroArea");

    if (sharedIncome) setIncome(sharedIncome);
    if (sharedAge) setAge(sharedAge);
    if (sharedNewAmount) setNewAmount(sharedNewAmount);
    if (sharedNewYears) setNewYears(sharedNewYears);
    if (sharedNewRate) setNewRate(sharedNewRate);
    if (sharedNewRateType) setNewRateType(sharedNewRateType as RateType);
    if (sharedIsMetroArea) setIsMetroArea(sharedIsMetroArea === "true");
  }, [searchParams]);

  useEffect(() => {
    const d = new Date();
    setTodayStr(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} 적용중`);
  }, []);

  // ✅ 공유된 값이 다 채워져 있으면 자동으로 한 번 계산 실행
  useEffect(() => {
    if (searchParams.get("income") && searchParams.get("age") && searchParams.get("newAmount")) {
      const t = setTimeout(() => calculate(), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExistLoan = () => setExistLoans(prev => [...prev, makeEmptyLoan()]);
  const removeExistLoan = (id: string) => setExistLoans(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev);
  const updateExistLoan = (id: string, patch: Partial<ExistLoan>) =>
    setExistLoans(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  // 대출종류가 신용대출/마이너스통장이면 신용대출 산정만기 특례(5년 일시상환/10년 분할상환 상한) 적용
  const isCreditType = (loanType: string) => loanType === "신용대출" || loanType === "마이너스통장";
  const existLoanMonthlies = existLoans.map(l =>
    calcMonthlyPI(
      Number(l.amount) * 10000, Number(l.years), Number(l.rate),
      l.repayType === "graduated" ? "equal-pi" : l.repayType,
      false,
      isCreditType(l.loanType)
    )
  );
  const existMonthlyTotal = existLoanMonthlies.reduce((a, b) => a + b, 0);
  // 신규대출 실제 월 상환액 (화면 표시용, 스트레스금리 미반영)
  const newMonthly = calcMonthlyPI(
    Number(newAmount) * 10000, Number(newYears), Number(newRate),
    newRepayType === "graduated" ? "equal-pi" : newRepayType
  );
  // 신규대출 DSR 심사용 월 상환액: 스트레스금리 가산 + 만기 상한 적용
  // 정책모기지(디딤돌·보금자리론 등)는 상품 설계상 50년 만기가 그대로 인정되므로 40년 상한 미적용
  const stressRate = getStressRate(newRateType, isMetroArea);
  const screeningRate = Number(newRate) + stressRate;
  const newMonthlyForDSR = calcMonthlyPI(
    Number(newAmount) * 10000, Number(newYears), screeningRate,
    newRepayType === "graduated" ? "equal-pi" : newRepayType,
    !isPolicyMortgage // 정책모기지가 아닐 때만 40년 상한 적용
  );
  const calculate = () => {
    const incomeNum = Number(income) * 10000;
    const ageNum = Number(age);
    if (!incomeNum || !ageNum) {
      alert("연소득과 나이를 입력해주세요.");
      return;
    }
    // ✅ DSR 심사는 신규대출에 스트레스금리+40년만기상한을 적용한 값을 사용
    const annualDebtPayment = (existMonthlyTotal + newMonthlyForDSR) * 12;
    const dsrPlain = (annualDebtPayment / incomeNum) * 100;
    const rate = getFutureIncomeRate(ageNum, isPolicyMortgage ? Number(newYears) : Math.min(Number(newYears), DSR_MAX_YEARS));
    const futureIncome = incomeNum * (1 + rate / 100);
    const dsrFuture = (annualDebtPayment / futureIncome) * 100;
    setResult({ dsrPlain, dsrFuture });
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  const bankPass = result ? result.dsrPlain <= 40 : null;
  const nonBankPass = result ? result.dsrPlain <= 50 : null;
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <style jsx>{`
        @keyframes dsrDateBreath {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press">
            ← 메인으로
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
          <BarChart3 size={20} strokeWidth={1.75} className="text-emerald-600" />
          DSR 계산기
        </h1>

        {/* 스트레스 DSR 규제 현황 */}
        <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <span
            className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{
              background: "#fecaca",
              color: "#b91c1c",
              animation: "dsrDateBreath 2.4s ease-in-out infinite",
            }}
          >
            {todayStr}
          </span>
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">스트레스 DSR 규제 현황</h2>
          <div className="grid grid-cols-3 gap-2">
            {STRESS_DSR_STAGES.map((s, i) => {
              const active = i === CURRENT_STAGE_INDEX;
              return (
                <div key={s.stage} className={`rounded-xl p-3 text-center border ${active ? "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800" : "bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600"}`}>
                  <p className={`text-xs font-bold ${active ? "text-red-700 dark:text-red-300" : "text-slate-400 dark:text-slate-500"}`}>{s.stage}</p>
                  <p className={`text-[10px] mt-0.5 ${active ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>{s.date}</p>
                  <p className={`text-[10px] mt-1 ${active ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-400 dark:text-slate-500"}`}>{s.add}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 장래인정소득 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">장래인정소득이란?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            만 39세 이하 무주택 근로자가 만기 10년 이상 주택담보대출(분할상환)을 받을 때,
            현재 소득이 아닌 연령대별 소득흐름 평균을 반영해 DSR 산정용 소득을 높여주는 제도입니다.
          </p>
          <button
            onClick={() => setShowTable(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
          >
            연령대별 인정비율표 {showTable ? "접기" : "더보기"}
            <ChevronDown
              size={14}
              strokeWidth={2}
              style={{
                transform: showTable ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>
          {showTable && (
            <div className="mt-3 space-y-2 result-enter">
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                    <tr>
                      <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-semibold">연령\만기</th>
                      <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-semibold">10~14년</th>
                      <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-semibold">15~19년</th>
                      <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-semibold">20년~</th>
                      <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-semibold">30년</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["20~24세", "21.6%", "32.0%", "40.8%", "51.6%"],
                      ["25~29세", "16.8%", "23.6%", "28.4%", "31.4%"],
                      ["30~34세", "12.6%", "16.1%", "17.7%", "13.1%"],
                      ["35~39세", "6.2%", "6.8%", "5.3%", "-"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-t border-slate-100 dark:border-slate-700">
                        {row.map((cell, i) => (
                          <td key={i} className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                출처: 금융위원회, 「새정부 가계대출 관리방향 및 단계적 규제 정상화방안」(2022.6) 12p
              </p>
            </div>
          )}
        </div>

        {/* 기존대출 입력 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400">기존대출 입력</h2>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{existLoans.length}건</span>
          </div>
          {existLoans.map((loan, idx) => (
            <div key={loan.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 space-y-3 bg-slate-50/50 dark:bg-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">대출 {idx + 1}</span>
                {existLoans.length > 1 && (
                  <button
                    onClick={() => removeExistLoan(loan.id)}
                    className="text-[11px] text-red-400 hover:text-red-600 transition"
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출종류</label>
                  <select value={loan.loanType} onChange={(e) => updateExistLoan(loan.id, { loanType: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500">
                    {EXIST_LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">상환방식</label>
                  <select value={loan.repayType} onChange={(e) => updateExistLoan(loan.id, { repayType: e.target.value as RepayType })}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500">
                    <option value="equal-pi">원리금균등</option>
                    <option value="equal-principal">원금균등</option>
                    <option value="bullet">만기일시</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출금액 (만원)</label>
                <input type="number" value={loan.amount} onChange={(e) => updateExistLoan(loan.id, { amount: e.target.value })}
                  placeholder="예: 5000" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">
                    대출만기 (년)
                    {loan.repayType === "bullet" && isCreditType(loan.loanType) && (
                      <span className="text-amber-500 dark:text-amber-400"> · 심사만기 5년 고정</span>
                    )}
                  </label>
                  <input type="number" value={loan.years} onChange={(e) => updateExistLoan(loan.id, { years: e.target.value })}
                    placeholder="예: 5" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출금리 (%)</label>
                  <input type="number" step="0.01" value={loan.rate} onChange={(e) => updateExistLoan(loan.id, { rate: e.target.value })}
                    placeholder="예: 6.5" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500" />
                </div>
              </div>
              {isCreditType(loan.loanType) && loan.repayType !== "bullet" && Number(loan.years) > CREDIT_LOAN_MAX_YEARS && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  신용대출 분할상환은 DSR 산정만기가 최장 {CREDIT_LOAN_MAX_YEARS}년으로 상한됩니다. (실제 만기 {loan.years}년, 심사만기 {CREDIT_LOAN_MAX_YEARS}년)
                </p>
              )}
              {existLoanMonthlies[idx] > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                  심사용 월 원리금 <span className="font-bold">{fmtWon(existLoanMonthlies[idx])}</span>
                  {loan.repayType === "bullet" && isCreditType(loan.loanType) && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">만기일시상환은 산정만기 5년 원금분할 기준으로 계산됩니다.</p>
                  )}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addExistLoan}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            + 기존대출 추가하기
          </button>
          {existMonthlyTotal > 0 && (
            <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">
              기존대출 합계 월 원리금 <span className="font-bold">{fmtWon(existMonthlyTotal)}</span>
            </div>
          )}
        </div>

        {/* 신규대출 입력 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400">신규대출 (주담대) 입력</h2>
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">상환방식</label>
            <select value={newRepayType} onChange={(e) => setNewRepayType(e.target.value as RepayType)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500">
              <option value="equal-pi">원리금균등</option>
              <option value="equal-principal">원금균등</option>
              <option value="graduated">체증식</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출원금 (만원)</label>
              <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                placeholder="예: 50000" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출금리 (%)</label>
              <input type="number" step="0.01" value={newRate} onChange={(e) => setNewRate(e.target.value)}
                placeholder="예: 4.2" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">대출기간 (년)</label>
            <input type="number" value={newYears} onChange={(e) => setNewYears(e.target.value)}
              placeholder="예: 30" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 mb-2" />
            <div className="flex gap-2">
              {[30, 40, 50].map((y) => (
                <button key={y} onClick={() => setNewYears(String(y))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    newYears === String(y)
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                  }`}>
                  {y}년
                </button>
              ))}
            </div>
            {Number(newYears) > DSR_MAX_YEARS && !isPolicyMortgage && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                DSR 산정 시 만기는 최대 {DSR_MAX_YEARS}년까지만 인정됩니다. (실제 만기 {newYears}년, 심사만기 {DSR_MAX_YEARS}년)
              </p>
            )}
            {Number(newYears) > DSR_MAX_YEARS && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">정책모기지 상품 이용</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">디딤돌대출·보금자리론 등 (만 34세 이하 무주택청년·신혼부부 대상 50년 상품)</p>
                </div>
                <button
                  onClick={() => setIsPolicyMortgage(v => !v)}
                  style={{
                    position: "relative", width: 44, height: 24, borderRadius: 999,
                    background: isPolicyMortgage ? "#10b981" : "#cbd5e1", border: "none", cursor: "pointer",
                    transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, left: isPolicyMortgage ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
                  }} />
                </button>
              </div>
            )}
            {Number(newYears) > DSR_MAX_YEARS && isPolicyMortgage && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5">
                정책모기지 상품은 상품 설계상 50년 만기가 그대로 인정되어 심사만기 상한이 적용되지 않습니다.
              </p>
            )}
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
            <div>
              <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">금리유형</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { key: "variable", label: "변동형" },
                  { key: "mixed", label: "혼합형" },
                  { key: "cyclic", label: "주기형" },
                  { key: "fixed", label: "고정형" },
                ].map((r) => (
                  <button key={r.key} onClick={() => setNewRateType(r.key as RateType)}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      newRateType === r.key
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {newRateType !== "fixed" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">수도권·규제지역 여부</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">서울·경기·인천 또는 투기과열지구·조정대상지역</p>
                </div>
                <button
                  onClick={() => setIsMetroArea(v => !v)}
                  style={{
                    position: "relative", width: 44, height: 24, borderRadius: 999,
                    background: isMetroArea ? "#10b981" : "#cbd5e1", border: "none", cursor: "pointer",
                    transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, left: isMetroArea ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
                  }} />
                </button>
              </div>
            )}
          </div>
          {newMonthly > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
              실제 월 원리금 <span className="font-bold">{fmtWon(newMonthly)}</span>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">입력하신 실제 대출조건 기준 상환액입니다.</p>
            </div>
          )}
          {stressRate > 0 && Number(newRate) > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-bold">
                DSR 심사 적용금리: {Number(newRate).toFixed(2)}% + 스트레스금리 {stressRate.toFixed(2)}%p = {screeningRate.toFixed(2)}%
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                심사만기 {isPolicyMortgage ? newYears : Math.min(Number(newYears) || 0, DSR_MAX_YEARS)}년 기준,
                심사용 월 원리금 <span className="font-bold">{fmtWon(newMonthlyForDSR)}</span>으로 DSR이 계산됩니다.
              </p>
            </div>
          )}
          {newRateType === "fixed" && Number(newRate) > 0 && (
            <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
              순수 고정금리 대출은 스트레스금리가 적용되지 않습니다.
            </div>
          )}
        </div>

        {/* 개인정보 입력 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400">개인정보 입력</h2>
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">
              연소득 (만원) <span className="text-slate-400 dark:text-slate-500">— 혼인신고 완료 부부는 합산 입력, 전년도 원천징수영수증 기준</span>
            </label>
            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)}
              placeholder="예: 6000" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">차주 나이 (만)</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
              placeholder="예: 32" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500" />
          </div>
        </div>
        <button
          onClick={calculate}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition btn-press"
        >
          계산하기
        </button>

        {/* 결과 */}
        {result && (
          <div ref={resultRef} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-1 result-enter">
            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">DSR 심사 계산 결과</h2>
            <div className="flex justify-between items-baseline py-2.5 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-500 dark:text-slate-400">장래소득 미반영 DSR</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200">{result.dsrPlain.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-baseline py-2.5">
              <span className="text-sm text-slate-500 dark:text-slate-400">장래소득 반영 DSR</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{result.dsrFuture.toFixed(1)}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className={`rounded-xl p-3 text-center border ${bankPass ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800"}`}>
                <p className={`text-xs font-bold ${bankPass ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                  {bankPass ? "은행권 통과" : "은행권 초과"}
                </p>
                <p className={`text-[10px] mt-0.5 ${bankPass ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>40% 이하 기준</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${nonBankPass ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800"}`}>
                <p className={`text-xs font-bold ${nonBankPass ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                  {nonBankPass ? "비은행권 통과" : "비은행권 초과"}
                </p>
                <p className={`text-[10px] mt-0.5 ${nonBankPass ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>50% 이하 기준</p>
              </div>
            </div>

            {/* ✅ 공유하기 버튼 */}
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700">
              <ShareButton
                title="DSR 계산 결과 - 똑집"
                description={`DSR ${result.dsrPlain.toFixed(1)}% (장래소득 반영시 ${result.dsrFuture.toFixed(1)}%)`}
                params={{
                  income,
                  age,
                  newAmount,
                  newYears,
                  newRate,
                  newRateType,
                  isMetroArea: String(isMetroArea),
                }}
              />
            </div>
          </div>
        )}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-700">
          출처: 금융위원회 「3단계 스트레스 DSR 시행방안」(2025.5.20), 「10.15 가계부채 관리방안」(2025.10.15),
          전국은행연합회 소비자포털 스트레스금리 공시, 금융위원회 「가계대출 관리 강화 방안」(2023.9.13, DSR 만기 40년 상한),
          신용대출 DSR 산정만기 특례(만기일시상환 5년 원금분할 간주, 분할상환 최장 10년 상한).
          지방 주담대 2단계 유예는 은행연합회 발표(2026.6.30)에 따라 2026년 말까지 연장 적용 중입니다.
          기존대출은 실행 당시 적용된 스트레스금리를 기준으로 하나, 실행 시점을 특정하기 어려워 본 계산기는
          기존대출의 실제 상환액을 그대로 반영합니다(스트레스금리 미가산). 본 계산기는 신규 주택담보대출에 한해
          스트레스금리를 반영하며, 신용대출은 잔액 1억원 초과 시에만 스트레스금리가 부과되는 등 별도 요건이 있어
          신규 신용대출 시뮬레이션에는 적용되지 않습니다. 은행 자체 50년 상품의 40년 상한 예외는 은행별 자체 심사
          (소득·은퇴시점 등) 기준으로, 정책모기지 외에는 실제 승인 여부가 다를 수 있습니다.
          정확한 한도는 금융기관 상담을 통해 확인해주세요.
        </p>
      </div>
    </div>
  );
}

// ✅ useSearchParams는 Next.js App Router에서 Suspense 경계 안에서 사용해야 함
export default function DSRPage() {
  return (
    <Suspense fallback={null}>
      <DSRPageContent />
    </Suspense>
  );
}
