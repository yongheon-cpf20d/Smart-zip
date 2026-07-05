// lib/regulationData.ts
// ✅ 단일 소스 — 이 파일만 수정하면 메인페이지 지도, 메인페이지 규제요약,
//    규제현황 페이지 세 군데에 자동으로 반영됩니다.

export type RegulationType = "투기과열지구" | "조정대상지역" | "토지거래허가구역";

export type RegulationArea = {
  name: string;
  sido: "서울" | "경기" | "인천" | "대구" | "부산" | "기타";
  type: RegulationType;
};

// ── 규제유형별 스타일 ──────────────────────────────────────────────────
export const REGULATION_STYLE: Record<RegulationType, {
  color: string;         // 지도 채우기 색
  strokeColor?: string;  // 토지거래허가구역 테두리 색 (선택)
  strokeWidth?: number;  // 테두리 두께
  borderColor: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  rules: string[];
}> = {
  "투기과열지구": {
    color: "#fca5a5",
    borderColor: "#fca5a5",
    bgColor: "#fef2f2",
    textColor: "#991b1b",
    dotColor: "#ef4444",
    rules: [
      "무주택자 LTV 40%(6억 한도)",
      "유주택자 구입목적 주담대 금지 (LTV 0%)",
      "1주택 비과세 요건: 2년 보유 + 2년 실거주",
      "다주택자 양도세 중과 & 장특공제 배제",
      "다주택자 취득세 중과 (2주택 8%, 3주택 12%)",
      "재당첨 제한 10년",
      "주택 구입시 6개월 내 전입 의무",
    ],
  },
  "조정대상지역": {
    color: "#f97316",
    borderColor: "#fcd34d",
    bgColor: "#fffbeb",
    textColor: "#92400e",
    dotColor: "#f59e0b",
    rules: [
      "무주택자 LTV 40%(6억 한도)",
      "유주택자 구입목적 주담대 금지 (LTV 0%)",
      "1주택 비과세 요건: 2년 보유 + 2년 실거주",
      "다주택자 양도세 중과 & 장특공제 배제",
      "다주택자 취득세 중과 (2주택 8%, 3주택 12%)",
      "재당첨 제한 7년",
      "주택 구입시 6개월 내 전입 의무",
    ],
  },
  "토지거래허가구역": {
    color: "transparent",    // 채우기 없음 (투과지/조정대상 색 위에 테두리만)
    strokeColor: "#dc2626",  // 진한 빨강 테두리 (투기과열지구 파스텔과 구분)
    strokeWidth: 2.5,
    borderColor: "#dc2626",
    bgColor: "#fef2f2",
    textColor: "#7f1d1d",
    dotColor: "#dc2626",
    rules: [
      "실거주 목적 외 주택 취득 원칙적 금지",
      "구청장 허가 없이 매매·증여·임대차 계약 불가",
      "허가 없이 계약 시 계약 무효 및 형사처벌",
      "투기과열지구·조정대상지역 규제 중복 적용",
    ],
  },
};

// ── 규제지역 목록 ─────────────────────────────────────────────────────
export const REGULATION_AREAS: RegulationArea[] = [
  // 시도 단위
  { name: "서울특별시", sido: "기타", type: "투기과열지구" },

 // 서울 (투기과열지구)
  { name: "강남구", sido: "서울", type: "투기과열지구" },
  { name: "서초구", sido: "서울", type: "투기과열지구" },
  { name: "송파구", sido: "서울", type: "투기과열지구" },
  { name: "용산구", sido: "서울", type: "투기과열지구" },
  { name: "성동구", sido: "서울", type: "투기과열지구" },
  { name: "마포구", sido: "서울", type: "투기과열지구" },
  { name: "강동구", sido: "서울", type: "투기과열지구" },
  { name: "영등포구", sido: "서울", type: "투기과열지구" },
  { name: "양천구", sido: "서울", type: "투기과열지구" },
  { name: "동작구", sido: "서울", type: "투기과열지구" },
  { name: "광진구", sido: "서울", type: "투기과열지구" },
  { name: "중구", sido: "서울", type: "투기과열지구" },
  { name: "종로구", sido: "서울", type: "투기과열지구" },
  { name: "서대문구", sido: "서울", type: "투기과열지구" },
  { name: "강서구", sido: "서울", type: "투기과열지구" },
  { name: "노원구", sido: "서울", type: "투기과열지구" },
  { name: "성북구", sido: "서울", type: "투기과열지구" },
  { name: "구로구", sido: "서울", type: "투기과열지구" },
  { name: "동대문구", sido: "서울", type: "투기과열지구" },
  { name: "관악구", sido: "서울", type: "투기과열지구" },
  { name: "은평구", sido: "서울", type: "투기과열지구" },
  { name: "중랑구", sido: "서울", type: "투기과열지구" },
  { name: "금천구", sido: "서울", type: "투기과열지구" },
  { name: "강북구", sido: "서울", type: "투기과열지구" },
  { name: "도봉구", sido: "서울", type: "투기과열지구" },

  // 서울 (조정대상지역)
  { name: "강남구", sido: "서울", type: "조정대상지역" },
  { name: "서초구", sido: "서울", type: "조정대상지역" },
  { name: "송파구", sido: "서울", type: "조정대상지역" },
  { name: "용산구", sido: "서울", type: "조정대상지역" },
  { name: "성동구", sido: "서울", type: "조정대상지역" },
  { name: "마포구", sido: "서울", type: "조정대상지역" },
  { name: "강동구", sido: "서울", type: "조정대상지역" },
  { name: "영등포구", sido: "서울", type: "조정대상지역" },
  { name: "양천구", sido: "서울", type: "조정대상지역" },
  { name: "동작구", sido: "서울", type: "조정대상지역" },
  { name: "광진구", sido: "서울", type: "조정대상지역" },
  { name: "중구", sido: "서울", type: "조정대상지역" },
  { name: "종로구", sido: "서울", type: "조정대상지역" },
  { name: "서대문구", sido: "서울", type: "조정대상지역" },
  { name: "강서구", sido: "서울", type: "조정대상지역" },
  { name: "노원구", sido: "서울", type: "조정대상지역" },
  { name: "성북구", sido: "서울", type: "조정대상지역" },
  { name: "구로구", sido: "서울", type: "조정대상지역" },
  { name: "동대문구", sido: "서울", type: "조정대상지역" },
  { name: "관악구", sido: "서울", type: "조정대상지역" },
  { name: "은평구", sido: "서울", type: "조정대상지역" },
  { name: "중랑구", sido: "서울", type: "조정대상지역" },
  { name: "금천구", sido: "서울", type: "조정대상지역" },
  { name: "강북구", sido: "서울", type: "조정대상지역" },
  { name: "도봉구", sido: "서울", type: "조정대상지역" },

  // 서울 토지거래허가구역
  { name: "강남구", sido: "서울", type: "토지거래허가구역" },
  { name: "서초구", sido: "서울", type: "토지거래허가구역" },
  { name: "송파구", sido: "서울", type: "토지거래허가구역" },
  { name: "용산구", sido: "서울", type: "토지거래허가구역" },
  { name: "성동구", sido: "서울", type: "토지거래허가구역" },
  { name: "마포구", sido: "서울", type: "토지거래허가구역" },
  { name: "강동구", sido: "서울", type: "토지거래허가구역" },
  { name: "영등포구", sido: "서울", type: "토지거래허가구역" },
  { name: "양천구", sido: "서울", type: "토지거래허가구역" },
  { name: "동작구", sido: "서울", type: "토지거래허가구역" },
  { name: "광진구", sido: "서울", type: "토지거래허가구역" },
  { name: "중구", sido: "서울", type: "토지거래허가구역" },
  { name: "종로구", sido: "서울", type: "토지거래허가구역" },
  { name: "서대문구", sido: "서울", type: "토지거래허가구역" },
  { name: "강서구", sido: "서울", type: "토지거래허가구역" },
  { name: "노원구", sido: "서울", type: "토지거래허가구역" },
  { name: "성북구", sido: "서울", type: "토지거래허가구역" },
  { name: "구로구", sido: "서울", type: "토지거래허가구역" },
  { name: "동대문구", sido: "서울", type: "토지거래허가구역" },
  { name: "관악구", sido: "서울", type: "토지거래허가구역" },
  { name: "은평구", sido: "서울", type: "토지거래허가구역" },
  { name: "중랑구", sido: "서울", type: "토지거래허가구역" },
  { name: "금천구", sido: "서울", type: "토지거래허가구역" },
  { name: "강북구", sido: "서울", type: "토지거래허가구역" },
  { name: "도봉구", sido: "서울", type: "토지거래허가구역" },

  // 경기 투기과열지구
  { name: "수원시 장안구", sido: "경기", type: "투기과열지구" },
  { name: "수원시 팔달구", sido: "경기", type: "투기과열지구" },
  { name: "수원시 영통구", sido: "경기", type: "투기과열지구" },
  { name: "성남시 수정구", sido: "경기", type: "투기과열지구" },
  { name: "성남시 중원구", sido: "경기", type: "투기과열지구" },
  { name: "성남시 분당구", sido: "경기", type: "투기과열지구" },
  { name: "안양시 동안구", sido: "경기", type: "투기과열지구" },
  { name: "용인시 수지구", sido: "경기", type: "투기과열지구" },
  { name: "용인시 기흥구", sido: "경기", type: "투기과열지구" },
  { name: "구리시", sido: "경기", type: "투기과열지구" },
  { name: "하남시", sido: "경기", type: "투기과열지구" },
  { name: "광명시", sido: "경기", type: "투기과열지구" },
  { name: "과천시", sido: "경기", type: "투기과열지구" },
  { name: "의왕시", sido: "경기", type: "투기과열지구" },
  { name: "화성시", sido: "경기", type: "투기과열지구" },

  // 경기 조정대상지역
  { name: "수원시 장안구", sido: "경기", type: "조정대상지역" },
  { name: "수원시 팔달구", sido: "경기", type: "조정대상지역" },
  { name: "수원시 영통구", sido: "경기", type: "조정대상지역" },
  { name: "성남시 수정구", sido: "경기", type: "조정대상지역" },
  { name: "성남시 중원구", sido: "경기", type: "조정대상지역" },
  { name: "성남시 분당구", sido: "경기", type: "조정대상지역" },
  { name: "안양시 동안구", sido: "경기", type: "조정대상지역" },
  { name: "용인시 수지구", sido: "경기", type: "조정대상지역" },
  { name: "용인시 기흥구", sido: "경기", type: "조정대상지역" },
  { name: "구리시", sido: "경기", type: "조정대상지역" },
  { name: "하남시", sido: "경기", type: "조정대상지역" },
  { name: "광명시", sido: "경기", type: "조정대상지역" },
  { name: "과천시", sido: "경기", type: "조정대상지역" },
  { name: "의왕시", sido: "경기", type: "조정대상지역" },
  { name: "화성시", sido: "경기", type: "조정대상지역" },

  // 경기 토지거래허가구역
  { name: "수원시 장안구", sido: "경기", type: "토지거래허가구역" },
  { name: "수원시 팔달구", sido: "경기", type: "토지거래허가구역" },
  { name: "수원시 영통구", sido: "경기", type: "토지거래허가구역" },
  { name: "성남시 수정구", sido: "경기", type: "토지거래허가구역" },
  { name: "성남시 중원구", sido: "경기", type: "토지거래허가구역" },
  { name: "성남시 분당구", sido: "경기", type: "토지거래허가구역" },
  { name: "안양시 동안구", sido: "경기", type: "토지거래허가구역" },
  { name: "용인시 수지구", sido: "경기", type: "토지거래허가구역" },
  { name: "용인시 기흥구", sido: "경기", type: "토지거래허가구역" },
  { name: "구리시", sido: "경기", type: "토지거래허가구역" },
  { name: "하남시", sido: "경기", type: "토지거래허가구역" },
  { name: "광명시", sido: "경기", type: "토지거래허가구역" },
  { name: "과천시", sido: "경기", type: "토지거래허가구역" },
  { name: "의왕시", sido: "경기", type: "토지거래허가구역" },
  { name: "화성시", sido: "경기", type: "토지거래허가구역" },
];

// ── 헬퍼: 지역명으로 규제 전체 목록 조회 (중복 허용 — 지도에서 사용) ──
export function getRegulationsByName(name: string): RegulationArea[] {
  const normalized = name.replace(/\s/g, "");

  // ✅ "서울특별시" 통합 조회 시: 시도 단위 등록(투기과열지구)뿐 아니라
  //    서울 25개 구 중 하나라도 토지거래허가구역이면 "서울 전체가 토허제"로 판단
  //    (수도권 지도에서 서울을 하나로 뭉쳐 보여줄 때, 구별로만 등록된 토허제 정보가
  //     서울시 단위 조회에서는 안 잡히던 문제 수정)
  if (name === "서울특별시" || normalized === "서울특별시") {
    const cityLevel = REGULATION_AREAS.filter((a) => a.name === name || a.name.replace(/\s/g, "") === normalized);
    const seoulDistricts = REGULATION_AREAS.filter((a) => a.sido === "서울");
    const seoulHasToheo = seoulDistricts.some((a) => a.type === "토지거래허가구역");
    if (seoulHasToheo && !cityLevel.some((a) => a.type === "토지거래허가구역")) {
      return [...cityLevel, { name: "서울특별시", sido: "기타", type: "토지거래허가구역" }];
    }
    return cityLevel;
  }

  return REGULATION_AREAS.filter((a) =>
    a.name === name || a.name.replace(/\s/g, "") === normalized
  );
}

// ── 헬퍼: 지역명으로 지도 채우기 색 조회 (투과지 > 조정대상 우선순위) ──
export function getRegulationByName(name: string): {
  type: RegulationType | "규제없음";
  color: string;
  hasToheo: boolean; // 토지거래허가구역 여부
} {
  const areas = getRegulationsByName(name);
  const hasToheo = areas.some((a) => a.type === "토지거래허가구역");

  // 채우기 우선순위: 투기과열 > 조정대상
  const fill =
    areas.find((a) => a.type === "투기과열지구") ??
    areas.find((a) => a.type === "조정대상지역");

  if (!fill) return { type: "규제없음", color: "#e8ecf1", hasToheo };
  return { type: fill.type, color: REGULATION_STYLE[fill.type].color, hasToheo };
}

// ── 헬퍼: 유형별 그룹핑 (메인페이지 규제요약) ────────────────────────
export function groupByType(): Record<RegulationType, RegulationArea[]> {
  const grouped: Record<RegulationType, RegulationArea[]> = {
    "투기과열지구": [],
    "조정대상지역": [],
    "토지거래허가구역": [],
  };
  const seen: Record<string, Set<RegulationType>> = {};
  for (const area of REGULATION_AREAS) {
    if (area.sido === "기타") continue;
    if (!seen[area.name]) seen[area.name] = new Set();
    if (!seen[area.name].has(area.type)) {
      grouped[area.type].push(area);
      seen[area.name].add(area.type);
    }
  }
  return grouped;
}

// ── 헬퍼: 시도별 그룹핑 ───────────────────────────────────────────────
export function groupBySido(): Record<string, RegulationArea[]> {
  const grouped: Record<string, RegulationArea[]> = {};
  for (const area of REGULATION_AREAS) {
    if (area.sido === "기타") continue;
    if (!grouped[area.sido]) grouped[area.sido] = [];
    grouped[area.sido].push(area);
  }
  return grouped;
}