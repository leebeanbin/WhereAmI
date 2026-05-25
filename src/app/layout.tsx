import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Where Am I? - Retro Tracker",
  description: "A cute retro pixel art location tracker",
  manifest: "/manifest.json",
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
