// ✅ 백필 메인 스크립트
// 실행: npx tsx scripts/backfill.ts (또는 ts-node)
// - 2021.01 ~ 현재까지, 서울+경기 전체 지역의 거래 데이터를 가져와 Supabase에 저장
// - 일일 호출 한도(DAILY_CALL_LIMIT)에 도달하면 자동으로 멈추고, 다음 실행 시 이어서 진행
// - 진행 상태는 scripts/.backfill-progress.json 에 저장됨
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { ALL_REGIONS } from "../lib/regionCodes";
import { fetchTransactionsForRegion } from "../lib/fetchTransactions";
import { generateYearMonthList } from "../lib/yearMonthRange";
import {
  loadProgress,
  saveProgress,
  makeTaskKey,
  isTaskCompleted,
  markTaskCompleted,
} from "./backfillProgress";

// ⚠️ 공공데이터포털 활용신청 단계(보통 1,000회/일)에 맞춰 보수적으로 설정.
// 승인 후 트래픽 한도가 더 높다면 이 값을 늘려도 됨.
const DAILY_CALL_LIMIT = 900;

// API 서버 부담을 줄이기 위한 호출 간 딜레이(ms)
const CALL_DELAY_MS = 200;

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다. .env.local을 확인하세요."
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const progress = loadProgress();
  const yearMonths = generateYearMonthList();

  // 전체 작업 목록: 지역 x 연월 조합
  const allTasks: { regionCode: string; regionName: string; yearMonth: string }[] = [];
  for (const ym of yearMonths) {
    for (const region of ALL_REGIONS) {
      allTasks.push({ regionCode: region.code, regionName: region.name, yearMonth: ym });
    }
  }

  const remainingTasks = allTasks.filter(
    (t) => !isTaskCompleted(progress, makeTaskKey(t.regionCode, t.yearMonth))
  );

  console.log(`[백필] 전체 작업 ${allTasks.length}개 중 ${remainingTasks.length}개 남음`);

  if (remainingTasks.length === 0) {
    console.log("[백필] 모든 작업이 이미 완료되었습니다! 🎉");
    return;
  }

  let callCount = 0;
  let fetchedThisRun = 0;
  let errorsThisRun = 0;

  for (const task of remainingTasks) {
    if (callCount >= DAILY_CALL_LIMIT) {
      console.log(
        `[백필] 일일 호출 한도(${DAILY_CALL_LIMIT}회)에 도달하여 중단합니다. 내일 다시 실행하면 이어서 진행됩니다.`
      );
      break;
    }

    const taskKey = makeTaskKey(task.regionCode, task.yearMonth);

    try {
      const transactions = await fetchTransactionsForRegion(task.regionCode, task.yearMonth);

      if (transactions.length > 0) {
        // complex_key 생성 후 Supabase에 upsert (중복 방지)
        const rows = transactions
          .filter((t) => !t.isCancelled)
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

        if (rows.length > 0) {
          const { error } = await supabase.from("apt_transactions").insert(rows);
          if (error) {
            console.error(`[백필] DB 저장 실패 (${task.regionName} ${task.yearMonth}):`, error.message);
            errorsThisRun += 1;
          } else {
            fetchedThisRun += rows.length;
          }
        }
      }

      markTaskCompleted(progress, taskKey);
      callCount += 1;

      // 진행상황 주기적으로 콘솔 출력 (50건마다)
      if (callCount % 50 === 0) {
        console.log(
          `[백필] 진행중... ${callCount}/${Math.min(remainingTasks.length, DAILY_CALL_LIMIT)} (이번 실행 누적 수집: ${fetchedThisRun}건)`
        );
        // 50건마다 진행상태 저장 (중간에 끊겨도 손실 최소화)
        progress.totalFetched += 0; // 누적은 마지막에 한번에 반영
        saveProgress(progress);
      }

      await new Promise((resolve) => setTimeout(resolve, CALL_DELAY_MS));
    } catch (err) {
      console.error(`[백필] 호출 실패 (${task.regionName} ${task.yearMonth}):`, err);
      errorsThisRun += 1;
      callCount += 1;
      // 실패해도 다음 작업으로 계속 진행 (완료 처리는 하지 않아 다음 실행 시 재시도됨)
    }
  }

  progress.lastRunAt = new Date().toISOString();
  progress.totalFetched += fetchedThisRun;
  progress.totalErrors += errorsThisRun;
  saveProgress(progress);

  console.log(`\n[백필] 이번 실행 완료`);
  console.log(`  - 처리한 작업 수: ${callCount}`);
  console.log(`  - 수집된 거래 건수: ${fetchedThisRun}`);
  console.log(`  - 에러 발생 수: ${errorsThisRun}`);
  console.log(`  - 전체 진행률: ${progress.completedTasks.length}/${allTasks.length}`);

  if (progress.completedTasks.length < allTasks.length) {
    console.log(`\n👉 아직 남은 작업이 있습니다. 내일 다시 'npx tsx scripts/backfill.ts' 를 실행해주세요.`);
  } else {
    console.log(`\n🎉 백필이 모두 완료되었습니다!`);
  }
}

main().catch((err) => {
  console.error("[백필] 치명적 오류:", err);
  process.exit(1);
});