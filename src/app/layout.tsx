import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "턴테이블 매치 (Turntable Match) | 직장인 프리미엄 로테이션 소개팅",
  description: "단 2시간, 선별된 10명의 직장인 이성과 나누는 깊이 있는 일대일 대화. 결혼중개업 정식 등록 기반, 철저한 신원 인증과 프라이빗 골목 라운지에서 안심하고 시작하세요.",
  keywords: ["로테이션 소개팅", "직장인 미팅", "턴테이블 매치", "소개팅 모임", "직장인 소개팅", "가치관 매칭", "프리미엄 미팅"],
  openGraph: {
    title: "턴테이블 매치 (Turntable Match) | 직장인 프리미엄 로테이션 소개팅",
    description: "철저한 신원 인증 기반, 10대10 로테이션 대화로 나만의 인연을 만나보세요. 매칭률 40% 보증.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
