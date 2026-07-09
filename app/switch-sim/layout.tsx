import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "갈아타기 계산기 2026",
  description:
    "현재 집 매도 후 새 집 매수 시 갈아타기 손익을 시뮬레이션. 양도세·취득세·중개보수·이사비 차감 후 실제 순자산 변화 계산. 선매도·선매수 시나리오 비교.",
  keywords: [
    "갈아타기계산기", "갈아타기시뮬레이션", "주택갈아타기", "집바꾸기비용",
    "선매도선매수", "갈아타기세금", "갈아타기손익", "주택교체비용",
  ],
  alternates: {
    canonical: "https://똑집.com/switch-sim",
  },
  openGraph: {
    title: "갈아타기 계산기 2026 | 매도·매수 순서별 손익 시뮬레이션 — 똑집",
    description:
      "현재 집 팔고 새 집 살 때 양도세·취득세·이사비 포함 실제 순자산 변화를 시뮬레이션.",
    url: "https://똑집.com/switch-sim",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
