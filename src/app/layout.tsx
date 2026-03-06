import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "전국 마라톤 캘린더 - 전국 마라톤 대회 일정",
  description: "전국 마라톤 대회 일정을 한눈에 확인하고, 접수 마감일을 놓치지 마세요.",
  metadataBase: new URL("https://marathon-calendar.vercel.app"),
  openGraph: {
    title: "전국 마라톤 캘린더",
    description: "전국 마라톤 대회 일정을 한눈에 확인하고, 접수 마감일을 놓치지 마세요.",
    siteName: "전국 마라톤 캘린더",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
