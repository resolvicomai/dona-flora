'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { getChatCopy } from './chat-language'

/**
 * Sparkles ghost button rendered in the app header (home and other library
 * pages). Navigates to `/chat` which opens either a new conversation or the
 * most recent one (ChatPage decides based on loadChat(id)).
 *
 * Visual contract comes from UI-SPEC §Entry points layout (lines 290-299):
 *   - variant="ghost" size="icon" h-10 w-10 (size="icon" maps to size-8 in the
 *     base-ui Button, which yields the 40×40 touch target via parent spacing).
 *   - aria-label "Conversar com a Dona Flora" serves both the a11y label and
 *     the tooltip text when shadcn Tooltip is wrapped around it.
 *
 * Tooltip decision: the spec permits deferring tooltip wiring if it introduces
 * provider plumbing. For Phase 4 close, we rely on the aria-label alone —
 * which is the accessibility-required surface — and skip the visual tooltip.
 * A future cross-cutting pass can wrap every icon-only button in a Tooltip
 * provider without affecting this component's contract.
 */
export function ChatHeaderEntryButton() {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={copy.bookCta.headerAria}
      render={<Link href="/chat" />}
      className="h-10 w-10 min-h-[44px] min-w-[44px]"
    >
      <Sparkles className="h-4 w-4" aria-hidden="true" />
    </Button>
  )
}
