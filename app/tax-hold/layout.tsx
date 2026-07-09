import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "보유세 계산기 2026",
  description:
    "공시가격 기준 재산세와 종합부동산세(종부세)를 한 번에 계산. 1주택·다주택 세율, 고령자·장기보유 공제, 2026년 공정시장가액비율 자동 반영. 무료 보유세 계산기.",
  keywords: [
    "보유세계산기", "재산세계산기", "종부세계산기", "종합부동산세계산기",
    "재산세계산", "종부세계산", "공시가격보유세", "1주택종부세",
    "다주택종부세", "보유세", "2026종부세",
  ],
  alternates: {
    canonical: "https://똑집.com/tax-hold",
  },
  openGraph: {
    title: "보유세 계산기 2026 | 재산세·종부세 합산 계산 — 똑집",
    description:
      "공시가격 입력 하나로 재산세와 종합부동산세를 즉시 계산. 1주택 비과세 기준, 고령자·장기보유 공제 자동 반영.",
    url: "https://똑집.com/tax-hold",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
