"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HoldingTaxPage() {
  const [price, setPrice] = useState(120000); // 공시가격 (만원)
  const [isJoint, setIsJoint] = useState(false); // 공동명의 여부
  const [homeCount, setHomeCount] = useState(1); // 주택 수
  const [isRegulated, setIsRegulated] = useState(false); // 조정대상지역 여부

  const [result, setResult] = useState({ propertyTax: 0, comprehensiveTax: 0, total: 0 });

  useEffect(() => {
    // 1. 재산세 로직 (지방세법 제111조)
    const taxableValue = price * 10000 * 0.6; // 공정시장가액비율 60%
    let propertyTax = 0;
    if (taxableValue <= 60000000) propertyTax = taxableValue * 0.001;
    else if (taxableValue <= 150000000) propertyTax = 60000 + (taxableValue - 60000000) * 0.0015;
    else if (taxableValue <= 300000000) propertyTax = 195000 + (taxableValue - 150000000) * 0.0025;
    else propertyTax = 570000 + (taxableValue - 300000000) * 0.004;

    // 2. 종부세 로직 (종합부동산세법 제9조)
    let basicDeduction = homeCount === 1 ? 1200000000 : 900000000;
    if (isJoint) basicDeduction = 900000000 * 2; // 부부 각각 9억 공제
    
    const taxableBase = Math.max(0, (price * 10000 * 0.6) - basicDeduction);
    let comprehensiveTax = 0;
    
    if (taxableBase > 0) {
      // 다주택 중과 로직 간소화
      const rate = (homeCount >= 3 || (homeCount === 2 && isRegulated)) ? 0.02 : 0.005;
      comprehensiveTax = taxableBase * rate;
    }

    setResult({
      propertyTax: Math.round(propertyTax),
      comprehensiveTax: Math.round(comprehensiveTax),
      total: Math.round(propertyTax + comprehensiveTax)
    });
  }, [price, isJoint, homeCount, isRegulated]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="inline-block px-4 py-2 bg-white text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-100 transition text-sm">
          ← 메인으로 돌아가기
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">📜 보유세(재산세+종부세) 계산기</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">공동주택 공시가격 (만원)</label>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full p-4 border rounded-xl font-extrabold bg-gray-50 focus:bg-white outline-none" />
              <a href="https://www.realtyprice.kr/" target="_blank" className="text-[11px] text-emerald-600 font-bold mt-2 block underline">공시가격 알리미로 확인하기 ↗</a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 p-3 border rounded-xl bg-gray-50 font-bold text-sm cursor-pointer">
                <input type="checkbox" checked={isJoint} onChange={(e) => setIsJoint(e.target.checked)} /> 공동명의
              </label>
              <select value={homeCount} onChange={(e) => setHomeCount(Number(e.target.value))} className="p-3 border rounded-xl bg-gray-50 font-bold text-sm">
                <option value={1}>1주택</option>
                <option value={2}>2주택</option>
                <option value={3}>3주택 이상</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-3xl text-white shadow-lg flex flex-col justify-center">
            <h3 className="text-gray-400 font-bold text-sm mb-6">최종 예상 보유세</h3>
            <div className="text-5xl font-extrabold text-emerald-400 mb-8">₩ {result.total.toLocaleString()}</div>
            <div className="space-y-3 text-sm font-medium border-t border-gray-700 pt-6">
              <div className="flex justify-between"><span>재산세</span><span>₩ {result.propertyTax.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>종합부동산세</span><span>₩ {result.comprehensiveTax.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        {/* 법적 근거 주석 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-[11px] text-gray-500 space-y-2">
          <p><strong>⚖️ 세액 산출 근거 (2026년 현행 세법 기준)</strong></p>
          <p>• <strong>재산세:</strong> 「지방세법」 제111조에 따라 과세표준(공시가격의 60%)에 누진세율 적용.</p>
          <p>• <strong>종합부동산세:</strong> 「종합부동산세법」 제8조~9조에 따라 1주택자(12억)/다주택자(9억) 기본공제 및 공정시장가액비율(60%) 반영.</p>
          <p>• 위 계산 결과는 시뮬레이션이며, 실제 납부액은 과세관청의 결정에 따라 달라질 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}