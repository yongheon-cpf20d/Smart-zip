"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TrendingUp } from "lucide-react";
import PriceInput from "@/components/PriceInput";
import ShareButton from "@/components/ShareButton"; // ✅ 1. 공유 버튼 컴포넌트 임포트

// ✅ 법령 출처: 소득세법 제55조(세율), 제95조(장기보유특별공제), 제103조(기본공제), 제104조(양도소득세 세율)
// 규제 변경 시 이 파일의 세율표/공제율만 수정하면 전체 반영됨.

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

// ── 종합소득세 기본세율 (제55조제1항) — 2년 이상 보유 시 적용 ──
function getBasicTaxRate(base: number): number {
  if (base <= 14_000_000) return base * 0.06;
  if (base <= 50_000_000) return 840_000 + (base - 14_000_000) * 0.15;
  if (base <= 88_000_000) return 6_240_000 + (base - 50_000_000) * 0.24;
  if (base <= 150_000_000) return 15_360_000 + (base - 88_000_000) * 0.35;
  if (base <= 300_000_000) return 37_060_000 + (base - 150_000_000) * 0.38;
  if (base <= 500_000_000) return 94_060_000 + (base - 300_000_000) * 0.4;
  if (base <= 1_000_000_000) return 174_060_000 + (base - 500_000_000) * 0.42;
  return 384_060_000 + (base - 1_000_000_000) * 0.45;
}

// ── 단기 보유세율 (제104조제1항제2호, 제3호) — 주택/조합원입주권/분양권 기준 ──
function getShortTermRate(holdingYears: number): number | null {
  if (holdingYears < 1) return 0.7; // 1년 미만 70%
  if (holdingYears < 2) return 0.6; // 1~2년 미만 60%
  return null; // 2년 이상은 기본세율 적용
}

// ── 다주택 중과 가산 (제104조제7항) — 조정대상지역만 적용 ──
function getMultiHouseSurcharge(houseCount: "1" | "2" | "3+", isAdjusted: boolean): number {
  if (!isAdjusted) return 0; // 비조정지역은 중과 없음
  if (houseCount === "2") return 0.2; // +20%p
  if (houseCount === "3+") return 0.3; // +30%p
  return 0;
}

// ── 1세대1주택 장기보유특별공제 (제95조제2항 표2) ──
function getOneHouseLTCG(holdingYears: number, livingYears: number): number {
  if (holdingYears < 3) return 0;
  if (livingYears < 2) return getGeneralLTCG(holdingYears);
  const holdingRate = Math.min(Math.floor(holdingYears) * 0.04, 0.4);
  const livingRate = Math.min(Math.floor(livingYears) * 0.04, 0.4);
  return Math.min(holdingRate + livingRate, 0.8);
}

// ── 일반 장기보유특별공제 (제95조제2항 표1) — 3년 이상부터 ──
function getGeneralLTCG(holdingYears: number): number {
  if (holdingYears < 3) return 0;
  const rate = Math.min(Math.floor(holdingYears) * 0.02, 0.3); // 연 2%, 최대 30%
  return rate;
}

const BASIC_DEDUCTION = 2_500_000;
const ONE_HOUSE_NONTAX_LIMIT = 1_200_000_000;

type HouseCount = "1" | "2" | "3+";

function TaxSellPageContent() {
  const searchParams = useSearchParams();
  const resultRef = useRef<HTMLDivElement>(null);

  const [salePrice, setSalePrice] = useState(""); 
  const [purchasePrice, setPurchasePrice] = useState(""); 
  const [otherExpenses, setOtherExpenses] = useState(""); 
  const [holdingYears, setHoldingYears] = useState("");

  const [isOneHouse, setIsOneHouse] = useState(true);
  const [livingYears, setLivingYears] = useState("");
  const [meetsNonTaxRequirement, setMeetsNonTaxRequirement] = useState(true);

  const [applyMultiHouseTax, setApplyMultiHouseTax] = useState(false);
  const [houseCount, setHouseCount] = useState<HouseCount>("2");
  const [isAdjustedArea, setIsAdjustedArea] = useState(false);

  const [result, setResult] = useState<{
    gainBeforeLTCG: number;
    ltcgRate: number;
    ltcgAmount: number;
    taxableGain: number;
    appliedRate: number;
    isShortTerm: boolean;
    surchargeRate: number;
    tax: number;
    localTax: number;
    totalTax: number;
    isNonTaxable: boolean;
    nonTaxableNote: string;
  } | null>(null);

  // ✅ 2. URL 쿼리 파라미터로 상태값 복원 (Hydration)
  useEffect(() => {
    const spSale = searchParams.get("sale");
    if (spSale) {
      setSalePrice(spSale);
      if (searchParams.get("purchase")) setPurchasePrice(searchParams.get("purchase")!);
      if (searchParams.get("expenses")) setOtherExpenses(searchParams.get("expenses")!);
      if (searchParams.get("holdingYears")) setHoldingYears(searchParams.get("holdingYears")!);
      if (searchParams.get("isOneHouse")) setIsOneHouse(searchParams.get("isOneHouse") === "true");
      if (searchParams.get("livingYears")) setLivingYears(searchParams.get("livingYears")!);
      if (searchParams.get("meetsNonTaxRequirement")) setMeetsNonTaxRequirement(searchParams.get("meetsNonTaxRequirement") === "true");
      if (searchParams.get("applyMultiHouseTax")) setApplyMultiHouseTax(searchParams.get("applyMultiHouseTax") === "true");
      if (searchParams.get("houseCount")) setHouseCount(searchParams.get("houseCount") as HouseCount);
      if (searchParams.get("isAdjustedArea")) setIsAdjustedArea(searchParams.get("isAdjustedArea") === "true");
    }
  }, [searchParams]);

  // ✅ 3. 필수 입력값(양도/취득가액)이 링크에 있으면 즉시 계산 (Auto-Run)
  useEffect(() => {
    const spSale = searchParams.get("sale");
    const spPurchase = searchParams.get("purchase");

    if (spSale && spPurchase) {
      const t = setTimeout(() => {
        calculate({
          sale: spSale,
          purchase: spPurchase,
          expenses: searchParams.get("expenses") || "",
          holdingYears: searchParams.get("holdingYears") || "",
          isOneHouse: searchParams.get("isOneHouse") !== "false", // 기본값 true
          livingYears: searchParams.get("livingYears") || "",
          meetsNonTaxRequirement: searchParams.get("meetsNonTaxRequirement") !== "false", // 기본값 true
          applyMultiHouseTax: searchParams.get("applyMultiHouseTax") === "true",
          houseCount: (searchParams.get("houseCount") as HouseCount) || "2", // 기본값 2
          isAdjustedArea: searchParams.get("isAdjustedArea") === "true",
        });
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 4. 계산 함수 (URL 강제 주입용 overrideParams 허용)
  const calculate = (overrideParams?: {
    sale: string;
    purchase: string;
    expenses: string;
    holdingYears: string;
    isOneHouse: boolean;
    livingYears: string;
    meetsNonTaxRequirement: boolean;
    applyMultiHouseTax: boolean;
    houseCount: HouseCount;
    isAdjustedArea: boolean;
  }) => {
    const tSale = overrideParams ? overrideParams.sale : salePrice;
    const tPurchase = overrideParams ? overrideParams.purchase : purchasePrice;
    const tExpenses = overrideParams ? overrideParams.expenses : otherExpenses;
    const tHoldingYears = overrideParams ? overrideParams.holdingYears : holdingYears;
    const tIsOneHouse = overrideParams ? overrideParams.isOneHouse : isOneHouse;
    const tLivingYears = overrideParams ? overrideParams.livingYears : livingYears;
    const tMeetsNonTaxReq = overrideParams ? overrideParams.meetsNonTaxRequirement : meetsNonTaxRequirement;
    const tApplyMulti = overrideParams ? overrideParams.applyMultiHouseTax : applyMultiHouseTax;
    const tHouseCount = overrideParams ? overrideParams.houseCount : houseCount;
    const tIsAdjusted = overrideParams ? overrideParams.isAdjustedArea : isAdjustedArea;

    const sale = Number(tSale) * 10000;
    const purchase = Number(tPurchase) * 10000;
    const expenses = Number(tExpenses) * 10000;
    const years = Number(tHoldingYears);

    if (!sale || !purchase) {
      alert("양도가액과 취득가액을 입력해주세요.");
      return;
    }

    const gainBeforeLTCGRaw = Math.max(sale - purchase - expenses, 0);

    let isNonTaxable = false;
    let nonTaxableNote = "";
    let gainBeforeLTCG = gainBeforeLTCGRaw;

    if (tIsOneHouse && tMeetsNonTaxReq) {
      if (sale <= ONE_HOUSE_NONTAX_LIMIT) {
        isNonTaxable = true;
        nonTaxableNote = "양도가액이 12억원 이하로 전액 비과세 대상입니다.";
        gainBeforeLTCG = 0;
      } else {
        const taxablePortion = (sale - ONE_HOUSE_NONTAX_LIMIT) / sale;
        gainBeforeLTCG = gainBeforeLTCGRaw * taxablePortion;
        nonTaxableNote = `고가주택(12억원 초과)으로 과세대상 양도차익만 계산되었습니다. (전체 차익의 ${(taxablePortion * 100).toFixed(1)}%만 과세)`;
      }
    }

    if (isNonTaxable) {
      setResult({
        gainBeforeLTCG: 0,
        ltcgRate: 0,
        ltcgAmount: 0,
        taxableGain: 0,
        appliedRate: 0,
        isShortTerm: false,
        surchargeRate: 0,
        tax: 0,
        localTax: 0,
        totalTax: 0,
        isNonTaxable: true,
        nonTaxableNote,
      });
      setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
      return;
    }

    const isMultiHouseSurchargeApplied = tApplyMulti && getMultiHouseSurcharge(tHouseCount, tIsAdjusted) > 0;

    let ltcgRate = 0;
    if (isMultiHouseSurchargeApplied) {
      ltcgRate = 0; 
    } else if (tIsOneHouse) {
      ltcgRate = getOneHouseLTCG(years, Number(tLivingYears));
    } else {
      ltcgRate = getGeneralLTCG(years);
    }
    const ltcgAmount = gainBeforeLTCG * ltcgRate;

    const gainAfterLTCG = gainBeforeLTCG - ltcgAmount;
    const taxableGain = Math.max(gainAfterLTCG - BASIC_DEDUCTION, 0);

    const shortTermRate = getShortTermRate(years);
    const isShortTermHolding = shortTermRate !== null;
    let appliedRate = 0;
    let surchargeRate = 0;

    let basicTax = getBasicTaxRate(taxableGain);
    let basicAppliedRate = 0;
    if (tApplyMulti) {
      surchargeRate = getMultiHouseSurcharge(tHouseCount, tIsAdjusted);
      basicTax += taxableGain * surchargeRate;
    }
    basicAppliedRate = basicTax / (taxableGain || 1);

    let tax = 0;
    let isShortTermApplied = false;

    if (isShortTermHolding) {
      const shortTermTax = taxableGain * shortTermRate!;
      if (shortTermTax > basicTax) {
        tax = shortTermTax;
        appliedRate = shortTermRate!;
        isShortTermApplied = true;
      } else {
        tax = basicTax;
        appliedRate = basicAppliedRate;
      }
    } else {
      tax = basicTax;
      appliedRate = basicAppliedRate;
    }

    const localTax = tax * 0.1;
    const totalTax = tax + localTax;

    setResult({
      gainBeforeLTCG,
      ltcgRate,
      ltcgAmount,
      taxableGain,
      appliedRate,
      isShortTerm: isShortTermApplied,
      surchargeRate: isShortTermApplied ? 0 : surchargeRate,
      tax,
      localTax,
      totalTax,
      isNonTaxable: false,
      nonTaxableNote,
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press"
        >
          ← 메인으로
        </Link>

        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <TrendingUp size={20} strokeWidth={1.75} className="text-emerald-600" />
          양도소득세 계산기
        </h1>

        {/* 거래 정보 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">거래 정보 입력</h2>

          <div className="grid grid-cols-2 gap-3">
            <PriceInput
              label="양도가액 (만원)"
              value={salePrice}
              onChange={setSalePrice}
              placeholder="예: 150000"
            />
            <PriceInput
              label="취득가액 (만원)"
              value={purchasePrice}
              onChange={setPurchasePrice}
              placeholder="예: 100000"
            />
          </div>

          <PriceInput
            label="필요경비 (만원) — 중개수수료, 취득세, 법무사비 등"
            value={otherExpenses}
            onChange={setOtherExpenses}
            placeholder="예: 1000"
          />

          <div>
            <label className="text-xs text-slate-400 mb-1 block">보유기간 (년)</label>
            <input
              type="number"
              value={holdingYears}
              onChange={(e) => setHoldingYears(e.target.value)}
              placeholder="예: 7"
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
              checked={isOneHouse}
              onChange={(e) => setIsOneHouse(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            1세대 1주택 (장기보유특별공제 최대 80%)
          </label>

          {isOneHouse && (
            <div className="ml-6 space-y-3 border-l-2 border-emerald-100 pl-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={meetsNonTaxRequirement}
                  onChange={(e) => setMeetsNonTaxRequirement(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                비과세 요건 충족 (2년 이상 보유, 조정지역은 거주요건 포함)
              </label>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">거주기간 (년)</label>
                <input
                  type="number"
                  value={livingYears}
                  onChange={(e) => setLivingYears(e.target.value)}
                  placeholder="예: 5"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {meetsNonTaxRequirement && (
                <p className="text-[11px] text-emerald-600">
                  양도가액 12억원까지는 비과세, 초과분(고가주택)은 그 초과 비율만큼만 과세됩니다.
                </p>
              )}
            </div>
          )}

          {!isOneHouse && (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  checked={applyMultiHouseTax}
                  onChange={(e) => setApplyMultiHouseTax(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                다주택자 양도세 중과 적용
              </label>
              <p className="text-[11px] text-slate-400 -mt-2">
                세대 전체 주택수와 별개로, 지금 양도하는 이 주택이 조정대상지역에 있는 경우에만 중과됩니다.
              </p>

              {applyMultiHouseTax && (
                <div className="ml-6 space-y-3 border-l-2 border-emerald-100 pl-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">보유 주택수 (양도 주택 포함)</label>
                    <div className="flex gap-2">
                      {(["2", "3+"] as HouseCount[]).map((h) => (
                        <button
                          key={h}
                          onClick={() => setHouseCount(h)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            houseCount === h
                              ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          {h}주택
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAdjustedArea}
                      onChange={(e) => setIsAdjustedArea(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    조정대상지역 소재 (중과 적용 조건)
                  </label>

                  {!isAdjustedArea && (
                    <p className="text-[11px] text-amber-600">
                      비조정대상지역은 다주택 중과가 적용되지 않습니다.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => calculate()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition btn-press"
        >
          계산하기
        </button>

        {/* 결과 - 비과세일 때 */}
        {result && result.isNonTaxable && (
          <div ref={resultRef} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 result-enter">
            <h2 className="text-sm font-bold text-slate-600">계산 결과</h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <p className="text-xs text-emerald-600 font-semibold mb-1">1세대 1주택 비과세</p>
              <p className="text-2xl font-black text-emerald-700">0원</p>
              <p className="text-xs text-emerald-600 mt-2">{result.nonTaxableNote}</p>
            </div>
            
            {/* ✅ 5-1. 공유하기 버튼 (비과세 결과) */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <ShareButton
                title="양도소득세 비과세 확인 - 똑집"
                description={`양도가액 ${fmtWon(Number(salePrice)*10000)} 기준, 1세대 1주택 비과세 대상 (납부세액 0원)`}
                params={{
                  sale: salePrice, purchase: purchasePrice, expenses: otherExpenses, holdingYears,
                  isOneHouse: String(isOneHouse), livingYears, meetsNonTaxRequirement: String(meetsNonTaxRequirement),
                  applyMultiHouseTax: String(applyMultiHouseTax), houseCount, isAdjustedArea: String(isAdjustedArea),
                }}
              />
            </div>

            <p className="text-[10px] text-slate-400 pt-2 leading-relaxed border-t border-slate-100 mt-4">
              출처: 소득세법 제89조제1항제3호. 2년 이상 보유(조정대상지역 취득 시 2년 이상 거주 포함) 등
              비과세 요건은 사용자가 직접 확인한 것으로 간주하였습니다. 실제 요건 충족 여부는
              세무 전문가 확인이 필요합니다.
            </p>
          </div>
        )}

        {/* 결과 - 과세 대상일 때 */}
        {result && !result.isNonTaxable && (
          <div ref={resultRef} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 result-enter">
            <h2 className="text-sm font-bold text-slate-600">계산 결과</h2>

            {result.nonTaxableNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                {result.nonTaxableNote}
              </div>
            )}

            {result.isShortTerm && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                보유기간 2년 미만 단기세율({(result.appliedRate * 100).toFixed(0)}%)이 적용되었습니다.
              </div>
            )}

            {!result.isShortTerm && result.surchargeRate > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                다주택자 중과(+{(result.surchargeRate * 100).toFixed(0)}%p)가 적용되었습니다.
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">양도차익</span>
                <span className="font-bold">{fmtWon(result.gainBeforeLTCG)}</span>
              </div>
              {result.ltcgAmount > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    장기보유특별공제 ({(result.ltcgRate * 100).toFixed(0)}%)
                  </span>
                  <span className="font-bold text-emerald-600">-{fmtWon(result.ltcgAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">과세표준 (기본공제 250만원 차감 후)</span>
                <span className="font-bold">{fmtWon(result.taxableGain)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">양도소득세</span>
                <span className="font-bold">{fmtWon(result.tax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">지방소득세 (양도세의 10%)</span>
                <span className="font-bold">{fmtWon(result.localTax)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mt-3">
              <p className="text-xs text-emerald-600 font-semibold mb-1">총 납부세액</p>
              <p className="text-2xl font-black text-emerald-700">{fmtWon(result.totalTax)}</p>
            </div>

            {/* ✅ 5-2. 공유하기 버튼 (과세 결과) */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <ShareButton
                title="양도소득세 계산 결과 - 똑집"
                description={`양도가액 ${fmtWon(Number(salePrice)*10000)} 기준, 예상 납부세액 ${fmtWon(result.totalTax)}`}
                params={{
                  sale: salePrice, purchase: purchasePrice, expenses: otherExpenses, holdingYears,
                  isOneHouse: String(isOneHouse), livingYears, meetsNonTaxRequirement: String(meetsNonTaxRequirement),
                  applyMultiHouseTax: String(applyMultiHouseTax), houseCount, isAdjustedArea: String(isAdjustedArea),
                }}
              />
            </div>

            <p className="text-[10px] text-slate-400 pt-2 leading-relaxed mt-4">
              출처: 소득세법 제55조(기본세율), 제89조(1세대1주택 비과세), 제95조(장기보유특별공제),
              제103조(양도소득 기본공제), 제104조(세율 및 다주택 중과).
              다주택 중과는 양도하는 주택이 조정대상지역에 있는 경우에만 적용되며, 세대 전체 주택수와
              무관하게 비조정지역 주택 양도 시에는 중과되지 않습니다. 본 계산은 참고용이며
              실제 세액은 세무 전문가 확인이 필요합니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ✅ 6. Next.js App Router용 안전한 Suspense 컴포넌트 처리
export default function TaxSellPage() {
  return (
    <Suspense fallback={null}>
      <TaxSellPageContent />
    </Suspense>
  );
}