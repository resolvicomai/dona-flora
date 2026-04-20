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
        'relative flex w-full max-w-[75ch] min-h-14 flex-col gap-0.5 rounded-md border border-dashed border-border/60 bg-transparent px-3 py-2 pr-20 shadow-none',
        className,
      )}
    >
      <span className="absolute top-2 right-3 inline-flex items-center rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-[10px] font-medium leading-none text-warning">
        Fora do acervo
      </span>
      <span className="line-clamp-1 text-sm font-medium text-foreground">
        {title} — {author}
      </span>
      <span className="text-xs text-muted-foreground line-clamp-1">
        {reason}
      </span>
    </div>
  )
}
