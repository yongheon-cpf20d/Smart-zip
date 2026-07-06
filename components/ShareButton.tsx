"use client";

import { useEffect } from "react";
import { MessageCircle, Link as LinkIcon } from "lucide-react";

// TypeScript에서 window.Kakao를 에러 없이 쓰기 위한 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

type ShareButtonProps = {
  title: string;
  description: string;
  params: Record<string, string>;
};

export default function ShareButton({ title, description, params }: ShareButtonProps) {
  // 1. 카카오 SDK 스크립트를 화면이 켜질 때 동적으로 몰래 불러옵니다.
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // 스크립트가 다 불러와지면 아까 .env.local에 넣은 키로 엔진에 시동을 겁니다!
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      }
    };
  }, []);

  const handleKakaoShare = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert("카카오톡 공유 기능을 불러오는 중입니다. 1~2초 뒤에 다시 눌러주세요.");
      return;
    }

    // 2. 현재 주소 + 계산기에 입력된 값들(params)을 완벽한 URL로 조합합니다.
    const queryString = new URLSearchParams(params).toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}?${queryString}`;

    // 3. 카카오톡 공유 API를 호출해서 팝업을 띄웁니다!
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: title,
        description: description,
        // 🚀 아까 코드로 만든 썸네일 주소 연결 (배포 후엔 실제 도메인으로 바꿔야 완벽히 뜹니다)
        imageUrl: `${window.location.origin}/opengraph-image.png`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: "계산 결과 확인하기",
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
  };

  const handleCopyLink = async () => {
    const queryString = new URLSearchParams(params).toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}?${queryString}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("링크가 복사되었습니다! 원하는 곳에 붙여넣기 하세요.");
    } catch (e) {
      alert("링크 복사에 실패했습니다.");
    }
  };

  return (
    <div className="flex gap-2">
      {/* 카카오톡 공유 버튼 (카카오 공식 노란색 적용) */}
      <button
        onClick={handleKakaoShare}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FEE500] text-[#191919] text-xs font-bold rounded-xl hover:bg-[#FEE500]/90 transition shadow-sm btn-press"
      >
        <MessageCircle size={16} fill="#191919" className="text-[#FEE500]" /> 카카오톡 공유
      </button>
      
      {/* 일반 링크 복사 버튼 */}
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition shadow-sm btn-press"
      >
        <LinkIcon size={14} /> 링크 복사
      </button>
    </div>
  );
}