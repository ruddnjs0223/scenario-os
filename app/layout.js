import { Inter } from "next/font/google";
import Script from "next/script"; // 애드센스용 스크립트

const inter = Inter({ subsets: ["latin"] });

// ★ 3번 요청: 구글 SEO 검색 키워드 최적화
export const metadata = {
  title: "Scenario OS Pro - AI 시나리오 분석 및 작가 마켓",
  description: "할리우드 이론 기반 시나리오 분석, 작가 커뮤니티, 시나리오 마켓 플랫폼. 로버트 맥키, 세이브 더 캣 스타일 정밀 진단.",
  keywords: [
    "시나리오제작", 
    "시나리오글쓰기", 
    "영화시나리오", 
    "드라마시나리오", 
    "애니메이션시나리오", 
    "로버트맥기", 
    "세이브더캣", 
    "시나리오닥터", 
    "작가공모전"
  ],
  openGraph: {
    title: "Scenario OS Pro",
    description: "당신의 시나리오를 AI 전문가가 분석해드립니다.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* ★ 4번 요청: 구글 애드센스 자동 승인을 위한 코드 (ca-pub- 뒤에 본인 ID 넣어야 함) */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000" 
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className} style={{margin: 0, backgroundColor: 'black', color: '#f5f5f7'}}>
        {children}
      </body>
    </html>
  );
}