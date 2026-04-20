import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { AppShell } from "@/components/app-shell/app-shell";
import { ThemeProvider } from "@/components/app-shell/theme-provider";
import { ThemeScript } from "@/components/app-shell/theme-script";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <NuqsAdapter>
            <AppShell>{children}</AppShell>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
