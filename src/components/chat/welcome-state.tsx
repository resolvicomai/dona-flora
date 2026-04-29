'use client'

import Link from 'next/link'
import { BookHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { getChatCopy } from './chat-language'

interface WelcomeStateProps {
  bookCount: number
}

/**
 * Initial empty-conversation state shown when `messages.length === 0`.
 *
 * Copy is prescribed by UI-SPEC §Copywriting "Welcome state" with three
 * pluralization branches:
 *  - `bookCount === 0`: onboarding-style body + CTA to `/` (biblioteca vazia)
 *  - `bookCount === 1`: singular "1 livro aqui"
 *  - `bookCount >= 2`: plural "N livros aqui"
 *
 * Persona: the heading is the stable signature "Oi! Sou a Dona Flora, sua
 * bibliotecária." (never varies in Phase 4 — fixes the brand).
 */
export function WelcomeState({ bookCount }: WelcomeStateProps) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)

  return (
    <div className="flex flex-1 flex-col items-center justify-start gap-5 px-4 pb-10 pt-24 text-center sm:justify-center sm:py-16 md:py-24">
      <div className="brand-inset hidden h-14 w-14 items-center justify-center text-muted-foreground sm:flex sm:h-18 sm:w-18">
        <BookHeart
          className="h-6 w-6 sm:h-8 sm:w-8"
          aria-hidden="true"
        />
      </div>
      <h2 className="section-title max-w-2xl text-balance text-foreground">
        {copy.welcome.heading}
      </h2>
      {bookCount === 0 ? (
        <>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            {copy.welcome.emptyBody}
          </p>
          <Button render={<Link href="/" />}>{copy.welcome.emptyCta}</Button>
        </>
      ) : bookCount === 1 ? (
        <p className="max-w-md text-sm leading-7 text-muted-foreground">
          {copy.welcome.singularBody}
        </p>
      ) : (
        <p className="max-w-md text-sm leading-7 text-muted-foreground">
          {copy.welcome.pluralBody(bookCount)}
        </p>
      )}
    </div>
  )
}
