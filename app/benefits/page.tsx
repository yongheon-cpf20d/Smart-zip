"use client";

import Link from "next/link";

// ✅ 정보 출처: 한국주택금융공사(HF) 디딤돌/보금자리론 상품안내(2026.06.22 기준 고시),
//    주택도시기금 포털, 주택공급에 관한 규칙, LH청약플러스, 뉴:홈, 지방세법 제36조의3·제36조의5
// 정책은 자주 바뀌므로 이 파일의 데이터 배열만 수정하면 화면에 바로 반영됨.
// 2026.06 기준 최신 정보로 작성. 실제 신청 전 반드시 기금e든든/청약홈 공고문으로 재확인 필요.

type CardColor = "emerald" | "blue" | "violet";

const colorMap: Record<CardColor, { bg: string; border: string; text: string; badge: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
  },
};

// ── 1. 대출 (정책모기지) ──
const loanBenefits = [
  {
    title: "내집마련 디딤돌대출",
    target: "부부합산 연소득 6천만원 이하 (생애최초·2자녀 이상 7천만원, 신혼가구 8.5천만원 이하)",
    points: [
      "대출한도: 일반 2억원 / 생애최초 2.4억원 / 신혼·2자녀 이상 3.2억원",
      "LTV 70% (생애최초는 80%, 단 수도권·규제지역은 70%)",
      "고정금리 또는 변동금리, 우대금리 중복 적용 시 최대 0.5~0.7%p",
      "1개월 내 전입 후 2년 이상 실거주 의무",
    ],
  },
  {
    title: "신생아 특례 디딤돌대출",
    target: "2023.1.1. 이후 출생(입양 포함) 자녀가 있는 무주택 세대",
    points: [
      "대출한도 최대 4억원 이내",
      "LTV 70% (생애최초 80%, 수도권·규제지역 70%)",
      "특례금리 적용, 추가 출산 시 자녀 1명당 5년씩 연장(최장 15년)",
      "부부합산 연소득 8.5천만원 이하 시 특례금리, 초과 시 일반금리",
    ],
  },
  {
    title: "보금자리론",
    target: "주택가격 6억원 이하, 디딤돌 소득기준 초과자도 가능",
    points: [
      "대출한도 최대 3.6억원 (다자녀·전세사기피해자 4억원, 생애최초 4.2억원)",
      "규제지역도 생애최초·실수요자(무주택, 6억 이하, 부부합산 7천만원 이하)는 LTV 미차감",
      "만기 최장 50년 (청년·신혼가구 요건 충족 시)",
      "전 기간 고정금리로 금리변동 위험 없음",
    ],
  },
];

// ── 2. 세금 감면 ──
const taxBenefits = [
  {
    title: "생애최초 취득세 감면",
    legal: "지방세특례제한법 제36조의3",
    points: [
      "주택가격 12억원 이하 생애최초 주택 구입 시 적용",
      "60㎡ 이하 + 수도권 6억/지방 3억 이하 소형주택: 최대 300만원 한도 감면",
      "그 외 주택: 최대 200만원 한도 감면",
      "법인은 적용 대상에서 제외",
    ],
    link: "/tax-acq",
  },
  {
    title: "출산·양육 취득세 감면",
    legal: "지방세특례제한법 제36조의5",
    points: [
      "출산 가구가 주택가격 12억원 이하 주택 취득 시 적용",
      "최대 500만원 한도 감면",
      "생애최초 감면과 중복 적용 불가 (둘 중 유리한 것 선택)",
    ],
    link: "/tax-acq",
  },
  {
    title: "1세대1주택 양도세 비과세",
    legal: "소득세법 제89조제1항제3호",
    points: [
      "2년 이상 보유(조정대상지역 취득 시 거주요건 포함) 시 적용",
      "양도가액 12억원 이하 전액 비과세",
      "12억원 초과(고가주택)는 초과 비율만큼만 과세",
    ],
    link: "/tax-sell",
  },
];

// ── 3. 청약 특별공급 ──
const subscriptionBenefits = [
  {
    title: "신혼부부 특별공급",
    target: "혼인기간 7년 이내 또는 6세 이하 자녀를 둔 무주택 세대 (예비신혼부부·한부모 포함)",
    points: [
      "공공분양: 소득 100%(맞벌이 120%) 이하 우선공급 70%, 130%(맞벌이 140%) 이하 잔여공급",
      "민영주택(85㎡ 이하): 소득 100%(맞벌이 120%) 이하 50%, 140%(맞벌이 160%) 이하 20% 공급",
      "특별공급 물량의 일정 비율을 신혼부부 전용으로 배정",
      "2025년 개편: 출산가구 2회 신청 허용, 무주택 조건 완화(과거 보유 후 처분 시에도 가능)",
    ],
  },
  {
    title: "생애최초 특별공급",
    target: "생애최초로 주택을 구입하는 무주택 세대 (세대원 전원 과거 주택소유 이력 없을 것)",
    points: [
      "공공분양: 소득 100%(맞벌이 120%) 이하 우선공급 70%, 130%(맞벌이 140%) 일반공급 20%, 추첨 10%",
      "민영주택: 소득기준 최대 160%까지 완화, 추첨제 비율 30%로 확대 (2026년 기준)",
      "근로소득이 있을 것(무직자 제외)이 신혼부부 특공과의 핵심 차이",
      "신혼부부 특공과 중복 신청 불가 — 본인에게 유리한 쪽 선택 필요",
    ],
  },
  {
    title: "신생아 특별공급",
    target: "2세 미만 자녀가 있는 무주택 세대구성원",
    points: [
      "건설량의 20% 범위에서 공급",
      "소득기준 140%(맞벌이 200%) 이하",
      "2023.3.28. 이후 출산 자녀 1명: 소득·자산기준 10%p 완화, 2명 이상: 20%p 완화",
      "신혼부부 특공과 별도로 신청 가능 — 자녀가 있다면 함께 비교 필수",
    ],
  },
];

function BenefitCard({
  title,
  subtitle,
  points,
  color,
  link,
}: {
  title: string;
  subtitle: string;
  points: string[];
  color: CardColor;
  link?: string;
}) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5 flex flex-col h-full`}>
      <p className={`text-sm font-bold ${c.text} mb-1`}>{title}</p>
      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">{subtitle}</p>
      <ul className="space-y-1.5 mt-auto">
        {points.map((p) => (
          <li key={p} className={`text-xs ${c.text} flex items-start gap-1.5 leading-relaxed`}>
            <span className="mt-0.5 shrink-0">•</span>
            {p}
          </li>
        ))}
      </ul>
      {link && (
        <Link
          href={link}
          className={`mt-4 self-start text-[11px] font-bold px-3 py-1.5 rounded-full ${c.badge} hover:opacity-80 transition`}
        >
          관련 계산기 바로가기 →
        </Link>
      )}
    </div>
  );
}

export default function BenefitsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-7">

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition"
        >
          ← 메인으로
        </Link>

        <div>
          <h1 className="text-xl font-bold text-slate-800">🎁 생애최초 · 신혼부부 혜택 모아보기</h1>
          <p className="text-xs text-slate-400 mt-1">
            2026.06 기준 정리 · 대출 · 세금 · 청약 혜택을 한눈에
          </p>
        </div>

        {/* 대출 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            🏦 대출 (정책모기지)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loanBenefits.map((b) => (
              <BenefitCard
                key={b.title}
                title={b.title}
                subtitle={b.target}
                points={b.points}
                color="emerald"
                link="/loan"
              />
            ))}
          </div>
        </section>

        {/* 세금 감면 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            💰 세금 감면
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {taxBenefits.map((b) => (
              <BenefitCard
                key={b.title}
                title={b.title}
                subtitle={b.legal}
                points={b.points}
                color="blue"
                link={b.link}
              />
            ))}
          </div>
        </section>

        {/* 청약 특별공급 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            🏠 청약 특별공급
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionBenefits.map((b) => (
              <BenefitCard
                key={b.title}
                title={b.title}
                subtitle={b.target}
                points={b.points}
                color="violet"
              />
            ))}
          </div>
        </section>

        <p className="text-[10px] text-slate-400 pt-2 leading-relaxed border-t border-slate-100 mt-2">
          출처: 한국주택금융공사 디딤돌/보금자리론 상품안내(2026.06.22 기준 고시), 주택도시기금 포털,
          「주택공급에 관한 규칙」, 「공공주택 특별법 시행규칙」 별표6, LH청약플러스, 뉴:홈,
          지방세특례제한법 제36조의3·제36조의5, 소득세법 제89조. 소득기준 %는 전년도 도시근로자
          가구당 월평균소득 기준이며, 대출한도·금리·소득기준은 정책 변경에 따라 수시로 바뀌므로
          신청 전 반드시 기금e든든(enhuf.molit.go.kr) 또는 청약홈에서 최신 공고문을 확인해주세요.
        </p>

      </div>
    </div>
  );
}