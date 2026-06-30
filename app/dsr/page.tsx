"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type RepayType = "equal-pi" | "equal-principal" | "bullet" | "graduated";

// ✅ 장래인정소득 인정산식 (출처: 금융위원회, 「새정부 가계대출 관리방향 및
//    단계적 규제 정상화방안」 2022.6, 12p) — 만 39세 이하 무주택 근로자,
//    만기 10년 이상 분할상환 주담대에만 적용
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

// 차주에게 유리한 만기 선택 가능 (20년 또는 실제만기 중 유리한 쪽)
function getFutureIncomeRate(age: number, years: number): number {
  const band = getAgeBand(age);
  if (!band || years < 10) return 0;
  const row = FUTURE_INCOME_TABLE[band];

  if (years >= 10 && years < 15) return row[10];
  if (years >= 15 && years < 20) return row[15];
  if (years === 20) return row[20];
  // 20년 초과: 20년 적용 vs 실제만기(30년 기준) 중 유리한 쪽
  if (years > 20) return Math.max(row[20], row[30] || 0);
  return 0;
}

function calcMonthlyPI(
  principal: number,
  years: number,
  ratePct: number,
  type: "equal-pi" | "equal-principal" | "bullet"
): number {
  if (!principal || !years || !ratePct) return 0;
  const months = years * 12;
  const mr = ratePct / 100 / 12;

  if (type === "bullet") {
    return principal * mr; // 만기일시: 매월 이자만
  }
  if (type === "equal-principal") {
    const fixedPrincipal = principal / months;
    return fixedPrincipal + principal * mr; // 첫 회차 기준
  }
  // 원리금균등
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

// ✅ 현재 적용 단계 — 규제 변경 시 이 인덱스만 수정하면 반영됨 (0, 1, 2)
const CURRENT_STAGE_INDEX = 2;

export default function DSRPage() {
  const [todayStr, setTodayStr] = useState("");

  // 기존대출
  const [existLoanType, setExistLoanType] = useState(EXIST_LOAN_TYPES[0]);
  const [existRepayType, setExistRepayType] = useState<RepayType>("equal-pi");
  const [existAmount, setExistAmount] = useState("");
  const [existYears, setExistYears] = useState("");
  const [existRate, setExistRate] = useState("");

  // 신규대출
  const [newRepayType, setNewRepayType] = useState<RepayType>("equal-pi");
  const [newAmount, setNewAmount] = useState("");
  const [newYears, setNewYears] = useState("");
  const [newRate, setNewRate] = useState("");

  // 개인정보
  const [income, setIncome] = useState("");
  const [age, setAge] = useState("");

  const [result, setResult] = useState<{
    dsrPlain: number;
    dsrFuture: number;
  } | null>(null);

  useEffect(() => {
    const d = new Date();
    setTodayStr(
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
        d.getDate()
      ).padStart(2, "0")} 적용중`
    );
  }, []);

  const existMonthly = calcMonthlyPI(
    Number(existAmount) * 10000,
    Number(existYears),
    Number(existRate),
    existRepayType === "graduated" ? "equal-pi" : existRepayType
  );

  const newMonthly = calcMonthlyPI(
    Number(newAmount) * 10000,
    Number(newYears),
    Number(newRate),
    newRepayType === "graduated" ? "equal-pi" : newRepayType
  );

  const calculate = () => {
    const incomeNum = Number(income) * 10000;
    const ageNum = Number(age);

    if (!incomeNum || !ageNum) {
      alert("연소득과 나이를 입력해주세요.");
      return;
    }

    const annualDebtPayment = (existMonthly + newMonthly) * 12;
    const dsrPlain = (annualDebtPayment / incomeNum) * 100;

    const rate = getFutureIncomeRate(ageNum, Number(newYears));
    const futureIncome = incomeNum * (1 + rate / 100);
    const dsrFuture = (annualDebtPayment / futureIncome) * 100;

    setResult({ dsrPlain, dsrFuture });
  };

  const bankPass = result ? result.dsrPlain <= 40 : null;
  const nonBankPass = result ? result.dsrPlain <= 50 : null;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition"
        >
          ← 메인으로
        </Link>

        <h1 className="text-xl font-bold text-slate-800">📊 DSR 계산기</h1>

        {/* 1. 규제상태 알림 */}
        <div className="relative bg-white border border-slate-200 rounded-2xl p-5">
          <span className="absolute top-4 right-4 text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            {todayStr}
          </span>
          <h2 className="text-sm font-bold text-slate-600 mb-3">스트레스 DSR 규제 현황</h2>
          <div className="grid grid-cols-3 gap-2">
            {STRESS_DSR_STAGES.map((s, i) => {
              const active = i === CURRENT_STAGE_INDEX;
              return (
                <div
                  key={s.stage}
                  className={`rounded-xl p-3 text-center border ${
                    active
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p className={`text-xs font-bold ${active ? "text-red-700" : "text-slate-400"}`}>
                    {s.stage}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${active ? "text-red-500" : "text-slate-400"}`}>
                    {s.date}
                  </p>
                  <p className={`text-[10px] mt-1 ${active ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                    {s.add}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 장래인정소득 박스 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-600 mb-2">장래인정소득이란?</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            만 39세 이하 무주택 근로자가 만기 10년 이상 주택담보대출(분할상환)을 받을 때,
            현재 소득이 아닌 연령대별 소득흐름 평균을 반영해 DSR 산정용 소득을 높여주는 제도입니다.
          </p>
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-[11px] border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="py-2 px-2 text-slate-500 font-semibold">연령\만기</th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">10~14년</th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">15~19년</th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">20년~</th>
                  <th className="py-2 px-2 text-slate-500 font-semibold">30년</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["20~24세", "21.6%", "32.0%", "40.8%", "51.6%"],
                  ["25~29세", "16.8%", "23.6%", "28.4%", "31.4%"],
                  ["30~34세", "12.6%", "16.1%", "17.7%", "13.1%"],
                  ["35~39세", "6.2%", "6.8%", "5.3%", "-"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-slate-100">
                    {row.map((cell, i) => (
                      <td key={i} className="py-1.5 px-2 text-center text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            출처: 금융위원회, 「새정부 가계대출 관리방향 및 단계적 규제 정상화방안」(2022.6) 12p
          </p>
        </div>

        {/* 3. 기존대출 입력 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">기존대출 입력</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">대출종류</label>
              <select
                value={existLoanType}
                onChange={(e) => setExistLoanType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              >
                {EXIST_LOAN_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">상환방식</label>
              <select
                value={existRepayType}
                onChange={(e) => setExistRepayType(e.target.value as RepayType)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="equal-pi">원리금균등</option>
                <option value="equal-principal">원금균등</option>
                <option value="bullet">만기일시</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">대출금액 (만원)</label>
            <input
              type="number"
              value={existAmount}
              onChange={(e) => setExistAmount(e.target.value)}
              placeholder="예: 5000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">대출만기 (년)</label>
              <input
                type="number"
                value={existYears}
                onChange={(e) => setExistYears(e.target.value)}
                placeholder="예: 5"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">대출금리 (%)</label>
              <input
                type="number"
                step="0.01"
                value={existRate}
                onChange={(e) => setExistRate(e.target.value)}
                placeholder="예: 6.5"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {existMonthly > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-emerald-700">
              월 원리금 <span className="font-bold">{fmtWon(existMonthly)}</span>
              <p className="text-[11px] text-emerald-600 mt-0.5">월 원리금이 맞나요? 입력값을 다시 확인해보세요.</p>
            </div>
          )}
        </div>

        {/* 4. 신규대출 입력 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">신규대출 (주담대) 입력</h2>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">상환방식</label>
            <select
              value={newRepayType}
              onChange={(e) => setNewRepayType(e.target.value as RepayType)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            >
              <option value="equal-pi">원리금균등</option>
              <option value="equal-principal">원금균등</option>
              <option value="graduated">체증식</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">대출원금 (만원)</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="예: 50000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">대출금리 (%)</label>
              <input
                type="number"
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="예: 4.2"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">대출기간 (년)</label>
            <input
              type="number"
              value={newYears}
              onChange={(e) => setNewYears(e.target.value)}
              placeholder="예: 30"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 mb-2"
            />
            <div className="flex gap-2">
              {[30, 40, 50].map((y) => (
                <button
                  key={y}
                  onClick={() => setNewYears(String(y))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    newYears === String(y)
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>

          {newMonthly > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-emerald-700">
              월 원리금 <span className="font-bold">{fmtWon(newMonthly)}</span>
              <p className="text-[11px] text-emerald-600 mt-0.5">월 원리금이 맞나요? 입력값을 다시 확인해보세요.</p>
            </div>
          )}
        </div>

        {/* 5. 개인정보 입력 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">개인정보 입력</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              연소득 (만원) <span className="text-slate-400">— 혼인신고 완료 부부는 합산 입력, 전년도 원천징수영수증 기준</span>
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="예: 6000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">차주 나이 (만)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="예: 32"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 6. 계산하기 버튼 */}
        <button
          onClick={calculate}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
        >
          계산하기
        </button>

        {/* 결과 */}
        {result && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
            <h2 className="text-sm font-bold text-slate-600 mb-2">계산 결과</h2>

            <div className="flex justify-between items-baseline py-2.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">장래소득 미반영 DSR</span>
              <span className="text-xl font-black text-slate-800">{result.dsrPlain.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-baseline py-2.5">
              <span className="text-sm text-slate-500">장래소득 반영 DSR</span>
              <span className="text-xl font-black text-emerald-600">{result.dsrFuture.toFixed(1)}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div
                className={`rounded-xl p-3 text-center border ${
                  bankPass ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                }`}
              >
                <p className={`text-xs font-bold ${bankPass ? "text-emerald-700" : "text-red-700"}`}>
                  {bankPass ? "은행권 통과" : "은행권 초과"}
                </p>
                <p className={`text-[10px] mt-0.5 ${bankPass ? "text-emerald-500" : "text-red-500"}`}>
                  40% 이하 기준
                </p>
              </div>
              <div
                className={`rounded-xl p-3 text-center border ${
                  nonBankPass ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                }`}
              >
                <p className={`text-xs font-bold ${nonBankPass ? "text-emerald-700" : "text-red-700"}`}>
                  {nonBankPass ? "비은행권 통과" : "비은행권 초과"}
                </p>
                <p className={`text-[10px] mt-0.5 ${nonBankPass ? "text-emerald-500" : "text-red-500"}`}>
                  50% 이하 기준
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}