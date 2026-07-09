import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "양도세 계산기 2026",
  description:
    "주택 양도소득세를 보유기간·거주기간·주택 수에 따라 자동 계산. 1세대 1주택 비과세(12억), 장기보유특별공제 최대 80%, 다주택자 중과(2026 한시 완화) 반영. 무료 양도세 계산기.",
  keywords: [
    "양도세계산기", "양도소득세계산기", "주택양도세", "1주택양도세비과세",
    "장기보유특별공제", "양도세중과", "다주택양도세", "양도세계산",
    "2026양도세", "집팔때세금계산",
  ],
  alternates: {
    canonical: "https://똑집.com/tax-sell",
  },
  openGraph: {
    title: "양도세 계산기 2026 | 1주택 비과세·장기보유특별공제 자동 반영 — 똑집",
    description:
      "보유기간·거주기간·주택 수 입력으로 양도소득세 즉시 계산. 1세대 1주택 비과세 12억, 장특공 최대 80% 자동 적용.",
    url: "https://똑집.com/tax-sell",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
