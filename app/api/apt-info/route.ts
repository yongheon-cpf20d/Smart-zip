import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.RTMS_API_KEY ?? "";
const BASE = "https://apis.data.go.kr/1613000/AptBasisInfoServiceV4";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("kaptCode") ?? "";
  if (!code) return NextResponse.json({}, { status: 400 });

  try {
    const url = `${BASE}/getAphusBassInfoV4?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${code}&_type=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const json = await res.json();
    return NextResponse.json(json?.response?.body?.item ?? {});
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
