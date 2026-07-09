import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "아파트 실거래 분석 2026 — 단지별 거래 추이·환금성 조회",
  description:
    "서울·경기 아파트 단지별 최근 24개월 실거래 추이 그래프, 월별 거래건수, 평형별 환금성(거래건수/세대수) 자동 계산. 국토교통부 실거래가 데이터 기반.",
  keywords: [
    "아파트실거래분석", "아파트거래추이", "아파트환금성", "단지별실거래",
    "아파트매매통계", "실거래가그래프", "서울아파트거래", "경기아파트거래",
    "아파트유동성", "부동산데이터분석",
  ],
  alternates: {
    canonical: "https://똑집.com/apt-trade",
  },
  openGraph: {
    title: "아파트 실거래 분석 | 단지별 거래 추이·환금성 — 똑집",
    description:
      "서울·경기 아파트 단지별 실거래 추이와 평형별 환금성을 한눈에. 국토교통부 실거래가 데이터 기반.",
    url: "https://똑집.com/apt-trade",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
