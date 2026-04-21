import { MessagesSquare } from 'lucide-react'

/**
 * Empty state for the chat sidebar (no conversations yet).
 *
 * Copy comes from UI-SPEC §Copywriting "Sidebar empty heading/body".
 * Icon is decorative (aria-hidden) — the heading carries meaning for
 * screen readers.
 */
export function SidebarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div className="glass-pill flex h-16 w-16 items-center justify-center rounded-full border border-glass-border text-muted-foreground">
        <MessagesSquare className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
        Nenhuma conversa ainda.
      </h2>
      <p className="max-w-sm text-sm leading-7 text-muted-foreground">
        Suas conversas com a Dona Flora aparecem aqui.
      </p>
    </div>
  )
}
