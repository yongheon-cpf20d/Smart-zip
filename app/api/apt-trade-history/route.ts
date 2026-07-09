import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.RTMS_API_KEY ?? "";
const BASE = "https://apis.data.go.kr/1613000/RTMSOBJSvc/getRTMSDataSvcAptTradeDev";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sigunguCode = sp.get("sigunguCode") ?? "";
  const aptName = sp.get("aptName") ?? "";
  const months = Math.min(parseInt(sp.get("months") ?? "24"), 36);

  if (!sigunguCode || !aptName) {
    return NextResponse.json({ error: "params required" }, { status: 400 });
  }

  // 최근 N개월 목록 (오래된 순)
  const now = new Date();
  const monthList: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthList.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const results = await Promise.all(
    monthList.map(async (ym) => {
      try {
        const url = `${BASE}?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=${sigunguCode}&DEAL_YMD=${ym}&pageNo=1&numOfRows=1000`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const json = await res.json();
        const raw = json?.response?.body?.items?.item ?? [];
        const all = Array.isArray(raw) ? raw : (raw?.아파트 ? [raw] : []);
        return {
          ym,
          items: all.filter((x: { 아파트: string }) => x.아파트 === aptName),
        };
      } catch {
        return { ym, items: [] };
      }
    })
  );

  return NextResponse.json(results);
}
