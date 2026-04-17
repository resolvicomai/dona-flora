'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarBody } from './chat-sidebar'
import type { ChatSummary } from '@/lib/chats/schema'
import type { ReactElement } from 'react'

/**
 * Mobile drawer variant of the chat sidebar (shadcn `Sheet`, side="left").
 *
 * The trigger element is provided by the parent (ChatMain header in Plan 06)
 * as a React element so the menu button stays co-located with the chat header
 * layout — this component stays decoupled from the header chrome. The trigger
 * element receives base-ui's Dialog trigger props (click handler, aria-expanded)
 * via the `render` prop forwarding.
 *
 * Reuses `SidebarBody` from chat-sidebar.tsx so empty state and list rendering
 * are identical between desktop and mobile.
 */
interface Props {
  trigger: ReactElement
  chats: ChatSummary[]
  activeChatId?: string
}

export function ChatSidebarDrawer({ trigger, chats, activeChatId }: Props) {
  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="left"
        className="w-72 p-0 bg-zinc-900"
      >
        <SheetHeader className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-800">
          <SheetTitle className="text-xl font-semibold text-zinc-100">
            Conversas
          </SheetTitle>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Nova conversa"
            render={<Link href="/chat" />}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </SheetHeader>
        <SidebarBody chats={chats} activeChatId={activeChatId} />
      </SheetContent>
    </Sheet>
  )
}
