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
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center">
      <MessagesSquare className="h-16 w-16 text-zinc-700" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-zinc-100">
        Nenhuma conversa ainda.
      </h2>
      <p className="max-w-sm text-sm text-zinc-400">
        Suas conversas com a Dona Flora aparecem aqui.
      </p>
    </div>
  )
}
