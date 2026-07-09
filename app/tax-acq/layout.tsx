import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "취득세 계산기 2026",
  description:
    "2026년 기준 주택 취득세를 실거래가·주택 수·조정대상지역 여부에 따라 즉시 계산. 생애최초 취득세 감면(최대 300만원), 출산가구 감면(최대 500만원) 자동 반영. 법인·다주택 중과 포함.",
  keywords: [
    "취득세계산기", "취득세계산", "주택취득세", "생애최초취득세감면",
    "취득세감면", "다주택취득세", "조정대상지역취득세", "취득세중과",
    "출산취득세감면", "2026취득세",
  ],
  alternates: {
    canonical: "https://똑집.com/tax-acq",
  },
  openGraph: {
    title: "취득세 계산기 2026 | 생애최초·출산가구 감면 자동 반영 — 똑집",
    description:
      "주택 취득세를 주택 수·지역·가격에 따라 즉시 계산. 생애최초·출산가구 감면 자동 적용. 2026년 최신 기준.",
    url: "https://똑집.com/tax-acq",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
