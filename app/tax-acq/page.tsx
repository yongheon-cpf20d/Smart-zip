"use client";

import { useState } from "react";
import Link from "next/link";

// ✅ 법령 출처: 지방세법 제11조(부동산 취득의 세율), 제13조의2(법인의 주택 취득 등 중과)
//    지방세특례제한법 제36조의3(생애최초), 제36조의5(출산·양육)
//    농어촌특별세법 제5조, 지방세법 제151조(지방교육세)
// 규제가 바뀌면 이 파일의 세율 상수만 수정하면 전체 반영됨.

type HouseCount = "1" | "2" | "3" | "4+";
type RegionType = "adjusted" | "non-adjusted";
type ReductionType = "none" | "first-time" | "childbirth";
type DealType = "purchase" | "gift" | "inherit"; // 매매 / 증여 / 상속
type PropertyType = "house" | "officetel-residential" | "officetel-commercial"; // 주택 / 오피스텔(주거용) / 오피스텔(업무용)

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

// ── 거래유형별 고정세율 ──────────────────────────────────────────
// 증여: 지방세법 제11조제1항제2호 — 3.5%
const GIFT_RATE = 0.035;
// 상속: 지방세법 제11조제1항제1호 — 2.8%
const INHERIT_RATE = 0.028;
// 오피스텔(업무용): 지방세법 제11조제1항제7호 — 4%
const OFFICETEL_COMMERCIAL_RATE = 0.04;

// ── 매매(유상거래) 표준세율: 지방세법 제11조제1항제8호 ──────────
// 6억 이하: 1% / 6억 초과 9억 이하: 1~3% 누진 / 9억 초과: 3%
function getStandardRate(price: number): number {
  if (price <= 600_000_000) return 0.01;
  if (price <= 900_000_000) {
    const rate = ((price * (2 / 300_000_000)) - 3) / 100;
    return Math.round(rate * 10000) / 10000;
  }
  return 0.03;
}

// ── 다주택자/법인 중과세율: 지방세법 제13조의2제1항 ──────────────
function getMultiHouseRate(
  isCorporation: boolean,
  houseCountAfter: HouseCount,
  region: RegionType
): number | null {
  if (isCorporation) return 0.12;
  if (region === "adjusted") {
    if (houseCountAfter === "1") return null;
    if (houseCountAfter === "2") return 0.08;
    if (houseCountAfter === "3" || houseCountAfter === "4+") return 0.12;
  } else {
    if (houseCountAfter === "1" || houseCountAfter === "2") return null;
    if (houseCountAfter === "3") return 0.08;
    if (houseCountAfter === "4+") return 0.12;
  }
  return null;
}

// ── 생애최초 감면 한도: 지방세특례제한법 제36조의3 ──────────────
function getFirstTimeBuyerCap(price: number, areaSqm: number, isMetro: boolean): number {
  const smallHouseLimit = isMetro ? 600_000_000 : 300_000_000;
  const isSmallHouse = areaSqm > 0 && areaSqm <= 60 && price <= smallHouseLimit;
  return isSmallHouse ? 3_000_000 : 2_000_000;
}

// 출산·양육 감면 한도: 500만원
const CHILDBIRTH_REDUCTION_CAP = 5_000_000;

// ── 농어촌특별세: 농어촌특별세법 제5조 ──────────────────────────
// 85㎡ 이하 국민주택규모: 비과세 (농어촌특별세법 제4조제11호)
// 85㎡ 초과: 취득세 과세표준 × 0.2%
// 과세표준: 매매=실거래가, 증여=시가인정액, 상속=공시가격 (유저가 입력한 값 그대로 사용)
// ※ 감면 전 취득세의 과세표준(=입력가액)을 기준으로 함
function calcRuralTax(price: number, standardRate: number, areaSqm: number): number {
  const isRuralTaxable = areaSqm === 0 || areaSqm > 85;
  return isRuralTaxable ? price * standardRate * 0.1 : 0;
}

// ── 지방교육세: 지방세법 제151조제1항제1호 ──────────────────────
// 주택 유상취득: 취득세액 × 50% × 20% = 취득세액 × 10%
// 감면이 있는 경우: 감면 후 취득세액 × 10% (감면분도 함께 경감됨)
// ※ 출처: 지방세법 제151조제1항제1호 다목1) — 감면율 적용 후 남은 금액
function calcEduTax(acquisitionTaxAfterReduction: number): number {
  return acquisitionTaxAfterReduction * 0.1;
}

// ── 거래유형별 입력 가액 레이블 ──────────────────────────────
const PRICE_LABEL: Record<DealType, { label: string; placeholder: string; desc: string }> = {
  purchase: {
    label: "매매가격 (만원)",
    placeholder: "예: 70000 (= 7억원)",
    desc: "실제 매매계약서상 거래금액을 입력해주세요.",
  },
  gift: {
    label: "시가인정액 (만원)",
    placeholder: "예: 70000 (= 7억원)",
    desc: "증여세·취득세 과세표준은 공시가격이 아닌 시가인정액(매매사례가액·감정가 등)입니다. 정확한 시가인정액은 감정평가 또는 유사 매매사례가액을 참고해주세요.",
  },
  inherit: {
    label: "시가표준액 (공시가격, 만원)",
    placeholder: "예: 50000 (= 5억원)",
    desc: "상속 취득세 과세표준은 실거래가가 아닌 주택공시가격(시가표준액)입니다. 국토부 공동주택 공시가격 조회 후 입력해주세요.",
  },
};

const AREA_QUICK_BUTTONS: { label: string; value: string }[] = [
  { label: "60㎡ 이하", value: "59" },
  { label: "85㎡ 이하", value: "84" },
  { label: "85㎡ 초과", value: "100" },
];

const DEAL_TYPE_OPTIONS: { key: DealType; label: string; desc: string }[] = [
  { key: "purchase", label: "매매", desc: "유상취득" },
  { key: "gift", label: "증여", desc: "무상취득 3.5%" },
  { key: "inherit", label: "상속", desc: "무상취득 2.8%" },
];

const PROPERTY_TYPE_OPTIONS: { key: PropertyType; label: string; desc: string }[] = [
  { key: "house", label: "주택", desc: "아파트·단독·다가구 등" },
  { key: "officetel-residential", label: "오피스텔(주거용)", desc: "주택 준용 세율" },
  { key: "officetel-commercial", label: "오피스텔(업무용)", desc: "일반건물 4%" },
];

export default function TaxAcqPage() {
  const [dealType, setDealType] = useState<DealType>("purchase");
  const [propertyType, setPropertyType] = useState<PropertyType>("house");
  const [priceInput, setPriceInput] = useState("");
  const [area, setArea] = useState("");

  const [isCorporation, setIsCorporation] = useState(false);
  const [houseCountAfter, setHouseCountAfter] = useState<HouseCount>("1");
  const [region, setRegion] = useState<RegionType>("non-adjusted");
  const [applyMultiHouseTax, setApplyMultiHouseTax] = useState(false);
  const [isTemporary2House, setIsTemporary2House] = useState(false);

  const [reductionType, setReductionType] = useState<ReductionType>("none");
  const [isMetro, setIsMetro] = useState(true);

  const [result, setResult] = useState<{
    standardRate: number;
    appliedRate: number;
    acquisitionTaxBeforeReduction: number;
    reductionAmount: number;
    acquisitionTax: number;
    ruralTax: number;
    eduTax: number;
    total: number;
    isMultiHouseApplied: boolean;
    effectiveRate: number; // 실효세율 = 총납부세액 / 취득가액
    price: number; // 실효세율 계산용
  } | null>(null);

  // 매매가 아니면 감면/중과 옵션 비활성화 여부
  const isPurchase = dealType === "purchase";
  const isOfficetelCommercial = propertyType === "officetel-commercial";

  const calculate = () => {
    const price = Number(priceInput) * 10000;
    const areaNum = Number(area);

    if (!price) {
      alert("취득가액을 입력해주세요.");
      return;
    }

    let appliedRate: number;
    let standardRate: number;
    let isMultiHouseApplied = false;

    // ── 세율 결정 ──────────────────────────────────────────
    if (dealType === "gift") {
      // 증여: 3.5% 고정 (중과/감면 없음)
      appliedRate = GIFT_RATE;
      standardRate = GIFT_RATE;
    } else if (dealType === "inherit") {
      // 상속: 2.8% 고정
      appliedRate = INHERIT_RATE;
      standardRate = INHERIT_RATE;
    } else if (isOfficetelCommercial) {
      // 오피스텔(업무용): 4% 고정
      appliedRate = OFFICETEL_COMMERCIAL_RATE;
      standardRate = OFFICETEL_COMMERCIAL_RATE;
    } else {
      // 매매 (주택 또는 주거용 오피스텔): 표준세율 + 중과 판단
      standardRate = getStandardRate(price);
      appliedRate = standardRate;

      const reductionApplies = reductionType !== "none";
      if (applyMultiHouseTax && !isTemporary2House && !reductionApplies) {
        const multiRate = getMultiHouseRate(isCorporation, houseCountAfter, region);
        if (multiRate !== null) {
          appliedRate = multiRate;
          isMultiHouseApplied = true;
        }
      }
    }

    const acquisitionTaxBeforeReduction = price * appliedRate;

    // ── 감면액 계산 (매매만 적용) ──────────────────────────
    let reductionAmount = 0;
    if (isPurchase && !isOfficetelCommercial) {
      if (reductionType === "first-time" && price <= 1_200_000_000) {
        const cap = getFirstTimeBuyerCap(price, areaNum, isMetro);
        reductionAmount = Math.min(acquisitionTaxBeforeReduction, cap);
      } else if (reductionType === "childbirth" && price <= 1_200_000_000) {
        reductionAmount = Math.min(acquisitionTaxBeforeReduction, CHILDBIRTH_REDUCTION_CAP);
      }
    }

    const acquisitionTax = acquisitionTaxBeforeReduction - reductionAmount;

    // ── 농어촌특별세: 감면 전 표준세율 기준 ──────────────────
    const ruralTax = calcRuralTax(price, standardRate, areaNum);

    // ── 지방교육세: 감면 후 취득세 × 10% ──────────────────
    const eduTax = calcEduTax(acquisitionTax);

    const total = acquisitionTax + ruralTax + eduTax;
    const effectiveRate = price > 0 ? total / price : 0;

    setResult({
      standardRate,
      appliedRate,
      acquisitionTaxBeforeReduction,
      reductionAmount,
      acquisitionTax,
      ruralTax,
      eduTax,
      total,
      isMultiHouseApplied,
      effectiveRate,
      price,
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <h1 className="text-xl font-bold text-slate-800">🏠 취득세 계산기</h1>

        {/* ① 거래유형 선택 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">거래유형</h2>
          <div className="grid grid-cols-3 gap-2">
            {DEAL_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setDealType(opt.key);
                  // 증여/상속은 감면 초기화
                  if (opt.key !== "purchase") setReductionType("none");
                }}
                className={`py-3 rounded-xl border transition flex flex-col items-center gap-0.5 ${
                  dealType === opt.key
                    ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm font-bold">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>

          {dealType === "gift" && (
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              증여는 취득세 3.5% 고정세율이 적용됩니다. 증여세는 별도입니다.
            </p>
          )}
          {dealType === "inherit" && (
            <p className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              상속은 취득세 2.8% 고정세율이 적용됩니다. 상속세는 별도입니다.
            </p>
          )}
        </div>

        {/* ② 부동산 종류 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">부동산 종류</h2>
          <div className="grid grid-cols-3 gap-2">
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPropertyType(opt.key)}
                className={`py-3 rounded-xl border transition flex flex-col items-center gap-0.5 ${
                  propertyType === opt.key
                    ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm font-bold">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
          {isOfficetelCommercial && (
            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              업무용 오피스텔은 일반건물 세율 4%가 적용됩니다. 중과·감면 적용 대상 외입니다.
            </p>
          )}
        </div>

        {/* ③ 기본 정보 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">취득 정보 입력</h2>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              {PRICE_LABEL[dealType].label}
            </label>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder={PRICE_LABEL[dealType].placeholder}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {PRICE_LABEL[dealType].desc}
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              전용면적 (㎡)
              <span className="text-slate-400 ml-1">— 농어촌특별세 및 감면 기준, 모르면 비워두기</span>
            </label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="예: 84.97"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 mb-2"
            />
            <div className="flex gap-2">
              {AREA_QUICK_BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => setArea(btn.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    area === btn.value
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ④ 적용 옵션 — 매매 + 주택/주거용 오피스텔일 때만 표시 */}
        {isPurchase && !isOfficetelCommercial && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-600">적용 옵션</h2>

            {/* 다주택 중과 */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={applyMultiHouseTax}
                onChange={(e) => setApplyMultiHouseTax(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
              다주택자/법인 중과세 적용
            </label>

            {applyMultiHouseTax && (
              <div className="ml-6 space-y-3 border-l-2 border-emerald-100 pl-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCorporation}
                    onChange={(e) => setIsCorporation(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  법인 명의 취득 (무조건 12%)
                </label>

                {!isCorporation && (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">취득 후 보유 주택수 (이 주택 포함)</label>
                      <div className="flex gap-2">
                        {(["1", "2", "3", "4+"] as HouseCount[]).map((h) => (
                          <button
                            key={h}
                            onClick={() => setHouseCountAfter(h)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              houseCountAfter === h
                                ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-500"
                            }`}
                          >
                            {h}주택
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">지역</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRegion("adjusted")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            region === "adjusted"
                              ? "bg-red-50 border-red-300 text-red-700"
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          조정대상지역
                        </button>
                        <button
                          onClick={() => setRegion("non-adjusted")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            region === "non-adjusted"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          비조정대상지역
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTemporary2House}
                        onChange={(e) => setIsTemporary2House(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      일시적 2주택 (중과 배제 대상)
                    </label>
                  </>
                )}
              </div>
            )}

            {/* 취득세 감면 */}
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={reductionType !== "none"}
                onChange={(e) => setReductionType(e.target.checked ? "first-time" : "none")}
                className="w-4 h-4 accent-emerald-500"
              />
              취득세 감면 적용 (생애최초 또는 출산·양육)
            </label>

            {reductionType !== "none" && (
              <div className="ml-6 space-y-3 border-l-2 border-emerald-100 pl-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setReductionType("first-time")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      reductionType === "first-time"
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}
                  >
                    생애최초 (제36조의3)
                  </button>
                  <button
                    onClick={() => setReductionType("childbirth")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      reductionType === "childbirth"
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}
                  >
                    출산·양육 (제36조의5)
                  </button>
                </div>

                {reductionType === "first-time" && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                      소재지역 (60㎡ 이하 소형주택 가액기준 적용 시)
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => setIsMetro(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${isMetro ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
                        수도권 (6억 이하 소형 300만)
                      </button>
                      <button onClick={() => setIsMetro(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${!isMetro ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
                        지방 (3억 이하 소형 300만)
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  {reductionType === "first-time"
                    ? "취득가액 12억원 이하, 본인·배우자 무주택 요건 충족 시 적용. 생애최초와 출산양육 중복 적용 불가."
                    : "취득가액 12억원 이하, 1가구 1주택 요건 충족 시 적용. (생애최초와 중복 불가, 유리한 쪽 선택)"}
                </p>
              </div>
            )}
          </div>
        )}

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

            {result.isMultiHouseApplied && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                다주택자/법인 중과세율이 적용되었습니다 ({(result.appliedRate * 100).toFixed(0)}%)
              </div>
            )}
            {result.reductionAmount > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                취득세 감면 {fmtWon(result.reductionAmount)}이 적용되었습니다.
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">적용 세율</span>
                <span className="font-bold">{(result.appliedRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">감면 전 취득세</span>
                <span className="font-bold">{fmtWon(result.acquisitionTaxBeforeReduction)}</span>
              </div>
              {result.reductionAmount > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">감면액</span>
                  <span className="font-bold text-emerald-600">-{fmtWon(result.reductionAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">취득세 (감면 후)</span>
                <span className="font-bold">{fmtWon(result.acquisitionTax)}</span>
              </div>
            {result.ruralTax > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">
                  농어촌특별세
                  <span className="text-[10px] text-slate-400 ml-1">
                    (85㎡ 초과 · {dealType === "inherit" ? "공시가격" : dealType === "gift" ? "시가인정액" : "매매가격"} × 0.2%)
                  </span>
                </span>
                <span className="font-bold">{fmtWon(result.ruralTax)}</span>
              </div>
            )}
            {result.ruralTax === 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">
                  농어촌특별세
                  <span className="text-[10px] text-slate-400 ml-1">(85㎡ 이하 비과세)</span>
                </span>
                <span className="font-bold text-slate-400">0원</span>
              </div>
            )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">
                  지방교육세
                  <span className="text-[10px] text-slate-400 ml-1">(감면 후 취득세 × 10%)</span>
                </span>
                <span className="font-bold">{fmtWon(result.eduTax)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mt-3">
              <p className="text-xs text-emerald-600 font-semibold mb-1">총 납부세액</p>
              <p className="text-2xl font-black text-emerald-700">{fmtWon(result.total)}</p>
            </div>

            {/* ① 실효세율 표시 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 font-semibold mb-1.5">실효세율 (취득가액 대비 실제 총 부담)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-700">
                  {(result.effectiveRate * 100).toFixed(3)}%
                </span>
                <span className="text-[11px] text-slate-400">
                  = 총납부세액 {fmtWon(result.total)} ÷ 취득가액 {fmtWon(result.price)}
                </span>
              </div>
              <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
                <span>취득세 {(result.acquisitionTax / result.price * 100).toFixed(3)}%</span>
                {result.ruralTax > 0 && <span>농특세 {(result.ruralTax / result.price * 100).toFixed(3)}%</span>}
                <span>지방교육세 {(result.eduTax / result.price * 100).toFixed(3)}%</span>
              </div>
            </div>

            {/* ② 감면 자동 추천 넛지 (매매이고 감면 미선택 시) */}
            {isPurchase && !isOfficetelCommercial && reductionType === "none" && result.price <= 1_200_000_000 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-700">💡 취득세 감면 혜택을 받을 수 있어요!</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-700 font-semibold">생애최초 구매자라면</p>
                      <p className="text-[10px] text-amber-600">최대 200만원 (소형주택은 300만원) 감면</p>
                    </div>
                    <button
                      onClick={() => setReductionType("first-time")}
                      className="text-[11px] font-bold px-3 py-1.5 bg-amber-400 text-amber-900 rounded-lg hover:bg-amber-500 transition shrink-0"
                    >
                      적용해보기
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-amber-200 pt-2">
                    <div>
                      <p className="text-xs text-amber-700 font-semibold">출산·양육 가구라면</p>
                      <p className="text-[10px] text-amber-600">최대 500만원 감면</p>
                    </div>
                    <button
                      onClick={() => setReductionType("childbirth")}
                      className="text-[11px] font-bold px-3 py-1.5 bg-amber-400 text-amber-900 rounded-lg hover:bg-amber-500 transition shrink-0"
                    >
                      적용해보기
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 border-t border-amber-200 pt-2">
                  👆 적용해보기 버튼을 누른 후 위의 옵션을 확인하고 계산하기를 다시 눌러주세요.
                </p>
              </div>
            )}

            <p className="text-[10px] text-slate-400 pt-2 leading-relaxed">
              출처: 지방세법 제11조(취득세율), 제13조의2(다주택·법인 중과), 제151조(지방교육세) /
              지방세특례제한법 제36조의3(생애최초), 제36조의5(출산·양육) / 농어촌특별세법 제5조.
              농어촌특별세·지방교육세는 감면 전 취득세 기준으로 산정됩니다.
              본 계산은 참고용이며 실제 세액은 관할 시군구 기준을 따릅니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}