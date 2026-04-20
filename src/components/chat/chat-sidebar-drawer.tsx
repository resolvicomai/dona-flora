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
        className="w-72 rounded-r-xl !gap-0 !border-border !bg-card/95 p-0 !shadow-mac-lg backdrop-blur-xl"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border !px-4 !py-3">
          <SheetTitle className="text-base font-medium text-foreground">
            Conversas
          </SheetTitle>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Nova conversa"
            onClick={newChat}
            className="h-8 w-8 min-h-[44px] min-w-[44px] rounded-md border border-border bg-background/80 text-foreground shadow-mac-sm backdrop-blur-xl hover:!bg-accent"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </SheetHeader>
        <SidebarBody chats={chats} activeChatId={activeChatId} />
      </SheetContent>
    </Sheet>
  )
}
