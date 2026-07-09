import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.RTMS_API_KEY ?? "";
const BASE = "https://apis.data.go.kr/1613000/AptListService3";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("sigunguCode") ?? "";
  if (!code) return NextResponse.json([], { status: 400 });

  try {
    const url = `${BASE}/getSigunguAptList3?serviceKey=${encodeURIComponent(API_KEY)}&sigunguCode=${code}&numOfRows=3000&pageNo=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const json = await res.json();
    const raw = json?.response?.body?.items?.item ?? [];
    const items: { kaptCode: string; kaptName: string }[] = Array.isArray(raw) ? raw : (raw?.kaptCode ? [raw] : []);
    items.sort((a, b) => a.kaptName.localeCompare(b.kaptName));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
