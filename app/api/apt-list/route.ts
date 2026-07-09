import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.RTMS_API_KEY ?? "";
const BASE = "https://apis.data.go.kr/1613000/AptListService3";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("sigunguCode") ?? "";
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (!code) return NextResponse.json([], { status: 400 });

  try {
    const url = `${BASE}/getSigunguAptList3?serviceKey=${encodeURIComponent(API_KEY)}&sigunguCode=${code}&numOfRows=3000&pageNo=1&_type=json`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    if (debug) return NextResponse.json({ status: res.status, raw: text.slice(0, 2000) });

    let json: unknown;
    try { json = JSON.parse(text); } catch {
      return NextResponse.json({ error: "xml-response", preview: text.slice(0, 300) }, { status: 502 });
    }

    const body = (json as { response?: { body?: { items?: unknown } } })?.response?.body;
    const raw = body?.items ?? [];
    const items: { kaptCode: string; kaptName: string }[] = Array.isArray(raw) ? raw : (raw && typeof raw === "object" && "kaptCode" in raw ? [raw as { kaptCode: string; kaptName: string }] : []);
    items.sort((a, b) => a.kaptName.localeCompare(b.kaptName));
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
