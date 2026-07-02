import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "똑집 DDokzip | 부동산 세금·대출·규제 정보",
  description: "취득세·보유세·양도세 계산기, DSR·주담대 계산기, 규제현황, 신고가 정보를 한눈에. 국토교통부 공식 데이터 기반 부동산 종합 정보 플랫폼.",
  keywords: "취득세계산기, 양도세계산기, 보유세계산기, DSR계산기, 주담대계산기, 부동산규제, 신고가",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}