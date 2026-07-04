// ✅ 일일 실거래가 업데이트 스크립트 (백필과 별개, 매일 가볍게 실행)
// 실행: npx tsx scripts/daily-update.ts
//
// 목적: 백필(전체 과거 데이터 수집)이 끝난 후, 매일 "이번 달 + 지난 달"만
//      다시 조회해서 새로 신고된 거래만 추가한다.
//
// 왜 2개월치를 매번 다시 보나?
//   실거래 신고 유예기간이 30일이라, 예를 들어 6/8 계약 건이
//   6/15 계약 건보다 늦게(예: 6/25에) 국토부에 등록될 수 있다.
//   그래서 최신 1개월치만 보면 "늦게 신고된 지난달 거래"를 놓친다.
//
// 왜 "새로 보는 거래만" insert하나?
//   신고가 판정 로직(new_high_view)이 "오늘 DB에 처음 저장된(created_at=오늘)
//   거래 중 역대 최고가"를 신고가로 인식하기 때문에, 이미 알고 있던 거래를
//   오늘 다시 insert(중복)하면 created_at이 오늘로 바뀌어 가짜 신고가가 발생한다.
//   따라서 "완전히 새로운 거래"만 골라서 넣어야 정확하다.

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { ALL_REGIONS } from "../lib/regionCodes";
import { fetchTransactionsForRegion } from "../lib/fetchTransactions";

const CALL_DELAY_MS = 200;

// 이번 달 + 지난 달의 YYYYMM 문자열 생성
function getRecentTwoMonths(): string[] {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, "0")}`;
  return [prevMonth, thisMonth];
}

// 거래 식별용 고유키 (완전 동일 거래 판별용)
function makeTxKey(t: {
  complexName: string; dong: string; area: number; floor: number; price: number; dealDate: string;
}): string {
  const roundedArea = Math.round(t.area * 100) / 100;
  return `${t.complexName}|${t.dong}|${roundedArea}|${t.floor}|${t.price}|${t.dealDate}`;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const months = getRecentTwoMonths();

  console.log(`[일일업데이트] 대상 기간: ${months.join(", ")}`);
  console.log(`[일일업데이트] 대상 지역: ${ALL_REGIONS.length}개 (서울+경기)`);
  console.log(`[일일업데이트] 총 호출 예정: ${ALL_REGIONS.length * months.length}회\n`);

  let totalNew = 0;
  let totalChecked = 0;
  let errors = 0;

  for (const yearMonth of months) {
    const year = yearMonth.slice(0, 4);
    const month = yearMonth.slice(4, 6);
    const monthStart = `${year}-${month}-01`;
    const nextMonthDate = new Date(Number(year), Number(month), 1); // month는 0-indexed라 자동으로 다음달
    const monthEnd = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

    for (const region of ALL_REGIONS) {
      try {
        // 1. 이 지역+월에 이미 저장된 거래들의 고유키 목록 조회
        const { data: existing, error: fetchErr } = await supabase
          .from("apt_transactions")
          .select("complex_name, dong, area, floor, price, deal_date")
          .eq("region_code", region.code)
          .gte("deal_date", monthStart)
          .lt("deal_date", monthEnd);

        if (fetchErr) {
          console.error(`[일일업데이트] 기존 데이터 조회 실패 (${region.name} ${yearMonth}):`, fetchErr.message);
          errors++;
          continue;
        }

        const existingKeys = new Set(
          (existing ?? []).map((e) =>
            makeTxKey({
              complexName: e.complex_name, dong: e.dong, area: e.area,
              floor: e.floor, price: e.price, dealDate: e.deal_date,
            })
          )
        );

        // 2. 국토부 API에서 최신 데이터 조회
        const transactions = await fetchTransactionsForRegion(region.code, yearMonth);
        totalChecked += transactions.length;

        // 3. 완전히 새로운 거래만 필터링
        const newRows = transactions
          .filter((t) => !t.isCancelled)
          .filter((t) => !existingKeys.has(makeTxKey(t)))
          .map((t) => {
            const roundedArea = Math.round(t.area * 100) / 100;
            return {
              complex_key: `${t.complexName}__${t.dong}__${roundedArea}`,
              complex_name: t.complexName,
              dong: t.dong,
              region_name: t.regionName,
              region_code: t.regionCode,
              area: t.area,
              floor: t.floor,
              price: t.price,
              deal_date: t.dealDate,
              build_year: t.buildYear,
            };
          });

        if (newRows.length > 0) {
          const { error: insertErr } = await supabase.from("apt_transactions").insert(newRows);
          if (insertErr) {
            console.error(`[일일업데이트] 저장 실패 (${region.name} ${yearMonth}):`, insertErr.message);
            errors++;
          } else {
            totalNew += newRows.length;
            console.log(`  ${region.name} ${yearMonth}: 신규 ${newRows.length}건`);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, CALL_DELAY_MS));
      } catch (err) {
        console.error(`[일일업데이트] 호출 실패 (${region.name} ${yearMonth}):`, err);
        errors++;
      }
    }
  }

  console.log(`\n[일일업데이트] 완료`);
  console.log(`  - 확인한 거래 수: ${totalChecked}`);
  console.log(`  - 신규 저장 건수: ${totalNew}`);
  console.log(`  - 에러 수: ${errors}`);

  // ✅ 뷰 갱신 (신고가 + 대장아파트)
  console.log(`\n[일일업데이트] 뷰(new_high_view, top_apt_by_area_view) 갱신 중...`);
  const { error: refreshError } = await supabase.rpc("refresh_all_views");
  if (refreshError) {
    console.error("[일일업데이트] 뷰 갱신 실패:", refreshError.message);
  } else {
    console.log("[일일업데이트] 뷰 갱신 완료!");
  }
}

main().catch((err) => {
  console.error("[일일업데이트] 치명적 오류:", err);
  process.exit(1);
});