import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',         // 구글, 네이버 등 세상의 모든 검색 로봇 환영!
      allow: '/',             // 사이트의 모든 페이지(메인, 계산기 등) 수집 허용
      disallow: '/api/',      // 단, 내부 데이터를 처리하는 API 서버 폴더는 훔쳐가지 마!
    },
    // 검색 로봇에게 아까 만든 사이트맵의 위치를 친절하게 알려줍니다.
    sitemap: 'https://xn--b71bo88a.com/sitemap.xml', // 🚀 여기에 버셀 주소나 실제 도메인을 넣으세요!
  };
}