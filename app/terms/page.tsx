import Link from "next/link";

export const metadata = {
  title: "이용약관 | 똑집 DDokzip",
};

const sections = [
  {
    title: "제1조 (목적)",
    content: `본 약관은 '똑집'(이하 '서비스')이 제공하는 부동산 세금 및 대출 계산 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: "제2조 (저작권 및 소유권)",
    items: [
      "서비스가 자체적으로 개발한 계산 로직, UI/UX 디자인, 브랜드 로고(심볼) 및 관련 콘텐츠에 대한 지식재산권은 '똑집'에 귀속됩니다.",
      "이용자는 서비스를 이용함으로써 얻은 정보를 서비스의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.",
    ],
  },
  {
    title: "제3조 (서비스의 제공 및 변경)",
    items: [
      "본 서비스는 정부 정책(국토교통부, 국세청, 행정안전부 등) 및 오픈 API 데이터를 기반으로 부동산 관련 모의 계산 기능을 제공합니다.",
      "서비스는 세법 개정, 정책 변경 등의 사유가 발생할 경우 계산 로직을 업데이트하거나 변경할 수 있습니다.",
    ],
  },
  {
    title: "제4조 (서비스의 한계 및 면책 조항)",
    highlight: true,
    items: [
      "본 서비스가 제공하는 모든 계산 결과(취득세, 보유세, 대출 한도 등)는 입력된 데이터를 바탕으로 산출된 '단순 참고용 예상 수치'입니다.",
      "부동산 세법은 개별 이용자의 자산 현황, 보유 기간, 규제지역 여부 등 미세한 조건에 따라 완전히 달라질 수 있으므로, 본 서비스의 결과값은 법적 증빙 자료로 활용될 수 없습니다.",
      "서비스는 이용자가 본 서비스의 계산 결과를 신뢰하여 행한 투자, 계약 등의 경제적 의사결정으로 인해 발생한 어떠한 손해(세금 과소/과다 신고, 대출 거절 등)에 대해서도 법적 책임을 지지 않습니다.",
      "실제 계약 및 세금 신고 전에는 반드시 전문 세무사, 법무사 또는 관할 기관(국세청, 은행 등)의 공식 자문을 거쳐야 합니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition">
          ← 메인으로
        </Link>

        {/* 헤더 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-2xl font-black text-slate-800 mb-2">이용약관</h1>
          <p className="text-sm text-slate-400">시행일: 2026년 7월 1일</p>
        </div>

        {/* 본문 */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.title}
              className={`bg-white border rounded-2xl p-6 space-y-3 ${
                section.highlight
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {section.highlight && (
                  <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                    핵심
                  </span>
                )}
                <h2 className={`text-base font-bold ${section.highlight ? "text-amber-800" : "text-slate-700"}`}>
                  {section.title}
                </h2>
              </div>

              {section.content && (
                <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
              )}

              {section.items && (
                <ol className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                      <span className={`shrink-0 font-bold ${section.highlight ? "text-amber-600" : "text-slate-400"}`}>
                        {i + 1}.
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}

          {/* 부칙 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-700 mb-2">부칙</h2>
            <p className="text-sm text-slate-600">본 약관은 2026년 7월 1일부터 시행됩니다.</p>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-emerald-600 transition">개인정보처리방침 →</Link>
          <a href="mailto:ttockzip@gmail.com" className="hover:text-emerald-600 transition">
            문의: ttockzip@gmail.com
          </a>
        </div>

      </div>
    </div>
  );
}