// lib/getOrFetchLocations.ts
// ✅ 여러 단지의 좌표를 한번에 확보하는 함수
// 1. Supabase complex_locations 테이블에서 이미 있는 좌표는 그대로 사용 (캐시)
// 2. 없는 것만 네이버 Geocoding API로 새로 조회해서 저장
// → 매번 전체를 다시 지오코딩하지 않고, 신규 단지만 API 호출해서 비용/시간 절약

import { createClient } from "@supabase/supabase-js";
import { geocodeComplex } from "./geocoding";

type ComplexKey = {
  complexName: string;
  dong: string;
  regionName: string;
};

export type LocatedComplex = ComplexKey & {
  latitude: number | null;
  longitude: number | null;
};

export async function getOrFetchLocations(
  complexes: ComplexKey[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<LocatedComplex[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: LocatedComplex[] = [];

  for (const c of complexes) {
    // 1. 캐시 확인
    const { data: cached } = await supabase
      .from("complex_locations")
      .select("latitude, longitude, geocode_status")
      .eq("complex_name", c.complexName)
      .eq("dong", c.dong)
      .eq("region_name", c.regionName)
      .maybeSingle();

    if (cached && cached.geocode_status === "success") {
      results.push({ ...c, latitude: cached.latitude, longitude: cached.longitude });
      continue;
    }

    // 2. 캐시에 없거나 실패했던 경우 → 새로 지오코딩 시도
    const geo = await geocodeComplex(c.regionName, c.dong, c.complexName);

    await supabase.from("complex_locations").upsert({
      complex_name: c.complexName,
      dong: c.dong,
      region_name: c.regionName,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      geocode_status: geo ? "success" : "failed",
      updated_at: new Date().toISOString(),
    }, { onConflict: "complex_name,dong,region_name" });

    results.push({ ...c, latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null });

    // 네이버 API 과호출 방지용 짧은 딜레이
    await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}