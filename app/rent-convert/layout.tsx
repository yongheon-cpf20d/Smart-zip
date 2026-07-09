import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전월세 전환 계산기 2026 — 전세→월세·월세→전세 즉시 환산",
  description:
    "전세금을 월세로, 월세를 전세금으로 즉시 환산. 법정 전월세전환율(기준금리 2.75%+2%p=4.75%) 자동 반영. 전환율 슬라이더로 협상 시나리오 비교 가능. 주택임대차보호법 기준.",
  keywords: [
    "전월세전환계산기", "전세월세환산", "월세전세환산", "전월세전환율",
    "전세월세계산기", "전월세계산기", "법정전환율", "전세금환산",
    "월세보증금계산", "전월세전환",
  ],
  openGraph: {
    title: "전월세 전환 계산기 2026 | 전세↔월세 즉시 환산 — 똑집",
    description:
      "전세금↔월세를 법정 전환율(4.75%) 기준으로 즉시 환산. 협상 시나리오 전환율 조절 가능.",
    url: "https://xn--b71bo88a.com/rent-convert",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
