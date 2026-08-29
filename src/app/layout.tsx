import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { VisitTracker } from "@/components/visit-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BadDates.fyi | Anonymous Dating Disaster Reports",
  description: "Track the financial and experiential costs of modern dating in Indian metros.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteHeader />
        <VisitTracker />
        <main>{children}</main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
