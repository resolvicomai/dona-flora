import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { AppShell } from '@/components/app-shell/app-shell'
import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'
import { ThemeProvider } from '@/components/app-shell/theme-provider'
import { ThemeScript } from '@/components/app-shell/theme-script'
import { getUserSettings } from '@/lib/auth/db'
import { getServerSession } from '@/lib/auth/server'
import { DEFAULT_APP_LANGUAGE, resolveHtmlLang } from '@/lib/i18n/app-language'

import './globals.css'

const plexSans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dona Flora — Biblioteca Pessoal',
  description: 'Sua biblioteca pessoal com um bibliotecário alimentado por IA',
}

/**
 * Mobile foundation: explicit viewport so iOS Safari/Chrome activates
 * `env(safe-area-inset-*)` (requires `viewport-fit: cover`) and so the
 * initial scale is locked to 1 — without this the existing safe-area
 * classes across the app silently resolve to zero.
 *
 * `userScalable` is left at the platform default (true) so users with
 * accessibility needs can still pinch-zoom; we only prevent the implicit
 * auto-zoom on input focus via 16px font-size on form controls.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession()
  const locale = session?.user?.id
    ? getUserSettings(session.user.id).language
    : DEFAULT_APP_LANGUAGE

  return (
    <html
      lang={resolveHtmlLang(locale)}
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
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
  )
}
