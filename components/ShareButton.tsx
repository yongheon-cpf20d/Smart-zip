// components/ShareButton.tsx
// ✅ 계산 결과 공유 버튼 — 카카오톡 공유 + 링크 복사
// 사용법: <ShareButton title="DSR 계산 결과" description="DSR 45.2%" params={{income: "8000", age: "35"}} />
"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";

declare global {
  interface Window {
    Kakao: any;
  }
}

type Props = {
  title: string;        // 카카오톡 공유 카드 제목 (예: "DSR 계산 결과")
  description: string;  // 카카오톡 공유 카드 설명 (예: "DSR 45.2% · 월 상환액 250만원")
  params: Record<string, string>; // 현재 입력값들 (URL 쿼리파라미터로 인코딩됨)
};

let kakaoInitialized = false;

export default function ShareButton({ title, description, params }: Props) {
  const [copied, setCopied] = useState(false);

  const buildShareUrl = () => {
    const url = new URL(window.location.href);
    url.search = ""; // 기존 쿼리 초기화
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  };

  const handleCopyLink = async () => {
    const shareUrl = buildShareUrl();
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKakaoShare = () => {
    if (!window.Kakao) return;

    if (!kakaoInitialized) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      kakaoInitialized = true;
    }

    const shareUrl = buildShareUrl();

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: `${window.location.origin}/logo-share.png`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: "결과 보러가기",
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleKakaoShare}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#FEE500] text-[#191919] hover:brightness-95 transition"
      >
        <Share2 size={13} strokeWidth={2} />
        카카오톡 공유
      </button>
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
      >
        {copied ? <Check size={13} strokeWidth={2} /> : <Link2 size={13} strokeWidth={2} />}
        {copied ? "복사됨!" : "링크 복사"}
      </button>
    </div>
  );
}