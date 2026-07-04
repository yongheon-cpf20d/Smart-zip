// ✅ 2019년 1월 ~ 현재까지의 "계약년월(YYYYMM)" 목록을 생성
// 2019년부터로 확장 (사용자 요청 반영, 기존 2021년에서 소급)

const BACKFILL_START_YEAR = 2019;
const BACKFILL_START_MONTH = 1;

export function generateYearMonthList(toDate: Date = new Date()): string[] {
  const result: string[] = [];
  let year = BACKFILL_START_YEAR;
  let month = BACKFILL_START_MONTH;

  const endYear = toDate.getFullYear();
  const endMonth = toDate.getMonth() + 1; // JS는 0부터 시작하므로 +1

  while (year < endYear || (year === endYear && month <= endMonth)) {
    result.push(`${year}${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return result;
}