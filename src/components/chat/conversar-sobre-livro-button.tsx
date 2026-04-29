'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { getChatCopy } from './chat-language'

interface Props {
  slug: string
  titulo: string
}

/**
 * CTA on `/books/[slug]` that deep-links into `/chat?about={slug}`.
 *
 * Deep-link contract (UI-SPEC §Deep-link, UI-D9/UI-D10):
 *   - Navigates to `/chat?about={slug}` WITHOUT submitting the message.
 *   - ChatPage (Plan 05) validates slug presence in knownSlugs and pre-fills
 *     the composer with the pt-BR seed. If the slug isn't recognised, the
 *     ?about= param is silently ignored.
 *   - `encodeURIComponent` defends the URL even when slugs are already kebab —
 *     a future change that loosens the slug format (e.g. permits accents) will
 *     not leak unsafe characters through this component.
 *
 * Accessibility:
 *   - aria-label "Conversar sobre {titulo} com a Dona Flora" — screen readers
 *     announce the specific book instead of the generic visible label.
 *   - The Sparkles icon is decorative (aria-hidden="true"); the visible text
 *     "Conversar sobre este livro" remains the primary affordance.
 */
export function ConversarSobreLivroButton({ slug, titulo }: Props) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)

  return (
    <Button
      aria-label={copy.bookCta.aboutBookAria(titulo)}
      render={<Link href={`/chat?about=${encodeURIComponent(slug)}`} />}
      className="shadow-mac-sm"
    >
      <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
      {copy.bookCta.aboutBookLabel}
    </Button>
  )
}
