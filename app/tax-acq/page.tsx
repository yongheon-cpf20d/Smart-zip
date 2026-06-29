"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AcquisitionTaxPage() {
  // 기본 입력 상태
  const [price, setPrice] = useState(80000); // 매매가 (만원)
  const [areaLarge, setAreaLarge] = useState(false); // 전용 85㎡ 초과 여부
  const [homeCount, setHomeCount] = useState('1주택');
  const [isRegulated, setIsRegulated] = useState(false); // 조정대상지역 여부

  // 감면 혜택 상태
  const [isFirstHome, setIsFirstHome] = useState(false);
  const [newbornDate, setNewbornDate] = useState('');

  // 결과 상태
  const [result, setResult] = useState({
    taxRate: 0,
    baseTax: 0,
    eduTax: 0,
    farmTax: 0,
    discount: 0,
    totalTax: 0,
  });

  // 실시간 계산 로직 (useEffect를 통해 값이 바뀔 때마다 즉시 반영)
  useEffect(() => {
    if (price <= 0) return;

    let currentRate = 1;

    // 1. 다주택 및 규제지역에 따른 취득세율 산정 (지방세법 제11조, 제13조의2)
    if (homeCount === '1주택' || (homeCount === '2주택' && !isRegulated)) {
      if (price <= 60000) currentRate = 1.0;
      else if (price <= 90000) {
        // 6~9억 원 구간 비례세율 공식: (매매가 * 2 / 3억 - 3) %
        currentRate = Math.floor(((price * 2) / 30000 - 3) * 100) / 100;
      } else currentRate = 3.0;
    } else if (homeCount === '2주택' && isRegulated) {
      currentRate = 8.0;
    } else if (homeCount === '3주택' && !isRegulated) {
      currentRate = 8.0;
    } else {
      // 3주택(조정), 4주택 이상, 법인
      currentRate = 12.0;
    }

    const priceWon = price * 10000;
    const base = priceWon * (currentRate / 100);
    
    // 2. 부가세 산정
    // 지방교육세 (산출세액의 10% 가정, 중과 등 세부 디테일 MVP 간소화)
    const edu = base * 0.1;
    // 농어촌특별세 (85㎡ 초과 시 매매가의 0.2%)
    const farm = areaLarge ? priceWon * 0.002 : 0;

    // 3. 감면 혜택 적용 (지방세특례제한법)
    let maxDiscount = 0;
    // 생애최초 (최대 200만 원 한도)
    if (isFirstHome) {
      maxDiscount = Math.min(base, 2000000);
    }
    // 신생아 감면 (날짜가 입력되었을 경우 가등록 상태로 최대 500만 원 한도 적용 시뮬레이션)
    if (newbornDate) {
      maxDiscount = Math.max(maxDiscount, Math.min(base, 5000000));
    }

    setResult({
      taxRate: currentRate,
      baseTax: base,
      eduTax: edu,
      farmTax: farm,
      discount: maxDiscount,
      totalTax: base + edu + farm - maxDiscount,
    });
  }, [price, areaLarge, homeCount, isRegulated, isFirstHome, newbornDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Link href="/" className="inline-block px-4 py-2 bg-white text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-100 transition text-sm">
          ← 메인으로 돌아가기
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">🏠 부동산 취득세 계산기</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. 입력부 (좌측) */}
          <div className="space-y-6">
            
            {/* 감면 혜택 영역 (유저 시선 가장 먼저 닿도록 상단 배치) */}
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <span>🎁</span> 특별 감면 혜택을 확인하세요
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-100/50 transition">
                  <input type="checkbox" checked={isFirstHome} onChange={(e) => setIsFirstHome(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                  <span className="text-sm font-bold text-gray-700">생애최초 주택 구입 (최대 200만 원 감면)</span>
                </label>
                
                <div className="bg-white p-4 rounded-xl border border-emerald-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">👶 신생아 출산/입양 감면 (최대 500만 원)</label>
                  <div className="flex flex-col gap-1">
                    <input type="date" value={newbornDate} onChange={(e) => setNewbornDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm text-gray-600 outline-none focus:border-emerald-400" />
                    <span className="text-[10px] text-gray-400">자녀 출생일 기준 전후 1년 이내 취득 시 적용</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 기본 입력 폼 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">매매 가격 (만원)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-4 border border-gray-200 rounded-xl font-extrabold text-lg bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">보유 주택 수</label>
                  <select value={homeCount} onChange={(e) => setHomeCount(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none text-sm font-bold">
                    <option>1주택</option>
                    <option>2주택</option>
                    <option>3주택</option>
                    <option>4주택 이상 (법인)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">면적 요건</label>
                  <select value={areaLarge ? '85초과' : '85이하'} onChange={(e) => setAreaLarge(e.target.value === '85초과')} className="w-full p-3 border rounded-xl bg-gray-50 outline-none text-sm font-bold">
                    <option value="85이하">전용 85㎡ 이하</option>
                    <option value="85초과">전용 85㎡ 초과</option>
                  </select>
                </div>
              </div>

              {/* 규제지역 체크 (2주택 이상부터 의미가 있음) */}
              {homeCount !== '1주택' && homeCount !== '4주택 이상 (법인)' && (
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 animate-in fade-in">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isRegulated} onChange={(e) => setIsRegulated(e.target.checked)} className="w-5 h-5 text-pink-600 rounded" />
                    <span className="text-sm font-bold text-pink-800">취득 주택이 조정대상지역인가요?</span>
                  </label>
                  <p className="text-[10px] text-pink-600 mt-1 ml-7">다주택자는 규제지역 여부에 따라 중과세율(8%, 12%)이 다르게 적용됩니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. 결과부 (우측) */}
          <div className="flex flex-col space-y-6">
            <div className="bg-gray-900 p-8 rounded-3xl shadow-lg text-white flex-1 flex flex-col justify-center relative overflow-hidden">
              
              {/* 장식용 원형 배경 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500 opacity-20 rounded-full -ml-8 -mb-8 pointer-events-none"></div>

              <h3 className="text-gray-400 font-bold text-sm mb-6">최종 예상 납부액</h3>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold text-emerald-400">₩ {Math.max(0, result.totalTax).toLocaleString()}</span>
              </div>

              <div className="space-y-4 text-sm font-medium border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center text-gray-300">
                  <span>적용 취득세율</span>
                  <span className="font-bold text-white">{result.taxRate} %</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>기본 취득세</span>
                  <span>₩ {result.baseTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>지방교육세</span>
                  <span>₩ {result.eduTax.toLocaleString()}</span>
                </div>
                {areaLarge && (
                  <div className="flex justify-between items-center text-gray-300">
                    <span>농어촌특별세 (85㎡ 초과)</span>
                    <span>₩ {result.farmTax.toLocaleString()}</span>
                  </div>
                )}
                
                {result.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-bold bg-emerald-900/30 p-3 rounded-xl mt-2">
                    <span>특별 감면 적용</span>
                    <span>- ₩ {result.discount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 법적 근거 주석 박스 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                <span className="text-emerald-500">⚖️</span> 산출 법적 근거 (2026 현행)
              </h4>
              <ul className="text-[10px] text-gray-500 space-y-1.5 leading-relaxed">
                <li>• <strong className="text-gray-600">지방세법 제11조, 제13조의2:</strong> 주택 가격 및 주택 수, 조정대상지역 여부에 따른 기본/중과세율 적용.</li>
                <li>• <strong className="text-gray-600">지방세특례제한법 제36조의2:</strong> 생애최초 주택 구입 시 최대 200만 원 산출세액 감면.</li>
                <li>• <strong className="text-gray-600">지방세특례제한법 제36조의3:</strong> 신생아 출생·입양 가구 주택 취득 시 최대 500만 원 산출세액 감면.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}