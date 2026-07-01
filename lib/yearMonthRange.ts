// ✅ 2021년 1월 ~ 현재까지의 "계약년월(YYYYMM)" 목록을 생성
// 폭등기였던 2021년부터를 백필 시작점으로 설정 (사용자 요청 반영)

const BACKFILL_START_YEAR = 2021;
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