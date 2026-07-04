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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const months = getRecentTwoMonths();
  let totalNew = 0;
  let totalChecked = 0;
  let errors = 0;
  const log: string[] = [];

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
          } else {
            totalNew += newRows.length;
            log.push(`${region.name} ${yearMonth}: 신규 ${newRows.length}건`);
          }
        }

        // Vercel 함수 5분 제한 안에 끝내기 위해 딜레이 최소화
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        errors++;
      }
    }
  }

  // ✅ 뷰 갱신
  let refreshOk = true;
  const { error: refreshError } = await supabase.rpc("refresh_all_views");
  if (refreshError) {
    refreshOk = false;
  }

  return NextResponse.json({
    success: true,
    totalChecked,
    totalNew,
    errors,
    refreshOk,
    details: log,
    timestamp: new Date().toISOString(),
  });
}