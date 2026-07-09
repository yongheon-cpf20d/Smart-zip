"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { REGULATION_AREAS } from "@/lib/regulationData";
import ThemeToggle from "@/components/ThemeToggle";

// ✅ 법령/정책 출처: 금융위원회 「주택시장 안정화 대책」 관련 「긴급 가계부채 점검회의」(2025.10.15)
//    + 지방세법 제13조의2(법인의 주택 취득 등 중과), 종합부동산세법 등
// 규제는 자주 바뀌므로 이 배열만 수정하면 화면에 바로 반영됨.
// ✅ 적용 지역 목록은 lib/regulationData.ts 에서 자동으로 가져옵니다.
//    → 그 파일 하나만 수정하면 메인페이지 지도 + 규제요약 + 이 페이지 전부 반영됩니다.

type RegColor = "red" | "orange" | "amber";

const colorMap: Record<RegColor, { bg: string; border: string; text: string; badge: string }> = {
  red: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
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
      "주담대 LTV 40% (비규제지역 70% 대비 대폭 강화)",
      "3억원 초과 APT 취득 시 전세대출 제한",
      "1주택자 재건축·재개발 중도금·이주비대출 시 추가 주택구입 제한",
      "주택 매매·임대사업자 외 사업자의 주택구입목적 주담대(사업자대출) 제한",
      "다주택자 양도세 중과 +30%p (3주택 이상)",
    ],
  },
  {
    title: "조정대상지역",
    color: "orange",
    summary: "투기과열지구보다는 완화됐지만 대출·세제 규제가 적용됩니다.",
    details: [
      "주담대 LTV 40% (수도권·규제지역 공통 강화)",
      "1주택자가 수도권·규제지역에서 전세대출 받을 시 이자상환분 DSR 반영 (10.29 시행)",
      "1억원 초과 신용대출 보유 시 1년간 규제지역 내 주택구입 제한",
      "다주택자 양도세 중과 +20%p (2주택) / +30%p (3주택 이상)",
      "취득세 중과 8~12% (1세대 2주택 이상)",
    ],
  },
  {
    title: "토지거래허가구역",
    color: "amber",
    summary: "토지·건물 거래 시 관할 구청장의 허가가 필요한 지역입니다.",
    details: [
      "비주택담보대출 LTV 40% (기존 70%에서 강화)",
      "주거용 토지는 일정 기간 실거주 의무 부과",
      "상업·업무용 토지는 일정 기간 직접 이용 의무 부과",
      "허가 없이 거래 시 형사처벌 또는 이행강제금 부과 대상",
    ],
  },
];

const stressDSRStages = [
  { stage: "1단계", date: "2024.02 ~", add: "+0.25%p", note: "은행권 주담대 대상 시범 도입" },
  { stage: "2단계", date: "2024.09 ~", add: "+0.75%p", note: "전 금융권 주담대·신용대출 확대" },
  { stage: "3단계", date: "2025.07 ~", add: "+1.50%p", note: "수도권·규제지역 주담대 스트레스 금리 하한 3.0%로 추가 강화" },
];

const CURRENT_STAGE_INDEX = 2;

export default function RegulationPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-5">

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition"
          >
            ← 메인으로
          </Link>
          <ThemeToggle />
        </div>

        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck size={20} strokeWidth={1.75} className="text-emerald-600" />
            규제 현황
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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
                          className={`text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-900/30 ${c.text}`}
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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">스트레스 DSR 단계별 현황</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            대출금리에 일정 수준의 스트레스 금리를 가산해 DSR을 산정, 미래 금리 상승 리스크를 미리 반영하는 제도입니다.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {stressDSRStages.map((s, i) => {
              const active = i === CURRENT_STAGE_INDEX;
              return (
                <div
                  key={s.stage}
                  className={`rounded-xl p-4 border ${
                    active
                      ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                      : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  <p className={`text-sm font-bold ${active ? "text-red-700 dark:text-red-300" : "text-slate-400 dark:text-slate-500"}`}>
                    {s.stage}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${active ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {s.date}
                  </p>
                  <p className={`text-xs mt-1.5 font-semibold ${active ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                    가산 {s.add}
                  </p>
                  <p className={`text-[10px] mt-2 leading-relaxed ${active ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {s.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 추가 대출 규제 (10.15 대책) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">주택가격별 주담대 한도 차등화</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            수도권·규제지역 주택구입목적 주담대 한도가 시가에 따라 차등 적용됩니다. (2025.10.16 시행)
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">15억원 이하</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1">6억원</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400">15억 ~ 25억원</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1">4억원</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-xs text-red-600 dark:text-red-400">25억원 초과</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-1">2억원</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3">
            ※ 이주비대출은 주택가격과 관계없이 최대 6억원 적용
          </p>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 leading-relaxed">
          출처: 금융위원회 「주택시장 안정화 대책」 관련 「긴급 가계부채 점검회의」(2025.10.15) 보도자료,
          지방세법 제13조의2. 본 정보는 참고용이며 실제 규제지역 지정 현황 및 세부 기준은
          국토교통부 및 금융위원회 공지를 확인해주세요.
        </p>

      </div>
    </div>
  );
}
