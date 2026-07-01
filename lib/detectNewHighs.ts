// ✅ "신고가" 판별 로직
// 정의: 동일 단지(complexName) + 동일 전용면적(area, 소수점 둘째자리까지 동일 취급)의
//       과거 모든 거래 내역 중 이번 거래가 역대 최고가를 갱신한 경우를 "신고가"로 판정
//
// 면적은 완전히 똑같지 않고 0.01㎡ 정도 오차가 나는 경우가 있어 반올림해서 비교한다.

import { ParsedTransaction } from "./fetchTransactions";

export type NewHighRecord = {
  complexName: string;
  dong: string;
  regionName: string;
  area: number;
  floor: number;
  price: number; // 신고가 금액(원)
  previousHighPrice: number | null; // 직전 최고가(원). 최초 거래면 null
  dealDate: string;
  priceDiff: number | null; // 직전 대비 상승액(원). 최초 거래면 null
};

/**
 * 단지명 + 면적을 묶는 키 생성. 면적은 소수점 둘째자리까지 반올림해서 동일 평형으로 취급.
 */
function makeComplexKey(complexName: string, dong: string, area: number): string {
  const roundedArea = Math.round(area * 100) / 100;
  return `${complexName}__${dong}__${roundedArea}`;
}

/**
 * 신규 거래 데이터(이번 달)와, 비교 기준이 될 과거 최고가 데이터(이전까지의 단지별 최고가)를 받아
 * 신고가(직전 최고가 갱신) 목록을 반환한다.
 *
 * @param newTransactions 이번에 새로 수집된 거래 데이터
 * @param previousHighMap 단지+면적 키 → 직전까지의 최고가(원). DB에서 미리 조회해서 전달.
 */
export function detectNewHighs(
  newTransactions: ParsedTransaction[],
  previousHighMap: Map<string, number>
): NewHighRecord[] {
  const newHighs: NewHighRecord[] = [];

  // 해제(취소)된 거래는 신고가 판정에서 제외
  const validTransactions = newTransactions.filter((t) => !t.isCancelled);

  // 동일 거래 묶음 내에서도 여러 건이 들어올 수 있으므로, 키별로 그룹화 후 최댓값만 비교
  const grouped = new Map<string, ParsedTransaction[]>();
  for (const t of validTransactions) {
    const key = makeComplexKey(t.complexName, t.dong, t.area);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  for (const [key, transactions] of grouped) {
    // 이번 수집분 중 해당 단지+면적의 최고가 거래 1건만 추출
    const maxTransaction = transactions.reduce((max, t) => (t.price > max.price ? t : max));

    const previousHigh = previousHighMap.get(key) ?? null;

    // 직전 최고가가 없거나(최초 거래), 이번 거래가 직전 최고가를 초과하면 신고가로 판정
    if (previousHigh === null || maxTransaction.price > previousHigh) {
      newHighs.push({
        complexName: maxTransaction.complexName,
        dong: maxTransaction.dong,
        regionName: maxTransaction.regionName,
        area: maxTransaction.area,
        floor: maxTransaction.floor,
        price: maxTransaction.price,
        previousHighPrice: previousHigh,
        dealDate: maxTransaction.dealDate,
        priceDiff: previousHigh !== null ? maxTransaction.price - previousHigh : null,
      });
    }
  }

  // 상승액 큰 순으로 정렬 (최초 거래는 맨 뒤로)
  newHighs.sort((a, b) => {
    if (a.priceDiff === null) return 1;
    if (b.priceDiff === null) return -1;
    return b.priceDiff - a.priceDiff;
  });

  return newHighs;
}

/**
 * makeComplexKey를 외부(DB 조회 등)에서도 동일하게 쓸 수 있도록 export
 */
export { makeComplexKey };