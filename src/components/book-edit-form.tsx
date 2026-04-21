'use client'

import { useState, useRef, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/star-rating'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BookStatus } from '@/lib/books/schema'
import { getStatusLabel, getStatusOptions } from '@/lib/books/status-labels'

interface BookEditFormProps {
  slug: string
  initialStatus: BookStatus
  initialRating: number | undefined
  initialNotes: string
  renderedNotes: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function BookEditForm({
  slug,
  initialStatus,
  initialRating,
  initialNotes,
  renderedNotes,
}: BookEditFormProps) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const statusOptions = getStatusOptions(locale)
  const [status, setStatus] = useState<BookStatus>(initialStatus)
  const [rating, setRating] = useState(initialRating ?? 0)
  const [notes, setNotes] = useState(initialNotes)
  const [editingNotes, setEditingNotes] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (editingNotes && textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
      ta.focus()
      ta.setSelectionRange(ta.value.length, ta.value.length)
    }
  }, [editingNotes])

  useEffect(() => {
    if (editingNotes && textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  }, [notes, editingNotes])

  async function save(patch: Record<string, unknown>) {
    if (savedFlashTimer.current) {
      clearTimeout(savedFlashTimer.current)
      savedFlashTimer.current = null
    }
    setSaveState('saving')
    try {
      const res = await fetch(`/api/books/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error()
      setSaveState('saved')
      startTransition(() => {
        router.refresh()
      })
      savedFlashTimer.current = setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
    }
  }

  function handleStatusChange(v: string | null) {
    if (!v) return
    const next = v as BookStatus
    setStatus(next)
    if (next !== status) save({ status: next })
  }

  function handleRatingChange(v: number) {
    setRating(v)
    if (v !== rating) save({ rating: v > 0 ? v : null })
  }

  function handleNotesBlur() {
    setEditingNotes(false)
    if (notes !== initialNotes) save({ notes })
  }

  return (
    <div className="panel-solid space-y-6 rounded-[2rem] p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Leitura</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground">
            Anotações e progresso
          </h2>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="space-y-3">
          <Label className="text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
            Status
          </Label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v) => getStatusLabel(v, locale)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
            Nota
          </Label>
          <StarRating value={rating} onChange={handleRatingChange} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
          Minhas notas
        </Label>

        {editingNotes ? (
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Suas notas pessoais sobre este livro…"
            className="min-h-[220px] resize-none font-mono text-sm"
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setEditingNotes(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setEditingNotes(true)
              }
            }}
            className="surface-transition min-h-[140px] cursor-text rounded-[1.6rem] border border-hairline bg-surface p-5 hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-ring"
            title="Clique para editar"
          >
            {renderedNotes ? (
              <div
                className="markdown-content max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedNotes }}
              />
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Clique para adicionar notas em Markdown…
              </p>
            )}
          </div>
        )}

        <p className="text-xs leading-6 text-muted-foreground">
          Suporta Markdown: `# título`, `**negrito**`, `*itálico*`, `- lista`,
          `` `código` ``. Clique fora pra salvar.
        </p>
      </div>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  const label =
    state === 'saving'
      ? 'Salvando…'
      : state === 'saved'
        ? 'Alterações salvas.'
        : 'Erro ao salvar.'
  const tone =
    state === 'error'
      ? 'border-destructive/20 bg-destructive/10 text-destructive'
      : 'border-hairline bg-surface text-foreground'

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  )
}
