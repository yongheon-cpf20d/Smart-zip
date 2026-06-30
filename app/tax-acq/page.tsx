"use client";

import { useState } from "react";
import Link from "next/link";

// ✅ 법령 출처: 지방세법 제11조(부동산 취득의 세율), 제13조의2(법인의 주택 취득 등 중과)
//    농어촌특별세법 제5조, 지방세법 제151조(지방교육세)
// 규제가 바뀌면 이 파일의 세율표만 수정하면 전체 반영됨.

type HouseCount = "1" | "2" | "3" | "4+";
type RegionType = "adjusted" | "non-adjusted";
type ReductionType = "none" | "first-time" | "childbirth";

const fmtWon = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

// ✅ 생애최초 주택 구입 감면 (지방세특례제한법 제36조의3)
// - 취득당시가액 12억원 이하, 본인+배우자 무주택 요건
// - 소형주택(60㎡↓ + 수도권6억/지방3억↓): 산출세액 300만원 한도 면제·공제
// - 그 외: 산출세액 200만원 한도 면제·공제
function getFirstTimeBuyerCap(price: number, areaSqm: number, isMetro: boolean): number {
  const smallHouseLimit = isMetro ? 600_000_000 : 300_000_000;
  const isSmallHouse = areaSqm > 0 && areaSqm <= 60 && price <= smallHouseLimit;
  return isSmallHouse ? 3_000_000 : 2_000_000;
}

// ✅ 출산·양육 주택 취득 감면 (지방세특례제한법 제36조의5)
// - 취득가액 12억원 이하, 1가구 1주택 요건
// - 산출세액 500만원 한도 면제·공제
const CHILDBIRTH_REDUCTION_CAP = 5_000_000;

// 6억 이하 ~ 9억 초과 구간 표준세율 계산 (제11조제1항제8호)
function getStandardRate(price: number): number {
  if (price <= 600_000_000) return 0.01;
  if (price <= 900_000_000) {
    // (가액 × 2/3억 - 3) × 1/100
    const rate = ((price * (2 / 300_000_000)) - 3) / 100;
    return Math.round(rate * 10000) / 10000; // 소수점 4자리
  }
  return 0.03;
}

// 다주택자 중과세율 (제13조의2제1항)
// 1세대 2주택(조정) / 3주택(비조정): 8%
// 1세대 3주택+(조정) / 4주택+(비조정): 12%
function getMultiHouseRate(
  isCorporation: boolean,
  houseCountAfter: HouseCount,
  region: RegionType
): number | null {
  if (isCorporation) return 0.12; // 법인은 무조건 12%

  if (region === "adjusted") {
    if (houseCountAfter === "1") return null; // 표준세율 적용
    if (houseCountAfter === "2") return 0.08;
    if (houseCountAfter === "3" || houseCountAfter === "4+") return 0.12;
  } else {
    if (houseCountAfter === "1" || houseCountAfter === "2") return null;
    if (houseCountAfter === "3") return 0.08;
    if (houseCountAfter === "4+") return 0.12;
  }
  return null;
}

export default function TaxAcqPage() {
  const [priceInput, setPriceInput] = useState(""); // 만원 단위
  const [area, setArea] = useState(""); // 전용면적 ㎡
  const [isCorporation, setIsCorporation] = useState(false);
  const [houseCountAfter, setHouseCountAfter] = useState<HouseCount>("1");
  const [region, setRegion] = useState<RegionType>("non-adjusted");

  // 체크박스形 적용 옵션
  const [applyMultiHouseTax, setApplyMultiHouseTax] = useState(false);
  const [isTemporary2House, setIsTemporary2House] = useState(false); // 일시적 2주택

  const [reductionType, setReductionType] = useState<ReductionType>("none");
  const [isMetro, setIsMetro] = useState(true); // 수도권 여부 (생애최초 소형주택 기준에 사용)

  const [result, setResult] = useState<{
    standardRate: number;
    appliedRate: number;
    acquisitionTax: number;
    ruralTax: number;
    eduTax: number;
    reductionAmount: number;
    total: number;
    isMultiHouseApplied: boolean;
  } | null>(null);

  const calculate = () => {
    const price = Number(priceInput) * 10000;
    const areaNum = Number(area);

    if (!price) {
      alert("주택 취득가액을 입력해주세요.");
      return;
    }

    const standardRate = getStandardRate(price);

    let appliedRate = standardRate;
    let isMultiHouseApplied = false;

    // 생애최초/출산양육 감면 적용 시 법인 중과세율(제13조의2) 적용 안 함 (제36조의3제1항)
    const reductionApplies = reductionType !== "none";

    // 일시적 2주택 또는 감면 대상이면 중과 배제
    if (applyMultiHouseTax && !isTemporary2House && !reductionApplies) {
      const multiRate = getMultiHouseRate(isCorporation, houseCountAfter, region);
      if (multiRate !== null) {
        appliedRate = multiRate;
        isMultiHouseApplied = true;
      }
    }

    const acquisitionTaxBeforeReduction = price * appliedRate;

    // 감면액 계산
    let reductionAmount = 0;
    if (reductionType === "first-time" && price <= 1_200_000_000) {
      const cap = getFirstTimeBuyerCap(price, areaNum, isMetro);
      reductionAmount = Math.min(acquisitionTaxBeforeReduction, cap);
    } else if (reductionType === "childbirth" && price <= 1_200_000_000) {
      reductionAmount = Math.min(acquisitionTaxBeforeReduction, CHILDBIRTH_REDUCTION_CAP);
    }

    const acquisitionTax = acquisitionTaxBeforeReduction - reductionAmount;

    // 농어촌특별세: 전용 85㎡ 초과 시 표준세율(중과 전)의 10%
    // 85㎡ 이하 국민주택규모는 비과세
    const isRuralTaxable = areaNum === 0 || areaNum > 85;
    const ruralTax = isRuralTaxable ? price * standardRate * 0.1 : 0;

    // 지방교육세: (표준세율 - 2%) × 20% (제151조제1항제1호)
    const eduTaxBaseRate = Math.max(standardRate - 0.02, 0);
    const eduTax = price * eduTaxBaseRate * 0.2;

    const total = acquisitionTax + ruralTax + eduTax;

    setResult({
      standardRate,
      appliedRate,
      acquisitionTax,
      ruralTax,
      eduTax,
      reductionAmount,
      total,
      isMultiHouseApplied,
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

        <h1 className="text-xl font-bold text-slate-800">🏠 취득세 계산기</h1>

        {/* 기본 정보 입력 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">주택 정보 입력</h2>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">주택 취득가액 (만원)</label>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="예: 70000 (= 7억원)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              전용면적 (㎡) <span className="text-slate-400">— 농어촌특별세 산정용, 모르면 비워두기</span>
            </label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="예: 84.97"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 적용 옵션 (체크박스) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-600">적용 옵션</h2>

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
                    <label className="text-xs text-slate-400 mb-1 block">
                      취득 후 보유 주택수 (이 주택 포함)
                    </label>
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
                    지역 (소형주택 가액기준 60㎡ 이하 적용 시 사용)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsMetro(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        isMetro
                          ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      수도권 (6억 이하)
                    </button>
                    <button
                      onClick={() => setIsMetro(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        !isMetro
                          ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      지방 (3억 이하)
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                {reductionType === "first-time"
                  ? "취득가액 12억원 이하, 본인·배우자 무주택 요건 충족 시 적용됩니다."
                  : "취득가액 12억원 이하, 1가구 1주택 요건 충족 시 적용됩니다."}
              </p>
            </div>
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
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">농어촌특별세</span>
                <span className="font-bold">{fmtWon(result.ruralTax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">지방교육세</span>
                <span className="font-bold">{fmtWon(result.eduTax)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mt-3">
              <p className="text-xs text-emerald-600 font-semibold mb-1">총 납부세액</p>
              <p className="text-2xl font-black text-emerald-700">{fmtWon(result.total)}</p>
            </div>

            <p className="text-[10px] text-slate-400 pt-2">
              출처: 지방세법 제11조, 제13조의2, 제151조 / 지방세특례제한법 제36조의3(생애최초),
              제36조의5(출산·양육) / 농어촌특별세법 제5조.
              본 계산은 참고용이며 실제 세액은 시군구 및 개별 사안에 따라 달라질 수 있습니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}