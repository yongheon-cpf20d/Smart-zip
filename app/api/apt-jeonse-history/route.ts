import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.RTMS_API_KEY ?? "";
const BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

function normName(name: string): string {
  return name
    .trim()
    .replace(/\s*(아파트|APT|apt)$/i, "")
    .replace(/\([^)]*\)$/, "")
    .replace(/\s+/g, "")   // 공백 전부 제거
    .toLowerCase();
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sigunguCode = sp.get("sigunguCode") ?? "";
  const aptName = sp.get("aptName") ?? "";
  const months = Math.min(parseInt(sp.get("months") ?? "24"), 36);

  if (!sigunguCode || !aptName) {
    return NextResponse.json({ error: "params required" }, { status: 400 });
  }

  const normAptName = normName(aptName);

  const now = new Date();
  const monthList: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthList.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const debug = sp.get("debug") === "1";

  if (debug) {
    const ym = monthList[monthList.length - 1];
    const url = `${BASE}?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=${sigunguCode}&DEAL_YMD=${ym}&pageNo=1&numOfRows=20&_type=json`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      const raw = json?.response?.body?.items?.item ?? json?.response?.body?.items ?? [];
      const all = Array.isArray(raw) ? raw : [raw];
      const sample = all.slice(0, 3);
      return NextResponse.json({ ym, aptName, normAptName, totalInMonth: all.length, sample });
    } catch {
      return NextResponse.json({ raw: text.slice(0, 500) });
    }
  }

  const results = await Promise.all(
    monthList.map(async (ym) => {
      try {
        const url = `${BASE}?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=${sigunguCode}&DEAL_YMD=${ym}&pageNo=1&numOfRows=1000&_type=json`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const json = await res.json();
        const raw = json?.response?.body?.items?.item ?? [];
        const all = Array.isArray(raw) ? raw : (raw && typeof raw === "object" && "aptNm" in raw ? [raw] : []);
        return {
          ym,
          // 전세만 (월세금액 = 0 또는 없는 경우)
          items: all.filter((x: { aptNm: string; monthlyRent?: string | number }) =>
            normName(x.aptNm) === normAptName &&
            (!x.monthlyRent || x.monthlyRent === 0 || x.monthlyRent === "0")
          ),
        };
      } catch {
        return { ym, items: [] };
      }
    })
  );

  return NextResponse.json(results);
}
