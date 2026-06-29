"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SellingTaxPage() {
  const [sellPrice, setSellPrice] = useState(150000); // 양도가액 (만원)
  const [buyPrice, setBuyPrice] = useState(100000); // 취득가액 (만원)
  const [isSingleHome, setIsSingleHome] = useState(true); // 1세대 1주택 여부
  const [holdYears, setHoldYears] = useState(5); // 보유 기간
  const [liveYears, setLiveYears] = useState(5); // 거주 기간
  const [isRegulated, setIsRegulated] = useState(false); // 조정대상지역 여부

  const [taxResult, setTaxResult] = useState<number | null>(null);

  const calculateTax = () => {
    // 1. 비과세 판정
    if (isSingleHome && sellPrice <= 120000) {
      setTaxResult(0); // 비과세
      return;
    }

    // 2. 양도차익 계산
    const gain = sellPrice - buyPrice;
    
    // 3. 장기보유특별공제 (1주택자 기준: 보유 4% + 거주 4% = 최대 80%)
    const holdRate = Math.min(holdYears * 4, 40);
    const liveRate = Math.min(liveYears * 4, 40);
    const totalDeductionRate = isSingleHome ? (holdRate + liveRate) / 100 : (holdYears * 2) / 100;
    
    const taxableGain = gain - (gain * totalDeductionRate);
    
    // 4. 간이 세율 적용 (실무에서는 구간별 누진세율 적용)
    const tax = taxableGain * 0.2; // 단순화된 세율 예시
    setTaxResult(Math.round(tax));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-bold">← 메인</Link>
        <h1 className="text-3xl font-extrabold">📈 양도소득세 계산기</h1>

        <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={sellPrice} onChange={(e)=>setSellPrice(Number(e.target.value))} placeholder="양도가액(만원)" className="p-4 border rounded-xl" />
            <input type="number" value={buyPrice} onChange={(e)=>setBuyPrice(Number(e.target.value))} placeholder="취득가액(만원)" className="p-4 border rounded-xl" />
          </div>
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={isSingleHome} onChange={(e)=>setIsSingleHome(e.target.checked)} /> 1세대 1주택 비과세 대상</label>
          <div className="grid grid-cols-2 gap-4">
            <select value={holdYears} onChange={(e)=>setHoldYears(Number(e.target.value))} className="p-3 border rounded-xl">
              {[...Array(20)].map((_, i) => <option key={i} value={i+1}>{i+1}년 보유</option>)}
            </select>
            <select value={liveYears} onChange={(e)=>setLiveYears(Number(e.target.value))} className="p-3 border rounded-xl">
              {[...Array(20)].map((_, i) => <option key={i} value={i+1}>{i+1}년 거주</option>)}
            </select>
          </div>
          <button onClick={calculateTax} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">계산하기</button>
        </div>

        {taxResult !== null && (
          <div className="bg-gray-900 p-8 rounded-3xl text-white">
            <h2 className="text-emerald-400 font-bold mb-2">예상 양도소득세</h2>
            <div className="text-4xl font-extrabold">₩ {taxResult.toLocaleString()}</div>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border text-[11px] text-gray-500 space-y-1">
          <p>• <strong>소득세법 제89조:</strong> 1세대 1주택 비과세 규정.</p>
          <p>• <strong>소득세법 제95조:</strong> 보유 및 거주 기간별 장기보유특별공제(최대 80%).</p>
        </div>
      </div>
    </div>
  );
}