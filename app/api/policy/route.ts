import { NextResponse } from "next/server";

// ✅ 국토교통부 + 금융위원회 공식 정책발표 RSS
// Google News에서 공식 기관명 키워드로 필터링
// revalidate: 10800 (3시간 캐싱, Hobby 플랜 기준)

export const revalidate = 10800;

const POLICY_RSS_URLS = [
  {
    url: 'https://news.google.com/rss/search?q="국토교통부"+보도자료&hl=ko&gl=KR&ceid=KR:ko',
    label: "국토부",
  },
  {
    url: 'https://news.google.com/rss/search?q="금융위원회"+보도자료&hl=ko&gl=KR&ceid=KR:ko',
    label: "금융위",
  },
];

type PolicyItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  label: string;
};

function parseRSS(xml: string, label: string, maxItems = 4): PolicyItem[] {
  const items: PolicyItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const block = match[1];

    const title =
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>(.*?)<\/title>/)?.[1] ??
      "";

    const link =
      block.match(/<link>(.*?)<\/link>/)?.[1] ??
      block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ??
      "";

    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

    const source =
      block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ??
      block.match(/<source>(.*?)<\/source>/)?.[1] ??
      "";

    const cleanTitle = title
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // 보도자료/정책 발표 관련 키워드 필터 (광고성 기사 제거)
    const isRelevant =
      cleanTitle.includes("국토교통부") ||
      cleanTitle.includes("금융위원회") ||
      cleanTitle.includes("국토부") ||
      cleanTitle.includes("금융위") ||
      cleanTitle.includes("보도자료") ||
      cleanTitle.includes("발표") ||
      cleanTitle.includes("시행") ||
      cleanTitle.includes("지정") ||
      cleanTitle.includes("대책");

    if (cleanTitle && link && isRelevant) {
      items.push({ title: cleanTitle, link, pubDate, source, label });
    }

    if (items.length >= maxItems) break;
  }

  return items;
}

// pubDate 파싱해서 최신순 정렬
function parsePubDate(dateStr: string): number {
  try {
    return new Date(dateStr).getTime();
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const allItems: PolicyItem[] = [];

    const results = await Promise.allSettled(
      POLICY_RSS_URLS.map(({ url, label }) =>
        fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; DDokzipBot/1.0; +https://ddokzip.vercel.app)",
          },
          next: { revalidate: 10800 },
        })
          .then((r) => r.text())
          .then((xml) => parseRSS(xml, label))
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      }
    }

    // 중복 제거 + 최신순 정렬 + 최대 6개
    const seen = new Set<string>();
    const unique = allItems
      .filter((item) => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      })
      .sort((a, b) => parsePubDate(b.pubDate) - parsePubDate(a.pubDate))
      .slice(0, 6);

    if (unique.length === 0) {
      // fallback
      return NextResponse.json({
        items: [
          { title: "국토교통부, 기흥·동탄·구리 토지거래허가구역 지정", link: "#", source: "국토교통부", label: "국토부" },
          { title: "금융위원회, 스트레스 DSR 3단계 시행", link: "#", source: "금융위원회", label: "금융위" },
          { title: "국토교통부, 주택시장 안정화 대책 발표", link: "#", source: "국토교통부", label: "국토부" },
        ],
        updatedAt: new Date().toISOString(),
        isFallback: true,
      });
    }

    return NextResponse.json({
      items: unique,
      updatedAt: new Date().toISOString(),
      isFallback: false,
    });
  } catch (err) {
    console.error("[정책발표 API] 오류:", err);
    return NextResponse.json(
      { error: "정책발표를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}