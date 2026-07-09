import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "주담대 계산기 2026",
  description:
    "주택담보대출 월 상환액을 원리금균등·원금균등·체증식 방식으로 즉시 계산. 연차별 원금·이자 구성, DSR 자동 산출, 2026년 스트레스 금리 반영. 무료 주담대 계산기.",
  keywords: [
    "주담대계산기", "주택담보대출계산기", "원리금균등상환계산기",
    "이자계산기", "대출이자계산기", "주담대이자계산", "체증식상환",
    "원금균등상환", "대출월납부액", "주택대출계산",
  ],
  openGraph: {
    title: "주담대 계산기 2026 | 원리금·이자 월 납부액 즉시 계산 — 똑집",
    description:
      "원리금균등·원금균등·체증식 방식별 월 납부액, 연차별 원금·이자 구성을 한눈에. 무료 주택담보대출 계산기.",
    url: "https://xn--b71bo88a.com/loan",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
