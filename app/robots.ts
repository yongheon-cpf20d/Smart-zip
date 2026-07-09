import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API 라우트·내부 어드민은 인덱싱 제외
        disallow: ["/api/", "/admin/", "/feedback/"],
      },
    ],
    sitemap: "https://똑집.com/sitemap.xml",
    host: "https://똑집.com",
  };
}
