'use client'

import { cn } from '@/lib/utils'

interface ExternalBookMentionProps {
  title: string
  author: string
  reason: string
  className?: string
}

/**
 * Inline, non-interactive marker for books the librarian brings from outside
 * the user's library. Visually distinct from LibraryBookCardInline through a
 * dashed border, amber badge, and text-only treatment so the user can tell at
 * a glance that the book is NOT in their collection.
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
    <div
      role="note"
      aria-label={`Livro fora do acervo: ${title} de ${author}`}
      title={reason}
      className={cn(
        'relative flex w-full max-w-[75ch] min-h-16 flex-col gap-1 rounded-[1.35rem] rounded-md-compat border border-dashed border-hairline bg-transparent px-3.5 py-3 pr-24 shadow-none',
        className,
      )}
    >
      <span className="absolute top-3 right-3 inline-flex items-center rounded-full border border-hairline bg-surface px-2.5 py-1 text-[10px] font-medium leading-none tracking-[0.08em] text-muted-foreground uppercase">
        Fora do acervo
      </span>
      <span className="sr-only">externo</span>
      <span className="line-clamp-1 text-sm font-medium tracking-[-0.02em] text-foreground">
        {title} — {author}
      </span>
      <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">
        {reason}
      </span>
    </div>
  )
}
