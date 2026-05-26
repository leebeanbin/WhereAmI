import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1a1a2e',
};

export const metadata: Metadata = {
  title: "Where Am I? - Retro Tracker",
  description: "나만의 레트로 모빌리티 라이프로그 다이어리",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "WhereAmI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/banana_192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full overflow-hidden" suppressHydrationWarning>
      <head>
        <link href="https://cdn.jsdelivr.net/gh/neodgm/neodgm-webfont@latest/neodgm/style.css" rel="stylesheet" />
        <link href="https://unpkg.com/nes.css@2.3.0/css/nes.min.css" rel="stylesheet" />
      </head>
      <body className="h-full overflow-hidden flex flex-col font-neodgm bg-gray-100" suppressHydrationWarning>
        {process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY && (
           <Script
             src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer,drawing&autoload=false`}
             strategy="beforeInteractive"
           />
        )}
        {children}
      </body>
    </html>
  );
}
