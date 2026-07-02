import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 | 똑집 DDokzip",
};

const sections = [
  {
    title: "제1조 (개인정보의 수집 항목 및 방법)",
    highlight: true,
    items: [
      "본 서비스는 회원가입 없이 이용할 수 있는 자산 계산기 서비스를 지향합니다.",
      "이용자가 계산기를 이용하기 위해 입력하는 데이터(매매가액, 전용면적, 연소득, 주택 소유 현황 등)는 일회성 계산을 위한 변수로만 사용되며, 서비스의 서버에 절대 저장(수집)되지 않습니다.",
      "단, 웹사이트의 오류 개선 및 서비스 이용 통계 분석을 위해 쿠키(Cookie) 및 브라우저 로컬 스토리지(Local Storage)를 활용하여 일시적인 세션 데이터를 유지할 수 있습니다.",
    ],
  },
  {
    title: "제2조 (개인정보의 이용 목적)",
    content: "서비스가 제공하는 모의 계산 기능 수행 및 유저 편의를 위한 브라우저 내 임시 상태 유지 목적으로만 데이터를 활용합니다.",
  },
  {
    title: "제3조 (개인정보의 보유 및 파기)",
    content: "본 서비스는 비로그인 기반 모의 계산 데이터에 대해 서버 저장을 하지 않으므로, 이용자가 브라우저 창을 닫거나 세션을 종료하는 즉시 모든 입력 정보는 파기됩니다.",
  },
  {
    title: "제4조 (이용자의 권리와 행사 방법)",
    content: "이용자는 언제든지 브라우저의 쿠키 및 웹 데이터를 삭제함으로써 서비스에 남아있는 임시 기록을 직접 파기할 수 있습니다.",
  },
  {
    title: "제5조 (개인정보 보호책임자 및 문의)",
    content: "서비스 이용 중 개인정보 관련 문의사항이나 보안 제안이 있으신 경우 아래의 연락처로 문의해 주시기 바랍니다.",
    contact: "ttockzip@gmail.com",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        {/* 헤더 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-2xl font-black text-slate-800 mb-2">개인정보처리방침</h1>
          <p className="text-sm text-slate-400 mb-4">시행일: 2026년 7월 1일</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            '똑집'은 이용자의 개인정보를 중요시하며,
            「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 및
            「개인정보보호법」을 준수하고 있습니다.
          </p>
        </div>

        {/* 핵심 요약 배너 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-2xl shrink-0">🔒</span>
          <div>
            <p className="text-sm font-bold text-emerald-700 mb-1">서버에 저장되지 않습니다</p>
            <p className="text-xs text-emerald-600 leading-relaxed">
              계산기에 입력하신 매매가, 소득, 주택 보유 현황 등 모든 데이터는
              브라우저 내에서만 처리되며 서버로 전송되거나 저장되지 않습니다.
            </p>
          </div>
        </div>

        {/* 본문 */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.title}
              className={`bg-white border rounded-2xl p-6 space-y-3 ${
                section.highlight
                  ? "border-emerald-200"
                  : "border-slate-200"
              }`}
            >
              <h2 className={`text-base font-bold ${section.highlight ? "text-emerald-700" : "text-slate-700"}`}>
                {section.title}
              </h2>

              {section.content && (
                <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
              )}

              {section.items && (
                <ol className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                      <span className="shrink-0 font-bold text-slate-400">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              )}

              {section.contact && (
                <div className="mt-2 pl-4 border-l-2 border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">이메일 문의</p>
                  <a
                    href={`mailto:${section.contact}`}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
                  >
                    {section.contact}
                  </a>
                </div>
              )}
            </div>
          ))}

          {/* 부칙 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-700 mb-2">부칙</h2>
            <p className="text-sm text-slate-600">본 개인정보처리방침은 2026년 7월 1일부터 시행됩니다.</p>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <Link href="/terms" className="hover:text-emerald-600 transition">← 이용약관</Link>
          <a href="mailto:ttockzip@gmail.com" className="hover:text-emerald-600 transition">
            문의: ttockzip@gmail.com
          </a>
        </div>

      </div>
    </div>
  );
}