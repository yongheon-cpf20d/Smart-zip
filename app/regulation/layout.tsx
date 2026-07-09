import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "부동산 규제지역 현황 2026 — 투기과열·조정대상·토지거래허가구역",
  description:
    "2026년 7월 기준 부동산 규제지역 현황. 투기과열지구·조정대상지역·토지거래허가구역 지도, LTV·DSR·취득세 중과·청약 규제 요약. 스트레스 DSR 3단계 현황 포함.",
  keywords: [
    "투기과열지구", "조정대상지역", "규제지역", "토지거래허가구역",
    "부동산규제", "LTV규제", "청약규제", "2026규제지역",
    "서울규제지역", "규제현황",
  ],
  openGraph: {
    title: "부동산 규제지역 현황 2026 | 투기과열·조정대상 지도 — 똑집",
    description:
      "2026년 최신 투기과열지구·조정대상지역·토지거래허가구역 지도와 LTV·취득세·청약 규제 요약.",
    url: "https://xn--b71bo88a.com/regulation",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
