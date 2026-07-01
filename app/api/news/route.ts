import { NextResponse } from "next/server";

// ✅ Google News RSS — 한국어 부동산 뉴스
// 별도 API 키 불필요, 서버사이드 fetch 가능
// revalidate: 10800 (3시간마다 자동 갱신)
// Hobby 플랜: 접속자가 있을 때 3시간 경과 시 갱신
// Pro 플랜 전환 시: Vercel Cron으로 9/12/15시 정확히 설정 가능

export const revalidate = 10800; // 3시간 캐싱

const RSS_URLS = [
  {
    url: "https://news.google.com/rss/search?q=부동산+아파트&hl=ko&gl=KR&ceid=KR:ko",
    label: "부동산",
  },
  {
    url: "https://news.google.com/rss/search?q=주택담보대출+금리&hl=ko&gl=KR&ceid=KR:ko",
    label: "대출",
  },
];

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];

  // <item> 블록 추출
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const block = match[1];

    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? block.match(/<title>(.*?)<\/title>/)?.[1]
      ?? "";

    const link = block.match(/<link>(.*?)<\/link>/)?.[1]
      ?? block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]
      ?? "";

    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

    // Google News RSS에서 출처 언론사 추출
    const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1]
      ?? block.match(/<source>(.*?)<\/source>/)?.[1]
      ?? "";

    // 제목에서 HTML 엔티티 제거
    const cleanTitle = title
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanTitle && link) {
      items.push({ title: cleanTitle, link, pubDate, source });
    }

    if (items.length >= 5) break; // 피드당 최대 5개
  }

  return items;
}

export async function GET() {
  try {
    const allItems: NewsItem[] = [];

    // 여러 RSS 피드 병렬 fetch
    const results = await Promise.allSettled(
      RSS_URLS.map(({ url }) =>
        fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; DDokzipBot/1.0; +https://ddokzip.vercel.app)",
          },
          next: { revalidate: 10800 },
        }).then((r) => r.text())
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const items = parseRSS(result.value);
        allItems.push(...items);
      }
    }

    // 중복 제거 + 최대 8개 반환
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    }).slice(0, 8);

    if (unique.length === 0) {
      // 뉴스 fetch 실패 시 fallback 데이터
      return NextResponse.json({
        items: [
          { title: "국토부, 수도권 규제지역 해제 검토 착수", link: "#", source: "" },
          { title: "내년부터 아파트 관리비 공개 의무화 확대", link: "#", source: "" },
          { title: "서울 아파트 거래량 3개월 연속 증가세", link: "#", source: "" },
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
    console.error("[뉴스 API] 오류:", err);
    return NextResponse.json(
      { error: "뉴스를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}