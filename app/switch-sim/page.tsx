"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import PriceInput from "@/components/PriceInput";

// ✅ 법령 출처
// 양도세: 소득세법 제89조(비과세), 제95조(장특공제), 제103조(기본공제), 제104조(세율·중과)
// 취득세: 지방세법 제11조, 제13조의2 / 지방세특례제한법 제36조의3(생애최초)
// 중개보수: 공인중개사법 시행규칙 제20조 별표1 (2021.10.19 개정)
// 주담대: 금융위원회 주택시장 안정화 대책 (2025.10.15)

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";
const fmtHundred = (n: number) => {
  const uk = Math.floor(n / 100_000_000);
  const man = Math.round((n % 100_000_000) / 10_000);
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${man.toLocaleString()}만원`;
};

// ── 양도세 ──────────────────────────────────────────────────
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

function getOneHouseLTCG(holdY: number, liveY: number): number {
  // 1. 3년 미만 보유 시 장특공제 전면 배제
  if (holdY < 3) return 0;
  // 2. 보유 3년 이상이나 거주 2년 미만 → 일반표(연 2%, 최대 30%)로 강등
  if (liveY < 2) return getGeneralLTCG(holdY);
  // 3. 3년 이상 보유 + 2년 이상 거주 → 1세대1주택 표(보유4%+거주4%, 최대 80%)
  const h = Math.min(Math.floor(holdY) * 0.04, 0.4);
  const l = Math.min(Math.floor(liveY) * 0.04, 0.4);
  return Math.min(h + l, 0.8);
}

function getGeneralLTCG(holdY: number): number {
  if (holdY < 3) return 0;
  return Math.min(Math.floor(holdY) * 0.02, 0.3);
}

function calcSellTax(
  sellPrice: number,
  purchasePrice: number,
  expenses: number,
  holdY: number,
  liveY: number,
  isOneHouse: boolean,
  meetsNonTax: boolean,
  houseCount: "1" | "2" | "3+",
  isAdjusted: boolean
): { tax: number; localTax: number; total: number; note: string } {
  const gainRaw = Math.max(sellPrice - purchasePrice - expenses, 0);

  // 1세대1주택 비과세
  if (isOneHouse && meetsNonTax) {
    if (sellPrice <= 1_200_000_000) {
      return { tax: 0, localTax: 0, total: 0, note: "1세대1주택 비과세 (12억 이하)" };
    }
    // 고가주택
    const taxablePortion = (sellPrice - 1_200_000_000) / sellPrice;
    const gain = gainRaw * taxablePortion;
    const ltcgRate = getOneHouseLTCG(holdY, liveY);
    const ltcg = gain * ltcgRate;
    const taxable = Math.max(gain - ltcg - 2_500_000, 0);
    const tax = getBasicTaxRate(taxable);
    const localTax = tax * 0.1;
    return { tax, localTax, total: tax + localTax, note: `고가주택 과세 (${(taxablePortion * 100).toFixed(1)}% 과세분)` };
  }

  // 다주택 중과
  const isMultiSurcharge = houseCount !== "1" && isAdjusted;
  let ltcgRate = 0;
  if (!isMultiSurcharge) {
    ltcgRate = isOneHouse ? getOneHouseLTCG(holdY, liveY) : getGeneralLTCG(holdY);
  }
  const ltcg = gainRaw * ltcgRate;
  const taxable = Math.max(gainRaw - ltcg - 2_500_000, 0);
  let tax = getBasicTaxRate(taxable);
  let surchargeNote = "";
  if (isMultiSurcharge) {
    const surcharge = houseCount === "2" ? 0.2 : 0.3;
    tax += taxable * surcharge;
    surchargeNote = ` + 중과 +${surcharge * 100}%p`;
  }
  const localTax = tax * 0.1;
  return {
    tax, localTax, total: tax + localTax,
    note: `기본세율${surchargeNote}${ltcgRate > 0 ? ` / 장특공제 ${(ltcgRate * 100).toFixed(0)}%` : ""}`,
  };
}

// ── 중개보수 (2021 개정) ─────────────────────────────────────
function getBrokerage(price: number): number {
  let rate: number;
  if (price < 50_000_000) rate = 0.006;
  else if (price < 200_000_000) rate = 0.005;
  else if (price < 900_000_000) rate = 0.004;
  else if (price < 1_200_000_000) rate = 0.005;
  else if (price < 1_500_000_000) rate = 0.006;
  else rate = 0.007;
  const raw = price * rate;
  if (price < 50_000_000) return Math.min(raw, 250_000);
  if (price < 200_000_000) return Math.min(raw, 800_000);
  return raw;
}

// ── 취득세 ──────────────────────────────────────────────────
function getStandardRate(price: number): number {
  if (price <= 600_000_000) return 0.01;
  if (price <= 900_000_000) return Math.round((((price * (2 / 300_000_000)) - 3) / 100) * 10000) / 10000;
  return 0.03;
}

function getMultiHouseRate(houseCount: "1" | "2" | "3+", region: "adjusted" | "non-adjusted"): number | null {
  if (region === "adjusted") {
    if (houseCount === "2") return 0.08;
    if (houseCount === "3+") return 0.12;
  } else {
    if (houseCount === "3+") return 0.08;
  }
  return null;
}

// ── 주담대 한도 ──────────────────────────────────────────────
function getLoanLimit(buyPrice: number, kbPrice: number, isFirstTime: boolean, isRegulated: boolean): {
  limit: number; ltv: number;
} {
  const base = Math.min(buyPrice, kbPrice);
  const ltv = isFirstTime ? 0.7 : (isRegulated ? 0.4 : 0.7);
  const ltvAmount = base * ltv;
  let cap = Infinity;
  if (isRegulated) {
    if (kbPrice <= 1_500_000_000) cap = 600_000_000;
    else if (kbPrice <= 2_500_000_000) cap = 400_000_000;
    else cap = 200_000_000;
  }
  return { limit: Math.min(ltvAmount, cap), ltv };
}

// ── 월 원리금 계산 (원리금균등상환) ──────────────────────────
function monthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

type HouseCount = "1" | "2" | "3+";
type RegionType = "adjusted" | "non-adjusted";

export default function SwitchSimPage() {
  // ── 매도 입력 ──
  const [sellPriceInput, setSellPriceInput] = useState("");
  const [purchasePriceInput, setPurchasePriceInput] = useState("");
  const [expensesInput, setExpensesInput] = useState("");
  const [holdYears, setHoldYears] = useState("");
  const [liveYears, setLiveYears] = useState("");
  const [isOneHouse, setIsOneHouse] = useState(true);
  const [meetsNonTax, setMeetsNonTax] = useState(true);
  const [sellHouseCount, setSellHouseCount] = useState<HouseCount>("1");
  const [sellIsAdjusted, setSellIsAdjusted] = useState(false);
  const [existingLoanInput, setExistingLoanInput] = useState("");
  const [existingRate, setExistingRate] = useState("4.0");   // 기존 대출 금리
  const [existingRemainYears, setExistingRemainYears] = useState("25"); // 기존 잔여기간

  // ── 매수 입력 ──
  const [buyPriceInput, setBuyPriceInput] = useState("");
  const [kbPriceInput, setKbPriceInput] = useState("");
  const [buyAreaInput, setBuyAreaInput] = useState("");
  const [buyHouseCount, setBuyHouseCount] = useState<HouseCount>("1");
  const [buyRegion, setBuyRegion] = useState<RegionType>("adjusted");
  const [buyReduction, setBuyReduction] = useState<"none" | "first-time" | "childbirth">("none");
  const [newRate, setNewRate] = useState("4.2");        // 신규 대출 금리
  const [newLoanYears, setNewLoanYears] = useState("30"); // 신규 대출 기간
  const resultRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<{
    // 매도
    sellTax: number;
    sellLocalTax: number;
    sellBrokerage: number;
    sellBrokerageVat: number;
    existingLoan: number;
    netProceeds: number;
    sellTaxNote: string;
    // 매수
    acqTax: number;
    eduTax: number;
    ruralTax: number;
    buyBrokerage: number;
    buyBrokerageVat: number;
    totalBuyCost: number;
    // 대출
    loanLimit: number;
    ltv: number;
    // 최종
    additionalCapital: number;
    totalCost: number; // 갈아타기 총 비용 (세금+수수료만)
    // 월 부담 분석
    oldMonthly: number;
    newMonthly: number;
    monthlyDiff: number;
  } | null>(null);

  const calculate = () => {
    const sellPrice = Number(sellPriceInput) * 10000;
    const purchasePrice = Number(purchasePriceInput) * 10000;
    const expenses = Number(expensesInput) * 10000;
    const holdY = Number(holdYears);
    const liveY = Number(liveYears);
    const existingLoan = Number(existingLoanInput) * 10000;
    const buyPrice = Number(buyPriceInput) * 10000;
    const kbPrice = Number(kbPriceInput) * 10000;
    const buyArea = Number(buyAreaInput);

    if (!sellPrice || !purchasePrice || !buyPrice || !kbPrice) {
      alert("매도가액, 취득가액, 매수가액, KB시세를 모두 입력해주세요.");
      return;
    }

    // ── 매도 계산 ──
    const { tax: sellTax, localTax: sellLocalTax, total: sellTaxTotal, note: sellTaxNote } = calcSellTax(
      sellPrice, purchasePrice, expenses, holdY, liveY,
      isOneHouse, meetsNonTax, sellHouseCount, sellIsAdjusted
    );
    const sellBrokerage = getBrokerage(sellPrice);
    const sellBrokerageVat = sellBrokerage * 1.1;
    const netProceeds = sellPrice - sellTaxTotal - sellBrokerageVat - existingLoan;

    // ── 매수 계산 ──
    const stdRate = getStandardRate(buyPrice);
    const multiRate = getMultiHouseRate(buyHouseCount, buyRegion);
    const acqRate = multiRate ?? stdRate;
    const acqBefore = buyPrice * acqRate;

    let reductionAmt = 0;
    if (buyReduction === "first-time" && buyPrice <= 1_200_000_000) {
      reductionAmt = Math.min(acqBefore, buyArea > 0 && buyArea <= 60 && buyPrice <= 600_000_000 ? 3_000_000 : 2_000_000);
    } else if (buyReduction === "childbirth" && buyPrice <= 1_200_000_000) {
      reductionAmt = Math.min(acqBefore, 5_000_000);
    }
    const acqTax = acqBefore - reductionAmt;
    const eduTax = acqTax * 0.1;
    const ruralTax = (buyArea === 0 || buyArea > 85) ? buyPrice * stdRate * 0.1 : 0;
    const buyBrokerage = getBrokerage(buyPrice);
    const buyBrokerageVat = buyBrokerage * 1.1;
    const totalBuyCost = buyPrice + acqTax + eduTax + ruralTax + buyBrokerageVat;

    // ── 주담대 ──
    const isFirstTime = buyReduction === "first-time";
    const isRegulated = buyRegion === "adjusted";
    const { limit: loanLimit, ltv } = getLoanLimit(buyPrice, kbPrice, isFirstTime, isRegulated);

    // ── 최종 ──
    const additionalCapital = totalBuyCost - loanLimit - Math.max(netProceeds, 0);
    const totalCost = sellTaxTotal + sellBrokerageVat + acqTax + eduTax + ruralTax + buyBrokerageVat;

    // ── 월 부담 분석 ──
    const oldMonthly = monthlyPayment(existingLoan, Number(existingRate), Number(existingRemainYears));
    const newMonthly = monthlyPayment(loanLimit, Number(newRate), Number(newLoanYears));
    const monthlyDiff = newMonthly - oldMonthly;

    setResult({
      sellTax, sellLocalTax, sellBrokerage, sellBrokerageVat,
      existingLoan, netProceeds, sellTaxNote,
      acqTax, eduTax, ruralTax, buyBrokerage, buyBrokerageVat, totalBuyCost,
      loanLimit, ltv,
      additionalCapital, totalCost,
      oldMonthly, newMonthly, monthlyDiff,
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

        <div>
          <h1 className="text-xl font-bold text-slate-800">🔄 갈아타기 시뮬레이터</h1>
          <p className="text-xs text-slate-400 mt-1">현재 집 매도 → 새 집 매수 시 추가 필요 자기자본을 계산합니다</p>
        </div>

        {/* ═══ 매도 섹션 ═══ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">SELL</span>
            현재 집 매도 정보
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <PriceInput
              label="매도가액 (만원)"
              value={sellPriceInput}
              onChange={setSellPriceInput}
              placeholder="예: 100000"
            />
            <PriceInput
              label="취득가액 (만원)"
              value={purchasePriceInput}
              onChange={setPurchasePriceInput}
              placeholder="예: 70000"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <PriceInput
              label="필요경비 (만원)"
              value={expensesInput}
              onChange={setExpensesInput}
              placeholder="예: 500"
            />
            <div>
              <label className="text-xs text-slate-400 mb-1 block">보유기간 (년)</label>
              <input type="number" value={holdYears} onChange={e => setHoldYears(e.target.value)}
                placeholder="예: 8" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">거주기간 (년)</label>
              <input type="number" value={liveYears} onChange={e => setLiveYears(e.target.value)}
                placeholder="예: 8" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
          </div>

          <div>
            <PriceInput
              label="기존 주담대 잔액 (만원)"
              value={existingLoanInput}
              onChange={setExistingLoanInput}
              placeholder="없으면 0 또는 비워두세요"
            />
            <p className="text-[10px] text-slate-400 mt-1">매도 시 상환되는 기존 대출 잔액 (실수령액에서 차감)</p>
          </div>

          {/* 기존 대출 조건 (월부담 비교용) */}
          {Number(existingLoanInput) > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">기존 대출 금리 (%)</label>
                <input type="number" step="0.1" value={existingRate} onChange={e => setExistingRate(e.target.value)}
                  placeholder="예: 4.0" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">기존 대출 잔여기간 (년)</label>
                <input type="number" value={existingRemainYears} onChange={e => setExistingRemainYears(e.target.value)}
                  placeholder="예: 25" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
              </div>
            </div>
          )}

          {/* 양도세 옵션 */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isOneHouse} onChange={e => setIsOneHouse(e.target.checked)}
                className="w-4 h-4 accent-emerald-500" />
              1세대 1주택 (비과세 검토)
            </label>

            {isOneHouse && (
              <label className="flex items-center gap-2 text-sm cursor-pointer ml-5">
                <input type="checkbox" checked={meetsNonTax} onChange={e => setMeetsNonTax(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500" />
                비과세 요건 충족 (2년 이상 보유·거주)
              </label>
            )}

            {!isOneHouse && (
              <div className="space-y-2 ml-1">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">보유 주택수</label>
                  <div className="flex gap-2">
                    {(["1", "2", "3+"] as HouseCount[]).map(h => (
                      <button key={h} onClick={() => setSellHouseCount(h)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          sellHouseCount === h ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                        }`}>{h}주택</button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={sellIsAdjusted} onChange={e => setSellIsAdjusted(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500" />
                  조정대상지역 소재 (다주택 중과 적용)
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ═══ 매수 섹션 ═══ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">BUY</span>
            새 집 매수 정보
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <PriceInput
              label="매수가액 (만원)"
              value={buyPriceInput}
              onChange={setBuyPriceInput}
              placeholder="예: 150000"
            />
            <div>
              <PriceInput
                label="KB시세 (만원)"
                value={kbPriceInput}
                onChange={setKbPriceInput}
                placeholder="예: 155000"
              />
              <p className="text-[10px] text-slate-400 mt-1">주담대 한도 산정 기준</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">전용면적 (㎡)</label>
            <div className="flex gap-2">
              <input type="number" value={buyAreaInput} onChange={e => setBuyAreaInput(e.target.value)}
                placeholder="예: 84" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
              {["59", "84", "100"].map(v => (
                <button key={v} onClick={() => setBuyAreaInput(v)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition shrink-0 ${
                    buyAreaInput === v ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                  }`}>{v}㎡</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">소재 지역</label>
              <div className="flex gap-2">
                {[{ k: "adjusted", l: "조정지역" }, { k: "non-adjusted", l: "비조정" }].map(r => (
                  <button key={r.k} onClick={() => setBuyRegion(r.k as RegionType)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                      buyRegion === r.k ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                    }`}>{r.l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">취득 후 주택수</label>
              <div className="flex gap-1.5">
                {(["1", "2", "3+"] as HouseCount[]).map(h => (
                  <button key={h} onClick={() => setBuyHouseCount(h)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                      buyHouseCount === h ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                    }`}>{h}주택</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">취득세 감면</label>
            <div className="flex gap-2">
              {[{ k: "none", l: "없음" }, { k: "first-time", l: "생애최초" }, { k: "childbirth", l: "출산·양육" }].map(r => (
                <button key={r.k} onClick={() => setBuyReduction(r.k as "none" | "first-time" | "childbirth")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                    buyReduction === r.k ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                  }`}>{r.l}</button>
              ))}
            </div>
          </div>

          {/* 신규 대출 조건 (월부담 비교용) */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">신규 대출 금리 (%)</label>
              <input type="number" step="0.1" value={newRate} onChange={e => setNewRate(e.target.value)}
                placeholder="예: 4.2" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">신규 대출 기간 (년)</label>
              <input type="number" value={newLoanYears} onChange={e => setNewLoanYears(e.target.value)}
                placeholder="예: 30" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
          </div>
        </div>

        <button onClick={calculate}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition text-base">
          갈아타기 시뮬레이션 실행
        </button>

        {/* ═══ 결과 ═══ */}
        {result && (
          <div ref={resultRef} className="space-y-4">

            {/* 매도 내역 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">SELL</span>
                매도 내역
              </h3>
              {result.sellTaxNote && (
                <div className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-1.5">{result.sellTaxNote}</div>
              )}
              <div className="space-y-0 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">양도소득세</span>
                  <span className="font-bold">{fmtWon(result.sellTax)}</span>
                </div>
                {result.sellTax > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">지방소득세</span>
                    <span className="font-bold">{fmtWon(result.sellLocalTax)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">중개수수료 (VAT포함)</span>
                  <span className="font-bold">{fmtWon(result.sellBrokerageVat)}</span>
                </div>
                {result.existingLoan > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">기존 주담대 상환</span>
                    <span className="font-bold text-red-500">-{fmtWon(result.existingLoan)}</span>
                  </div>
                )}
              </div>
              <div className={`rounded-xl p-3 flex justify-between items-center ${result.netProceeds >= 0 ? "bg-blue-50 border border-blue-200" : "bg-red-50 border border-red-200"}`}>
                <span className={`text-sm font-bold ${result.netProceeds >= 0 ? "text-blue-700" : "text-red-700"}`}>매도 실수령액</span>
                <span className={`text-lg font-black ${result.netProceeds >= 0 ? "text-blue-700" : "text-red-600"}`}>
                  {result.netProceeds < 0 ? "-" : ""}{fmtWon(Math.abs(result.netProceeds))}
                </span>
              </div>
            </div>

            {/* 매수 내역 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">BUY</span>
                매수 내역
              </h3>
              <div className="space-y-0 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">취득세</span>
                  <span className="font-bold">{fmtWon(result.acqTax)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">지방교육세</span>
                  <span className="font-bold">{fmtWon(result.eduTax)}</span>
                </div>
                {result.ruralTax > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">농어촌특별세</span>
                    <span className="font-bold">{fmtWon(result.ruralTax)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">중개수수료 (VAT포함)</span>
                  <span className="font-bold">{fmtWon(result.buyBrokerageVat)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">주담대 한도 <span className="text-[10px] text-slate-400">(LTV {(result.ltv * 100).toFixed(0)}%)</span></span>
                  <span className="font-bold text-blue-600">-{fmtWon(result.loanLimit)}</span>
                </div>
              </div>
            </div>

            {/* 자금 흐름 시각화 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-600">💰 자금 흐름 한눈에 보기</h3>
              <p className="text-[11px] text-slate-400">새 집 매수 총비용 {fmtWon(result.totalBuyCost)}는 아래 3가지로 충당됩니다</p>

              {(() => {
                const total = result.totalBuyCost;
                const proceeds = Math.max(result.netProceeds, 0);
                const loan = result.loanLimit;
                const capital = Math.max(result.additionalCapital, 0);
                const proceedsPct = (proceeds / total) * 100;
                const loanPct = (loan / total) * 100;
                const capitalPct = (capital / total) * 100;

                return (
                  <>
                    <div className="h-12 rounded-xl overflow-hidden flex">
                      {proceedsPct > 0 && (
                        <div className="h-full flex items-center justify-center bg-blue-400 transition-all duration-500"
                          style={{ width: `${proceedsPct}%` }}>
                          {proceedsPct > 12 && <span className="text-[10px] font-bold text-white">매도금 {proceedsPct.toFixed(0)}%</span>}
                        </div>
                      )}
                      {loanPct > 0 && (
                        <div className="h-full flex items-center justify-center bg-emerald-500 transition-all duration-500"
                          style={{ width: `${loanPct}%` }}>
                          {loanPct > 12 && <span className="text-[10px] font-bold text-white">대출 {loanPct.toFixed(0)}%</span>}
                        </div>
                      )}
                      {capitalPct > 0 && (
                        <div className="h-full flex items-center justify-center bg-amber-400 transition-all duration-500"
                          style={{ width: `${capitalPct}%` }}>
                          {capitalPct > 12 && <span className="text-[10px] font-bold text-amber-900">자기자본 {capitalPct.toFixed(0)}%</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />
                        <span className="text-slate-500">매도 실수령 {fmtWon(proceeds)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                        <span className="text-slate-500">신규 대출 {fmtWon(loan)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
                        <span className="text-slate-500">추가 자기자본 {fmtWon(capital)}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 최종 결과 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-600">최종 결과</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">갈아타기 총 비용</p>
                  <p className="text-xs text-slate-400 mb-2">(세금 + 수수료 합산)</p>
                  <p className="text-lg font-black text-slate-700">{fmtWon(result.totalCost)}</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${result.additionalCapital > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <p className={`text-xs font-semibold mb-1 ${result.additionalCapital > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    추가 필요 자기자본
                  </p>
                  <p className="text-xs text-slate-400 mb-2">(매도 실수령 + 주담대 외)</p>
                  <p className={`text-lg font-black ${result.additionalCapital > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                    {result.additionalCapital < 0 ? "여유자금 " : ""}{fmtWon(Math.abs(result.additionalCapital))}
                    {result.additionalCapital < 0 && <span className="block text-xs font-normal text-emerald-500">({fmtHundred(Math.abs(result.additionalCapital))} 남음)</span>}
                  </p>
                </div>
              </div>

              {result.additionalCapital > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
                  💡 매도 실수령액({fmtWon(result.netProceeds)})과 주담대({fmtWon(result.loanLimit)})를 합산해도
                  <span className="font-bold"> {fmtWon(result.additionalCapital)}</span>가 부족합니다.
                  갈아타기 전 추가 자금 마련 계획이 필요합니다.
                </div>
              )}

              {result.additionalCapital <= 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700 leading-relaxed">
                  ✅ 매도 실수령액과 주담대로 새 집 구매가 가능합니다.
                  <span className="font-bold"> {fmtWon(Math.abs(result.additionalCapital))}</span> 여유자금이 남습니다.
                </div>
              )}
            </div>

            {/* 월 부담 변화 분석 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-600">📅 매달 대출 상환 부담 변화</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[11px] text-slate-400 mb-1">기존 집 월 상환액</p>
                  <p className="text-lg font-black text-slate-600">{fmtWon(result.oldMonthly)}</p>
                  {result.existingLoan > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">잔액 {fmtWon(result.existingLoan)}</p>
                  )}
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-[11px] text-emerald-500 mb-1">새 집 월 상환액</p>
                  <p className="text-lg font-black text-emerald-700">{fmtWon(result.newMonthly)}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">대출 {fmtWon(result.loanLimit)}</p>
                </div>
              </div>

              {/* 월 부담 증감 */}
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${result.monthlyDiff > 0 ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
                <span className={`text-sm font-bold ${result.monthlyDiff > 0 ? "text-red-700" : "text-blue-700"}`}>
                  {result.monthlyDiff > 0 ? "매달 추가 부담" : "매달 부담 감소"}
                </span>
                <span className={`text-xl font-black ${result.monthlyDiff > 0 ? "text-red-600" : "text-blue-600"}`}>
                  {result.monthlyDiff > 0 ? "+" : "-"}{fmtWon(Math.abs(result.monthlyDiff))}
                </span>
              </div>

              {result.monthlyDiff > 0 && (
                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 rounded-lg px-3 py-2">
                  갈아타기 후 매달 <span className="font-bold text-red-600">{fmtWon(result.monthlyDiff)}</span>씩
                  더 부담하게 됩니다. 연간 약 {fmtWon(result.monthlyDiff * 12)} 추가 지출이에요.
                  소득 대비 상환 여력을 꼭 확인하세요.
                </p>
              )}

              <p className="text-[10px] text-slate-400">
                * 원리금균등상환 기준. 실제 상환액은 상환방식(원금균등/거치식 등)과 금리 변동에 따라 달라집니다.
              </p>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
              출처: 소득세법 제89조·제95조·제103조·제104조(양도세), 지방세법 제11조·제13조의2(취득세),
              공인중개사법 시행규칙 제20조 별표1(중개보수), 금융위원회 주택시장 안정화 대책(2025.10.15).
              본 계산은 참고용이며 실제 세액·대출 조건은 세무사·금융기관 확인이 필요합니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}