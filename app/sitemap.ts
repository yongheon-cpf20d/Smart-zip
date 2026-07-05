// app/sitemap.ts
// ✅ Next.js가 이 파일을 자동으로 /sitemap.xml 로 변환해줌
// 구글/네이버 서치콘솔에 제출용

import type { MetadataRoute } from "next";

const BASE_URL = "https://xn--b71bo88a.com"; // 실제 도메인의 punycode 형태 (똑집.com)

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", priority: 1.0 },              // 메인페이지
    { path: "/tax-acq", priority: 0.9 },
    { path: "/tax-hold", priority: 0.9 },
    { path: "/tax-sell", priority: 0.9 },
    { path: "/total-cost", priority: 0.9 },
    { path: "/loan", priority: 0.9 },
    { path: "/dsr", priority: 0.9 },
    { path: "/switch-sim", priority: 0.8 },
    { path: "/asset-sim", priority: 0.8 },
    { path: "/new-high", priority: 0.8 },
    { path: "/top-apt", priority: 0.8 },
    { path: "/regulation", priority: 0.8 },
    { path: "/benefits", priority: 0.7 },
    { path: "/policy", priority: 0.6 },
    { path: "/changelog", priority: 0.5 },
    { path: "/feedback", priority: 0.4 },
  ];

  return pages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: page.priority,
  }));
}