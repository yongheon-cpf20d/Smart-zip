import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.RTMS_API_KEY ?? "";
const BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sigunguCode = sp.get("sigunguCode") ?? "";
  const aptName = sp.get("aptName") ?? "";
  const months = Math.min(parseInt(sp.get("months") ?? "24"), 36);

  if (!sigunguCode || !aptName) {
    return NextResponse.json({ error: "params required" }, { status: 400 });
  }

  /** 단지명 정규화: 공백·'아파트'·괄호 제거 후 소문자 비교 */
  function normName(name: string): string {
    return name
      .trim()
      .replace(/\s*(아파트|APT|apt)$/i, "")
      .replace(/\([^)]*\)$/, "")
      .replace(/\s+/g, "")   // 공백 전부 제거 (API마다 공백 표기 다름)
      .toLowerCase();
  }
  const normAptName = normName(aptName);
  const nameMatch = (a: string) => {
    const n = normName(a);
    return n === normAptName || normAptName.endsWith(n) || n.endsWith(normAptName);
  };

  // 최근 N개월 목록 (오래된 순)
  const now = new Date();
  const monthList: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthList.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const debug = sp.get("debug") === "1";

  // 최근 1개월만 디버그용으로 먼저 확인
  if (debug) {
    const ym = monthList[monthList.length - 1];
    const url = `${BASE}?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=${sigunguCode}&DEAL_YMD=${ym}&pageNo=1&numOfRows=1000&_type=json`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      const raw = json?.response?.body?.items?.item ?? json?.response?.body?.items ?? [];
      const all = Array.isArray(raw) ? raw : [raw];
      const uniqueNames = [...new Set(all.map((x: { aptNm: string }) => x.aptNm))].sort();
      const sample = all.slice(0, 3).map((x: Record<string, unknown>) => ({ aptNm: x["aptNm"], excluUseAr: x["excluUseAr"], dealAmount: x["dealAmount"] }));
      return NextResponse.json({ ym, aptName, normAptName, totalInMonth: all.length, uniqueNames, sample, matched: all.filter((x: { aptNm: string }) => normName(x["aptNm"]) === normAptName).length });
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
          items: all.filter((x: { aptNm: string }) => nameMatch(x.aptNm)),
        };
      } catch {
        return { ym, items: [] };
      }
    })
  );

  return NextResponse.json(results);
}
