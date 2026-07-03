"use client";

import Link from "next/link";
import { REGULATION_AREAS } from "../../lib/regulationData";

// ✅ 법령/정책 출처: 금융위원회 「주택시장 안정화 대책」 관련 「긴급 가계부채 점검회의」(2025.10.15)
//    + 지방세법 제13조의2(법인의 주택 취득 등 중과), 종합부동산세법 등
// 규제는 자주 바뀌므로 이 배열만 수정하면 화면에 바로 반영됨.
// ✅ 적용 지역 목록은 lib/regulationData.ts 에서 자동으로 가져옵니다.
//    → 그 파일 하나만 수정하면 메인페이지 지도 + 규제요약 + 이 페이지 전부 반영됩니다.

type RegColor = "red" | "orange" | "amber";

const colorMap: Record<RegColor, { bg: string; border: string; text: string; badge: string }> = {
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
};

const regulations: {
  title: string;
  color: RegColor;
  summary: string;
  details: string[];
}[] = [
  {
    title: "투기과열지구",
    color: "red",
    summary: "가장 강력한 규제지역. 대출·세제·청약 전방위로 제한됩니다.",
    details: [
      "무주택자 LTV 40%(6억 한도)",
      "유주택자 구입목적 주담대 금지 (LTV 0%)",
      "1주택 비과세 요건: 2년 보유 + 2년 실거주",
      "다주택자 양도세 중과 & 장특공제 배제",
      "다주택자 취득세 중과 (2주택 8%, 3주택 12%)",
      "재당첨 제한 10년",
      "주택 구입시 6개월 내 전입 의무",
    ],
  },
  {
    title: "조정대상지역",
    color: "orange",
    summary: "투기과열지구보다는 완화됐지만 대출·세제 규제가 적용됩니다.",
    details: [
      "무주택자 LTV 40%(6억 한도)",
      "유주택자 구입목적 주담대 금지 (LTV 0%)",
      "1주택 비과세 요건: 2년 보유 + 2년 실거주",
      "다주택자 양도세 중과 & 장특공제 배제",
      "다주택자 취득세 중과 (2주택 8%, 3주택 12%)",
      "재당첨 제한 7년",
      "주택 구입시 6개월 내 전입 의무",
    ],
  },
  {
    title: "토지거래허가구역",
    color: "amber",
    summary: "토지·건물 거래 시 관할 구청장의 허가가 필요한 지역입니다.",
    details: [
      "매매 계약 체결 전 관할 지자체장 사전 허가 필수",
      "매수 후 최소 2년 실거주 의무 (신규 갭투자 절대 불가)",
      "기존 세입자 거주 주택 매수 시 실거주 한시 유예 (무주택자 한정)",
      "무허가 및 부정 허가 시 2년 이하 징역 또는 30% 이하 벌금",
      "실거주 의무 위반 시 매년 취득가액 최대 10% 이행강제금 부과",
    ],
  },
];

const stressDSRStages = [
  { stage: "1단계", date: "2024.02 ~", add: "+0.38%p", note: "은행권 주택담보대출 한정" },
  { stage: "2단계", date: "2024.09 ~", add: "+0.75%p", note: "1금융권 모든대출 + 2금융권 주택담보대출 적용. 수도권의 경우 1.2%p 적용" },
  { stage: "3단계", date: "2025.07 ~", add: "+1.50%p", note: "전 금융권의 모든 가계대출에 적용. 지방의 경우 0.75%p 연장" },
];

const CURRENT_STAGE_INDEX = 2;

export default function RegulationPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-5">

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition"
        >
          ← 메인으로
        </Link>

        <div>
          <h1 className="text-xl font-bold text-slate-800">📜 규제 현황</h1>
          <p className="text-xs text-slate-400 mt-1">
            2025.10.15 「주택시장 안정화 대책」 기준 · 출처: 금융위원회
          </p>
        </div>

        {/* 지역별 규제 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {regulations.map((reg) => {
            const c = colorMap[reg.color];
            // lib/regulationData.ts 에서 해당 규제유형의 지역 목록 자동 조회
            const matchedAreas = REGULATION_AREAS.filter(
              (a) => a.type === reg.title && a.sido !== "기타"
            );
            return (
              <div
                key={reg.title}
                className={`${c.bg} border ${c.border} rounded-2xl p-5 flex flex-col`}
              >
                <span className={`self-start text-[10px] font-bold px-2 py-1 rounded-full ${c.badge} mb-3`}>
                  {reg.title}
                </span>
                <p className={`text-sm font-bold ${c.text} mb-3 leading-snug`}>
                  {reg.summary}
                </p>
                <ul className="space-y-1.5">
                  {reg.details.map((d) => (
                    <li key={d} className={`text-xs ${c.text} flex items-start gap-1.5 leading-relaxed`}>
                      <span className="mt-0.5 shrink-0">•</span>
                      {d}
                    </li>
                  ))}
                </ul>

                {/* 적용 지역 목록 (lib/regulationData.ts 연동) */}
                {matchedAreas.length > 0 && (
                  <div className={`mt-4 pt-3 border-t ${c.border}`}>
                    <p className={`text-[10px] font-bold ${c.text} mb-1.5 opacity-70`}>적용 지역</p>
                    <div className="flex flex-wrap gap-1">
                      {matchedAreas.map((a) => (
                        <span
                          key={a.name}
                          className={`text-[10px] px-2 py-0.5 rounded-full bg-white/60 ${c.text}`}
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 스트레스 DSR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-600 mb-1">스트레스 DSR 단계별 현황</h2>
          <p className="text-xs text-slate-400 mb-4">
            대출금리에 일정 수준의 스트레스 금리를 가산해 DSR을 산정, 미래 금리 상승 리스크를 미리 반영하는 제도입니다.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {stressDSRStages.map((s, i) => {
              const active = i === CURRENT_STAGE_INDEX;
              return (
                <div
                  key={s.stage}
                  className={`rounded-xl p-4 border ${
                    active ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p className={`text-sm font-bold ${active ? "text-red-700" : "text-slate-400"}`}>
                    {s.stage}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${active ? "text-red-500" : "text-slate-400"}`}>
                    {s.date}
                  </p>
                  <p className={`text-xs mt-1.5 font-semibold ${active ? "text-red-600" : "text-slate-400"}`}>
                    가산 {s.add}
                  </p>
                  <p className={`text-[10px] mt-2 leading-relaxed ${active ? "text-red-500" : "text-slate-400"}`}>
                    {s.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 추가 대출 규제 (10.15 대책) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-600 mb-1">주택가격별 주담대 한도 차등화</h2>
          <p className="text-xs text-slate-400 mb-4">
            수도권·규제지역 주택구입목적 주담대 한도가 시가에 따라 차등 적용됩니다. (2025.10.16 시행)
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500">15억원 이하</p>
              <p className="text-lg font-bold text-slate-700 mt-1">6억원</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-600">15억 ~ 25억원</p>
              <p className="text-lg font-bold text-amber-700 mt-1">4억원</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600">25억원 초과</p>
              <p className="text-lg font-bold text-red-700 mt-1">2억원</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            ※ 이주비대출은 주택가격과 관계없이 최대 6억원 적용
          </p>
        </div>

        <p className="text-[10px] text-slate-400 pt-2 leading-relaxed">
          출처: 금융위원회 「주택시장 안정화 대책」 관련 「긴급 가계부채 점검회의」(2025.10.15) 보도자료,
          지방세법 제13조의2. 본 정보는 참고용이며 실제 규제지역 지정 현황 및 세부 기준은
          국토교통부 및 금융위원회 공지를 확인해주세요.
        </p>

      </div>
    </div>
  );
}