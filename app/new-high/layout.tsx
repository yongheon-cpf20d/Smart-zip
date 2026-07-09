import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘의 신고가 — 서울·경기 아파트 실거래 최고가",
  description:
    "국토교통부 실거래가 데이터 기반 서울·경기 아파트 당일 신고가 매일 업데이트. 지역별 신고가 순위, 이전 최고가 대비 상승액 확인. 신고가 카드 이미지 저장 기능 제공.",
  keywords: [
    "아파트신고가", "오늘신고가", "서울아파트신고가", "경기아파트신고가",
    "실거래신고가", "부동산신고가", "아파트최고가", "실거래가조회",
    "국토부실거래가", "신고가알림",
  ],
  alternates: {
    canonical: "https://똑집.com/new-high",
  },
  openGraph: {
    title: "오늘의 신고가 | 서울·경기 아파트 실거래 최고가 실시간 — 똑집",
    description:
      "국토교통부 실거래가 API 기반 서울·경기 아파트 신고가를 매일 업데이트. 지역별 신고가 순위 확인.",
    url: "https://똑집.com/new-high",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
