import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">

        {/* 상단: 로고 + 소개 */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <Image
              src="/logo.svg"
              alt="똑집 DDokzip"
              width={120}
              height={40}
              className="h-8 w-auto brightness-0 invert opacity-80"
            />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              부동산 세금·대출·규제 정보를 한눈에.<br />
              국토교통부 공식 데이터 기반의 부동산 종합 정보 플랫폼입니다.
            </p>
          </div>

          {/* 링크 모음 */}
          <div className="flex flex-col sm:flex-row gap-6 text-sm">
            <div className="space-y-2">
              <p className="text-slate-300 font-semibold text-xs uppercase tracking-wider">계산기</p>
              <div className="flex flex-col gap-1.5">
                <Link href="/loan" className="hover:text-emerald-400 transition">주담대 계산기</Link>
                <Link href="/dsr" className="hover:text-emerald-400 transition">DSR 계산기</Link>
                <Link href="/tax-acq" className="hover:text-emerald-400 transition">취득세 계산기</Link>
                <Link href="/tax-hold" className="hover:text-emerald-400 transition">보유세 계산기</Link>
                <Link href="/tax-sell" className="hover:text-emerald-400 transition">양도세 계산기</Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-slate-300 font-semibold text-xs uppercase tracking-wider">정보</p>
              <div className="flex flex-col gap-1.5">
                <Link href="/regulation" className="hover:text-emerald-400 transition">규제현황</Link>
                <Link href="/benefits" className="hover:text-emerald-400 transition">혜택모아보기</Link>
                <Link href="/total-cost" className="hover:text-emerald-400 transition">총비용 계산기</Link>
                <Link href="/new-high" className="hover:text-emerald-400 transition">오늘의 신고가</Link>
                <Link href="/policy" className="hover:text-emerald-400 transition">정책발표</Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-slate-300 font-semibold text-xs uppercase tracking-wider">안내</p>
              <div className="flex flex-col gap-1.5">
                <Link href="/terms" className="hover:text-emerald-400 transition">이용약관</Link>
                <Link href="/privacy" className="hover:text-emerald-400 transition">개인정보처리방침</Link>
                <a href="mailto:ttockzip@gmail.com" className="hover:text-emerald-400 transition">
                  ttockzip@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-slate-800" />

        {/* 데이터 출처 */}
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 font-semibold">데이터 출처</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            국토교통부 아파트매매 실거래가 공개 API · 금융위원회 보도자료 ·
            한국주택금융공사(HF) 디딤돌/보금자리론 상품안내 · 주택도시기금 포털 ·
            행정안전부 공공데이터포털 · 국세청 양도소득세 세율표
          </p>
        </div>

        {/* 면책 고지 */}
        <div className="bg-slate-800/50 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            ⚠️ <span className="text-slate-400 font-semibold">면책 고지</span> —
            본 사이트에서 제공하는 세금 계산, 대출 한도, 규제 정보 등 모든 내용은
            참고용이며 실제 세액·대출 조건과 다를 수 있습니다.
            부동산 거래 및 세금 신고 시에는 반드시 관할 세무서, 금융기관,
            공인세무사·법무사 등 전문가의 확인을 받으시기 바랍니다.
            본 사이트는 정보 제공을 목적으로 하며, 제공된 정보로 인한
            손해에 대해 책임을 지지 않습니다.
          </p>
        </div>

        {/* 하단: 저작권 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
          <p className="text-xs text-slate-600">
            © {currentYear} 똑집 DDokzip. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link href="/terms" className="hover:text-slate-400 transition">이용약관</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-slate-400 transition">개인정보처리방침</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}