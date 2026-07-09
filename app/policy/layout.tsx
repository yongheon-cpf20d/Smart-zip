import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "부동산 정책 발표 모음 2026 — 국토부·금융위 최신 정책",
  description:
    "국토교통부·금융위원회 부동산 정책 발표를 한 곳에서. 규제지역 지정·해제, 대출 규제, 세제 개편, 청약 제도 변경 등 최신 정책 발표 타임라인.",
  keywords: [
    "부동산정책", "국토부정책", "금융위정책", "부동산정책발표",
    "규제지역변경", "대출규제정책", "세제개편", "청약제도변경",
    "2026부동산정책",
  ],
  openGraph: {
    title: "부동산 정책 발표 모음 2026 | 국토부·금융위 최신 정책 — 똑집",
    description:
      "국토부·금융위 부동산 정책 발표를 한 곳에서. 규제·대출·세제·청약 제도 변경 타임라인.",
    url: "https://xn--b71bo88a.com/policy",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
