"use client";

import { useState } from "react";
import Link from "next/link";

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

// ── 정책대출 한도 및 대상주택가액 상한 ──────────────────────────
// 출처: 주택도시기금 포털(nhuf.molit.go.kr) 2026.06 기준
const POLICY_LOAN_INFO: Record<PolicyLoanType, {
  label: string;
  maxLoan: number;          // 최대 대출 한도(원)
  maxHousePrice: number;    // 대상 주택가액 상한(원)
  desc: string;
} | null> = {
  none: null,
  newborn: {
    label: "신생아 특례",
    maxLoan: 400_000_000,          // 4억원
    maxHousePrice: 900_000_000,    // 9억원 이하
    desc: "2세 미만 자녀 보유 무주택 세대 / 주택가액 9억 이하 / 최대 4억원",
  },
  didimdol: {
    label: "디딤돌 (신혼가구)",
    maxLoan: 320_000_000,          // 3.2억원
    maxHousePrice: 600_000_000,    // 6억원 이하
    desc: "신혼가구 기준 / 주택가액 6억 이하 / 최대 3.2억원",
  },
  bogeumjari: {
    label: "보금자리론 (생초)",
    maxLoan: 420_000_000,          // 4.2억원
    maxHousePrice: 600_000_000,    // 6억원 이하
    desc: "생애최초 기준 / 주택가액 6억 이하 / 최대 4.2억원",
  },
};

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";
const fmtHundred = (n: number) => {
  const hun = Math.round(n / 10000);
  if (hun >= 10000) return `${(hun / 10000).toFixed(1)}억원`;
  return `${hun.toLocaleString()}만원`;
};

// ── 중개수수료 법정상한요율
// 주택 매매 기준 — 9억 이상은 3개 구간으로 세분화됨
function getBrokerageRate(price: number): number {
  if (price < 50_000_000) return 0.006;       // 5천만 미만: 0.6% (한도 25만)
  if (price < 200_000_000) return 0.005;      // 5천만~2억 미만: 0.5% (한도 80만)
  if (price < 900_000_000) return 0.004;      // 2억~9억 미만: 0.4%
  if (price < 1_200_000_000) return 0.005;   // 9억~12억 미만: 0.5%
  if (price < 1_500_000_000) return 0.006;   // 12억~15억 미만: 0.6%
  return 0.007;                               // 15억 이상: 0.7%
}

// 한도액 적용 (5천만 미만: 25만원, 5천만~2억 미만: 80만원)
function getBrokerage(price: number): number {
  const rate = getBrokerageRate(price);
  const raw = price * rate;
  if (price < 50_000_000) return Math.min(raw, 250_000);
  if (price < 200_000_000) return Math.min(raw, 800_000);
  return raw;
}

// ── 취득세 표준세율 (지방세법 제11조제1항제8호) ──────────────
function getStandardRate(price: number): number {
  if (price <= 600_000_000) return 0.01;
  if (price <= 900_000_000) {
    const rate = ((price * (2 / 300_000_000)) - 3) / 100;
    return Math.round(rate * 10000) / 10000;
  }
  return 0.03;
}

// ── 다주택자 중과세율 (지방세법 제13조의2제1항) ──────────────
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

// ── 생애최초 감면 한도 (지방세특례제한법 제36조의3) ──────────
function getFirstTimeCap(price: number, area: number, isMetro: boolean): number {
  const smallLimit = isMetro ? 600_000_000 : 300_000_000;
  return (area > 0 && area <= 60 && price <= smallLimit) ? 3_000_000 : 2_000_000;
}

// ── 주담대 한도 ─────────────────────────────────────────────
// 기준가액: 매매가와 KB시세 중 낮은 값
// LTV: 생애최초 70% (25.6.27 이후), 조정지역 일반 40%, 비조정 70%
// 정책대출 선택 시: 해당 상품 한도로 강제 적용 (단, 대상주택가액 초과 시 불가 안내)
// 10.15 대책: 수도권·규제지역 주택가격별 상한액 적용
function getLoanLimit(
  salePrice: number,
  kbPrice: number,
  isFirstTime: boolean,
  isRegulated: boolean,
  policyLoan: PolicyLoanType
): { loanLimit: number; basePrice: number; ltv: number; policyNote: string } {
  const basePrice = Math.min(salePrice, kbPrice);
  const policyInfo = POLICY_LOAN_INFO[policyLoan];

  // 정책대출 선택 시
  if (policyInfo) {
    // 대상 주택가액 초과 → 정책대출 불가
    if (salePrice > policyInfo.maxHousePrice) {
      return {
        loanLimit: 0,
        basePrice,
        ltv: 0,
        policyNote: `⚠️ 매매가(${fmtHundred(salePrice)})가 ${policyInfo.label} 대상 주택가액 상한(${fmtHundred(policyInfo.maxHousePrice)})을 초과하여 해당 정책대출 이용이 불가합니다.`,
      };
    }
    // LTV 70% 적용 (규제지역 포함, 25.6.27 이후)
    const ltv = 0.7;
    const ltvAmount = basePrice * ltv;
    const loanLimit = Math.min(ltvAmount, policyInfo.maxLoan);
    return {
      loanLimit,
      basePrice,
      ltv,
      policyNote: isRegulated
        ? `💡 ${policyInfo.label}: 규제지역 적용 LTV ${(ltv * 100).toFixed(0)}%, 최대 ${fmtHundred(policyInfo.maxLoan)} 한도 적용. 대출 실행 후 6개월 이내 전입 의무가 발생합니다.`
        : `💡 ${policyInfo.label}: LTV ${(ltv * 100).toFixed(0)}%, 최대 ${fmtHundred(policyInfo.maxLoan)} 한도 적용.`,
    };
  }

  // 일반 대출
  const ltv = isFirstTime ? 0.7 : (isRegulated ? 0.4 : 0.7);
  const ltvAmount = basePrice * ltv;
  let capAmount = Infinity;
  if (isRegulated) {
    if (kbPrice <= 1_500_000_000) capAmount = 600_000_000;
    else if (kbPrice <= 2_500_000_000) capAmount = 400_000_000;
    else capAmount = 200_000_000;
  }
  const loanLimit = Math.min(ltvAmount, capAmount);
  const note = isRegulated
    ? "💡 대출 실행 후 6개월 이내 전입 의무가 발생합니다."
    : "";
  return { loanLimit, basePrice, ltv, policyNote: note };
}

const AREA_QUICK = [
  { label: "60㎡ 이하", value: "59" },
  { label: "85㎡ 이하", value: "84" },
  { label: "85㎡ 초과", value: "100" },
];

export default function TotalCostPage() {
  // ① 주택 구분
  const [houseCount, setHouseCount] = useState<HouseCount>("1");
  const [region, setRegion] = useState<RegionType>("adjusted");
  const [reductionType, setReductionType] = useState<ReductionType>("none");
  const [isMetro, setIsMetro] = useState(true);
  const [policyLoan, setPolicyLoan] = useState<PolicyLoanType>("none");

  // ② 주택 정보
  const [saleInput, setSaleInput] = useState("");
  const [kbInput, setKbInput] = useState("");
  const [areaInput, setAreaInput] = useState("");

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

  const calculate = () => {
    const salePrice = Number(saleInput) * 10000;
    const kbPrice = Number(kbInput) * 10000;
    const area = Number(areaInput);

    if (!salePrice || !kbPrice) {
      alert("매매가액과 KB시세를 입력해주세요.");
      return;
    }

    // 취득세
    const stdRate = getStandardRate(salePrice);
    const multiRate = getMultiHouseRate(houseCount, region);
    const acqRate = multiRate ?? stdRate;
    const acqBefore = salePrice * acqRate;

    let reductionAmt = 0;
    if (reductionType === "first-time" && salePrice <= 1_200_000_000) {
      const cap = getFirstTimeCap(salePrice, area, isMetro);
      reductionAmt = Math.min(acqBefore, cap);
    } else if (reductionType === "childbirth" && salePrice <= 1_200_000_000) {
      reductionAmt = Math.min(acqBefore, 5_000_000);
    }

    const acqTax = acqBefore - reductionAmt;
    const eduTax = acqTax * 0.1;
    const ruralTax = (area === 0 || area > 85) ? salePrice * stdRate * 0.1 : 0;

    // 중개수수료
    const brokerageRate = getBrokerageRate(salePrice);
    const brokerage = getBrokerage(salePrice); // 한도액 적용
    const brokerageVat = brokerage * 1.1;

    // 총비용
    const totalNoVat = salePrice + acqTax + eduTax + ruralTax + brokerage;
    const totalWithVat = salePrice + acqTax + eduTax + ruralTax + brokerageVat;

    // 주담대 한도 (정책대출 우선 적용)
    const isFirstTime = reductionType === "first-time";
    const isRegulated = region === "adjusted";
    const { loanLimit, basePrice, ltv, policyNote } = getLoanLimit(
      salePrice, kbPrice, isFirstTime, isRegulated, policyLoan
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
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div>
          <h1 className="text-xl font-bold text-slate-800">🧮 총비용 계산기</h1>
          <p className="text-xs text-slate-400 mt-1">집 구매 시 실제 필요한 총비용과 자기자본을 한눈에</p>
        </div>

        {/* ① 주택 구분 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-600">주택 구분</h2>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">보유 주택수 (취득 후 기준)</label>
            <div className="grid grid-cols-4 gap-2">
              {(["1", "2", "3", "4+"] as HouseCount[]).map((h) => (
                <button key={h} onClick={() => setHouseCount(h)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                    houseCount === h
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  {h}주택
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">소재 지역</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "adjusted", label: "조정대상지역" },
                { key: "non-adjusted", label: "비조정대상지역" },
              ].map((r) => (
                <button key={r.key} onClick={() => setRegion(r.key as RegionType)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                    region === r.key
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">취득세 감면</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "none", label: "없음" },
                { key: "first-time", label: "생애최초" },
                { key: "childbirth", label: "출산·양육" },
              ].map((r) => (
                <button key={r.key} onClick={() => setReductionType(r.key as ReductionType)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                    reductionType === r.key
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {reductionType === "first-time" && (
            <div className="border-t border-slate-100 pt-3">
              <label className="text-xs text-slate-400 mb-1.5 block">소재지역 (소형주택 감면한도 판단)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: true, label: "수도권 (6억 이하 소형 300만)" },
                  { v: false, label: "지방 (3억 이하 소형 300만)" },
                ].map((m) => (
                  <button key={String(m.v)} onClick={() => setIsMetro(m.v)}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      isMetro === m.v
                        ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 정책대출 선택 */}
          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs text-slate-400 mb-1.5 block">
              정책대출 선택
              <span className="text-slate-400 ml-1">— 선택 시 해당 상품 한도로 자동 적용</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(POLICY_LOAN_INFO) as [PolicyLoanType, typeof POLICY_LOAN_INFO[PolicyLoanType]][]).map(([key, info]) => (
                <button key={key} onClick={() => setPolicyLoan(key)}
                  className={`py-2.5 px-3 rounded-xl border transition text-left ${
                    policyLoan === key
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  <p className="text-xs font-bold">{info ? info.label : "일반 대출"}</p>
                  {info && <p className="text-[10px] opacity-70 mt-0.5">최대 {fmtHundred(info.maxLoan)} / {fmtHundred(info.maxHousePrice)} 이하</p>}
                </button>
              ))}
            </div>
            {policyLoan !== "none" && POLICY_LOAN_INFO[policyLoan] && (
              <p className="text-[11px] text-emerald-600 mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {POLICY_LOAN_INFO[policyLoan]!.desc}
              </p>
            )}
          </div>
        </div>

        {/* ② 주택 정보 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-600">주택 정보 입력</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">매매가액 (만원)</label>
              <input type="number" value={saleInput} onChange={(e) => setSaleInput(e.target.value)}
                placeholder="예: 90000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">KB시세 (만원)</label>
              <input type="number" value={kbInput} onChange={(e) => setKbInput(e.target.value)}
                placeholder="예: 95000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
              <p className="text-[10px] text-slate-400 mt-1">주담대 한도 산정 기준</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              전용면적 (㎡) <span className="text-slate-400">— 농어촌특별세 및 취득세 감면 기준</span>
            </label>
            <input type="number" value={areaInput} onChange={(e) => setAreaInput(e.target.value)}
              placeholder="예: 84.97"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 mb-2" />
            <div className="flex gap-2">
              {AREA_QUICK.map((btn) => (
                <button key={btn.label} onClick={() => setAreaInput(btn.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    areaInput === btn.value
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={calculate}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition text-base">
          총비용 계산하기
        </button>

        {/* 결과 */}
        {result && (
          <div className="space-y-4">

            {/* 비용 상세 내역 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-600 mb-3">비용 상세 내역</h2>
              <div className="space-y-0 text-sm">

                <div className="flex justify-between py-2.5 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">매매가액</span>
                  <span className="font-bold">{fmtWon(result.salePrice)}</span>
                </div>

                {/* 취득세 관련 */}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    취득세
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({(result.acqRate * 100).toFixed(2)}%
                      {result.reductionAmt > 0 && ` → 감면 ${fmtWon(result.reductionAmt)}`})
                    </span>
                  </span>
                  <span className="font-bold">{fmtWon(result.acqTax)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">지방교육세 <span className="text-[10px] text-slate-400">(취득세×10%)</span></span>
                  <span className="font-bold">{fmtWon(result.eduTax)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    농어촌특별세
                    <span className="text-[10px] text-slate-400 ml-1">
                      {Number(areaInput) > 85 ? "(85㎡ 초과 · 매매가×취득세율×10%)" : "(85㎡ 이하 비과세)"}
                    </span>
                  </span>
                  <span className={`font-bold ${result.ruralTax === 0 ? "text-slate-400" : ""}`}>
                    {fmtWon(result.ruralTax)}
                  </span>
                </div>

                {/* 중개수수료 */}
                <div className="py-2 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      중개수수료
                      <span className="text-[10px] text-slate-400 ml-1">(법정상한 {(result.brokerageRate * 100).toFixed(1)}%)</span>
                    </span>
                    <span className="font-bold">{fmtWon(result.brokerage)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-slate-400 ml-1">VAT 포함 시</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{fmtWon(result.brokerageVat)}</span>
                  </div>
                </div>

                {/* 주담대 */}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    주담대 한도
                    <span className="text-[10px] text-slate-400 ml-1">
                      (매매가·KB시세 중 낮은값 기준 × LTV {(result.ltv * 100).toFixed(0)}%, 상한 적용)
                    </span>
                  </span>
                  <span className="font-bold text-blue-600">-{fmtWon(result.loanLimit)}</span>
                </div>

                {/* 정책대출/전입의무 안내 */}
                {result.policyNote && (
                  <div className={`rounded-lg px-3 py-2.5 text-[11px] leading-relaxed ${
                    result.policyNote.startsWith("⚠️")
                      ? "bg-red-50 border border-red-200 text-red-700"
                      : "bg-blue-50 border border-blue-200 text-blue-700"
                  }`}>
                    {result.policyNote}
                  </div>
                )}
              </div>
            </div>

            {/* 총비용 + 자기자본 2열 카드 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500">총 구매비용</p>
                <div>
                  <p className="text-[10px] text-slate-400">VAT 제외</p>
                  <p className="text-lg font-black text-slate-700">{fmtWon(result.totalNoVat)}</p>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <p className="text-[10px] text-slate-400">VAT 포함</p>
                  <p className="text-lg font-black text-slate-800">{fmtWon(result.totalWithVat)}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-emerald-600">필요 자기자본</p>
                <div>
                  <p className="text-[10px] text-emerald-500">VAT 제외</p>
                  <p className="text-lg font-black text-emerald-700">{fmtWon(result.myCapitalNoVat)}</p>
                </div>
                <div className="border-t border-emerald-200 pt-2">
                  <p className="text-[10px] text-emerald-500">VAT 포함</p>
                  <p className="text-lg font-black text-emerald-800">{fmtWon(result.myCapitalWithVat)}</p>
                </div>
              </div>
            </div>

            {/* 주석 안내 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 본 계산은 필수 세금(취득세·지방교육세·농어촌특별세)과 법정 최대 중개수수료를 합산한 예상치입니다.
                단, 아래 항목은 계약 조건에 따라 달라지므로 총액에서 제외되었습니다.
              </p>
              <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
                <li>• 근저당 설정 등록면허세 (대출 이용 시 발생 · 대출금×120%×0.2%)</li>
                <li>• 법무사 수수료 (약 40~80만원, 사무소별 상이)</li>
                <li>• 국민주택채권 할인료 (매일 금리에 따라 변동 · 약 20~80만원)</li>
                <li>• 인지세 15만원 + 등기신청수수료(증지) 1.5만원</li>
              </ul>
              <p className="mt-2 text-[11px] text-slate-500 font-semibold">
                → 실제 등기 시 통상 100~200만원 내외의 여유 자금을 추가로 준비하시길 권장합니다.
              </p>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              출처: 지방세법 제11조·제13조의2·제151조, 지방세특례제한법 제36조의3·제36조의5,
              농어촌특별세법 제5조, 공인중개사법 시행규칙 제20조 [별표2],
              금융위원회 「주택시장 안정화 대책」(2025.10.15).
              주담대 한도는 KB시세 기준 LTV와 주택가격별 상한액 중 낮은 값을 적용합니다.
              본 계산은 참고용이며 실제 금액은 금융기관 및 관계기관 확인이 필요합니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}