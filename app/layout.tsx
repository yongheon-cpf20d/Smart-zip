import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ 브랜드 폰트 "그린 체리1스푼"은 로컬 ttf 파일 사용
// public/fonts/Griun_Cherry1Spoon-Rg.ttf → globals.css에 @font-face로 등록
// 여기서는 Google Fonts만 처리 (로컬 폰트는 CSS에서 --font-brand 변수로 관리)

const BASE_URL = "https://xn--b71bo88a.com"; // 도메인 확정 후 수정

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "똑집 DDokzip | 부동산 세금·대출 한눈에 계산",
    template: "%s | 똑집 DDokzip",
  },
  description:
    "똑똑한 부동산 길잡이, 똑집. 취득세·보유세·양도세 계산기, DSR·주담대 계산기, 갈아타기 시뮬레이터, 규제현황, 신고가 정보를 한눈에. 국토교통부 공식 데이터 기반 부동산 종합 정보 플랫폼.",
  keywords: [
    "취득세계산기", "양도세계산기", "보유세계산기", "DSR계산기",
    "주담대계산기", "부동산규제", "신고가", "갈아타기시뮬레이터",
    "총비용계산기", "생애최초취득세", "부동산세금", "똑집",
  ],
  authors: [{ name: "똑집 DDokzip" }],
  creator: "똑집 DDokzip",

  // Open Graph (카카오톡, 페이스북, 슬랙 등)
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "똑집 DDokzip",
    title: "똑집 DDokzip | 부동산 세금·대출 한눈에 계산",
    description:
      "똑똑한 부동산 길잡이, 똑집. 취득세·보유세·양도세 계산기, DSR·주담대 계산기, 갈아타기 시뮬레이터. 국토교통부 공식 데이터 기반.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "똑집 DDokzip — 부동산 세금·대출 한눈에 계산",
      },
    ],
  },
  verification: {
    google: "qOCvRyWAOJ_nPuNcX8pMWlNNueT3fUdRT8yWBTON6rY",
    other: {
      "naver-site-verification": "d9893962cbc8f6e3e8828accaaf426504b975936",
    },
  },

  // 트위터/X
  twitter: {
    card: "summary_large_image",
    title: "똑집 DDokzip | 부동산 세금·대출 한눈에 계산",
    description:
      "똑똑한 부동산 길잡이, 똑집. 취득세·보유세·양도세 계산기, DSR·주담대 계산기, 갈아타기 시뮬레이터. 국토교통부 공식 데이터 기반.",
    images: ["/twitter-image.png"],
  },

  // 검색엔진
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // 네이버/구글 인증 (나중에 서치콘솔 등록 시 추가)
  // verification: {
  //   google: "구글서치콘솔인증코드",
  //   other: { "naver-site-verification": "네이버웹마스터코드" },
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          strategy="beforeInteractive"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtcfe70V9gVXjXtaC12ojr55Uv/2j0LxUwWjaHrX3+j80"
          crossOrigin="anonymous"
        />
        {children}
        <Footer />
      </body>
    </html>
  );
}