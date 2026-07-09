import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전세 vs 매매 비교 계산기 2026 — 손익분기 연차 자동 계산",
  description:
    "전세와 매매 중 어느 쪽이 유리한지 즉시 비교. 취득세·대출이자·재산세·양도세·집값상승률 반영 20년 시뮬레이션, 손익분기 연차 자동 계산. 전세 기회비용 포함 풀버전 분석.",
  keywords: [
    "전세매매비교", "전세vs매매", "전세매매계산기", "매매전세비교계산기",
    "전세매매손익", "집살까전세살까", "손익분기계산", "전세기회비용",
    "부동산비교계산기", "매매전세차이",
  ],
  alternates: {
    canonical: "https://똑집.com/compare",
  },
  openGraph: {
    title: "전세 vs 매매 비교 계산기 | 손익분기 연차 자동 계산 — 똑집",
    description:
      "취득세·이자·재산세·양도세와 집값 상승률 반영 20년 시뮬레이션. 몇 년 보유해야 매매가 유리한지 즉시 계산.",
    url: "https://똑집.com/compare",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
