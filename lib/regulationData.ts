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
    borderColor: "#FF3000",
    bgColor: "#ffffff",
    textColor: "#BF2400",
    dotColor: "#FF3000",
    rules: [
      "주택구입 LTV 40%, 생애최초 LTV 70%",
    ],
  },
  "조정대상지역": {
    color: "#f97316",
    borderColor: "#FF5D00",
    bgColor: "#ffffff",
    textColor: "#BF4400",
    dotColor: "#FF5D00",
    rules: [
      "투기과열지구 하위 규제로 현재는 의미 없음"
    ],
  },
  "토지거래허가구역": {
    color: "transparent",    // 채우기 없음 (투과지/조정대상 색 위에 테두리만)
    strokeColor: "#dc2626",  // 진한 빨강 테두리 (투기과열지구 파스텔과 구분)
    strokeWidth: 2.5,  // 테두리 두께 → 2.5px
    borderColor: "#FF9500", // 규제요약 카드의 테두리 색 → 진한 빨강 (지도 테두리와 통일)
    bgColor: "#ffffff",  // 규제요약 카드의 배경색 → 아주 연한 빨강(거의 흰색에 가까운 핑크)
    textColor: "#D17900",  // 규제요약 카드 안의 글자색 → 진한 적갈색
    dotColor: "#FF9500",  // 카드 제목 앞의 작은 동그라미(●) 색 → 진한 빨강
    rules: [
      "실거주 목적 외 주택 취득 금지",
      "구청장 허가 없이 매매·증여·임대차 계약 불가",
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

// ─────────────────────────────────────────────────────────────────
// ✅ 전국 공통 대출규제 카드 (지역별 지도 색칠과는 무관한 전국 공통 제도)
//    메인페이지 규제요약에서 투기과열지구/조정대상지역/토지거래허가구역
//    3개 카드 옆에 추가로 표시되는 섹션. 지도 연동이 필요 없어서
//    REGULATION_AREAS/REGULATION_STYLE과는 완전히 독립된 별도 배열로 관리.
//    출처: 금융위원회 「3단계 스트레스 DSR 시행방안」(2025.5.20),
//          금융위원회 「'26년 상반기 스트레스 DSR 운영방안」(2025.12.10)
// ─────────────────────────────────────────────────────────────────
export type PolicyCard = {
  title: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  rules: string[];
};

export const NATIONAL_POLICY_CARDS: PolicyCard[] = [
  {
    title: "스트레스 DSR (3단계)",
    borderColor: "#c7d2fe",
    bgColor: "#ffffff",
    textColor: "#3730a3",
    dotColor: "#6366f1",
    rules: [
      "스트레스금리 수도권·규제지역 주담대 3.0%, 그 외 1.5%",
      "지방은 0.75% 한시 적용(~2026 말)",
    ],
  },
  {
    title: "주담대 한도 상한액 적용",
    borderColor: "#bbf7d0",
    bgColor: "#ffffff",
    textColor: "#166534",
    dotColor: "#22c55e",
    rules: [
      "주택담보대출 상한액 지정 : 6억 (15억 이하) / 4억 (15~25억) / 2억 (25억 초과)",
    ],
  },
];