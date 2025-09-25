import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "@/context/language-context";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weather Outfit Assistant",
  description: "AI-powered weather clothing recommendations",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <LanguageProvider>{children}</LanguageProvider>
        </Suspense>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
