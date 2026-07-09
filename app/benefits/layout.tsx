import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "부동산 정책 지원 2026 — 디딤돌·신생아특례·보금자리론·청약특공",
  description:
    "2026년 정책모기지(디딤돌대출·신생아특례대출·보금자리론) 조건 및 한도, 생애최초·출산가구 취득세 감면, 신혼부부·생애최초·신생아 청약 특별공급 자격 한눈에 정리.",
  keywords: [
    "디딤돌대출", "신생아특례대출", "보금자리론", "정책모기지",
    "생애최초취득세감면", "신혼부부특별공급", "생애최초특별공급",
    "신생아특별공급", "청약특공", "부동산정책지원2026",
  ],
  openGraph: {
    title: "부동산 정책 지원 2026 | 디딤돌·신생아특례·청약특공 정리 — 똑집",
    description:
      "2026년 정책모기지·취득세 감면·청약 특별공급 자격 조건을 한눈에 정리. 신청 전 꼭 확인하세요.",
    url: "https://xn--b71bo88a.com/benefits",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
