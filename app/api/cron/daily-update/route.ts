// app/api/cron/daily-update/route.ts
// ✅ Vercel Cron이 매일 자동으로 호출하는 API 엔드포인트
// scripts/daily-update.ts의 로직을 그대로 옮겨서 서버에서 실행되도록 함
//
// 동작: 이번달+지난달 서울/경기 실거래가를 조회해서 신규 거래만 저장,
//      끝나면 신고가/대장아파트 뷰(new_high_view, top_apt_by_area_view)를 자동 갱신

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ALL_REGIONS } from "@/lib/regionCodes";
import { fetchTransactionsForRegion } from "@/lib/fetchTransactions";

export const maxDuration = 300; // Vercel 함수 최대 실행시간 5분(Hobby 플랜 상한)
export const dynamic = "force-dynamic";

function getRecentTwoMonths(): string[] {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, "0")}`;
  return [prevMonth, thisMonth];
}

function makeTxKey(t: {
  complexName: string; dong: string; area: number; floor: number; price: number; dealDate: string;
}): string {
  const roundedArea = Math.round(t.area * 100) / 100;
  return `${t.complexName}|${t.dong}|${roundedArea}|${t.floor}|${t.price}|${t.dealDate}`;
}

export async function GET(request: NextRequest) {
  // ✅ Vercel Cron이 아닌 외부에서 함부로 호출 못하도록 보안 검증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ 디버깅: 환경변수 존재 여부 우선 확인
  const envCheck = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasRtmsKey: !!process.env.RTMS_API_KEY,
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey || !process.env.RTMS_API_KEY) {
    return NextResponse.json({ error: "환경변수 누락", envCheck }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const months = getRecentTwoMonths();
  let totalNew = 0;
  let totalChecked = 0;
  let errors = 0;
  const log: string[] = [];
  const errorDetails: string[] = [];

  console.log(`[cron] 시작 — 대상 지역 ${ALL_REGIONS.length}개, 대상 월 ${months.join(",")}`);

  // ✅ 디버깅: ALL_REGIONS가 비어있으면 즉시 원인 알 수 있게 반환
  if (!ALL_REGIONS || ALL_REGIONS.length === 0) {
    return NextResponse.json({
      error: "ALL_REGIONS 로드 실패 — 배열이 비어있음",
      regionsLength: ALL_REGIONS?.length ?? "undefined",
      envCheck,
    }, { status: 500 });
  }

  for (const yearMonth of months) {
    const year = yearMonth.slice(0, 4);
    const month = yearMonth.slice(4, 6);
    const monthStart = `${year}-${month}-01`;
    const nextMonthDate = new Date(Number(year), Number(month), 1);
    const monthEnd = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

    for (const region of ALL_REGIONS) {
      try {
        const { data: existing, error: fetchErr } = await supabase
          .from("apt_transactions")
          .select("complex_name, dong, area, floor, price, deal_date")
          .eq("region_code", region.code)
          .gte("deal_date", monthStart)
          .lt("deal_date", monthEnd);

        if (fetchErr) {
          errors++;
          errorDetails.push(`[기존조회실패] ${region.name} ${yearMonth}: ${fetchErr.message}`);
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

        const transactions = await fetchTransactionsForRegion(region.code, yearMonth);
        totalChecked += transactions.length;

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
            errors++;
            errorDetails.push(`[저장실패] ${region.name} ${yearMonth}: ${insertErr.message}`);
          } else {
            totalNew += newRows.length;
            log.push(`${region.name} ${yearMonth}: 신규 ${newRows.length}건`);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err: any) {
        errors++;
        errorDetails.push(`[예외] ${region.name} ${yearMonth}: ${err?.message ?? String(err)}`);
      }
    }
  }

  console.log(`[cron] 종료 — 확인 ${totalChecked}건, 신규 ${totalNew}건, 에러 ${errors}건`);
  if (errorDetails.length > 0) {
    console.error(`[cron] 에러 상세:`, errorDetails.slice(0, 5));
  }

  // ✅ 뷰 갱신
  let refreshOk = true;
  let refreshErrorMsg = "";
  const { error: refreshError } = await supabase.rpc("refresh_all_views");
  if (refreshError) {
    refreshOk = false;
    refreshErrorMsg = refreshError.message;
  }

  return NextResponse.json({
    success: true,
    envCheck,
    totalChecked,
    totalNew,
    errors,
    errorDetails: errorDetails.slice(0, 10), // 상위 10개만
    refreshOk,
    refreshErrorMsg,
    details: log,
    timestamp: new Date().toISOString(),
  });
}