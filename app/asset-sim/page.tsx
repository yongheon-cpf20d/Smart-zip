"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import PriceInput from "../../components/PriceInput";

// ✅ 법령 출처
// 양도세: 소득세법 제95조(장특공제), 제103조(기본공제), 제104조(세율)
// 비과세: 소득세법 제89조, 시행령 제160조(고가주택 안분계산)
// 지방소득세: 지방세법 제103조의3 (국세의 10%)

const fmtWon = (n: number): string => {
  const abs = Math.abs(Math.round(n));
  const uk = Math.floor(abs / 100_000_000);
  const man = Math.round((abs % 100_000_000) / 10_000);
  let str = "";
  if (uk > 0 && man > 0) str = `${uk}억 ${man.toLocaleString()}만원`;
  else if (uk > 0) str = `${uk}억원`;
  else str = `${man.toLocaleString()}만원`;
  return n < 0 ? `-${str}` : str;
};

// ── 양도세 계산 (검증된 로직) ──────────────────────────────
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

function calcTax(
  acqPrice: number,
  sellPrice: number,
  holdY: number,
  isOneHouse: boolean
): {
  totalGain: number;
  taxableGain: number;
  ltcgRate: number;
  ltcg: number;
  taxBase: number;
  nationalTax: number;
  localTax: number;
  totalTax: number;
  netProfit: number;
  taxPct: number;
} {
  // 필요경비: 취득가액의 2% (취득세+중개수수료 보수적 추정)
  const expenses = acqPrice * 0.02;
  const totalGain = sellPrice - acqPrice - expenses;

  if (totalGain <= 0) {
    return { totalGain, taxableGain: 0, ltcgRate: 0, ltcg: 0, taxBase: 0, nationalTax: 0, localTax: 0, totalTax: 0, netProfit: sellPrice - acqPrice, taxPct: 0 };
  }

  // 1세대1주택 비과세 + 고가주택 안분 (소득세법 시행령 제160조)
  let taxableGain = totalGain;
  if (isOneHouse) {
    if (sellPrice <= 1_200_000_000) {
      taxableGain = 0;
    } else {
      taxableGain = totalGain * (sellPrice - 1_200_000_000) / sellPrice;
    }
  }

  if (taxableGain <= 0) {
    return { totalGain, taxableGain: 0, ltcgRate: 0, ltcg: 0, taxBase: 0, nationalTax: 0, localTax: 0, totalTax: 0, netProfit: sellPrice - acqPrice, taxPct: 0 };
  }

  // 장기보유특별공제 (소득세법 제95조제2항)
  // 1세대1주택: 보유4%+거주4%=연8%, 최대80% (10년 이상)
  // 일반: 연2%, 최대30% (15년 이상), 3년 미만 0%
  // 장기보유특별공제 (3년 미만 배제, 보유=거주 동일 가정)
  let ltcgRate = 0;
  if (holdY >= 3) {
    ltcgRate = isOneHouse
      ? Math.min(holdY * 0.08, 0.8)  // 1세대1주택: 연8%, 최대80%
      : Math.min(holdY * 0.02, 0.3); // 일반: 연2%, 최대30%
  }
  const ltcg = taxableGain * ltcgRate;

  // 과세표준 (기본공제 250만원)
  const taxBase = Math.max(taxableGain - ltcg - 2_500_000, 0);

  // 세액
  const nationalTax = getBasicTaxRate(taxBase);
  const localTax = nationalTax * 0.1;
  const totalTax = nationalTax + localTax;

  const grossProfit = sellPrice - acqPrice;
  const netProfit = grossProfit - totalTax;
  const taxPct = grossProfit > 0 ? (totalTax / grossProfit) * 100 : 0;

  return { totalGain, taxableGain, ltcgRate, ltcg, taxBase, nationalTax, localTax, totalTax, netProfit, taxPct };
}

// 재미 멘트
function getWitComment(netProfit: number): { text: string; emoji: string } {
  if (netProfit <= 0) return { text: "앗... 본전치기 또는 마이너스입니다. 부동산은 버티기가 답일 수 있습니다!", emoji: "😭" };
  if (netProfit <= 50_000_000) return { text: "축하합니다! 대기업 연봉만큼의 순수익을 세후로 안전하게 챙기셨습니다.", emoji: "💸" };
  if (netProfit <= 300_000_000) return { text: "와우! 집이 아주 든든한 효자네요. 서울 아파트 평당 분양가만큼 주머니를 채우셨습니다.", emoji: "🥳" };
  return { text: "이 구역의 거대 주주님! 강남 아파트 전세금 혹은 치킨 1만 5천 마리를 드실 수 있는 자산가 반열에 오르셨습니다!", emoji: "👑" };
}

export default function AssetSimPage() {
  const [acqInput, setAcqInput] = useState("70000"); // 만원
  const [isOneHouse, setIsOneHouse] = useState(true);
  const [holdY, setHoldY] = useState(10);
  const [sellMultiple, setSellMultiple] = useState(1.5); // 취득가의 몇 배

  const acqPrice = Number(acqInput) * 10000;
  const maxSellPrice = acqPrice * 3;
  const minSellPrice = acqPrice;
  const sellPrice = Math.round(acqPrice * sellMultiple / 10_000_000) * 10_000_000; // 1000만 단위

  const result = useMemo(() => {
    if (!acqPrice) return null;
    return calcTax(acqPrice, sellPrice, holdY, isOneHouse);
  }, [acqPrice, sellPrice, holdY, isOneHouse]);

  const grossProfit = sellPrice - acqPrice;
  const witComment = result ? getWitComment(result.netProfit) : null;

  // 바 그래프 비율
  const taxBarPct = result && grossProfit > 0
    ? Math.min((result.totalTax / grossProfit) * 100, 100)
    : 0;
  const netBarPct = Math.max(100 - taxBarPct, 0);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        <div>
          <h1 className="text-xl font-bold text-slate-800">📈 미래 자산 시뮬레이터</h1>
          <p className="text-xs text-slate-400 mt-1">집값이 오르면 세금 내고 실제로 얼마 남을까?</p>
        </div>

        {/* 입력 섹션 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">

          {/* 취득가액 */}
          <PriceInput
            label="취득가액 (만원)"
            value={acqInput}
            onChange={setAcqInput}
            placeholder="예: 70000"
            quickValues={[
              { label: "5억", value: "50000" },
              { label: "7억", value: "70000" },
              { label: "10억", value: "100000" },
              { label: "15억", value: "150000" },
            ]}
          />

          {/* 1세대1주택 토글 */}
          <div className="flex items-center justify-between py-3 border-t border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">실거주 2년 채운 1세대 1주택인가요?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">활성화 시 12억 이하 비과세 + 장특공제 연 8% 적용</p>
            </div>
            <button
              onClick={() => setIsOneHouse(!isOneHouse)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOneHouse ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isOneHouse ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* 미래 가격 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400">미래 예상 매도가</label>
              <span className="text-sm font-black text-slate-800">{fmtWon(sellPrice)}</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={3.0}
              step={0.05}
              value={sellMultiple}
              onChange={e => setSellMultiple(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>현재가 {fmtWon(acqPrice)}</span>
              <span className="text-emerald-500 font-bold">{sellMultiple.toFixed(2)}배</span>
              <span>3배 {fmtWon(acqPrice * 3)}</span>
            </div>
          </div>

          {/* 보유기간 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400">보유·거주 기간</label>
              <span className="text-sm font-black text-slate-800">{holdY}년</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={holdY}
              onChange={e => setHoldY(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1년</span>
              <span className="text-emerald-500 font-bold">
                {isOneHouse
                  ? `장특공제 ${Math.min(holdY * 8, 80)}%`
                  : holdY >= 3 ? `장특공제 ${Math.min(holdY * 2, 30)}%` : "장특공제 없음"}
              </span>
              <span>20년</span>
            </div>
          </div>
        </div>

        {/* 결과 섹션 */}
        {result && acqPrice > 0 && (
          <div className="space-y-4">

            {/* 바 그래프 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-600">전체 상승액 분석</p>
                <p className="text-sm font-black text-slate-800">{fmtWon(grossProfit)}</p>
              </div>

              {/* 스택 바 */}
              <div className="h-10 rounded-xl overflow-hidden flex" style={{ transition: "all 0.3s ease" }}>
                {result.totalTax > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[10px] font-bold text-white bg-red-400 transition-all duration-500"
                    style={{ width: `${taxBarPct}%`, minWidth: taxBarPct > 3 ? undefined : 0 }}
                  >
                    {taxBarPct > 8 && `세금 ${taxBarPct.toFixed(1)}%`}
                  </div>
                )}
                <div
                  className="h-full flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500 transition-all duration-500"
                  style={{ width: `${netBarPct}%` }}
                >
                  {netBarPct > 15 && `실수익 ${netBarPct.toFixed(1)}%`}
                </div>
              </div>

              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
                  <span className="text-slate-500">세금 {fmtWon(result.totalTax)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-500">실수익 {fmtWon(Math.max(result.netProfit, 0))}</span>
                </div>
              </div>
            </div>

            {/* 세부 내역 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 text-sm">
              <p className="text-sm font-bold text-slate-600 mb-3">세금 계산 내역</p>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">전체 양도차익</span>
                <span className="font-bold">{fmtWon(result.totalGain)}</span>
              </div>
              {result.taxableGain < result.totalGain && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">
                    과세대상 양도차익
                    <span className="text-[10px] text-slate-400 ml-1">
                      {sellPrice <= 1_200_000_000 ? "(전액 비과세)" : `(12억 초과분 안분)`}
                    </span>
                  </span>
                  <span className="font-bold text-emerald-600">{fmtWon(result.taxableGain)}</span>
                </div>
              )}
              {result.ltcgRate > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">
                    장기보유특별공제
                    <span className="text-[10px] text-slate-400 ml-1">({(result.ltcgRate * 100).toFixed(0)}%)</span>
                  </span>
                  <span className="font-bold text-emerald-600">-{fmtWon(result.ltcg)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">과세표준 <span className="text-[10px] text-slate-400">(기본공제 250만 차감)</span></span>
                <span className="font-bold">{fmtWon(result.taxBase)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">양도소득세</span>
                <span className="font-bold text-red-500">{fmtWon(result.nationalTax)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">지방소득세 <span className="text-[10px] text-slate-400">(국세×10%)</span></span>
                <span className="font-bold text-red-400">{fmtWon(result.localTax)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-semibold">총 납부 세금</span>
                <span className="font-black text-red-500">{fmtWon(result.totalTax)}</span>
              </div>
            </div>

            {/* 최종 순수익 */}
            <div className={`rounded-2xl p-5 border ${result.netProfit > 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <p className={`text-xs font-semibold mb-1 ${result.netProfit > 0 ? "text-emerald-600" : "text-red-600"}`}>
                세후 순수익 (상승액 - 세금)
              </p>
              <p className={`text-3xl font-black ${result.netProfit > 0 ? "text-emerald-700" : "text-red-700"}`}>
                {fmtWon(result.netProfit)}
              </p>
              {result.taxPct > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  상승액의 {result.taxPct.toFixed(1)}%가 세금으로 납부됩니다
                </p>
              )}
            </div>

            {/* 재미 멘트 */}
            {witComment && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl shrink-0">{witComment.emoji}</span>
                <p className="text-sm text-slate-600 leading-relaxed">{witComment.text}</p>
              </div>
            )}

            {/* 면책 고지 */}
            <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
              ※ 본 계산 결과는 소득세법 및 지방세법 표준 세율을 기반으로 한 모의 시뮬레이션입니다.
              필요경비는 취득가액의 2%로 보수적 추정하였으며, 조정대상지역 규제, 다주택 중과,
              필요경비 증빙 여부 등 개인의 세부 조건에 따라 실제 세액과 차이가 발생할 수 있으므로
              정확한 과세 증빙은 전문 세무사와의 상담을 권장합니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}