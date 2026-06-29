"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoanPage() {
  const [repaymentType, setRepaymentType] = useState('원리금균등');
  const [principal, setPrincipal] = useState(30000); // 3억 (단위: 만원)
  const [rate, setRate] = useState(4.0); // 4%
  const [duration, setDuration] = useState(30); // 30년
  const [gracePeriod, setGracePeriod] = useState(0); // 거치기간 0년
  
  const [resultData, setResultData] = useState<any[]>([]);
  // 월 상환액 상태 (첫 달 기준)
  const [monthlyDetail, setMonthlyDetail] = useState({ total: 0, principal: 0, interest: 0 });

  const handleCalculate = () => {
    let balance = principal * 10000; 
    const monthlyRate = (rate / 100) / 12;
    const totalMonths = (duration - gracePeriod) * 12;
    
    // 원리금균등 월 상환액 공식
    const monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    // 거치기간 이후 본격 상환 '첫 달' 기준의 원금과 이자 계산
    const firstMonthInterest = balance * monthlyRate;
    const firstMonthPrincipal = monthlyPayment - firstMonthInterest;
    
    setMonthlyDetail({
      total: Math.round(monthlyPayment),
      principal: Math.round(firstMonthPrincipal),
      interest: Math.round(firstMonthInterest)
    });

    const yearlyData = [];
    let currentBalance = balance;

    for (let y = 1; y <= gracePeriod; y++) {
      const yearlyInterest = currentBalance * (rate / 100);
      yearlyData.push({
        year: y,
        principalPay: 0,
        interestPay: yearlyInterest,
        balance: currentBalance,
      });
    }

    for (let y = gracePeriod + 1; y <= duration; y++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;

      for (let m = 1; m <= 12; m++) {
        const interest = currentBalance * monthlyRate;
        const principalPay = monthlyPayment - interest;
        
        yearlyInterest += interest;
        yearlyPrincipal += principalPay;
        currentBalance -= principalPay;
      }

      yearlyData.push({
        year: y,
        principalPay: yearlyPrincipal,
        interestPay: yearlyInterest,
        balance: currentBalance > 0 ? currentBalance : 0,
      });
    }

    setResultData(yearlyData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Link href="/" className="inline-block px-4 py-2 bg-white text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-100 transition text-sm">
          ← 메인으로 돌아가기
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">💸 주택담보대출 시뮬레이션</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. 입력부 (좌측) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 lg:col-span-1">
            
            {/* 상환방식 선택 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">상환 방식</label>
              <div className="space-y-2">
                {['원리금균등', '원금균등', '체증식'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRepaymentType(type)}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      repaymentType === type
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-400'
                        : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 입력 폼 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">대출 원금 (만원)</label>
                <input 
                  type="number" 
                  value={principal} 
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">연 금리 (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={rate} 
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none" 
                />
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-bold text-gray-600">대출 기간 (년)</label>
                  <select value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} className="text-xs bg-gray-100 p-1 rounded-md text-gray-600 outline-none">
                    <option value={0}>거치기간 없음</option>
                    <option value={1}>1년 거치</option>
                    <option value={3}>3년 거치</option>
                  </select>
                </div>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none" 
                />
                <div className="flex gap-2 mt-2">
                  {[10, 20, 30, 40].map(y => (
                    <button key={y} onClick={() => setDuration(y)} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition">
                      {y}년
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleCalculate}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-extrabold hover:bg-emerald-500 transition-all shadow-md active:scale-95"
            >
              시뮬레이션 시작
            </button>
          </div>

          {/* 2. 결과부 (우측) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
            
            {resultData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-10 h-full">
                <span className="text-4xl mb-2">💡</span>
                <p className="font-medium">좌측에서 정보를 입력하고 시뮬레이션을 시작해보세요!</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-800 mb-4">📊 연도별 상환 흐름 (1년 단위)</h3>
                {/* 스택형 막대그래프 영역 */}
                <div className="flex items-end h-40 w-full gap-[2px] mb-4 pt-4 border-b border-gray-200">
                  {resultData.map((data, idx) => {
                    const maxPayment = Math.max(...resultData.map(d => d.principalPay + d.interestPay));
                    const principalHeight = (data.principalPay / maxPayment) * 100;
                    const interestHeight = (data.interestPay / maxPayment) * 100;

                    return (
                      <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10 transition-opacity">
                          {data.year}년차
                        </div>
                        {/* 이자 (빨강) */}
                        <div style={{ height: `${interestHeight}%` }} className="bg-red-400 w-full rounded-t-sm transition-all"></div>
                        {/* 원금 (파랑) */}
                        <div style={{ height: `${principalHeight}%` }} className="bg-blue-500 w-full transition-all"></div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-4 text-xs font-bold text-gray-600 mb-6">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span>원금</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-full"></span>이자</div>
                </div>

                {/* 🌟 신규 추가: 월별 상환 요약 (첫 달 기준) */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div className="text-center md:text-left flex-1">
                    <div className="text-xs text-gray-500 font-bold mb-1">월 상환 원리금 (상환 1회차 기준)</div>
                    <div className="text-2xl font-extrabold text-gray-900">₩ {monthlyDetail.total.toLocaleString()}</div>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-gray-300"></div>
                  <div className="flex gap-6 w-full md:w-auto justify-center">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-blue-500 mb-1">원금</div>
                      <div className="text-sm font-bold text-gray-700">₩ {monthlyDetail.principal.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-red-400 mb-1">이자</div>
                      <div className="text-sm font-bold text-gray-700">₩ {monthlyDetail.interest.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* 결과 표 (Table) - 전체 기호 및 풀(full) 숫자 서식 적용 */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0 shadow-sm">
                      <tr>
                        <th className="p-3 text-center">경과</th>
                        <th className="p-3 text-blue-600">납입 원금</th>
                        <th className="p-3 text-red-500">납입 이자</th>
                        <th className="p-3">대출 잔액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                      {resultData.map((data, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-center">{data.year}년</td>
                          <td className="p-3 text-blue-600">₩ {Math.round(data.principalPay).toLocaleString()}</td>
                          <td className="p-3 text-red-500">₩ {Math.round(data.interestPay).toLocaleString()}</td>
                          <td className="p-3 font-bold">₩ {Math.round(data.balance).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}