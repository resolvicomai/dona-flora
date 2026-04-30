'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { AppLanguageSwitcher } from '@/components/app-shell/app-language-switcher'
import { ThemeToggle } from '@/components/app-shell/theme-toggle'
import { BrandPromise } from './brand-promise'
import { authShellCopy, signUpStoryCopy } from './copy'
import { SignUpCardContext } from './sign-up-card-context'
import { SignUpOnboardingStory } from './sign-up-onboarding-story'

interface AuthShellProps {
  children: ReactNode
  description: string
  eyebrow: string
  footer?: ReactNode
  title: string
}

export function AuthShell({ children, description, eyebrow, footer, title }: AuthShellProps) {
  const pathname = usePathname()
  const { copy, locale } = useAppLanguage()

  const route = pathname.startsWith('/sign-up')
    ? 'signUp'
    : pathname.startsWith('/forgot-password')
      ? 'forgotPassword'
      : pathname.startsWith('/reset-password')
        ? 'resetPassword'
        : pathname.startsWith('/verify-email')
          ? 'verifyEmail'
          : 'signIn'

  const shellCopy = copy.shell
  const routeCopy = authShellCopy[locale][route]
  const isSignUp = route === 'signUp'
  const signUpStory = signUpStoryCopy[locale]

  return (
    <div className="page-frame flex flex-1 flex-col gap-4 py-6 md:gap-6 md:py-10">
      <header className="mx-auto flex w-full justify-center">
        <div className="brand-window inline-flex max-w-full items-center justify-center gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="inline-flex min-w-0 items-center gap-3">
            <span className="truncate text-lg font-semibold tracking-normal text-foreground sm:text-xl">
              Dona Flora
            </span>
            <span className="eyebrow hidden sm:block">{shellCopy.brandSubtitle}</span>
          </Link>

          <span aria-hidden="true" className="hidden h-6 w-px bg-hairline sm:block" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AppLanguageSwitcher mode="local" />
          </div>
        </div>
      </header>

      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,32rem)] lg:items-start">
        <section className="brand-panel hidden p-8 lg:flex lg:self-start lg:flex-col lg:gap-10">
          {isSignUp ? (
            <SignUpOnboardingStory locale={locale} />
          ) : (
            <BrandPromise shellCopy={shellCopy} />
          )}
        </section>

        <section className="brand-window mx-auto flex w-full max-w-xl flex-col p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">{routeCopy?.eyebrow ?? eyebrow}</p>
            <h2 className="text-[clamp(2rem,5vw,3.15rem)] font-semibold leading-none tracking-normal text-foreground">
              {routeCopy?.title ?? title}
            </h2>
            <p className="max-w-lg text-sm leading-7 text-muted-foreground">
              {routeCopy?.description ?? description}
            </p>
          </div>

          {isSignUp ? <SignUpCardContext story={signUpStory} /> : null}

          <div className="mt-8 flex flex-col gap-4">{children}</div>

          {footer ? (
            <div className="mt-6 border-t border-hairline pt-5 text-sm text-muted-foreground">
              {routeCopy?.footer ? <p>{routeCopy.footer}</p> : footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
