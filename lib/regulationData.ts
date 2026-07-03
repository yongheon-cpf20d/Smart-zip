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
    color: "#ef4444",
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
    strokeColor: "#7c3aed",  // 보라색 테두리
    strokeWidth: 2.5,
    borderColor: "#c4b5fd",
    bgColor: "#f5f3ff",
    textColor: "#4c1d95",
    dotColor: "#7c3aed",
    rules: [
      "매매 계약 체결 전 관할 지자체장 사전 허가 필수",
      "매수 후 최소 2년 실거주 의무 (신규 갭투자 절대 불가)",
      "기존 세입자 거주 주택 매수 시 실거주 한시 유예 (무주택자 한정)",
      "무허가 및 부정 허가 시 2년 이하 징역 또는 30% 이하 벌금",
      "실거주 의무 위반 시 매년 취득가액 최대 10% 이행강제금 부과",
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

  if (!fill) return { type: "규제없음", color: "#cbd5e1", hasToheo };
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