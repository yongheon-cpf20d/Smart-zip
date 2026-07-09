import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서울·경기 대장 아파트 — 지역별 시세 1위 랭킹",
  description:
    "서울 25개 구·경기 주요 지역별 시세 최고가 대장 아파트 랭킹. 평형별 실거래 가격, 지도로 위치 확인. 국토교통부 실거래가 기반 데이터 매일 업데이트.",
  keywords: [
    "대장아파트", "서울대장아파트", "강남대장아파트", "지역별최고가아파트",
    "서울아파트랭킹", "경기아파트순위", "고가아파트순위", "아파트시세순위",
    "부동산랭킹", "아파트가격순위",
  ],
  alternates: {
    canonical: "https://똑집.com/top-apt",
  },
  openGraph: {
    title: "서울·경기 대장 아파트 랭킹 | 지역별 시세 1위 — 똑집",
    description:
      "서울 25개 구·경기 지역별 시세 최고가 대장 아파트. 평형별 가격, 지도로 위치 확인.",
    url: "https://똑집.com/top-apt",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
