"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import PriceInput from "../../components/PriceInput";

// ✅ 법령 출처
// 재산세: 지방세법 제110조(과세표준), 제111조(세율), 제111조의2(1세대1주택 특례),
//         제112조(도시지역분 0.14%), 제151조(지방교육세 재산세액×20%)
// 종부세: 종합부동산세법 제8조(과세표준), 제9조(세율·세액·세액공제), 제10조의2(공동명의 특례)
//         농어촌특별세: 종부세액 × 20%
// 공동명의 특례: 종합부동산세법 제10조의2 — 부부가 1주택만 공동소유 시 신청으로 1세대1주택 적용

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

// ── 재산세 공정시장가액비율 (2026년 기준, 지방세법 시행령 제109조) ──
// 1세대1주택: 3억 이하 43%, 6억 이하 44%, 6억 초과 45% (9억 초과도 45% 적용)
// 다주택/법인: 60%
function getFairRatio(price: number, isOneHouse: boolean): number {
  if (!isOneHouse) return 0.60;
  if (price <= 300_000_000) return 0.43;
  if (price <= 600_000_000) return 0.44;
  return 0.45; // 6억 초과 전체 (9억 초과 포함)
}

// 재산세 한계세율 (중복분 계산용): 과세표준 구간별 최고 적용세율
function getMarginalRate(base: number): number {
  if (base <= 60_000_000) return 0.001;
  if (base <= 150_000_000) return 0.0015;
  if (base <= 300_000_000) return 0.0025;
  return 0.004;
}

// ── 재산세 세율 ───────────────────────────────────────────────
// 1세대1주택 특례 (지방세법 제111조의2): 공시가격 9억 이하만 적용
function getPropertyTaxOneHouse(base: number): number {
  if (base <= 60_000_000) return base * 0.0005;
  if (base <= 150_000_000) return 30_000 + (base - 60_000_000) * 0.001;
  if (base <= 300_000_000) return 120_000 + (base - 150_000_000) * 0.002;
  return 420_000 + (base - 300_000_000) * 0.0035;
}
// 일반세율 (지방세법 제111조제1항제3호나목)
function getPropertyTaxStandard(base: number): number {
  if (base <= 60_000_000) return base * 0.001;
  if (base <= 150_000_000) return 60_000 + (base - 60_000_000) * 0.0015;
  if (base <= 300_000_000) return 195_000 + (base - 150_000_000) * 0.0025;
  return 570_000 + (base - 300_000_000) * 0.004;
}

// ── 종부세 세율 (종합부동산세법 제9조제1항) ───────────────────
function calcCSVRaw(base: number, is3Plus: boolean): number {
  if (!is3Plus) {
    if (base <= 300_000_000) return base * 0.005;
    if (base <= 600_000_000) return 1_500_000 + (base - 300_000_000) * 0.007;
    if (base <= 1_200_000_000) return 3_600_000 + (base - 600_000_000) * 0.01;
    if (base <= 2_500_000_000) return 9_600_000 + (base - 1_200_000_000) * 0.013;
    if (base <= 5_000_000_000) return 26_500_000 + (base - 2_500_000_000) * 0.015;
    if (base <= 9_400_000_000) return 64_000_000 + (base - 5_000_000_000) * 0.02;
    return 152_000_000 + (base - 9_400_000_000) * 0.027;
  } else {
    if (base <= 300_000_000) return base * 0.005;
    if (base <= 600_000_000) return 1_500_000 + (base - 300_000_000) * 0.007;
    if (base <= 1_200_000_000) return 3_600_000 + (base - 600_000_000) * 0.01;
    if (base <= 2_500_000_000) return 9_600_000 + (base - 1_200_000_000) * 0.02;
    if (base <= 5_000_000_000) return 35_600_000 + (base - 2_500_000_000) * 0.03;
    if (base <= 9_400_000_000) return 110_600_000 + (base - 5_000_000_000) * 0.04;
    return 286_600_000 + (base - 9_400_000_000) * 0.05;
  }
}

// 법인 종부세: 공제 없이 단일세율 (제9조제2항)
function calcCSVCorporation(base: number, is3Plus: boolean): number {
  return base * (is3Plus ? 0.05 : 0.027);
}

// 1세대1주택 고령자/장기보유 세액공제 (제9조제5~7항), 최대 80%
function getAgeDeductionRate(age: number): number {
  if (age >= 70) return 0.4;
  if (age >= 65) return 0.3;
  if (age >= 60) return 0.2;
  return 0;
}
function getHoldingDeductionRate(years: number): number {
  if (years >= 15) return 0.5;
  if (years >= 10) return 0.4;
  if (years >= 5) return 0.2;
  return 0;
}

type OwnerType = "sole" | "joint-no-special" | "joint-special";
// sole: 단독명의
// joint-no-special: 공동명의(특례 미신청) — 각자 9억 공제, 세액공제 없음
// joint-special: 공동명의(특례 신청) — 전체 12억 공제, 세액공제 있음
type HouseCount = "1" | "2" | "3+";

const OWNER_TYPE_OPTIONS: { key: OwnerType; label: string; desc: string }[] = [
  { key: "sole", label: "단독명의", desc: "1인 소유" },
  { key: "joint-no-special", label: "공동명의\n(특례 미신청)", desc: "각자 9억 공제" },
  { key: "joint-special", label: "공동명의\n(특례 신청)", desc: "12억 공제·세액공제" },
];

export default function TaxHoldPage() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [priceInput, setPriceInput] = useState("");
  const [ownerType, setOwnerType] = useState<OwnerType>("sole");
  const [jointShare, setJointShare] = useState("50"); // 공동명의 시 본인 지분율(%)
  const [isCorporation, setIsCorporation] = useState(false);
  const [isOneHouse, setIsOneHouse] = useState(true);
  const [houseCount, setHouseCount] = useState<HouseCount>("1");
  const [isUrban, setIsUrban] = useState(true); // 도시지역분

  // 고령자/장기보유 공제 (1세대1주택 + 단독 or 공동명의특례신청 시만)
  const [applyDeduction, setApplyDeduction] = useState(false);
  const [age, setAge] = useState("");
  const [holdingYears, setHoldingYears] = useState("");

  const [result, setResult] = useState<{
    // 재산세 관련
    propTaxBase: number;
    propTax: number;
    eduTax: number;
    urbanTax: number;
    // 종부세 관련
    csvBase: number;
    csvRaw: number;
    csvDeductRate: number;
    csvDeductAmt: number;
    csvPropDeductAmt: number; // 재산세 중복분 공제액
    csvFinal: number;
    ruralTax: number;
    // 합계
    total: number;
    isCSVTarget: boolean; // 종부세 과세 대상 여부
    // 공동명의 특례 미신청 시 각자 계산
    isJointNoSpecial: boolean;
    eachTotal?: number; // 각자 납부액
  } | null>(null);

  const isJoint = ownerType !== "sole";
  const canApplyDeduction =
    isOneHouse && !isCorporation &&
    (ownerType === "sole" || ownerType === "joint-special");

  const calculate = () => {
    const price = Number(priceInput) * 10000;
    if (!price) { alert("공시가격을 입력해주세요."); return; }

    const is3Plus = houseCount === "3+";
    const shareRatio = isJoint ? Number(jointShare) / 100 : 1;

    // ── 재산세 계산 ────────────────────────────────────────────
    // 공정시장가액비율: 1세대1주택은 공시가격 구간별 43~45% (9억 초과도 45%)
    // 특례세율(0.05% 인하): 공시가격 9억 이하 1세대1주택만 적용 (공정시장가액비율과 별개)
    const fairRatio = getFairRatio(price, isOneHouse && !isCorporation);
    const propBase = price * fairRatio;

    const canUseOneHouseTaxRate =
      isOneHouse && !isCorporation && price <= 900_000_000 &&
      (ownerType === "sole" || ownerType === "joint-special");

    const propTax = canUseOneHouseTaxRate
      ? getPropertyTaxOneHouse(propBase)
      : getPropertyTaxStandard(propBase);

    const eduTax = propTax * 0.2; // 지방교육세: 재산세×20%
    const urbanTax = isUrban ? propBase * 0.0014 : 0; // 도시지역분: 과세표준×0.14%

    // ── 종부세 계산 ────────────────────────────────────────────
    let csvBase = 0;
    let csvRaw = 0;
    let csvDeductRate = 0;
    let csvDeductAmt = 0;
    let csvFinal = 0;
    let eachCSV = 0;

    if (ownerType === "joint-no-special") {
      // 공동명의 특례 미신청: 본인 지분만큼만 보유로 보고 각자 9억 공제
      const myPrice = price * shareRatio;
      csvBase = Math.max(myPrice - 900_000_000, 0) * 0.6;
      csvRaw = isCorporation ? calcCSVCorporation(csvBase, is3Plus) : calcCSVRaw(csvBase, is3Plus);
      // 세액공제 없음
      csvFinal = csvRaw;
      eachCSV = csvFinal; // 본인 납부액
    } else {
      // 단독명의 or 공동명의특례신청: 전체 공시가격 기준
      const deduction = (isOneHouse && !isCorporation) ? 1_200_000_000 : 900_000_000;
      csvBase = Math.max(price - deduction, 0) * 0.6;
      csvRaw = isCorporation
        ? calcCSVCorporation(csvBase, is3Plus)
        : calcCSVRaw(csvBase, is3Plus);

      // ✅ 재산세 중복분 공제 (종합부동산세법 제9조제3항, 시행령 제4조의3)
      // 공식: 종부세과세표준 × 재산세공정시장가액비율 × 재산세표준세율(한계세율)
      // 이중과세를 막기 위해 재산세로 이미 납부한 금액 중 종부세 과세분에 해당하는 부분을 공제
      const propDeductAmt = csvBase * fairRatio * getMarginalRate(propBase);
      const csvAfterPropDeduct = Math.max(csvRaw - propDeductAmt, 0);

      // 고령자/장기보유 세액공제
      if (applyDeduction && canApplyDeduction) {
        const ageRate = getAgeDeductionRate(Number(age));
        const holdRate = getHoldingDeductionRate(Number(holdingYears));
        csvDeductRate = Math.min(ageRate + holdRate, 0.8);
        csvDeductAmt = csvAfterPropDeduct * csvDeductRate;
      }
      csvFinal = Math.max(csvAfterPropDeduct - csvDeductAmt, 0);
    }

    const ruralTax = csvFinal * 0.2; // 농어촌특별세: 종부세×20%
    const isCSVTarget = csvBase > 0;

    // ── 총 납부세액 ────────────────────────────────────────────
    const total = propTax + eduTax + urbanTax + csvFinal + ruralTax;

    // 공동명의 특례 미신청: 각자 납부액 계산 (재산세는 지분 비례)
    let eachTotal: number | undefined;
    if (ownerType === "joint-no-special") {
      const myPropTax = propTax * shareRatio;
      const myEduTax = myPropTax * 0.2;
      const myUrbanTax = urbanTax * shareRatio;
      eachTotal = myPropTax + myEduTax + myUrbanTax + eachCSV + eachCSV * 0.2;
    }

    setResult({
      propTaxBase: propBase,
      propTax,
      eduTax,
      urbanTax,
      csvBase,
      csvRaw,
      csvDeductRate,
      csvDeductAmt,
      csvPropDeductAmt: ownerType !== "joint-no-special" ? csvBase * fairRatio * getMarginalRate(propBase) : 0,
      csvFinal,
      ruralTax,
      total,
      isCSVTarget,
      isJointNoSpecial: ownerType === "joint-no-special",
      eachTotal,
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <h1 className="text-xl font-bold text-slate-800">🏢 보유세 계산기</h1>
        <p className="text-xs text-slate-400 -mt-2">재산세 + 지방교육세 + 도시지역분 + 종합부동산세 + 농어촌특별세</p>

        {/* ① 공시가격 입력 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-600">주택 공시가격 입력</h2>
            <a
              href="https://www.realtyprice.kr/notice/main/mainBody.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition"
            >
              공시가격 조회 →
            </a>
          </div>
          <PriceInput
            value={priceInput}
            onChange={setPriceInput}
            placeholder="예: 100000"
          />
          <p className="text-[11px] text-slate-400">
            국토교통부 공동주택가격 공시 기준 (매년 4~5월 발표). 공시가격이 다를 경우 상단 링크에서 조회 후 입력해주세요.
          </p>
        </div>

        {/* ② 명의 구분 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">명의 구분</h2>
          <div className="grid grid-cols-3 gap-2">
            {OWNER_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setOwnerType(opt.key)}
                className={`py-3 px-2 rounded-xl border transition flex flex-col items-center gap-0.5 ${
                  ownerType === opt.key
                    ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold whitespace-pre-line text-center leading-tight">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>

          {isJoint && (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">본인 지분율 (%)</label>
                <div className="flex gap-2">
                  {["50", "60", "70"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setJointShare(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        jointShare === v
                          ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={jointShare}
                    onChange={(e) => setJointShare(e.target.value)}
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
                    placeholder="직접입력"
                  />
                </div>
              </div>
              {ownerType === "joint-special" && (
                <p className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  공동명의 1주택 특례 신청 시 지분율이 큰 배우자가 납세의무자가 됩니다. 매년 9.16~9.30 관할세무서에 신청 필요.
                </p>
              )}
              {ownerType === "joint-no-special" && (
                <p className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  특례 미신청 시 각자 지분율만큼 보유한 것으로 보아 각각 9억 공제 후 종부세 계산. 세액공제(고령자·장기보유)는 적용되지 않습니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ③ 적용 옵션 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">적용 옵션</h2>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isCorporation}
              onChange={(e) => setIsCorporation(e.target.checked)}
              className="w-4 h-4 accent-emerald-500" />
            법인 명의 보유 (종부세 단일세율, 공제 없음)
          </label>

          {!isCorporation && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isOneHouse}
                onChange={(e) => setIsOneHouse(e.target.checked)}
                className="w-4 h-4 accent-emerald-500" />
              1세대 1주택 (재산세 특례 + 종부세 12억 공제)
            </label>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">보유 주택수 (종부세 세율 결정)</label>
            <div className="flex gap-2">
              {(["1", "2", "3+"] as HouseCount[]).map((h) => (
                <button key={h} onClick={() => setHouseCount(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    houseCount === h
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500"
                  }`}>
                  {h}주택
                </button>
              ))}
            </div>
          </div>

          {/* 도시지역분 */}
          <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-slate-100">
            <input type="checkbox" checked={isUrban}
              onChange={(e) => setIsUrban(e.target.checked)}
              className="w-4 h-4 accent-emerald-500" />
            도시지역 내 주택 (재산세 도시지역분 +0.14%)
            <span className="text-[10px] text-slate-400">서울·수도권 아파트는 대부분 해당</span>
          </label>

          {/* 고령자/장기보유 공제 */}
          {canApplyDeduction && (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-slate-100">
                <input type="checkbox" checked={applyDeduction}
                  onChange={(e) => setApplyDeduction(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500" />
                고령자·장기보유 종부세 세액공제 (1세대1주택만)
              </label>
              {applyDeduction && (
                <div className="ml-6 grid grid-cols-2 gap-3 border-l-2 border-emerald-100 pl-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">만 나이</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                      placeholder="예: 65"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                    <p className="text-[10px] text-slate-400 mt-1">60세 20% / 65세 30% / 70세 40%</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">보유기간 (년)</label>
                    <input type="number" value={holdingYears} onChange={(e) => setHoldingYears(e.target.value)}
                      placeholder="예: 10"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                    <p className="text-[10px] text-slate-400 mt-1">5년 20% / 10년 40% / 15년 50%</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <button onClick={calculate}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition">
          계산하기
        </button>

        {/* 결과 */}
        {result && (
          <div ref={resultRef} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-600">계산 결과</h2>

            {/* 종부세 과세대상 알림 */}
            {result.isCSVTarget ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                📋 종합부동산세 과세 대상입니다. 매년 12월에 고지서가 발송됩니다.
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-500">
                ✅ 종합부동산세 과세 대상이 아닙니다. (공제액 이하)
              </div>
            )}

            {/* 세목별 내역 */}
            <div className="space-y-0 text-sm">
              <p className="text-[11px] font-bold text-slate-400 mb-1">재산세 관련</p>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">재산세</span>
                <span className="font-bold">{fmtWon(result.propTax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">지방교육세 <span className="text-[10px] text-slate-400">(재산세×20%)</span></span>
                <span className="font-bold">{fmtWon(result.eduTax)}</span>
              </div>
              {result.urbanTax > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">도시지역분 <span className="text-[10px] text-slate-400">(과세표준×0.14%)</span></span>
                  <span className="font-bold">{fmtWon(result.urbanTax)}</span>
                </div>
              )}

              <p className="text-[11px] font-bold text-slate-400 mt-3 mb-1">종합부동산세 관련</p>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">종부세 과세표준</span>
                <span className="font-bold">{fmtWon(result.csvBase)}</span>
              </div>
              {result.csvPropDeductAmt > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">재산세 중복분 공제 <span className="text-[10px] text-slate-400">(이중과세 방지)</span></span>
                  <span className="font-bold text-emerald-600">-{fmtWon(result.csvPropDeductAmt)}</span>
                </div>
              )}
              {result.csvDeductAmt > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    세액공제 <span className="text-[10px] text-slate-400">({(result.csvDeductRate * 100).toFixed(0)}%)</span>
                  </span>
                  <span className="font-bold text-emerald-600">-{fmtWon(result.csvDeductAmt)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">종합부동산세</span>
                <span className="font-bold">{fmtWon(result.csvFinal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">농어촌특별세 <span className="text-[10px] text-slate-400">(종부세×20%)</span></span>
                <span className="font-bold">{fmtWon(result.ruralTax)}</span>
              </div>
            </div>

            {/* 총 납부세액 */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mt-2">
              <p className="text-xs text-emerald-600 font-semibold mb-1">
                {result.isJointNoSpecial ? "본인 납부세액 (지분 기준)" : "총 납부세액"}
              </p>
              <p className="text-2xl font-black text-emerald-700">
                {fmtWon(result.isJointNoSpecial && result.eachTotal !== undefined ? result.eachTotal : result.total)}
              </p>
              {result.isJointNoSpecial && result.eachTotal !== undefined && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  배우자 포함 합산 약 {fmtWon(result.eachTotal * 2)} (지분 동일 가정)
                </p>
              )}
            </div>

            <p className="text-[10px] text-slate-400 pt-2 leading-relaxed">
              출처: 지방세법 제110조·제111조·제111조의2(재산세), 제112조(도시지역분), 제151조(지방교육세),
              종합부동산세법 제8조·제9조·제10조의2(공동명의 특례).
              재산세 세부담상한(지방세법 제122조) 및 종부세 재산세 공제(종부세법 제9조제3항)는
              전년도 세액 정보가 없어 미반영되었습니다. 도시지역분은 지자체 조례에 따라 다를 수 있습니다.
              본 계산은 참고용이며 실제 세액은 홈택스 또는 세무 전문가 확인이 필요합니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}