// lib/regulationData.ts
// ✅ 단일 소스 — 이 파일만 수정하면 메인페이지 지도, 메인페이지 규제요약,
//    규제현황 페이지 세 군데에 자동으로 반영됩니다.
//
// 새 지역 추가/변경 시: REGULATION_AREAS 배열에 항목만 추가하면 끝.

export type RegulationType = "투기과열지구" | "조정대상지역" | "규제없음";

export type RegulationArea = {
  name: string;       // 지도 매칭용 이름 (구/시 단위, 예: "강남구", "수원시 영통구")
  sido: "서울" | "경기" | "인천" | "대구" | "부산" | "기타";
  type: RegulationType;
};

// ── 규제유형별 스타일 (색상/배지 등 시각 정보는 여기서만 관리) ──────────
export const REGULATION_STYLE: Record<RegulationType, {
  color: string;       // 지도 채우기 색
  borderColor: string; // 카드 테두리
  bgColor: string;     // 카드 배경
  textColor: string;   // 카드 텍스트
  dotColor: string;    // 카드 인디케이터 점
  rules: string[];     // 적용 규제 요약
}> = {
  "투기과열지구": {
    color: "#ef4444",
    borderColor: "#fca5a5",
    bgColor: "#fef2f2",
    textColor: "#991b1b",
    dotColor: "#ef4444",
    rules: ["LTV 40%", "DSR 40%", "2년 실거주 의무", "분양권 전매 제한"],
  },
  "조정대상지역": {
    color: "#f97316",
    borderColor: "#fcd34d",
    bgColor: "#fffbeb",
    textColor: "#92400e",
    dotColor: "#f59e0b",
    rules: ["LTV 50%", "DSR 40%", "다주택 양도세 중과"],
  },
  "규제없음": {
    color: "#cbd5e1",
    borderColor: "#6ee7b7",
    bgColor: "#f0fdf4",
    textColor: "#065f46",
    dotColor: "#10b981",
    rules: ["LTV 70%", "DSR 40%", "규제 없음"],
  },
};

// ── 규제지역 목록 (여기에 추가/삭제/수정) ───────────────────────────────
export const REGULATION_AREAS: RegulationArea[] = [
  // 시도 단위 (지도에서 시도 레벨 표시용)
  { name: "서울특별시", sido: "기타", type: "투기과열지구" },
  { name: "인천광역시", sido: "기타", type: "조정대상지역" },
  { name: "경기도", sido: "기타", type: "조정대상지역" },
  { name: "대구광역시", sido: "기타", type: "조정대상지역" },
  { name: "부산광역시", sido: "기타", type: "조정대상지역" },

  // 서울 (투기과열지구)
  { name: "강남구", sido: "서울", type: "투기과열지구" },
  { name: "서초구", sido: "서울", type: "투기과열지구" },
  { name: "송파구", sido: "서울", type: "투기과열지구" },
  { name: "용산구", sido: "서울", type: "투기과열지구" },

  // 서울 (조정대상지역)
  { name: "성동구", sido: "서울", type: "조정대상지역" },
  { name: "마포구", sido: "서울", type: "조정대상지역" },
  { name: "영등포구", sido: "서울", type: "조정대상지역" },
  { name: "광진구", sido: "서울", type: "조정대상지역" },

  // 경기
  { name: "수원시 장안구", sido: "경기", type: "조정대상지역" },
  { name: "수원시 권선구", sido: "경기", type: "조정대상지역" },
  { name: "수원시 팔달구", sido: "경기", type: "조정대상지역" },
  { name: "수원시 영통구", sido: "경기", type: "조정대상지역" },
  { name: "성남시 수정구", sido: "경기", type: "조정대상지역" },
  { name: "성남시 중원구", sido: "경기", type: "조정대상지역" },
  { name: "성남시 분당구", sido: "경기", type: "투기과열지구" },
  { name: "안양시 만안구", sido: "경기", type: "조정대상지역" },
  { name: "안양시 동안구", sido: "경기", type: "조정대상지역" },
  { name: "구리시", sido: "경기", type: "조정대상지역" },
  { name: "하남시", sido: "경기", type: "조정대상지역" },
  { name: "광명시", sido: "경기", type: "조정대상지역" },
  { name: "과천시", sido: "경기", type: "투기과열지구" },
];

// ── 헬퍼 함수: 지역명으로 규제 조회 (지도에서 사용) ────────────────────
export function getRegulationByName(name: string): {
  type: RegulationType;
  color: string;
} {
  // 1. 정확히 일치하는 것 먼저 찾기
  const exact = REGULATION_AREAS.find((a) => a.name === name);
  if (exact) return { type: exact.type, color: REGULATION_STYLE[exact.type].color };

  // 2. 띄어쓰기 제거 후 비교 (예: "수원시영통구" → "수원시 영통구" 매칭)
  const normalized = name.replace(/\s/g, "");
  const fuzzy = REGULATION_AREAS.find((a) => a.name.replace(/\s/g, "") === normalized);
  if (fuzzy) return { type: fuzzy.type, color: REGULATION_STYLE[fuzzy.type].color };

  return { type: "규제없음", color: REGULATION_STYLE["규제없음"].color };
}

// ── 헬퍼 함수: 시도별로 그룹핑 (규제현황 페이지에서 사용) ──────────────
export function groupBySido(): Record<string, RegulationArea[]> {
  const grouped: Record<string, RegulationArea[]> = {};
  for (const area of REGULATION_AREAS) {
    if (area.sido === "기타") continue; // 시도 단위는 목록에서 제외
    if (!grouped[area.sido]) grouped[area.sido] = [];
    grouped[area.sido].push(area);
  }
  return grouped;
}

// ── 헬퍼 함수: 유형별로 그룹핑 (메인페이지 규제요약에서 사용) ──────────
export function groupByType(): Record<RegulationType, RegulationArea[]> {
  const grouped: Record<RegulationType, RegulationArea[]> = {
    "투기과열지구": [],
    "조정대상지역": [],
    "규제없음": [],
  };
  for (const area of REGULATION_AREAS) {
    if (area.sido === "기타") continue; // 시도 단위는 목록에서 제외
    grouped[area.type].push(area);
  }
  return grouped;
}