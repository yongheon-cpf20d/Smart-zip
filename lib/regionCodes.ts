// ✅ 출처: 행정표준코드관리시스템(www.code.go.kr) 법정동코드 앞 5자리 (시군구 단위)
// 국토교통부 아파트매매 실거래자료 API 호출 시 LAWD_CD 파라미터로 사용
// 코드 변경(행정구역 개편)이 있을 경우 이 파일만 수정하면 전체 반영됨

export type RegionCode = {
  code: string; // 법정동코드 앞 5자리
  name: string; // 표시용 이름
};

// ── 서울특별시 25개 자치구 ──
export const SEOUL_REGIONS: RegionCode[] = [
  { code: "11110", name: "서울 종로구" },
  { code: "11140", name: "서울 중구" },
  { code: "11170", name: "서울 용산구" },
  { code: "11200", name: "서울 성동구" },
  { code: "11215", name: "서울 광진구" },
  { code: "11230", name: "서울 동대문구" },
  { code: "11260", name: "서울 중랑구" },
  { code: "11290", name: "서울 성북구" },
  { code: "11305", name: "서울 강북구" },
  { code: "11320", name: "서울 도봉구" },
  { code: "11350", name: "서울 노원구" },
  { code: "11380", name: "서울 은평구" },
  { code: "11410", name: "서울 서대문구" },
  { code: "11440", name: "서울 마포구" },
  { code: "11470", name: "서울 양천구" },
  { code: "11500", name: "서울 강서구" },
  { code: "11530", name: "서울 구로구" },
  { code: "11545", name: "서울 금천구" },
  { code: "11560", name: "서울 영등포구" },
  { code: "11590", name: "서울 동작구" },
  { code: "11620", name: "서울 관악구" },
  { code: "11650", name: "서울 서초구" },
  { code: "11680", name: "서울 강남구" },
  { code: "11710", name: "서울 송파구" },
  { code: "11740", name: "서울 강동구" },
];

// ── 경기도 31개 시군 (일부 시는 구 단위로 세분화됨: 수원/성남/안양/안산/고양/용인/부천/화성) ──
export const GYEONGGI_REGIONS: RegionCode[] = [
  { code: "41111", name: "수원 장안구" },
  { code: "41113", name: "수원 권선구" },
  { code: "41115", name: "수원 팔달구" },
  { code: "41117", name: "수원 영통구" },
  { code: "41131", name: "성남 수정구" },
  { code: "41133", name: "성남 중원구" },
  { code: "41135", name: "성남 분당구" },
  { code: "41150", name: "의정부시" },
  { code: "41171", name: "안양 만안구" },
  { code: "41173", name: "안양 동안구" },
  { code: "41190", name: "부천시" },
  { code: "41210", name: "광명시" },
  { code: "41220", name: "평택시" },
  { code: "41250", name: "동두천시" },
  { code: "41271", name: "안산 상록구" },
  { code: "41273", name: "안산 단원구" },
  { code: "41281", name: "고양 덕양구" },
  { code: "41285", name: "고양 일산동구" },
  { code: "41287", name: "고양 일산서구" },
  { code: "41290", name: "과천시" },
  { code: "41310", name: "구리시" },
  { code: "41360", name: "남양주시" },
  { code: "41370", name: "오산시" },
  { code: "41390", name: "시흥시" },
  { code: "41410", name: "군포시" },
  { code: "41430", name: "의왕시" },
  { code: "41450", name: "하남시" },
  { code: "41461", name: "용인 처인구" },
  { code: "41463", name: "용인 기흥구" },
  { code: "41465", name: "용인 수지구" },
  { code: "41480", name: "파주시" },
  { code: "41500", name: "이천시" },
  { code: "41550", name: "안성시" },
  { code: "41570", name: "김포시" },
  { code: "41590", name: "화성시" },
  { code: "41610", name: "광주시" },
  { code: "41630", name: "양주시" },
  { code: "41650", name: "포천시" },
  { code: "41670", name: "여주시" },
  { code: "41800", name: "연천군" },
  { code: "41820", name: "가평군" },
  { code: "41830", name: "양평군" },
];

export const ALL_REGIONS: RegionCode[] = [...SEOUL_REGIONS, ...GYEONGGI_REGIONS];