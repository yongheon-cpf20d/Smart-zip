"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home as HomeIcon, ChevronRight, RotateCcw, Calculator,
  Landmark, BarChart3,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { useVisitorTracking } from "../hooks/useVisitorTracking";

// ─── 계산 로직 ─────────────────────────────────────────────────────────────

/** 장래소득 반영율 (DSR 스트레스 테스트, 만 나이 기준) */
function getFutureIncomeRate(age: number): number {
  if (age >= 20 && age <= 24) return 30.3;
  if (age >= 25 && age <= 29) return 18.2;
  if (age >= 30 && age <= 34) return 10.5;
  if (age >= 35 && age <= 39) return 5.4;
  return 0;
}

/** LTV 비율 */
function getLTV(isFirstHome: boolean, isRegulated: boolean): number {
  if (isFirstHome) return isRegulated ? 0.7 : 0.8;
  return isRegulated ? 0.5 : 0.7;
}

/** 역산 PMT: 월 상환액 → 원금 (원리금균등상환) */
function reversePMT(monthlyPayment: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthlyPayment * n;
  return (monthlyPayment * (1 - Math.pow(1 + r, -n))) / r;
}

/** 취득세 계산 (생애최초 200만원 한도 감면 포함) */
function getAcquisitionTax(price: number, isFirstHome: boolean): number {
  let rate: number;
  if (price <= 600_000_000) {
    rate = 0.01;
  } else if (price <= 900_000_000) {
    // 6억~9억: 1%→3% 선형 보간
    rate = 0.01 + ((price - 600_000_000) / 300_000_000) * 0.02;
  } else {
    rate = 0.03;
  }
  const baseTax = price * rate;
  if (isFirstHome) {
    // 생애최초: 최대 200만원 감면 (12억 이하 적용)
    const reduction = price <= 1_200_000_000 ? Math.min(2_000_000, baseTax) : 0;
    return Math.max(0, baseTax - reduction);
  }
  return baseTax;
}

/** 중개보수 (VAT 포함) */
function getBrokerFee(price: number): number {
  // 2023년 개정 기준 상한 요율
  let rate: number;
  if (price < 200_000_000) rate = 0.005;
  else if (price < 900_000_000) rate = 0.004;
  else rate = 0.005;
  return price * rate * 1.1; // VAT 10%
}

/** 총 부대비용 (취득세 + 복비 + 법무사 70만) */
function getAdditionalCosts(price: number, isFirstHome: boolean): number {
  return getAcquisitionTax(price, isFirstHome) + getBrokerFee(price) + 700_000;
}

/** 현금 → 최대 주택가 (LTV 제약, 반복 수렴) */
function calcMaxHouseFromCash(cashWon: number, ltv: number, isFirstHome: boolean): number {
  // 초기 추정: 부대비용 무시
  let price = cashWon / (1 - ltv);
  for (let i = 0; i < 12; i++) {
    const costs = getAdditionalCosts(price, isFirstHome);
    const next = (cashWon - costs) / (1 - ltv);
    if (next <= 0) return 0;
    if (Math.abs(next - price) < 1000) break;
    price = next;
  }
  return Math.max(0, price);
}

/** 연소득 → DSR 기반 최대 대출원금 */
function calcMaxLoanFromDSR(
  annualIncomeWon: number,
  age: number,
  isMetro: boolean,
  loanYears = 30
): number {
  const stressAdd = isMetro ? 3.0 : 0.75; // 스트레스 DSR 3단계
  const screeningRate = 4.0 + stressAdd;   // 기준금리 4.0% + 가산
  const futureRate = getFutureIncomeRate(age);
  const adjustedIncome = annualIncomeWon * (1 + futureRate / 100);
  const maxMonthlyPayment = (adjustedIncome * 0.4) / 12; // DSR 40% 상한
  return reversePMT(maxMonthlyPayment, screeningRate, loanYears);
}

interface CalcResult {
  maxHousePrice: number;
  ltvLimited: boolean;   // true=현금, false=DSR 제약
  ltv: number;
  loanAmountWon: number;
  selfFundWon: number;
  acquisitionCosts: number;
  stressRate: number;
  isFirstHome: boolean;
  isRegulated: boolean;
  loanYearsUsed: number;
}

function calculate(
  cashWon: number,
  incomeWon: number,
  age: number,
  isFirstHome: boolean,
  isRegulated: boolean
): CalcResult {
  const ltv = getLTV(isFirstHome, isRegulated);
  const isMetro = isRegulated; // 규제지역 ≈ 수도권/과열 근사

  // ① LTV + 현금 기반 최대 주택가
  const maxHouseFromCash = calcMaxHouseFromCash(cashWon, ltv, isFirstHome);

  // ② DSR 기반 최대 대출
  const maxLoanFromDSR = calcMaxLoanFromDSR(incomeWon, age, isMetro, 30);

  // ③ DSR 기반 최대 주택가: 대출이 LTV 상한까지 차면 주택가 = 대출/LTV
  //    단, 현금이 부족하면 현금이 바인딩
  const maxHouseFromDSR = maxLoanFromDSR / ltv;
  const reqCashForDSRHouse =
    maxHouseFromDSR * (1 - ltv) + getAdditionalCosts(maxHouseFromDSR, isFirstHome);

  let maxHousePrice: number;
  let ltvLimited: boolean;

  if (maxLoanFromDSR >= maxHouseFromCash * ltv) {
    // DSR이 넉넉 → 현금이 제약
    maxHousePrice = maxHouseFromCash;
    ltvLimited = true;
  } else if (reqCashForDSRHouse > cashWon) {
    // DSR이 제약이지만 현금도 부족 → 현금이 제약
    maxHousePrice = maxHouseFromCash;
    ltvLimited = true;
  } else {
    // DSR이 제약
    maxHousePrice = maxHouseFromDSR;
    ltvLimited = false;
  }

  if (maxHousePrice <= 0) maxHousePrice = 0;

  const loanAmount = Math.min(maxHousePrice * ltv, maxLoanFromDSR);
  const addCosts = getAdditionalCosts(maxHousePrice, isFirstHome);
  const selfFund = Math.max(0, maxHousePrice - loanAmount);
  const stressAdd = isMetro ? 3.0 : 0.75;

  return {
    maxHousePrice,
    ltvLimited,
    ltv,
    loanAmountWon: loanAmount,
    selfFundWon: selfFund,
    acquisitionCosts: addCosts,
    stressRate: 4.0 + stressAdd,
    isFirstHome,
    isRegulated,
    loanYearsUsed: 30,
  };
}

// ─── 포맷 헬퍼 ─────────────────────────────────────────────────────────────

function fmtEok(won: number): string {
  const eok = won / 1e8;
  if (eok >= 1) return `${eok.toFixed(1)}억`;
  return `${Math.round(won / 1e4).toLocaleString()}만원`;
}

function fmtEokDetailed(won: number): string {
  const eok = Math.floor(won / 1e8);
  const rem = Math.round((won % 1e8) / 1e4);
  if (eok === 0) return `${rem.toLocaleString()}만원`;
  if (rem === 0) return `${eok}억원`;
  return `${eok}억 ${rem.toLocaleString()}만원`;
}

function fmtMan(won: number): string {
  return `${Math.round(won / 1e4).toLocaleString()}만원`;
}

// ─── 타입 ───────────────────────────────────────────────────────────────────

type Step = "welcome" | "cash" | "income" | "age" | "hasHouse" | "location" | "calculating" | "result";

const STEP_INDEX: Record<Step, number> = {
  welcome: 0, cash: 1, income: 2, age: 3, hasHouse: 4, location: 5,
  calculating: 5, result: 6,
};
const TOTAL_STEPS = 6;

// ─── 서브 컴포넌트 ──────────────────────────────────────────────────────────

function StepWelcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <HomeIcon size={32} strokeWidth={1.75} className="text-emerald-600" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">
          내가 살 수 있는<br />집은 얼마짜리일까?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          보유 현금과 소득을 바탕으로<br />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">DSR·LTV 규제를 반영</span>한<br />
          최대 구매 가능 금액을 계산해 드려요.
        </p>
      </div>
      <button
        onClick={onStart}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-base transition btn-press"
      >
        시작하기 →
      </button>
      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        입력 정보는 저장되지 않아요
      </p>
      <Link href="/hub" className="block text-xs text-slate-400 hover:text-emerald-600 transition link-press">
        다른 계산기 모음 보기 →
      </Link>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  unit,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-4 text-2xl font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 pr-20"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500 font-medium">
        {unit}
      </span>
    </div>
  );
}

function YenPreview({ value, label }: { value: string; label: string }) {
  const num = parseFloat(value);
  if (!num || num <= 0) return null;
  return (
    <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
      {label}{" "}
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
        {fmtEokDetailed(num * 1e4)}
      </span>
    </p>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
    >
      ← 이전
    </button>
  );
}

function NextButton({ onClick, disabled, label = "다음 →" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold py-4 rounded-2xl text-base transition btn-press"
    >
      {label}
    </button>
  );
}

function StepCash({
  value, onChange, onNext, onBack, inputRef,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">1 / 5</p>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
          현재 보유한 현금이<br />얼마나 되세요?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          전세보증금 회수 예정액, 부모님 지원금 등<br />집 살 때 쓸 수 있는 금액 전부예요.
        </p>
      </div>
      <div className="space-y-1">
        <NumberInput value={value} onChange={onChange} placeholder="5000" unit="만원" inputRef={inputRef} />
        <YenPreview value={value} label="≈" />
      </div>
      <NextButton onClick={onNext} disabled={!parseFloat(value) || parseFloat(value) <= 0} />
      <div className="text-center">
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
}

function StepIncome({
  value, onChange, onNext, onBack, inputRef,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">2 / 5</p>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
          세전 연소득이<br />얼마인가요?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          원천징수영수증 기준 총 급여예요.<br />사업소득이면 종합소득세 신고 기준으로 입력하세요.
        </p>
      </div>
      <div className="space-y-1">
        <NumberInput value={value} onChange={onChange} placeholder="6000" unit="만원" inputRef={inputRef} />
        <YenPreview value={value} label="연봉" />
      </div>
      <NextButton onClick={onNext} disabled={!parseFloat(value) || parseFloat(value) <= 0} />
      <div className="text-center">
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
}

function StepAge({
  value, onChange, onNext, onBack, inputRef,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const age = parseInt(value);
  const futureRate = getFutureIncomeRate(age);
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">3 / 5</p>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
          만 나이가<br />어떻게 되세요?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          만 39세 이하라면 장래소득을 반영해<br />대출 한도가 더 유리하게 계산돼요.
        </p>
      </div>
      <div className="space-y-1">
        <NumberInput value={value} onChange={onChange} placeholder="35" unit="세" inputRef={inputRef} />
        {age >= 20 && age <= 39 && futureRate > 0 && (
          <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            장래소득 <span className="font-semibold">+{futureRate}%</span> 반영 → 대출 한도 우대 적용
          </p>
        )}
      </div>
      <NextButton
        onClick={onNext}
        disabled={!age || age < 19 || age > 80}
      />
      <div className="text-center">
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
}

function ChoiceCard({
  label, sublabel, selected, onClick,
}: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition btn-press ${
        selected
          ? "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700"
      }`}
    >
      <p className="font-bold text-base">{label}</p>
      {sublabel && <p className="text-xs mt-0.5 opacity-70">{sublabel}</p>}
    </button>
  );
}

function StepHasHouse({
  value, onChange, onBack,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">4 / 5</p>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
          주택을 소유한 적이<br />있으신가요?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          생애최초이면 취득세 감면 혜택과<br />더 높은 LTV가 적용돼요.
        </p>
      </div>
      <div className="space-y-3">
        <ChoiceCard
          label="아니요, 생애 처음이에요"
          sublabel="취득세 최대 200만원 감면 + LTV 우대"
          selected={value === true}
          onClick={() => onChange(true)}
        />
        <ChoiceCard
          label="네, 보유 이력 있어요"
          sublabel="일반 LTV 기준 적용"
          selected={value === false}
          onClick={() => onChange(false)}
        />
      </div>
      <div className="text-center">
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
}

function StepLocation({
  value, onChange, onBack,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">5 / 5</p>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
          어느 지역에서<br />집을 구하고 계세요?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          서울 전역은 투기과열지구(규제지역)예요.<br />규제지역 여부에 따라 LTV·DSR 계산이 달라져요.
        </p>
      </div>
      <div className="space-y-3">
        <ChoiceCard
          label="수도권 또는 규제지역"
          sublabel="서울·경기 일부 · 스트레스 DSR +3.0%p"
          selected={value === true}
          onClick={() => onChange(true)}
        />
        <ChoiceCard
          label="지방 또는 비규제지역"
          sublabel="수도권 외 · 스트레스 DSR +0.75%p"
          selected={value === false}
          onClick={() => onChange(false)}
        />
      </div>
      <div className="text-center">
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
}

function StepCalculating() {
  return (
    <div className="text-center space-y-8 py-8">
      <div className="flex justify-center">
        <div className="relative w-20 h-20">
          {/* Spinning ring */}
          <svg className="absolute inset-0 animate-spin" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              stroke="#10b981" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="60 150"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <HomeIcon size={24} strokeWidth={1.75} className="text-emerald-500" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">계산 중이에요...</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">DSR · LTV · 취득세 반영 중</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{value}</span>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function StepResult({
  result, onRetry,
  cash, income, isFirstHome, isRegulated, age,
}: {
  result: CalcResult;
  onRetry: () => void;
  cash: number;
  income: number;
  isFirstHome: boolean;
  isRegulated: boolean;
  age: number;
}) {
  const loanForUrl = Math.round(result.loanAmountWon / 1e4);
  const dsrRate = result.stressRate.toFixed(2);

  return (
    <div className="space-y-5">
      {/* 결과 메인 카드 */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-2 result-enter">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">최대 구매 가능 주택가</p>
        <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300 leading-tight">
          약 {fmtEok(result.maxHousePrice)}
        </p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {fmtEokDetailed(result.maxHousePrice)}
        </p>
        <div className="pt-1">
          <span className={`inline-block text-[11px] px-3 py-1 rounded-full font-semibold ${
            result.ltvLimited
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
          }`}>
            {result.ltvLimited ? "현금(LTV) 제약" : "DSR(소득) 제약"}
          </span>
        </div>
      </div>

      {/* 구성 내역 */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-1">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">구성 내역</p>
        <DetailRow label="내 현금 (투입)" value={fmtMan(cash)} />
        <DetailRow
          label={`주담대 (LTV ${(result.ltv * 100).toFixed(0)}%)`}
          value={fmtEokDetailed(result.loanAmountWon)}
          sub={`기준금리 4.0% + 스트레스 ${(result.stressRate - 4.0).toFixed(2)}%p = ${dsrRate}% 심사`}
        />
        <DetailRow
          label="취득세 + 복비 + 법무사"
          value={fmtMan(result.acquisitionCosts)}
          sub={isFirstHome ? "생애최초 취득세 감면 적용" : undefined}
        />
        <DetailRow
          label="자기자금 (주택가 - 대출)"
          value={fmtEokDetailed(result.selfFundWon)}
        />
      </div>

      {/* 계산 조건 요약 */}
      <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">계산 조건</p>
        <p>연소득 {fmtMan(income)} · 만 {age}세 · {isFirstHome ? "생애최초" : "유주택이력"} · {isRegulated ? "규제지역" : "비규제지역"}</p>
        <p>대출기간 30년 · 원리금균등상환 · DSR 40% 상한</p>
        {getFutureIncomeRate(age) > 0 && (
          <p className="text-emerald-600 dark:text-emerald-400">장래소득 +{getFutureIncomeRate(age)}% 반영됨</p>
        )}
      </div>

      {/* 주의사항 */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        실제 승인 한도는 은행별 내부 심사 기준, 직업 안정성, 기존 부채에 따라 달라질 수 있어요. 이 결과는 참고용 추정치입니다.
      </div>

      {/* 연결 링크 */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">세부 계산기로 이어보기</p>
        <Link
          href={`/total-cost`}
          className="flex items-center justify-between py-2.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition group"
        >
          <div className="flex items-center gap-2">
            <Calculator size={15} strokeWidth={1.75} className="text-emerald-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">총비용 계산기</span>
          </div>
          <ChevronRight size={14} strokeWidth={1.75} className="text-slate-400" />
        </Link>
        <Link
          href={`/loan?amount=${Math.round(result.maxHousePrice / 1e4)}`}
          className="flex items-center justify-between py-2.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition group border-t border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center gap-2">
            <Landmark size={15} strokeWidth={1.75} className="text-emerald-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">주담대 계산기</span>
          </div>
          <ChevronRight size={14} strokeWidth={1.75} className="text-slate-400" />
        </Link>
        <Link
          href={`/dsr?newAmount=${loanForUrl}&newYears=30&newRate=4.0`}
          className="flex items-center justify-between py-2.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition group border-t border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={15} strokeWidth={1.75} className="text-emerald-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">DSR 계산기</span>
          </div>
          <ChevronRight size={14} strokeWidth={1.75} className="text-slate-400" />
        </Link>
      </div>

      {/* 다시하기 + 계산기 모음 */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition btn-press"
        >
          <RotateCcw size={14} strokeWidth={1.75} />
          다시 계산
        </button>
        <Link
          href="/hub"
          className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition btn-press"
        >
          계산기 모음
          <ChevronRight size={14} strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────

export default function WizardPage() {
  useVisitorTracking("/");

  const [step, setStep] = useState<Step>("welcome");
  const [visible, setVisible] = useState(true);

  // 입력값
  const [cash, setCash] = useState("");
  const [income, setIncome] = useState("");
  const [age, setAge] = useState("");
  const [isFirstHome, setIsFirstHome] = useState<boolean | null>(null);
  const [isRegulated, setIsRegulated] = useState<boolean | null>(null);
  const [result, setResult] = useState<CalcResult | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const progress = (STEP_INDEX[step] / TOTAL_STEPS) * 100;

  const transition = (nextStep: Step) => {
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
      setTimeout(() => inputRef.current?.focus(), 120);
    }, 250);
  };

  // calculating 단계: 1.8초 후 계산 실행 → result
  useEffect(() => {
    if (step !== "calculating") return;
    const timer = setTimeout(() => {
      const r = calculate(
        parseFloat(cash) * 1e4,
        parseFloat(income) * 1e4,
        parseInt(age),
        isFirstHome ?? false,
        isRegulated ?? false
      );
      setResult(r);
      setVisible(false);
      setTimeout(() => { setStep("result"); setVisible(true); }, 250);
    }, 1800);
    return () => clearTimeout(timer);
  }, [step, cash, income, age, isFirstHome, isRegulated]);

  const handleRetry = () => {
    setCash("");
    setIncome("");
    setAge("");
    setIsFirstHome(null);
    setIsRegulated(null);
    setResult(null);
    setVisible(false);
    setTimeout(() => { setStep("cash"); setVisible(true); }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      {/* 상단 진행 바 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 z-50">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-md mx-auto px-5 pt-10 pb-20">
        {/* 헤더: 로고 + 허브 링크 + 다크모드 */}
        <div className="flex items-center gap-2 mb-10">
          <Link href="/" className="inline-flex items-center gap-0.5 link-press">
            <Image src="/logo.svg" alt="똑집" width={32} height={32} className="h-8 w-auto" priority />
            <span className="font-brand text-xl tracking-tight leading-none select-none text-black dark:text-white">똑집</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {step !== "welcome" && step !== "calculating" && step !== "result" && (
              <Link href="/hub" className="text-xs text-slate-400 hover:text-emerald-600 transition link-press">
                계산기 모음
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* 스텝 컨텐츠 (페이드 전환) */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}
        >
          {step === "welcome" && (
            <StepWelcome onStart={() => transition("cash")} />
          )}
          {step === "cash" && (
            <StepCash
              value={cash}
              onChange={setCash}
              onNext={() => transition("income")}
              onBack={() => transition("welcome")}
              inputRef={inputRef}
            />
          )}
          {step === "income" && (
            <StepIncome
              value={income}
              onChange={setIncome}
              onNext={() => transition("age")}
              onBack={() => transition("cash")}
              inputRef={inputRef}
            />
          )}
          {step === "age" && (
            <StepAge
              value={age}
              onChange={setAge}
              onNext={() => transition("hasHouse")}
              onBack={() => transition("income")}
              inputRef={inputRef}
            />
          )}
          {step === "hasHouse" && (
            <StepHasHouse
              value={isFirstHome}
              onChange={(v) => { setIsFirstHome(v); transition("location"); }}
              onBack={() => transition("age")}
            />
          )}
          {step === "location" && (
            <StepLocation
              value={isRegulated}
              onChange={(v) => { setIsRegulated(v); transition("calculating"); }}
              onBack={() => transition("hasHouse")}
            />
          )}
          {step === "calculating" && <StepCalculating />}
          {step === "result" && result && (
            <StepResult
              result={result}
              onRetry={handleRetry}
              cash={parseFloat(cash) * 1e4}
              income={parseFloat(income) * 1e4}
              isFirstHome={isFirstHome ?? false}
              isRegulated={isRegulated ?? false}
              age={parseInt(age)}
            />
          )}
        </div>
      </div>

      <style>{`
        .result-enter {
          animation: fadeSlideUp 0.4s ease;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
