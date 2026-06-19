import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Link from "next/link";
import { getLocale } from "@/lib/locale.server";
import { t } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";

export const metadata: Metadata = {
  title: "OS Exam Prep",
  description: "Practice bash, docker, and Java synchronization for the OS practical exam.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full flex-col bg-neutral-950 text-neutral-100">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-neutral-800 px-5">
          <Link href="/" className="font-semibold tracking-tight">
            OS<span className="text-emerald-400">Prep</span>
          </Link>
          <span className="hidden text-xs text-neutral-500 sm:inline">
            {t(locale, "app.tagline")}
          </span>
          <LocaleToggle locale={locale} />
        </header>
        {children}
      </body>
    </html>
  );
}
