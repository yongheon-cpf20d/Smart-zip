"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

// --- 주요 5개 지역 예시 데이터 (가벼운 버전) ---
// 나중에 전체 지도의 path 좌표(M... L...)로 이 부분을 갈아 끼우시면 됩니다.
const simpleMapData = [
  { id: 'seoul', name: '서울/경기', path: 'M50,100 L100,50 L150,100 Z', status: '투기 과열 지구' },
  { id: 'gangwon', name: '강원', path: 'M150,50 L200,100 L150,150 Z', status: '비규제 지역' },
  { id: 'chungcheong', name: '충청', path: 'M50,150 L100,200 L150,150 Z', status: '조정 대상 지역' },
  { id: 'gyeongsang', name: '경상', path: 'M150,150 L200,200 L150,250 Z', status: '비규제 지역' },
  { id: 'jeolla', name: '전라/제주', path: 'M50,200 L100,250 L150,200 Z', status: '비규제 지역' }
];

export default function RegulationMap() {
  const [selected, setSelected] = useState<string | null>(null);

  // 상태별 색상 설정
  const getColor = (status: string) => {
    switch (status) {
      case '투기 과열 지구': return '#14b8a6'; // Teal (서울/경기)
      case '조정 대상 지역': return '#94a3b8'; // Slate 400
      default: return '#1e293b'; // Slate 800 (비규제)
    }
  };

  return (
    <div className="p-8 bg-slate-950 text-white rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-bold text-center tracking-tight">전국 규제 지역 지도</h2>
      
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* 1. 벡터 지도 영역 */}
        <svg className="w-full md:w-2/3 h-auto" viewBox="0 0 250 300">
          {simpleMapData.map(region => (
            <motion.path
              key={region.id}
              d={region.path}
              fill={selected === region.id ? '#0d9488' : getColor(region.status)} // 선택 시 색상 변경
              stroke="#475569" // Slate 600 경계선
              strokeWidth="1"
              whileHover={{ scale: 1.05, stroke: '#f8fafc' }} // 호버 시 뽀잉 & 테두리 강조
              onClick={() => setSelected(region.id)} // 클릭 시 지역명 저장
              className="cursor-pointer transition-colors duration-200"
            />
          ))}
        </svg>

        {/* 2. 지역 정보 사이드바 영역 */}
        <div className="w-full md:w-1/3 p-6 bg-slate-900 rounded-lg space-y-4 border border-slate-800">
          {selected ? (
            simpleMapData.filter(r => r.id === selected).map(r => (
              <div key={r.id} className="space-y-2">
                <h3 className="text-xl font-semibold text-teal-400">{r.name}</h3>
                <p className="text-slate-300">규제 상태: <span className="font-bold">{r.status}</span></p>
                {/* 나중에 여기에 규제 상세 정보를 추가할 수 있습니다. */}
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-10">지도의 지역을 클릭하시면 상세 규제 정보를 확인할 수 있습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}