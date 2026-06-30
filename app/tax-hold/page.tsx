"use client";

import { useState } from "react";
import Link from "next/link";

// ✅ 법령 출처
// 재산세: 지방세법 제110조(과세표준), 제111조(세율), 제111조의2(1세대1주택 특례), 제122조(세부담상한)
// 종부세: 종합부동산세법 제8조(과세표준), 제9조(세율 및 세액), 제10조(세부담상한)

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

// ── 재산세 ──────────────────────────────
// 공정시장가액비율: 일반주택 60%, 1세대1주택 45% (지방세법 제110조제1항, 시행령 통상치)
const FAIR_VALUE_RATIO_GENERAL = 0.6;
const FAIR_VALUE_RATIO_ONE_HOUSE = 0.45;

function getPropertyTaxStandard(base: number): number {
  // 제111조제1항제3호나목 (일반 주택)
  if (base <= 60_000_000) return base * 0.001;
  if (base <= 150_000_000) return 60_000 + (base - 60_000_000) * 0.0015;
  if (base <= 300_000_000) return 195_000 + (base - 150_000_000) * 0.0025;
  return 570_000 + (base - 300_000_000) * 0.004;
}

function getPropertyTaxOneHouse(base: number): number {
  // 제111조의2제1항 (1세대1주택 특례, 시가표준액 9억 이하만 적용)
  if (base <= 60_000_000) return base * 0.0005;
  if (base <= 150_000_000) return 30_000 + (base - 60_000_000) * 0.001;
  if (base <= 300_000_000) return 120_000 + (base - 150_000_000) * 0.002;
  return 420_000 + (base - 300_000_000) * 0.0035;
}

// ── 종합부동산세 ──────────────────────────────
// 공정시장가액비율: 60% (2023년 기준, 매년 시행령으로 변경될 수 있음)
const CSV_FAIR_VALUE_RATIO = 0.6;

const ONE_HOUSE_DEDUCTION = 1_200_000_000; // 1세대1주택자 12억
const GENERAL_DEDUCTION = 900_000_000; // 그 외 9억

// 종부세 산출 (제9조제1항) - 구간별 직접 계산

function calcCSVBeforeCredit(base: number, is3PlusHouses: boolean): number {
  if (!is3PlusHouses) {
    // 제9조제1항제1호 (2주택 이하)
    if (base <= 300_000_000) return base * 0.005;
    if (base <= 600_000_000) return 1_500_000 + (base - 300_000_000) * 0.007;
    if (base <= 1_200_000_000) return 3_600_000 + (base - 600_000_000) * 0.01;
    if (base <= 2_500_000_000) return 9_600_000 + (base - 1_200_000_000) * 0.013;
    if (base <= 5_000_000_000) return 26_500_000 + (base - 2_500_000_000) * 0.015;
    if (base <= 9_400_000_000) return 64_000_000 + (base - 5_000_000_000) * 0.02;
    return 152_000_000 + (base - 9_400_000_000) * 0.027;
  } else {
    // 제9조제1항제2호 (3주택 이상)
    if (base <= 300_000_000) return base * 0.005;
    if (base <= 600_000_000) return 1_500_000 + (base - 300_000_000) * 0.007;
    if (base <= 1_200_000_000) return 3_600_000 + (base - 600_000_000) * 0.01;
    if (base <= 2_500_000_000) return 9_600_000 + (base - 1_200_000_000) * 0.02;
    if (base <= 5_000_000_000) return 35_600_000 + (base - 2_500_000_000) * 0.03;
    if (base <= 9_400_000_000) return 110_600_000 + (base - 5_000_000_000) * 0.04;
    return 286_600_000 + (base - 9_400_000_000) * 0.05;
  }
}

// 법인 종부세 (제9조제2항) - 공제 없이 단일세율
function calcCSVCorporation(base: number, is3PlusHouses: boolean): number {
  return base * (is3PlusHouses ? 0.05 : 0.027);
}

// 1세대1주택 고령자/장기보유 공제 (제9조제5항~9항) - 중복적용 시 최대 80%
function getOneHouseDeductionRate(age: number, holdingYears: number): number {
  let ageRate = 0;
  if (age >= 70) ageRate = 0.4;
  else if (age >= 65) ageRate = 0.3;
  else if (age >= 60) ageRate = 0.2;

  let holdingRate = 0;
  if (holdingYears >= 15) holdingRate = 0.5;
  else if (holdingYears >= 10) holdingRate = 0.4;
  else if (holdingYears >= 5) holdingRate = 0.2;

  return Math.min(ageRate + holdingRate, 0.8);
}

type HouseCountCSV = "1" | "2" | "3+";

export default function TaxHoldPage() {
  const [priceInput, setPriceInput] = useState(""); // 공시가격, 만원 단위
  const [isOneHouse, setIsOneHouse] = useState(true);
  const [isCorporation, setIsCorporation] = useState(false);
  const [houseCountCSV, setHouseCountCSV] = useState<HouseCountCSV>("1");

  // 1세대1주택 공제 옵션
  const [applyOneHouseDeduction, setApplyOneHouseDeduction] = useState(false);
  const [age, setAge] = useState("");
  const [holdingYears, setHoldingYears] = useState("");

  const [result, setResult] = useState<{
    propertyTax: number;
    csvBase: number;
    csvBeforeDeduction: number;
    csvDeductionAmount: number;
    csvFinal: number;
    totalHoldingTax: number;
  } | null>(null);

  const calculate = () => {
    const price = Number(priceInput) * 10000;
    if (!price) {
      alert("공시가격을 입력해주세요.");
      return;
    }

    // ── 재산세 계산 ──
    const fairRatio = isOneHouse && !isCorporation ? FAIR_VALUE_RATIO_ONE_HOUSE : FAIR_VALUE_RATIO_GENERAL;
    const propertyTaxBase = price * fairRatio;
    const propertyTax =
      isOneHouse && !isCorporation && price <= 900_000_000
        ? getPropertyTaxOneHouse(propertyTaxBase)
        : getPropertyTaxStandard(propertyTaxBase);

    // ── 종합부동산세 계산 ──
    const deduction = isOneHouse && !isCorporation ? ONE_HOUSE_DEDUCTION : GENERAL_DEDUCTION;
    const csvTaxBase = Math.max(price - deduction, 0) * CSV_FAIR_VALUE_RATIO;

    let csvBeforeDeduction = 0;
    const is3Plus = houseCountCSV === "3+";

    if (isCorporation) {
      csvBeforeDeduction = calcCSVCorporation(csvTaxBase, is3Plus);
    } else {
      csvBeforeDeduction = calcCSVBeforeCredit(csvTaxBase, is3Plus);
    }

    // 재산세 공제(종부세법 제9조제3항)는 홈택스에서 자동 반영되므로 여기서는 계산하지 않음.
    // 세부담 상한(종부세법 제10조, 지방세법 제122조)도 직전연도 세액 정보가 없어 미반영.

    // 1세대1주택 고령자/장기보유 공제
    let csvDeductionAmount = 0;
    if (applyOneHouseDeduction && isOneHouse && !isCorporation) {
      const rate = getOneHouseDeductionRate(Number(age), Number(holdingYears));
      csvDeductionAmount = csvBeforeDeduction * rate;
    }

    const finalCSV = Math.max(csvBeforeDeduction - csvDeductionAmount, 0);
    const totalHoldingTax = propertyTax + finalCSV;

    setResult({
      propertyTax,
      csvBase: csvTaxBase,
      csvBeforeDeduction,
      csvDeductionAmount,
      csvFinal: finalCSV,
      totalHoldingTax,
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition"
        >
          ← 메인으로
        </Link>

        <h1 className="text-xl font-bold text-slate-800">🏢 보유세 계산기 (재산세 + 종합부동산세)</h1>

        {/* 기본 정보 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">주택 정보 입력</h2>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">주택 공시가격 (만원)</label>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="예: 100000 (= 10억원)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 적용 옵션 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">적용 옵션</h2>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isCorporation}
              onChange={(e) => setIsCorporation(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            법인 명의 보유 (종부세 단일세율 적용)
          </label>

          {!isCorporation && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isOneHouse}
                onChange={(e) => setIsOneHouse(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
              1세대 1주택자 (재산세 특례 + 종부세 12억 공제)
            </label>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              종부세 산정용 보유 주택수
            </label>
            <div className="flex gap-2">
              {(["1", "2", "3+"] as HouseCountCSV[]).map((h) => (
                <button
                  key={h}
                  onClick={() => setHouseCountCSV(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    houseCountCSV === h
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  {h}주택
                </button>
              ))}
            </div>
          </div>

          {isOneHouse && !isCorporation && (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  checked={applyOneHouseDeduction}
                  onChange={(e) => setApplyOneHouseDeduction(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                고령자·장기보유 종부세 공제 적용
              </label>

              {applyOneHouseDeduction && (
                <div className="ml-6 grid grid-cols-2 gap-3 border-l-2 border-emerald-100 pl-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">만 나이</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="예: 65"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">보유기간 (년)</label>
                    <input
                      type="number"
                      value={holdingYears}
                      onChange={(e) => setHoldingYears(e.target.value)}
                      placeholder="예: 10"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={calculate}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
        >
          계산하기
        </button>

        {/* 결과 */}
        {result && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-600">계산 결과</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">재산세</span>
                <span className="font-bold">{fmtWon(result.propertyTax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">종부세 과세표준</span>
                <span className="font-bold">{fmtWon(result.csvBase)}</span>
              </div>
              {result.csvDeductionAmount > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">고령자·장기보유 세액공제</span>
                  <span className="font-bold text-emerald-600">
                    -{fmtWon(result.csvDeductionAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">종합부동산세</span>
                <span className="font-bold">{fmtWon(result.csvFinal)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mt-3">
              <p className="text-xs text-emerald-600 font-semibold mb-1">총 보유세 (재산세 + 종부세)</p>
              <p className="text-2xl font-black text-emerald-700">{fmtWon(result.totalHoldingTax)}</p>
              <p className="text-[10px] text-emerald-500 mt-1">
                (지방교육세, 농어촌특별세 등 부가세 별도)
              </p>
            </div>

            <p className="text-[10px] text-slate-400 pt-2 leading-relaxed">
              출처: 지방세법 제110조·제111조·제111조의2(재산세), 종합부동산세법 제8조·제9조(종부세).
              재산세 상당액 공제(종부세법 제9조제3항)는 홈택스 자동산정 영역으로 별도 반영하지
              않았습니다. 본 계산은 참고용이며 실제 세액은 홈택스 또는 세무 전문가 확인이 필요합니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}