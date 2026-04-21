'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatSummary } from '@/lib/chats/schema'

interface ChatSidebarItemProps {
  chat: ChatSummary
  active: boolean
}

/**
 * Single conversation entry in the sidebar.
 *
 * Delete action: hover-reveals a trash button; AlertDialog confirms before
 * calling DELETE /api/chats/{id}. On success the server tree refreshes so
 * the sidebar list re-reads; if the user was currently ON that chat, we
 * bounce to /chat (new conversation) with a full reload so useChat resets.
 */
export function ChatSidebarItem({ chat, active }: ChatSidebarItemProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const updated = new Date(chat.updated_at)
  const label = Number.isNaN(updated.getTime())
    ? ''
    : formatDistanceToNow(updated, { locale: ptBR, addSuffix: true })

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/chats/${chat.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 404) {
        console.error('[sidebar] delete failed:', res.status)
        setDeleting(false)
        return
      }
      setOpen(false)
      if (pathname === `/chat/${chat.id}`) {
        window.location.assign('/chat')
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('[sidebar] delete error:', err)
      setDeleting(false)
    }
  }

  return (
    <div
      className={cn(
        'group surface-transition relative flex items-stretch rounded-[1.25rem] border border-transparent',
        'hover:bg-foreground/[0.04] focus-within:bg-foreground/[0.04]',
        active &&
          'border-hairline border-l-2 border-l-zinc-100 border-zinc-100/0 bg-foreground/[0.06] shadow-mac-sm',
      )}
    >
      <Link
        href={`/chat/${chat.id}`}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-[44px] flex-1 flex-col gap-1 px-3.5 py-3 no-underline',
          'focus-visible:outline-none focus-visible:ring-2',
          'rounded-md focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <p className="line-clamp-1 text-sm font-medium tracking-[-0.02em] text-foreground">
          {chat.title}
        </p>
        {label && (
          <time dateTime={chat.updated_at} className="text-xs text-muted-foreground">
            {label}
          </time>
        )}
      </Link>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir conversa ${chat.title}`}
              className="mr-2 h-9 w-9 min-h-[44px] min-w-[44px] opacity-0 text-muted-foreground hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
            />
          }
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              A conversa &ldquo;{chat.title}&rdquo; será removida permanentemente
              do disco. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
              size="sm"
            >
              {deleting ? 'Excluindo…' : 'Excluir conversa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
