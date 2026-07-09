import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DSR 계산기 2026",
  description:
    "내 연봉 기준 DSR 한도와 최대 대출 가능액을 즉시 계산. 스트레스 DSR 3단계(+1.5%p) 자동 적용, 주담대·신용대출 합산 산출. 2026년 최신 기준 무료 DSR 계산기.",
  keywords: [
    "DSR계산기", "총부채원리금상환비율", "DSR한도계산", "대출가능금액",
    "스트레스DSR", "주담대한도", "DSR40", "DSR50", "대출한도계산기",
  ],
  openGraph: {
    title: "DSR 계산기 2026 | 스트레스 DSR 반영 대출 한도 계산 — 똑집",
    description:
      "연봉 입력 하나로 DSR 40%·50% 기준 최대 대출 한도 즉시 계산. 스트레스 DSR 3단계 자동 반영.",
    url: "https://xn--b71bo88a.com/dsr",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
