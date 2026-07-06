// app/api/locations/route.ts
// ✅ 클라이언트가 단지 목록을 보내면, 서버에서 좌표를 확보(캐시+신규조회)해서 반환
// NAVER_MAP_CLIENT_SECRET은 서버 전용 키라 클라이언트에서 직접 호출하면 안 되므로
// 이 API Route를 경유해서 안전하게 처리

import { NextRequest, NextResponse } from "next/server";
import { getOrFetchLocations } from "@/lib/getOrFetchLocations";

export async function POST(request: NextRequest) {
  try {
    const { complexes } = await request.json();

    if (!Array.isArray(complexes) || complexes.length === 0) {
      return NextResponse.json({ locations: [] });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const locations = await getOrFetchLocations(complexes, supabaseUrl, supabaseKey);

    return NextResponse.json({ locations });
  } catch (err: any) {
    console.error("[api/locations] 오류:", err);
    return NextResponse.json({ error: err?.message ?? "unknown error" }, { status: 500 });
  }
}