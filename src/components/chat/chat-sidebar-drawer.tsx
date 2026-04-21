'use client'

import { Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarBody, useNewChatHandler } from './chat-sidebar'
import type { ChatListEntry } from '@/lib/chats/list'
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
  chats: ChatListEntry[]
  activeChatId?: string
}

export function ChatSidebarDrawer({ trigger, chats, activeChatId }: Props) {
  const newChat = useNewChatHandler()
  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="left"
        className="!gap-0 p-0"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-hairline !px-4 !py-4">
          <SheetTitle className="text-lg font-medium tracking-[-0.03em] text-foreground">
            Conversas
          </SheetTitle>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Nova conversa"
            onClick={newChat}
            className="h-10 w-10 min-h-[44px] min-w-[44px]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </SheetHeader>
        <SidebarBody chats={chats} activeChatId={activeChatId} />
      </SheetContent>
    </Sheet>
  )
}
