// lib/geocoding.ts
// ✅ 단지 좌표 조회 로직 (v2 — 지역검색 API 우선 사용)
//
// 기존 문제: 네이버 Geocoding API(NCP)는 "정식 주소"만 인식하는 용도라,
//           "지역명+동+아파트명"을 붙여서 검색하면 아파트를 못 찾고
//           그 동의 대표 좌표(주민센터 등)로 잘못 매칭되는 문제가 있었음.
//
// 해결: 네이버 지역검색 API(Local Search, developers.naver.com)를 우선 사용.
//      이건 "장소/건물 이름"으로 검색하는 전용 API라 아파트 단지명 검색에 정확함.
//      실패 시에만 기존 Geocoding(동 단위)으로 fallback.

const NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";
const NAVER_GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";

type GeocodeResult = {
  latitude: number;
  longitude: number;
} | null;

// ✅ 1순위: 지역검색 API로 단지명 검색 (가장 정확)
async function searchLocalPlace(query: string): Promise<GeocodeResult> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[geocoding] 네이버 검색 API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const url = `${NAVER_LOCAL_SEARCH_URL}?query=${encodeURIComponent(query)}&display=1&sort=random`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!res.ok) {
      console.error(`[geocoding] 지역검색 API 응답 오류: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const first = data.items[0];
      // ✅ mapx/mapy는 좌표값에 10^7을 곱한 정수 형태로 옴 (경도*1e7, 위도*1e7)
      const longitude = parseInt(first.mapx, 10) / 10_000_000;
      const latitude = parseInt(first.mapy, 10) / 10_000_000;
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
    return null;
  } catch (err) {
    console.error("[geocoding] 지역검색 호출 실패:", err);
    return null;
  }
}

// ✅ 2순위(fallback): 정식 주소 기반 Geocoding — 동 단위까지만이라도 좌표 확보
async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const clientId = process.env.NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[geocoding] 네이버 지도 API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const res = await fetch(`${NAVER_GEOCODE_URL}?query=${encodeURIComponent(query)}`, {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
      },
    });

    if (!res.ok) {
      console.error(`[geocoding] Geocoding API 응답 오류: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.addresses && data.addresses.length > 0) {
      const first = data.addresses[0];
      return {
        latitude: parseFloat(first.y),
        longitude: parseFloat(first.x),
      };
    }
    return null;
  } catch (err) {
    console.error("[geocoding] Geocoding 호출 실패:", err);
    return null;
  }
}

// ✅ 단지 정보로 좌표 조회 — 지역검색(단지명) 우선, 실패시 Geocoding(동 단위) fallback
export async function geocodeComplex(
  regionName: string,
  dong: string,
  complexName: string
): Promise<GeocodeResult> {
  // 1차: 지역검색 API로 "지역+동+단지명" 검색 (가장 정확한 단지 위치)
  const localResult = await searchLocalPlace(`${regionName} ${dong} ${complexName}`);
  if (localResult) return localResult;

  // 2차: 단지명 없이 "지역+동"만으로 지역검색 재시도
  const localFallback = await searchLocalPlace(`${regionName} ${dong}`);
  if (localFallback) return localFallback;

  // 3차: 그래도 실패하면 기존 Geocoding으로 동 단위 좌표라도 확보
  return geocodeAddress(`${regionName} ${dong}`);
}