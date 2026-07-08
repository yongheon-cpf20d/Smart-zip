"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calculator, ChevronRight } from "lucide-react";
import PriceInput from "@/components/PriceInput";
import ShareButton from "@/components/ShareButton";
import ThemeToggle from "@/components/ThemeToggle";

// ✅ 법령 출처
// 취득세: 지방세법 제11조, 제13조의2 / 지방세특례제한법 제36조의3(생애최초), 제36조의5(출산·양육)
// 지방교육세: 지방세법 제151조 / 농어촌특별세: 농어촌특별세법 제5조
// 중개수수료: 공인중개사법 시행규칙 제20조 [별표1], 2021.10.19 개정
// 주담대 한도: 금융위원회 「주택시장 안정화 대책」(2025.10.15)
// 정책대출: 주택도시기금 디딤돌대출·신생아특례 상품안내(2026.06 기준), HF 보금자리론

type HouseCount = "1" | "2" | "3" | "4+";
type RegionType = "adjusted" | "non-adjusted";
type ReductionType = "none" | "first-time" | "childbirth";
type PolicyLoanType = "none" | "newborn" | "didimdol" | "bogeumjari";

const POLICY_LOAN_INFO: Record<PolicyLoanType, {
  label: string;
  maxLoan: number;
  maxHousePrice: number;
  desc: string;
} | null> = {
  none: null,
  newborn: {
    label: "신생아 특례",
    maxLoan: 400_000_000,
    maxHousePrice: 900_000_000,
    desc: "2세 미만 자녀 보유 무주택 세대 / 주택가액 9억 이하 / 최대 4억원",
  },
  didimdol: {
    label: "디딤돌 (신혼가구)",
    maxLoan: 320_000_000,
    maxHousePrice: 600_000_000,
    desc: "신혼가구 기준 / 주택가액 6억 이하 / 최대 3.2억원",
  },
  bogeumjari: {
    label: "보금자리론 (생초)",
    maxLoan: 420_000_000,
    maxHousePrice: 600_000_000,
    desc: "생애최초 기준 / 주택가액 6억 이하 / 최대 4.2억원",
  },
};

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";
const fmtHundred = (n: number) => {
  const hun = Math.round(n / 10000);
  if (hun >= 10000) return `${(hun / 10000).toFixed(1)}억원`;
  return `${hun.toLocaleString()}만원`;
};

function getBrokerageRate(price: number): number {
  if (price < 50_000_000) return 0.006;
  if (price < 200_000_000) return 0.005;
  if (price < 900_000_000) return 0.004;
  if (price < 1_200_000_000) return 0.005;
  if (price < 1_500_000_000) return 0.006;
  return 0.007;
}

function getBrokerage(price: number): number {
  const rate = getBrokerageRate(price);
  const raw = price * rate;
  if (price < 50_000_000) return Math.min(raw, 250_000);
  if (price < 200_000_000) return Math.min(raw, 800_000);
  return raw;
}

function getStandardRate(price: number): number {
  if (price <= 600_000_000) return 0.01;
  if (price <= 900_000_000) {
    const rate = ((price * (2 / 300_000_000)) - 3) / 100;
    return Math.round(rate * 10000) / 10000;
  }
  return 0.03;
}

function getMultiHouseRate(houseCount: HouseCount, region: RegionType): number | null {
  if (region === "adjusted") {
    if (houseCount === "2") return 0.08;
    if (houseCount === "3" || houseCount === "4+") return 0.12;
  } else {
    if (houseCount === "3") return 0.08;
    if (houseCount === "4+") return 0.12;
  }
  return null;
}

function getFirstTimeCap(price: number, area: number, isMetro: boolean): number {
  const smallLimit = isMetro ? 600_000_000 : 300_000_000;
  return (area > 0 && area <= 60 && price <= smallLimit) ? 3_000_000 : 2_000_000;
}

function getLoanLimit(
  salePrice: number,
  kbPrice: number,
  isFirstTime: boolean,
  isRegulated: boolean,
  policyLoan: PolicyLoanType
): { loanLimit: number; basePrice: number; ltv: number; policyNote: string } {
  const basePrice = Math.min(salePrice, kbPrice);
  const policyInfo = POLICY_LOAN_INFO[policyLoan];

  if (policyInfo) {
    if (salePrice > policyInfo.maxHousePrice) {
      return {
        loanLimit: 0,
        basePrice,
        ltv: 0,
        policyNote: `[주의] 매매가(${fmtHundred(salePrice)})가 ${policyInfo.label} 대상 주택가액 상한(${fmtHundred(policyInfo.maxHousePrice)})을 초과하여 해당 정책대출 이용이 불가합니다.`,
      };
    }
    const ltv = 0.7;
    const ltvAmount = basePrice * ltv;
    const loanLimit = Math.min(ltvAmount, policyInfo.maxLoan);
    return {
      loanLimit,
      basePrice,
      ltv,
      policyNote: isRegulated
        ? `[안내] ${policyInfo.label}: 규제지역 적용 LTV ${(ltv * 100).toFixed(0)}%, 최대 ${fmtHundred(policyInfo.maxLoan)} 한도 적용. 대출 실행 후 6개월 이내 전입 의무가 발생합니다.`
        : `[안내] ${policyInfo.label}: LTV ${(ltv * 100).toFixed(0)}%, 최대 ${fmtHundred(policyInfo.maxLoan)} 한도 적용.`,
    };
  }

  const ltv = isFirstTime ? 0.7 : (isRegulated ? 0.4 : 0.7);
  const ltvAmount = basePrice * ltv;
  let capAmount = Infinity;
  if (isRegulated) {
    if (kbPrice <= 1_500_000_000) capAmount = 600_000_000;
    else if (kbPrice <= 2_500_000_000) capAmount = 400_000_000;
    else capAmount = 200_000_000;
  }
  const loanLimit = Math.min(ltvAmount, capAmount);
  const note = isRegulated ? "[안내] 대출 실행 후 6개월 이내 전입 의무가 발생합니다." : "";
  return { loanLimit, basePrice, ltv, policyNote: note };
}

const AREA_QUICK = [
  { label: "60㎡ 이하", value: "59" },
  { label: "85㎡ 이하", value: "84" },
  { label: "85㎡ 초과", value: "100" },
];

function TotalCostPageContent() {
  const searchParams = useSearchParams();

  const [houseCount, setHouseCount] = useState<HouseCount>("1");
  const [region, setRegion] = useState<RegionType>("adjusted");
  const [reductionType, setReductionType] = useState<ReductionType>("none");
  const [isMetro, setIsMetro] = useState(true);
  const [policyLoan, setPolicyLoan] = useState<PolicyLoanType>("none");

  const [saleInput, setSaleInput] = useState("");
  const [kbInput, setKbInput] = useState("");
  const [areaInput, setAreaInput] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<{
    salePrice: number;
    kbPrice: number;
    acqRate: number;
    acqBefore: number;
    reductionAmt: number;
    acqTax: number;
    eduTax: number;
    ruralTax: number;
    brokerageRate: number;
    brokerage: number;
    brokerageVat: number;
    totalNoVat: number;
    totalWithVat: number;
    ltv: number;
    loanLimit: number;
    policyNote: string;
    myCapitalNoVat: number;
    myCapitalWithVat: number;
  } | null>(null);

  useEffect(() => {
    const sharedHouseCount = searchParams.get("houseCount");
    const sharedRegion = searchParams.get("region");
    const sharedReduction = searchParams.get("reduction");
    const sharedIsMetro = searchParams.get("isMetro");
    const sharedPolicyLoan = searchParams.get("policyLoan");
    const sharedSale = searchParams.get("sale");
    const sharedKb = searchParams.get("kb");
    const sharedArea = searchParams.get("area");

    if (sharedHouseCount) setHouseCount(sharedHouseCount as HouseCount);
    if (sharedRegion) setRegion(sharedRegion as RegionType);
    if (sharedReduction) setReductionType(sharedReduction as ReductionType);
    if (sharedIsMetro) setIsMetro(sharedIsMetro === "true");
    if (sharedPolicyLoan) setPolicyLoan(sharedPolicyLoan as PolicyLoanType);
    if (sharedSale) setSaleInput(sharedSale);
    if (sharedKb) setKbInput(sharedKb);
    if (sharedArea) setAreaInput(sharedArea);
  }, [searchParams]);

  useEffect(() => {
    const sharedSale = searchParams.get("sale");
    const sharedKb = searchParams.get("kb");

    if (sharedSale && sharedKb) {
      const t = setTimeout(() => {
        calculate({
          sale: sharedSale,
          kb: sharedKb,
          area: searchParams.get("area") || "",
          houseCount: (searchParams.get("houseCount") as HouseCount) || "1",
          region: (searchParams.get("region") as RegionType) || "adjusted",
          reduction: (searchParams.get("reduction") as ReductionType) || "none",
          isMetro: searchParams.get("isMetro") === "true",
          policyLoan: (searchParams.get("policyLoan") as PolicyLoanType) || "none",
        });
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculate = (overrideParams?: {
    sale: string;
    kb: string;
    area: string;
    houseCount: HouseCount;
    region: RegionType;
    reduction: ReductionType;
    isMetro: boolean;
    policyLoan: PolicyLoanType;
  }) => {
    const tSale = overrideParams ? overrideParams.sale : saleInput;
    const tKb = overrideParams ? overrideParams.kb : kbInput;
    const tArea = overrideParams ? overrideParams.area : areaInput;
    const tHouseCount = overrideParams ? overrideParams.houseCount : houseCount;
    const tRegion = overrideParams ? overrideParams.region : region;
    const tReduction = overrideParams ? overrideParams.reduction : reductionType;
    const tIsMetro = overrideParams ? overrideParams.isMetro : isMetro;
    const tPolicyLoan = overrideParams ? overrideParams.policyLoan : policyLoan;

    const salePrice = Number(tSale) * 10000;
    const kbPrice = Number(tKb) * 10000;
    const area = Number(tArea);

    if (!salePrice || !kbPrice) {
      alert("매매가액과 KB시세를 입력해주세요.");
      return;
    }

    const stdRate = getStandardRate(salePrice);
    const multiRate = getMultiHouseRate(tHouseCount, tRegion);
    const acqRate = multiRate ?? stdRate;
    const acqBefore = salePrice * acqRate;

    let reductionAmt = 0;
    if (tReduction === "first-time" && salePrice <= 1_200_000_000) {
      const cap = getFirstTimeCap(salePrice, area, tIsMetro);
      reductionAmt = Math.min(acqBefore, cap);
    } else if (tReduction === "childbirth" && salePrice <= 1_200_000_000) {
      reductionAmt = Math.min(acqBefore, 5_000_000);
    }

    const acqTax = acqBefore - reductionAmt;
    const eduTax = acqTax * 0.1;
    const ruralTax = (area === 0 || area > 85) ? salePrice * stdRate * 0.1 : 0;

    const brokerageRate = getBrokerageRate(salePrice);
    const brokerage = getBrokerage(salePrice);
    const brokerageVat = brokerage * 1.1;

    const totalNoVat = salePrice + acqTax + eduTax + ruralTax + brokerage;
    const totalWithVat = salePrice + acqTax + eduTax + ruralTax + brokerageVat;

    const isFirstTime = tReduction === "first-time";
    const isRegulated = tRegion === "adjusted";
    const { loanLimit, ltv, policyNote } = getLoanLimit(
      salePrice, kbPrice, isFirstTime, isRegulated, tPolicyLoan
    );

    const myCapitalNoVat = Math.max(totalNoVat - loanLimit, 0);
    const myCapitalWithVat = Math.max(totalWithVat - loanLimit, 0);

    setResult({
      salePrice, kbPrice,
      acqRate, acqBefore, reductionAmt, acqTax, eduTax, ruralTax,
      brokerageRate, brokerage, brokerageVat,
      totalNoVat, totalWithVat,
      ltv, loanLimit, policyNote,
      myCapitalNoVat, myCapitalWithVat,
    });

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <style jsx>{`
        @keyframes loanLinkBreath {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* 헤더 — 메인으로 링크 + 다크모드 토글 */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition link-press">
            ← 메인으로
          </Link>
          <ThemeToggle />
        </div>

        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
            <Calculator size={20} strokeWidth={1.75} className="text-emerald-600 dark:text-emerald-400" />
            총비용 계산기
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">집 구매 시 실제 필요한 총비용과 자기자본을 한눈에</p>
        </div>

        {/* ① 주택 구분 설정 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400">주택 구분</h2>

          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">보유 주택수 (취득 후 기준)</label>
            <div className="grid grid-cols-4 gap-2">
              {(["1", "2", "3", "4+"] as HouseCount[]).map((h) => (
                <button key={h} onClick={() => setHouseCount(h)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${houseCount === h
                    ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                  }`}>
                  {h}주택
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">소재 지역</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "adjusted", label: "조정대상지역" },
                { key: "non-adjusted", label: "비조정대상지역" },
              ].map((r) => (
                <button key={r.key} onClick={() => setRegion(r.key as RegionType)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${region === r.key
                    ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">취득세 감면</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "none", label: "없음" },
                { key: "first-time", label: "생애최초" },
                { key: "childbirth", label: "출산·양육" },
              ].map((r) => (
                <button key={r.key} onClick={() => setReductionType(r.key as ReductionType)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${reductionType === r.key
                    ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {reductionType === "first-time" && (
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">지역 구분</label>
              <div className="flex gap-2">
                {[true, false].map((m) => (
                  <button key={String(m)} onClick={() => setIsMetro(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${isMetro === m
                      ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                      : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                    }`}>
                    {m ? "수도권" : "지방"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 block">연계 정책대출 상품</label>
            <div className="flex gap-2 flex-wrap">
              {(["none", "newborn", "didimdol", "bobreumjari"] as PolicyLoanType[]).map((p) => {
                const label = p === "none" ? "일반대출" : POLICY_LOAN_INFO[p]?.label || "보금자리론";
                return (
                  <button key={p} onClick={() => setPolicyLoan(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${policyLoan === p
                      ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                      : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ② 대출/자산 정보 입력 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400">부동산 매수 정보 입력</h2>

          <PriceInput
            label="매매가격 (만원)"
            value={saleInput}
            onChange={setSaleInput}
            placeholder="예: 50000"
          />

          <PriceInput
            label="KB국민은행 시세 (만원) — 대출 한도 산정 기준"
            value={kbInput}
            onChange={setKbInput}
            placeholder="예: 50000"
          />

          <div>
            <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">전용면적 (㎡) — 농어촌특별세 부과 기준</label>
            <input
              type="number"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder="예: 84"
              className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 mb-2"
            />
            <div className="flex gap-2">
              {AREA_QUICK.map((a) => (
                <button key={a.value} onClick={() => setAreaInput(a.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${areaInput === a.value
                    ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => calculate()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition btn-press"
          >
            총비용 산출하기
          </button>
        </div>

        {/* ③ 결과 화면 */}
        {result && (
          <div ref={resultRef} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 result-enter">
            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-700">총비용 모의 정산서</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/70 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">총 필요 자금 (세금+중개비 포함)</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{fmtWon(result.totalWithVat)}</p>
              </div>
              <div className="bg-blue-50/70 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">최대 주담대 이용 금액</p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{fmtWon(result.loanLimit)}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-5 text-center border border-slate-100 dark:border-slate-600">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">준비해야 하는 최소 현금</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{fmtWon(result.myCapitalWithVat)}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">취득세 등 세금 {fmtWon(result.acqTax + result.eduTax + result.ruralTax)} 및 중개보수 부가세포함액 취합 완료</p>
            </div>

            <div className="space-y-2 pt-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100 dark:border-slate-700">
                <span>순수 주택 매매대금</span>
                <span className="font-semibold">{fmtWon(result.salePrice)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100 dark:border-slate-700">
                <span>세금 합계 (취득+교육+농특세)</span>
                <span className="font-semibold">{fmtWon(result.acqTax + result.eduTax + result.ruralTax)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100 dark:border-slate-700">
                <span>공인중개사 중개수수료 (VAT포함)</span>
                <span className="font-semibold">{fmtWon(result.brokerageVat)}</span>
              </div>
            </div>

            {result.policyNote && (
              <div className={`flex items-start gap-1.5 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${
                result.policyNote.startsWith("[주의]")
                  ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              }`}>
                <span>{result.policyNote.replace(/^\[(주의|안내)\]\s*/, "")}</span>
              </div>
            )}

            {result.loanLimit > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Link href={`/loan?amount=${Math.round(result.loanLimit / 10000)}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition animate-pulse">
                  이 대출 한도로 월 원리금 시뮬레이션 해보기 <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
                <ShareButton
                  title="내 집 마련 총비용 계산 결과 - 똑집"
                  description={`매매가 ${fmtHundred(result.salePrice)} 구매 시 최소 현금 ${fmtHundred(result.myCapitalWithVat)} 필요 (대출 ${fmtHundred(result.loanLimit)} 포함)`}
                  params={{
                    houseCount,
                    region,
                    reduction: reductionType,
                    isMetro: String(isMetro),
                    policyLoan,
                    sale: saleInput,
                    kb: kbInput,
                    area: areaInput,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 주석 안내 */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            본 계산은 필수 세금(취득세·지방교육세·농어촌특별세)과 법정 최대 중개수수료를 합산한 예상치입니다.
            단, 아래 항목은 계약 조건에 따라 달라지므로 총액에서 제외되었습니다.
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-400 dark:text-slate-500">
            <li>• 근저당 설정 등록면허세 (대출 이용 시 발생 · 대출금×120%×0.2%)</li>
            <li>• 법무사 수수료 (약 40~80만원, 사무소별 상이)</li>
            <li>• 국민주택채권 할인료 (매일 금리에 따라 변동 · 약 20~80만원)</li>
            <li>• 인지세 15만원 + 등기신청수수료(증지) 1.5만원</li>
          </ul>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            → 실제 등기 시 통상 100~200만원 내외의 여유 자금을 추가로 준비하시길 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TotalCostPage() {
  return (
    <Suspense fallback={null}>
      <TotalCostPageContent />
    </Suspense>
  );
}
