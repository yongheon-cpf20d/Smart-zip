import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "부동산 순수익 계산기 2026",
  description:
    "아파트·빌라 임대 투자 시 실질 수익률 계산. 취득세·보유세·대출이자·공실률·관리비 차감 후 순임대수익률과 레버리지 수익률(ROI) 자동 산출. 부동산 투자 수익성 분석.",
  keywords: [
    "부동산수익률계산기", "임대수익률계산기", "투자수익률계산", "순임대수익률",
    "아파트투자수익", "레버리지수익률", "부동산ROI", "월세수익률계산",
    "투자부동산계산기",
  ],
  openGraph: {
    title: "부동산 순수익 계산기 | 임대 투자 실질 수익률 분석 — 똑집",
    description:
      "취득세·보유세·이자·공실 모두 차감한 실질 임대 수익률과 레버리지 ROI를 즉시 계산.",
    url: "https://xn--b71bo88a.com/asset-sim",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
