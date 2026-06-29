"use client";

import React, { useState, useEffect } from 'react';

export default function DSRPage() {
  // 목표 금융기관 설정
  const [targetBank, setTargetBank] = useState('1금융권 (한도 40%)');
  const limitDSR = targetBank.includes('1금융권') ? 40 : 50;

  // 사용자 정보
  const [income, setIncome] = useState(5000); 
  const [age, setAge] = useState(35); 

  // 기존 보유 대출 상태 및 정밀 입력 폼
  const [existingLoans, setExistingLoans] = useState<any[]>([]);
  const [exType, setExType] = useState('신용대출');
  const [exMethod, setExMethod] = useState('만기일시(마통 등)');
  const [exPrincipal, setExPrincipal] = useState(5000); // 5천만원
  const [exRate, setExRate] = useState(5.0); // 5%
  const [exDuration, setExDuration] = useState(5); // 5년

  const [previewMonthlyPay, setPreviewMonthlyPay] = useState(0);

  // 기존 대출 월 납입액(크로스체크용) 실시간 계산
  useEffect(() => {
    let p = exPrincipal * 10000;
    let r = (exRate / 100) / 12;
    let n = exDuration * 12;

    if (p === 0 || n === 0) {
      setPreviewMonthlyPay(0);
      return;
    }

    let monthly = 0;
    if (exMethod === '만기일시(마통 등)') {
      monthly = p * r; // 이자만 납부
    } else if (exMethod === '원리금균등') {
      monthly = r === 0 ? p / n : p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else if (exMethod === '원금균등') {
      monthly = (p / n) + (p * r); // 첫 달 기준
    }
    setPreviewMonthlyPay(Math.round(monthly));
  }, [exType, exMethod, exPrincipal, exRate, exDuration]);

  // 기존 대출 리스트에 추가
  const handleAddExistingLoan = () => {
    if (exPrincipal <= 0) return;

    // DSR 산정용 '연간 원리금' (법적 규제 기준 반영)
    let dsrYearlyPay = 0;
    let p = exPrincipal * 10000;
    
    if (exMethod === '만기일시(마통 등)') {
      // 규제: 신용대출/마통 등 만기일시상환은 DSR 산정 시 원금을 5년 분할 상환하는 것으로 간주
      const assumedYears = 5; 
      dsrYearlyPay = (p / assumedYears) + (p * (exRate / 100));
    } else {
      dsrYearlyPay = previewMonthlyPay * 12;
    }

    setExistingLoans([...existingLoans, { 
      type: exType, 
      method: exMethod,
      principal: exPrincipal,
      rate: exRate,
      realMonthly: previewMonthlyPay, 
      dsrYearly: dsrYearlyPay / 10000 // 만원 단위로 저장
    }]);

    // 입력폼 초기화
    setExPrincipal(0);
  };

  const handleRemoveExistingLoan = (index: number) => {
    setExistingLoans(existingLoans.filter((_, i) => i !== index));
  };

  // 신규 대출 상태
  const [newPrincipal, setNewPrincipal] = useState(30000); 
  const [newDuration, setNewDuration] = useState(30); 
  const [newRate, setNewRate] = useState(4.0); 
  const [rateType, setRateType] = useState('변동금리'); 

  // 결과 상태
  const [dsrResult, setDsrResult] = useState<number | null>(null);

  const handleCalculateDSR = () => {
    // 1. 기존 대출 DSR 기준 연간 상환액 합산
    const totalExistingYearlyPay = existingLoans.reduce((acc, loan) => acc + loan.dsrYearly, 0);

    // 2. 신규 대출 계산 (스트레스 금리 적용)
    let stressRate = 1.5; 
    if (rateType === '혼합형 (5년고정)') stressRate = 1.5 * 0.6;
    else if (rateType === '주기형 (5년변동)') stressRate = 1.5 * 0.3;
    else if (rateType === '고정금리') stressRate = 0;

    const appliedRate = (newRate + stressRate) / 100 / 12; 
    const totalMonths = newDuration * 12;
    const principal = newPrincipal * 10000;

    const monthlyPayment = principal * (appliedRate * Math.pow(1 + appliedRate, totalMonths)) / (Math.pow(1 + appliedRate, totalMonths) - 1);
    const newYearlyPay = (monthlyPayment * 12) / 10000; 

    // 3. 장래인정소득 가산
    let appliedIncome = income;
    if (age >= 20 && age < 30) appliedIncome = income * 1.2; 
    else if (age >= 30 && age < 40) appliedIncome = income * 1.1; 

    // 4. 최종 계산
    const calculatedDsr = ((totalExistingYearlyPay + newYearlyPay) / appliedIncome) * 100;
    setDsrResult(calculatedDsr);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">🏦 총부채원리금상환비율(DSR) 한도 계산기</h1>

        {/* 스트레스 DSR 및 장래인정소득 안내 박스 */}
        <div className="bg-pink-50 border-[0.5px] border-pink-300 p-6 rounded-3xl shadow-sm relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-pink-200 text-pink-800 text-xs font-bold px-2 py-1 rounded-md animate-pulse">시행 중</span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">스트레스 DSR 3단계 (2025. 7. 1 ~)</h3>
            </div>
            <div className="flex gap-2">
              <span className="bg-white border border-pink-200 text-pink-700 text-xs font-bold px-3 py-1.5 rounded-full">1금융권 제한 40%</span>
              <span className="bg-white border border-pink-200 text-pink-700 text-xs font-bold px-3 py-1.5 rounded-full">2금융권 제한 50%</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-pink-100 mt-4">
            <h4 className="text-xs font-bold text-emerald-600 mb-2">💡 장래인정소득 기준 (무주택 근로자, 구입목적 비거치식 분할상환)</h4>
            <div className="text-[11px] text-gray-600 space-y-1">
              <p>• 연령대별 급여 및 통계청 자료를 바탕으로 <strong>대출 만기 시점까지의 평균소득증가율</strong>을 반영합니다.</p>
              <p>• 20~30대 청년층의 경우 장래의 소득 증가가 예상되므로 현재 소득보다 더 높은 한도를 인정받을 수 있습니다.</p>
              <p className="text-gray-400 mt-2 pt-2 border-t border-gray-100">※ 고용노동통계 월급여액 자료 기반 산출 (∑ 수식 적용)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 좌측: 대출 정보 입력 */}
          <div className="space-y-6">
            
            {/* 1. 목표 금융기관 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-emerald-400 relative">
              <div className="absolute -top-3 left-6 bg-emerald-400 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">STEP 1. 목표 설정</div>
              <label className="block text-sm font-bold text-gray-800 mb-2">대출받을 곳이 어디인가요?</label>
              <select value={targetBank} onChange={(e) => setTargetBank(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl font-bold bg-gray-50 text-emerald-700 outline-none">
                <option>1금융권 (한도 40%)</option>
                <option>2금융권 (한도 50%)</option>
              </select>
            </div>

            {/* 2. 기존 보유 대출 정밀 입력 (사용자 피드백 반영 영역) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">💳 기존 보유 대출</h3>
                <span className="text-[10px] text-gray-400">정확히 입력할수록 DSR이 정교해집니다</span>
              </div>
              
              {/* 추가된 대출 리스트 */}
              {existingLoans.length > 0 && (
                <ul className="space-y-3 mb-6">
                  {existingLoans.map((loan, idx) => (
                    <li key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 text-sm">[{loan.type}] {loan.principal}만원</span>
                        <button onClick={() => handleRemoveExistingLoan(idx)} className="text-gray-400 hover:text-red-500 font-bold">✕</button>
                      </div>
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>실제 월 납입액: <strong className="text-gray-700">₩{loan.realMonthly.toLocaleString()}</strong></span>
                      </div>
                      {/* DSR 반영액 경고 툴팁 느낌 */}
                      <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-pink-600 font-bold">
                        🚨 DSR 심사 시 적용되는 연 상환액: ₩{(loan.dsrYearly * 10000).toLocaleString()} 
                        {loan.method.includes('만기일시') && " (원금 5년 분할 간주)"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* 신규 대출 입력 폼 */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">대출 종류</label>
                    <select value={exType} onChange={(e)=>setExType(e.target.value)} className="w-full p-2 text-xs font-bold border rounded-lg outline-none">
                      <option>신용대출</option>
                      <option>중고차/신차대출</option>
                      <option>마이너스통장</option>
                      <option>기타 담보대출</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">상환 방식</label>
                    <select value={exMethod} onChange={(e)=>setExMethod(e.target.value)} className="w-full p-2 text-xs font-bold border rounded-lg outline-none">
                      <option>만기일시(마통 등)</option>
                      <option>원리금균등</option>
                      <option>원금균등</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">잔액(만원)</label>
                    <input type="number" value={exPrincipal} onChange={(e)=>setExPrincipal(Number(e.target.value))} className="w-full p-2 text-xs font-bold border rounded-lg outline-none" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">금리(%)</label>
                    <input type="number" step="0.1" value={exRate} onChange={(e)=>setExRate(Number(e.target.value))} className="w-full p-2 text-xs font-bold border rounded-lg outline-none" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">기간(년)</label>
                    <input type="number" value={exDuration} onChange={(e)=>setExDuration(Number(e.target.value))} className="w-full p-2 text-xs font-bold border rounded-lg outline-none" />
                  </div>
                </div>

                {/* 크로스체크 안내 영역 */}
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="text-xs text-blue-800">
                    실제 내는 돈 맞나요?<br/><span className="font-extrabold text-sm">월 ₩{previewMonthlyPay.toLocaleString()}</span>
                  </div>
                  <button onClick={handleAddExistingLoan} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-blue-500 shadow-sm transition">
                    + 목록에 추가
                  </button>
                </div>
              </div>
            </div>

            {/* 3. 신규 주택담보대출 정보 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">🏠 신규 주택담보대출</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">대출 신청 금액 (만원)</label>
                  <input type="number" value={newPrincipal} onChange={(e) => setNewPrincipal(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">연 금리 (%)</label>
                    <input type="number" step="0.1" value={newRate} onChange={(e) => setNewRate(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">금리 유형 (스트레스 금리 결정)</label>
                    <select value={rateType} onChange={(e) => setRateType(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-bold text-sm">
                      <option>변동금리</option>
                      <option>혼합형 (5년고정)</option>
                      <option>주기형 (5년변동)</option>
                      <option>고정금리</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">대출 만기 (년)</label>
                  <input type="number" value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-bold" />
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 차주 정보 및 결과 도출 */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">👤 개인(차주) 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">현재 연소득 (세전, 만원)</label>
                  <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-bold text-emerald-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">만 나이 (대출 신청일 기준)</label>
                  <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 outline-none font-bold" />
                </div>
              </div>
            </div>

            <button onClick={handleCalculateDSR} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-extrabold text-lg hover:bg-gray-800 transition shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <span>나의 DSR 한도 계산하기</span>
              <span>→</span>
            </button>

            {/* 동적 단일 결과창 */}
            {dsrResult !== null && (
              <div className={`flex-1 p-8 rounded-3xl border-2 shadow-lg flex flex-col justify-center items-center text-center transition-all duration-500 animate-in fade-in ${
                dsrResult > limitDSR ? 'bg-pink-50 border-pink-400' : 'bg-emerald-50 border-emerald-400'
              }`}>
                <div className={`text-xs font-extrabold px-3 py-1 rounded-full mb-4 shadow-sm ${
                  dsrResult > limitDSR ? 'bg-pink-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {dsrResult > limitDSR ? `🚨 ${limitDSR}% 한도 초과` : `✅ ${limitDSR}% 대출 승인 가능`}
                </div>
                
                <p className={`font-bold mb-1 ${dsrResult > limitDSR ? 'text-pink-700' : 'text-emerald-700'}`}>
                  선택하신 {targetBank} 심사 결과
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-6xl font-extrabold tracking-tighter ${dsrResult > limitDSR ? 'text-pink-900' : 'text-emerald-900'}`}>
                    {dsrResult.toFixed(1)}
                  </span>
                  <span className={`text-3xl font-bold ${dsrResult > limitDSR ? 'text-pink-900' : 'text-emerald-900'}`}>%</span>
                </div>

                <div className="bg-white/60 p-5 rounded-xl text-sm font-medium text-gray-800 w-full backdrop-blur-sm text-left space-y-2">
                  <p className="border-b pb-2">
                    <span className="text-gray-500 text-xs block mb-1">크로스체크 포인트</span>
                    유저님이 매달 내는 실제 돈은 적을 수 있지만, <strong>DSR 규제 심사 시에는 보수적인 기준(마통 5년 상환 간주, 스트레스 금리 가산 등)이 적용되어 %가 높게 산출</strong>됩니다.
                  </p>
                  {dsrResult > limitDSR ? (
                    <p className="text-pink-700 font-bold pt-1">⚠️ 신규 대출을 줄이거나 기존 대출을 먼저 상환해야 합니다.</p>
                  ) : (
                    <p className="text-emerald-700 font-bold pt-1">🎉 은행 심사를 무사히 통과할 수 있는 안전권입니다!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}