import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { AppShell } from "@/components/app-shell/app-shell";
import { AppLanguageProvider } from "@/components/app-shell/app-language-provider";
import { ThemeProvider } from "@/components/app-shell/theme-provider";
import { ThemeScript } from "@/components/app-shell/theme-script";
import { getUserSettings } from "@/lib/auth/db";
import { getServerSession } from "@/lib/auth/server";
import { DEFAULT_APP_LANGUAGE, resolveHtmlLang } from "@/lib/i18n/app-language";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dona Flora — Biblioteca Pessoal",
  description: "Sua biblioteca pessoal com um bibliotecário alimentado por IA",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  const locale = session?.user?.id
    ? getUserSettings(session.user.id).language
    : DEFAULT_APP_LANGUAGE;

  return (
    <html
      lang={resolveHtmlLang(locale)}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <AppLanguageProvider locale={locale}>
            <NuqsAdapter>
              <AppShell>{children}</AppShell>
            </NuqsAdapter>
          </AppLanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
