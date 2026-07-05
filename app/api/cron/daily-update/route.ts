// app/api/cron/daily-update/route.ts
// ✅ Vercel Cron이 매일 자동으로 호출하는 API 엔드포인트 (v2 — 월 단위로 분할 실행)
//
// 문제: 이번달+지난달 x 서울/경기(67개 지역) = 134개 조합을 한 번에 처리하면
//      Vercel Hobby 플랜의 함수 실행시간 상한(5분)을 넘겨서 타임아웃 발생.
// 해결: ?which=current 또는 ?which=prev 쿼리파라미터로 "이번달만" 또는
//      "지난달만" 처리하도록 분리. vercel.json에서 각각 다른 시각에 호출하면
//      한 번에 처리하는 지역 수가 67개로 줄어서 훨씬 빨리 끝남.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ALL_REGIONS } from "@/lib/regionCodes";
import { fetchTransactionsForRegion } from "@/lib/fetchTransactions";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function getRecentTwoMonths(): { prev: string; current: string } {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  return { prev: prevMonth, current: thisMonth };
}

function makeTxKey(t: {
  complexName: string; dong: string; area: number; floor: number; price: number; dealDate: string;
}): string {
  const roundedArea = Math.round(t.area * 100) / 100;
  return `${t.complexName}|${t.dong}|${roundedArea}|${t.floor}|${t.price}|${t.dealDate}`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // ✅ 이번달/지난달 중 하나만 처리 (쿼리파라미터로 지정, 기본값 current)
  const which = request.nextUrl.searchParams.get("which") ?? "current";
  const { prev, current } = getRecentTwoMonths();
  const yearMonth = which === "prev" ? prev : current;

  if (!ALL_REGIONS || ALL_REGIONS.length === 0) {
    return NextResponse.json({
      error: "ALL_REGIONS 로드 실패 — 배열이 비어있음",
      regionsLength: ALL_REGIONS?.length ?? "undefined",
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalNew = 0;
  let totalChecked = 0;
  let errors = 0;
  const log: string[] = [];
  const errorDetails: string[] = [];

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
      // 딜레이 제거 — Vercel 서버는 국토부 API 자체 응답시간이 병목이라 추가 딜레이 불필요
    } catch (err: any) {
      errors++;
      errorDetails.push(`[예외] ${region.name} ${yearMonth}: ${err?.message ?? String(err)}`);
    }
  }

  // ✅ 뷰 갱신은 "지난달(prev)" 처리 때 실행
  //    (지난달은 이미 수집된 데이터가 많아 신규 건수가 적고 처리시간이 짧아,
  //     뷰 갱신까지 5분 안에 끝낼 여유시간이 더 많음)
  let refreshOk = true;
  let refreshErrorMsg = "";
  if (which === "prev") {
    const { error: refreshError } = await supabase.rpc("refresh_all_views");
    if (refreshError) {
      refreshOk = false;
      refreshErrorMsg = refreshError.message;
    }
  }

  return NextResponse.json({
    success: true,
    which,
    yearMonth,
    envCheck,
    totalChecked,
    totalNew,
    errors,
    errorDetails: errorDetails.slice(0, 10),
    refreshOk,
    refreshErrorMsg,
    details: log,
    timestamp: new Date().toISOString(),
  });
}