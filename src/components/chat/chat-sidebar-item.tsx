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
        'group relative flex items-center gap-1 rounded-xl transition-colors',
        'hover:bg-zinc-800 focus-within:bg-zinc-800',
        active && 'bg-zinc-800 border-l-2 border-zinc-100',
      )}
    >
      <Link
        href={`/chat/${chat.id}`}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex-1 flex flex-col gap-1 p-3 min-h-[44px] no-underline',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-xl',
        )}
      >
        <p className="text-sm font-semibold text-zinc-100 line-clamp-1">
          {chat.title}
        </p>
        {label && (
          <time dateTime={chat.updated_at} className="text-xs text-zinc-400">
            {label}
          </time>
        )}
      </Link>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir conversa ${chat.title}`}
              className="mr-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-zinc-400 hover:text-red-400"
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
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              {deleting ? 'Excluindo…' : 'Excluir conversa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
