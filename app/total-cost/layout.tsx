import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "주택 구입 총비용 계산기 2026",
  description:
    "집 살 때 드는 모든 비용을 한 번에 계산. 매매가·취득세·중개보수·인테리어·이사비·대출 실행 비용까지 포함한 실전 총비용 계산기. 예상보다 얼마나 더 드는지 미리 확인하세요.",
  keywords: [
    "주택총비용계산기", "집살때비용", "취득세중개비", "부동산총비용",
    "집구입비용계산", "아파트구입비용", "인테리어비용포함", "실비용계산",
  ],
  alternates: {
    canonical: "https://똑집.com/total-cost",
  },
  openGraph: {
    title: "주택 구입 총비용 계산기 | 취득세·중개비·인테리어 포함 — 똑집",
    description:
      "집 살 때 드는 취득세, 중개보수, 인테리어, 이사비를 모두 합산한 실전 총비용 계산기.",
    url: "https://똑집.com/total-cost",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
