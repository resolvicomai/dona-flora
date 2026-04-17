'use client'

import type { ChatSummary } from '@/lib/chats/schema'
import type { LibrarianMessage } from '@/lib/chats/types'

// PLACEHOLDER — Plan 06 replaces this with the MessageList + Composer streaming surface.
// Keep the exported signature (ChatMain + ChatMainProps) stable so Plan 05's
// ChatShell does not need updating when Plan 06 lands.

export interface ChatMainProps {
  chatId?: string
  initialMessages?: LibrarianMessage[]
  chats: ChatSummary[]
  bookCount: number
  seedBook: { slug: string; title: string; author: string } | null
}

export function ChatMain(props: ChatMainProps) {
  // Plan 06 consumes all ChatMainProps fields; placeholder only renders copy.
  void props
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <p className="text-sm text-zinc-400 italic max-w-md text-center">
        Em construção — o chat é ativado na próxima etapa.
      </p>
    </div>
  )
}
