'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Check, Pencil, Pin, Trash2, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, es, ptBR, zhCN } from 'date-fns/locale'
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
import { Input } from '@/components/ui/input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { cn } from '@/lib/utils'
import type { ChatListEntry } from '@/lib/chats/list'
import { getChatCopy } from './chat-language'

interface ChatSidebarItemProps {
  chat: ChatListEntry
  active: boolean
  onDeleted?: (chatId: string) => void
  onUpdated?: (chat: ChatListEntry) => void
}

/**
 * Single conversation entry in the sidebar.
 *
 * Delete action: hover-reveals a trash button; AlertDialog confirms before
 * calling DELETE /api/chats/{id}. On success the server tree refreshes so
 * the sidebar list re-reads; if the user was currently ON that chat, we
 * bounce to /chat (new conversation) with a full reload so useChat resets.
 */
export function ChatSidebarItem({ active, chat, onDeleted, onUpdated }: ChatSidebarItemProps) {
  const pathname = usePathname()
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftTitle, setDraftTitle] = useState(chat.title)
  const [actionError, setActionError] = useState('')

  const updated = new Date(chat.updated_at)
  const label = Number.isNaN(updated.getTime())
    ? ''
    : formatDistanceToNow(updated, {
        locale: locale === 'en' ? enUS : locale === 'es' ? es : locale === 'zh-CN' ? zhCN : ptBR,
        addSuffix: true,
      })
  const preview = getChatPreview(chat.content, copy.item.youLabel, copy.item.externalLabel)

  async function patchChat(payload: { title?: string; pinned?: boolean }) {
    setSaving(true)
    setActionError('')
    try {
      const res = await fetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        setActionError(copy.item.updateError)
        setSaving(false)
        return
      }
      const responsePayload = (await res.json()) as { chat?: ChatListEntry }
      if (responsePayload.chat) {
        onUpdated?.({ ...responsePayload.chat, content: chat.content })
      }
      setEditing(false)
      setSaving(false)
    } catch (err) {
      void err
      setActionError(copy.item.updateError)
      setSaving(false)
    }
  }

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = draftTitle.trim()
    if (!nextTitle || nextTitle === chat.title) {
      setEditing(false)
      setDraftTitle(chat.title)
      return
    }
    void patchChat({ title: nextTitle })
  }

  async function handleDelete() {
    setDeleting(true)
    setActionError('')
    try {
      const res = await fetch(`/api/chats/${chat.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 404) {
        setActionError(copy.item.deleteError)
        setDeleting(false)
        return
      }
      setOpen(false)
      if (active || pathname === `/chat/${chat.id}`) {
        window.location.assign('/chat')
      } else {
        onDeleted?.(chat.id)
      }
    } catch (err) {
      void err
      setActionError(copy.item.deleteError)
      setDeleting(false)
    }
  }

  return (
    <div
      className={cn(
        'group surface-transition relative flex items-stretch rounded-md border border-transparent',
        'hover:bg-foreground/[0.04] focus-within:bg-foreground/[0.04]',
        active &&
          'border-hairline-strong border-l-2 border-l-primary bg-foreground/[0.06] shadow-none',
        chat.pinned && !active && 'bg-primary/[0.06]',
      )}
    >
      {editing ? (
        <form
          className="flex min-h-[44px] flex-1 flex-col gap-2 px-3.5 py-3"
          onSubmit={handleRename}
        >
          <Input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            aria-label={copy.item.titleInputAria}
            className="h-9 bg-background/65 text-sm font-semibold"
            autoFocus
            maxLength={80}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="xs" disabled={saving}>
              <Check className="h-3 w-3" aria-hidden="true" />
              {copy.item.save}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setEditing(false)
                setDraftTitle(chat.title)
              }}
              disabled={saving}
            >
              <X className="h-3 w-3" aria-hidden="true" />
              {copy.item.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <Link
          href={`/chat/${chat.id}`}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex min-h-[44px] flex-1 flex-col gap-1.5 px-3.5 py-3 pr-28 no-underline',
            'focus-visible:outline-none focus-visible:ring-2',
            'rounded-md focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {chat.pinned ? (
              <Pin className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" aria-hidden="true" />
            ) : null}
            <p className="line-clamp-1 text-sm font-semibold text-foreground">{chat.title}</p>
          </div>
          {preview ? (
            <p className="line-clamp-2 text-[0.78rem] leading-5 text-foreground/78">{preview}</p>
          ) : null}
          {label && (
            <time dateTime={chat.updated_at} className="text-xs text-muted-foreground">
              {label}
            </time>
          )}
        </Link>
      )}
      {!editing ? (
        <div
          className={cn(
            'pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-md bg-surface/88 p-1 shadow-none',
            'opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={
              chat.pinned ? copy.item.unpinAria(chat.title) : copy.item.pinAria(chat.title)
            }
            onClick={() => void patchChat({ pinned: !chat.pinned })}
            disabled={saving || deleting}
            className={cn('h-8 w-8 min-h-[32px] min-w-[32px]', chat.pinned && 'text-primary')}
          >
            <Pin className={cn('h-3.5 w-3.5', chat.pinned && 'fill-current')} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={copy.item.renameAria(chat.title)}
            onClick={() => setEditing(true)}
            disabled={saving || deleting}
            className="h-8 w-8 min-h-[32px] min-w-[32px]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={copy.item.deleteAria(chat.title)}
                  className="h-8 w-8 min-h-[32px] min-w-[32px] text-muted-foreground hover:text-destructive"
                />
              }
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.item.deleteTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {copy.item.deleteDescription(chat.title)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{copy.item.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  variant="destructive"
                  size="sm"
                >
                  {deleting ? copy.item.deleting : copy.item.deleteConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
      {actionError ? (
        <p
          aria-live="polite"
          className="absolute bottom-1 left-3 right-3 text-[0.72rem] font-medium text-destructive"
        >
          {actionError}
        </p>
      ) : null}
    </div>
  )
}

function getChatPreview(content: string, youLabel: string, externalLabel: string) {
  return content
    .replace(/^##\s+Você\s+—.*$/gm, `${youLabel}:`)
    .replace(/^##\s+Dona Flora\s+—.*$/gm, 'Dona Flora:')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^>\s*external:/gm, `${externalLabel}:`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)
}
