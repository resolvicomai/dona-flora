'use client'

import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExternalBookMentionProps {
  title: string
  author: string
  reason: string
  className?: string
}

/**
 * Inline, non-interactive marker for books the librarian brings from outside
 * the user's library. Visually distinct from LibraryBookCardInline (dashed
 * border + italic + "externo" chip + ArrowUpRight icon) so the user can tell
 * at a glance that the book is NOT in their collection.
 *
 * Semantics (UI-D4, UI-SPEC §Accessibility):
 * - role="note" so it's announced as auxiliary content, not as a landmark.
 * - aria-label carries "Sugestão externa: {title} de {author}" for a complete
 *   spoken phrase.
 * - Not a link, not a button, not a tab-stop — users should not be able to
 *   "click through" to an external URL from the chat surface.
 * - The `reason` prop surfaces via native `title` tooltip; Plan 06 may wrap
 *   this primitive in a shadcn Tooltip at the MessageBubble layer.
 */
export function ExternalBookMention({
  title,
  author,
  reason,
  className,
}: ExternalBookMentionProps) {
  return (
    <span
      role="note"
      aria-label={`Sugestão externa: ${title} de ${author}`}
      title={reason}
      className={cn(
        'inline-flex items-baseline gap-1 bg-transparent border border-dashed border-zinc-700',
        'text-zinc-300 rounded-md px-2 py-1 italic',
        className,
      )}
    >
      <span className="text-xs uppercase tracking-wide text-zinc-500 not-italic">
        externo
      </span>
      <span>
        {title} — {author}
      </span>
      <ArrowUpRight className="h-3 w-3 text-zinc-500" aria-hidden="true" />
    </span>
  )
}
