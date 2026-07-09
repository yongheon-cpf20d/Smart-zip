import type { MetadataRoute } from "next";

const BASE_URL = "https://똑집.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 정적 라우트 — changeFrequency·priority는 콘텐츠 성격에 맞게 분류
  const staticRoutes: MetadataRoute.Sitemap = [
    // 메인 (최고 우선순위)
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },

    // 계산기 (자주 사용, 콘텐츠 변경 적음)
    { url: `${BASE_URL}/loan`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/dsr`,         lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/tax-acq`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/tax-hold`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/tax-sell`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/total-cost`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/switch-sim`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/asset-sim`,   lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/rent-convert`,lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/compare`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // 실시간 데이터 (매일 갱신)
    { url: `${BASE_URL}/new-high`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/top-apt`,     lastModified: now, changeFrequency: "daily",   priority: 0.8 },

    // 정보 페이지 (월 1~2회 갱신)
    { url: `${BASE_URL}/regulation`,  lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/benefits`,    lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/policy`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
  ];

  return staticRoutes;
}
