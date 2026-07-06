"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, FileCheck, CheckCircle2 } from "lucide-react";
import PriceInput from "@/components/PriceInput";
import ShareButton from "@/components/ShareButton"; // ✅ 1. 공유 버튼 컴포넌트 임포트

// ✅ 법령 출처
// 재산세: 지방세법 제110조(과세표준), 제111조(세율), 제111조의2(1세대1주택 특례),
//         제112조(도시지역분 0.14%), 제151조(지방교육세 재산세액×20%)
// 종부세: 종합부동산세법 제8조(과세표준), 제9조(세율·세액·세액공제), 제10조의2(공동명의 특례)
//         농어촌특별세: 종부세액 × 20%
// 공동명의 특례: 종합부동산세법 제10조의2 — 부부가 1주택만 공동소유 시 신청으로 1세대1주택 적용

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

function getFairRatio(price: number, isOneHouse: boolean): number {
  if (!isOneHouse) return 0.60;
  if (price <= 300_000_000) return 0.43;
  if (price <= 600_000_000) return 0.44;
  return 0.45; 
}

function getMarginalRate(base: number): number {
  if (base <= 60_000_000) return 0.001;
  if (base <= 150_000_000) return 0.0015;
  if (base <= 300_000_000) return 0.0025;
  return 0.004;
}

function getPropertyTaxOneHouse(base: number): number {
  if (base <= 60_000_000) return base * 0.0005;
  if (base <= 150_000_000) return 30_000 + (base - 60_000_000) * 0.001;
  if (base <= 300_000_000) return 120_000 + (base - 150_000_000) * 0.002;
  return 420_000 + (base - 300_000_000) * 0.0035;
}

function getPropertyTaxStandard(base: number): number {
  if (base <= 60_000_000) return base * 0.001;
  if (base <= 150_000_000) return 60_000 + (base - 60_000_000) * 0.0015;
  if (base <= 300_000_000) return 195_000 + (base - 150_000_000) * 0.0025;
  return 570_000 + (base - 300_000_000) * 0.004;
}

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

function calcCSVCorporation(base: number, is3Plus: boolean): number {
  return base * (is3Plus ? 0.05 : 0.027);
}

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
type HouseCount = "1" | "2" | "3+";

const OWNER_TYPE_OPTIONS: { key: OwnerType; label: string; desc: string }[] = [
  { key: "sole", label: "단독명의", desc: "1인 소유" },
  { key: "joint-no-special", label: "공동명의\n(특례 미신청)", desc: "각자 9억 공제" },
  { key: "joint-special", label: "공동명의\n(특례 신청)", desc: "12억 공제·세액공제" },
];

function TaxHoldPageContent() {
  const resultRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [priceInput, setPriceInput] = useState("");
  const [ownerType, setOwnerType] = useState<OwnerType>("sole");
  const [jointShare, setJointShare] = useState("50");
  const [isCorporation, setIsCorporation] = useState(false);
  const [isOneHouse, setIsOneHouse] = useState(true);
  const [houseCount, setHouseCount] = useState<HouseCount>("1");
  const [isUrban, setIsUrban] = useState(true);

  const [applyDeduction, setApplyDeduction] = useState(false);
  const [age, setAge] = useState("");
  const [holdingYears, setHoldingYears] = useState("");

  const [result, setResult] = useState<{
    propTaxBase: number;
    propTax: number;
    eduTax: number;
    urbanTax: number;
    csvBase: number;
    csvRaw: number;
    csvDeductRate: number;
    csvDeductAmt: number;
    csvPropDeductAmt: number;
    csvFinal: number;
    ruralTax: number;
    total: number;
    isCSVTarget: boolean;
    isJointNoSpecial: boolean;
    eachTotal?: number;
  } | null>(null);

  const isJoint = ownerType !== "sole";
  const canApplyDeduction =
    isOneHouse && !isCorporation &&
    (ownerType === "sole" || ownerType === "joint-special");

  // ✅ 2. URL 쿼리 파라미터로 상태값 복원 (Hydration)
  useEffect(() => {
    const spPrice = searchParams.get("price");
    if (spPrice) {
      setPriceInput(spPrice);
      if (searchParams.get("ownerType")) setOwnerType(searchParams.get("ownerType") as OwnerType);
      if (searchParams.get("jointShare")) setJointShare(searchParams.get("jointShare")!);
      if (searchParams.get("isCorporation")) setIsCorporation(searchParams.get("isCorporation") === "true");
      if (searchParams.get("isOneHouse")) setIsOneHouse(searchParams.get("isOneHouse") === "true");
      if (searchParams.get("houseCount")) setHouseCount(searchParams.get("houseCount") as HouseCount);
      if (searchParams.get("isUrban")) setIsUrban(searchParams.get("isUrban") === "true");
      if (searchParams.get("applyDeduction")) setApplyDeduction(searchParams.get("applyDeduction") === "true");
      if (searchParams.get("age")) setAge(searchParams.get("age")!);
      if (searchParams.get("holdingYears")) setHoldingYears(searchParams.get("holdingYears")!);
    }
  }, [searchParams]);

  // ✅ 3. 필수 입력값(공시가격)이 링크에 있으면 즉시 계산 (Auto-Run)
  useEffect(() => {
    const spPrice = searchParams.get("price");
    if (spPrice) {
      const t = setTimeout(() => {
        calculate({
          price: spPrice,
          ownerType: (searchParams.get("ownerType") as OwnerType) || "sole",
          jointShare: searchParams.get("jointShare") || "50",
          isCorporation: searchParams.get("isCorporation") === "true",
          isOneHouse: searchParams.get("isOneHouse") !== "false", // 기본값 true
          houseCount: (searchParams.get("houseCount") as HouseCount) || "1",
          isUrban: searchParams.get("isUrban") !== "false", // 기본값 true
          applyDeduction: searchParams.get("applyDeduction") === "true",
          age: searchParams.get("age") || "",
          holdingYears: searchParams.get("holdingYears") || "",
        });
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 4. 계산 함수 (URL 강제 주입용 overrideParams 허용)
  const calculate = (overrideParams?: {
    price: string;
    ownerType: OwnerType;
    jointShare: string;
    isCorporation: boolean;
    isOneHouse: boolean;
    houseCount: HouseCount;
    isUrban: boolean;
    applyDeduction: boolean;
    age: string;
    holdingYears: string;
  }) => {
    const tPrice = overrideParams ? overrideParams.price : priceInput;
    const tOwnerType = overrideParams ? overrideParams.ownerType : ownerType;
    const tJointShare = overrideParams ? overrideParams.jointShare : jointShare;
    const tIsCorporation = overrideParams ? overrideParams.isCorporation : isCorporation;
    const tIsOneHouse = overrideParams ? overrideParams.isOneHouse : isOneHouse;
    const tHouseCount = overrideParams ? overrideParams.houseCount : houseCount;
    const tIsUrban = overrideParams ? overrideParams.isUrban : isUrban;
    const tApplyDeduction = overrideParams ? overrideParams.applyDeduction : applyDeduction;
    const tAge = overrideParams ? overrideParams.age : age;
    const tHoldingYears = overrideParams ? overrideParams.holdingYears : holdingYears;

    const price = Number(tPrice) * 10000;
    if (!price) { alert("공시가격을 입력해주세요."); return; }

    const is3Plus = tHouseCount === "3+";
    const isJointCase = tOwnerType !== "sole";
    const shareRatio = isJointCase ? Number(tJointShare) / 100 : 1;

    // ── 재산세 계산 ────────────────────────────────────────────
    const fairRatio = getFairRatio(price, tIsOneHouse && !tIsCorporation);
    const propBase = price * fairRatio;

    const canUseOneHouseTaxRate = tIsOneHouse && !tIsCorporation && price <= 900_000_000;

    const propTax = canUseOneHouseTaxRate
      ? getPropertyTaxOneHouse(propBase)
      : getPropertyTaxStandard(propBase);

    const eduTax = propTax * 0.2;
    const urbanTax = tIsUrban ? propBase * 0.0014 : 0;

    // ── 종부세 계산 ────────────────────────────────────────────
    let csvBase = 0;
    let csvRaw = 0;
    let csvDeductRate = 0;
    let csvDeductAmt = 0;
    let csvFinal = 0;
    let eachCSV = 0;
    let csvPropDeductAmt = 0;

    const tCanApplyDeduction = tIsOneHouse && !tIsCorporation && (tOwnerType === "sole" || tOwnerType === "joint-special");

    if (tOwnerType === "joint-no-special") {
      const deduction = tIsCorporation ? 0 : 900_000_000;
      const myPrice = price * shareRatio;
      csvBase = Math.max(myPrice - deduction, 0) * 0.6;
      csvRaw = tIsCorporation ? calcCSVCorporation(csvBase, is3Plus) : calcCSVRaw(csvBase, is3Plus);

      csvPropDeductAmt = csvBase * fairRatio * getMarginalRate(propBase);
      csvFinal = Math.max(csvRaw - csvPropDeductAmt, 0); 
      eachCSV = csvFinal;
    } else {
      let deduction = 0;
      if (!tIsCorporation) {
        deduction = tIsOneHouse ? 1_200_000_000 : 900_000_000;
      }
      csvBase = Math.max(price - deduction, 0) * 0.6;
      csvRaw = tIsCorporation
        ? calcCSVCorporation(csvBase, is3Plus)
        : calcCSVRaw(csvBase, is3Plus);

      csvPropDeductAmt = csvBase * fairRatio * getMarginalRate(propBase);
      const csvAfterPropDeduct = Math.max(csvRaw - csvPropDeductAmt, 0);

      if (tApplyDeduction && tCanApplyDeduction) {
        const ageRate = getAgeDeductionRate(Number(tAge));
        const holdRate = getHoldingDeductionRate(Number(tHoldingYears));
        csvDeductRate = Math.min(ageRate + holdRate, 0.8);
        csvDeductAmt = csvAfterPropDeduct * csvDeductRate;
      }
      csvFinal = Math.max(csvAfterPropDeduct - csvDeductAmt, 0);
    }

    const ruralTax = csvFinal * 0.2;
    const isCSVTarget = csvBase > 0;

    const total = propTax + eduTax + urbanTax + csvFinal + ruralTax;

    let eachTotal: number | undefined;
    if (tOwnerType === "joint-no-special") {
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
      csvPropDeductAmt: csvPropDeductAmt,
      csvFinal,
      ruralTax,
      total,
      isCSVTarget,
      isJointNoSpecial: tOwnerType === "joint-no-special",
      eachTotal,
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition link-press">
          ← 메인으로
        </Link>

        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Building2 size={20} strokeWidth={1.75} className="text-emerald-600" />
          보유세 계산기
        </h1>
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

          <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-slate-100">
            <input type="checkbox" checked={isUrban}
              onChange={(e) => setIsUrban(e.target.checked)}
              className="w-4 h-4 accent-emerald-500" />
            도시지역 내 주택 (재산세 도시지역분 +0.14%)
            <span className="text-[10px] text-slate-400">서울·수도권 아파트는 대부분 해당</span>
          </label>

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

        <button onClick={() => calculate()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition btn-press">
          계산하기
        </button>

        {/* 결과 */}
        {result && (
          <div ref={resultRef} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 result-enter">
            <h2 className="text-sm font-bold text-slate-600">계산 결과</h2>

            {result.isCSVTarget ? (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                <FileCheck size={14} strokeWidth={1.75} className="shrink-0" />
                종합부동산세 과세 대상입니다. 매년 12월에 고지서가 발송됩니다.
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-500">
                <CheckCircle2 size={14} strokeWidth={1.75} className="shrink-0" />
                종합부동산세 과세 대상이 아닙니다 (공제액 이하)
              </div>
            )}

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

            {/* ✅ 5. 공유하기 버튼 추가 */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <ShareButton
                title="보유세 계산 결과 - 똑집"
                description={`공시가격 ${fmtWon(Number(priceInput)*10000)} 기준, 예상 납부세액 ${fmtWon(result.isJointNoSpecial && result.eachTotal !== undefined ? result.eachTotal : result.total)}`}
                params={{
                  price: priceInput,
                  ownerType,
                  jointShare,
                  isCorporation: String(isCorporation),
                  isOneHouse: String(isOneHouse),
                  houseCount,
                  isUrban: String(isUrban),
                  applyDeduction: String(applyDeduction),
                  age,
                  holdingYears,
                }}
              />
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

// ✅ 6. Next.js App Router용 안전한 Suspense 컴포넌트 처리
export default function TaxHoldPage() {
  return (
    <Suspense fallback={null}>
      <TaxHoldPageContent />
    </Suspense>
  );
}