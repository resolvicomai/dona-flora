'use client'

import { MessagesSquare } from 'lucide-react'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { getChatCopy } from './chat-language'

/**
 * Empty state for the chat sidebar (no conversations yet).
 *
 * Copy comes from UI-SPEC §Copywriting "Sidebar empty heading/body".
 * Icon is decorative (aria-hidden) — the heading carries meaning for
 * screen readers.
 */
export function SidebarEmptyState() {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div className="brand-inset flex h-16 w-16 items-center justify-center text-muted-foreground">
        <MessagesSquare className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{copy.sidebar.emptyTitle}</h2>
      <p className="max-w-sm text-sm leading-7 text-muted-foreground">{copy.sidebar.emptyBody}</p>
    </div>
  )
}
