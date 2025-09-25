import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "@/context/language-context";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Style Planner",
  description: "AI-powered weather clothing recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                color: "#444",
                fontSize: "1.2rem",
                gap: "1.5rem",
              }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ animation: "spin 1s linear infinite" }}>
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#888"
                  strokeWidth="4"
                  strokeDasharray="100 40"
                  strokeLinecap="round"
                />
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </svg>
              <span>Loading your assistant...</span>
            </div>
          }>
          <LanguageProvider>{children}</LanguageProvider>
        </Suspense>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
