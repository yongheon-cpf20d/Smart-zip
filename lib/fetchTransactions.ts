// ✅ 국토교통부 아파트매매 실거래자료 API 연동 로직
// 출처: 공공데이터포털 - 국토교통부_아파트 매매 실거래가 자료
// https://www.data.go.kr/data/15126469/openapi.do
//
// API는 XML로 응답하며, LAWD_CD(법정동코드 5자리) + DEAL_YMD(계약년월 6자리)로 조회
// 인증키는 .env.local에 RTMS_API_KEY로 저장 (디코딩된 키 사용 권장)

import { XMLParser } from "fast-xml-parser";
import { ALL_REGIONS, RegionCode } from "./regionCodes";

const API_BASE_URL =
  "http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

export type RawTransaction = {
  거래금액: string; // "120,000" 형태 (만원 단위, 콤마 포함)
  건축년도: string;
  년: string;
  월: string;
  일: string;
  법정동: string;
  아파트: string; // 단지명
  전용면적: string;
  지번: string;
  지역코드: string;
  층: string;
  해제여부?: string; // "O"면 거래 취소
  거래유형?: string;
};

export type ParsedTransaction = {
  regionName: string;
  regionCode: string;
  dong: string; // 법정동
  complexName: string; // 단지명
  area: number; // 전용면적(㎡)
  floor: number;
  price: number; // 거래금액(원 단위로 환산)
  dealDate: string; // YYYY-MM-DD
  buildYear: number;
  isCancelled: boolean;
};

/**
 * 특정 지역(법정동코드) + 계약년월의 실거래 데이터를 가져온다.
 * @param regionCode 법정동코드 5자리
 * @param dealYearMonth 계약년월 6자리 (예: "202506")
 */
export async function fetchTransactionsForRegion(
  regionCode: string,
  dealYearMonth: string
): Promise<ParsedTransaction[]> {
  const apiKey = process.env.RTMS_API_KEY;
  if (!apiKey) {
    throw new Error("RTMS_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const url = `${API_BASE_URL}?serviceKey=${apiKey}&LAWD_CD=${regionCode}&DEAL_YMD=${dealYearMonth}&numOfRows=1000&pageNo=1`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`API 호출 실패: ${res.status} ${res.statusText} (지역: ${regionCode})`);
  }

  const xmlText = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xmlText);

  // 응답 구조: response.body.items.item (배열 또는 단일 객체)
  const resultCode = parsed?.response?.header?.resultCode;
  if (resultCode && resultCode !== "00") {
    const resultMsg = parsed?.response?.header?.resultMsg ?? "알 수 없는 오류";
    throw new Error(`API 오류 (${resultCode}): ${resultMsg} (지역: ${regionCode})`);
  }

  const items = parsed?.response?.body?.items?.item;
  if (!items) return [];

  const itemArray: RawTransaction[] = Array.isArray(items) ? items : [items];

  const regionInfo = ALL_REGIONS.find((r) => r.code === regionCode);

  return itemArray.map((item) => parseRawTransaction(item, regionInfo));
}

function parseRawTransaction(item: RawTransaction, regionInfo?: RegionCode): ParsedTransaction {
  const priceWon = Number(String(item.거래금액).replace(/,/g, "").trim()) * 10000; // 만원 -> 원
  const year = Number(item.년);
  const month = Number(item.월);
  const day = Number(item.일);
  const dealDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    regionName: regionInfo?.name ?? item.지역코드,
    regionCode: item.지역코드,
    dong: item.법정동?.trim() ?? "",
    complexName: item.아파트?.trim() ?? "",
    area: Number(item.전용면적),
    floor: Number(item.층),
    price: priceWon,
    dealDate,
    buildYear: Number(item.건축년도),
    isCancelled: item.해제여부 === "O",
  };
}

/**
 * 서울+경기 전체 지역의 당월 실거래 데이터를 가져온다.
 * API rate limit을 고려해 순차 호출 + 약간의 딜레이를 둔다.
 */
export async function fetchAllRegionsTransactions(
  dealYearMonth: string
): Promise<ParsedTransaction[]> {
  const allResults: ParsedTransaction[] = [];

  for (const region of ALL_REGIONS) {
    try {
      const transactions = await fetchTransactionsForRegion(region.code, dealYearMonth);
      allResults.push(...transactions);
      // API 과호출 방지를 위한 딜레이 (공공데이터포털 권장: 초당 트래픽 제한 있음)
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (err) {
      // 한 지역 실패해도 전체 작업은 계속 진행 (로그만 남김)
      console.error(`[실거래가] ${region.name}(${region.code}) 조회 실패:`, err);
    }
  }

  return allResults;
}