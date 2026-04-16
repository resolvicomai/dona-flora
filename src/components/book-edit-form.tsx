'use client'

import { useState, useRef, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/star-rating'
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
import { STATUS_OPTIONS, getStatusLabel } from '@/lib/books/status-labels'

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Label className="text-sm text-zinc-400 w-16">Status:</Label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700">
            <SelectValue>{(v) => getStatusLabel(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SaveIndicator state={saveState} />
      </div>

      <div className="flex items-center gap-4">
        <Label className="text-sm text-zinc-400 w-16">Nota:</Label>
        <StarRating value={rating} onChange={handleRatingChange} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-zinc-400">Minhas notas</Label>

        {editingNotes ? (
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Suas notas pessoais sobre este livro..."
            className="min-h-[200px] bg-zinc-900 border-zinc-700 resize-none font-mono text-sm"
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
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 min-h-[120px] cursor-text transition hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            title="Clique para editar"
          >
            {renderedNotes ? (
              <div
                className="prose prose-invert prose-sm prose-zinc max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedNotes }}
              />
            ) : (
              <p className="text-sm text-zinc-500 italic">
                Clique para adicionar notas em Markdown...
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-zinc-500">
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
  const color =
    state === 'error'
      ? 'text-red-500'
      : state === 'saved'
        ? 'text-green-500'
        : 'text-zinc-400'
  return <span className={`text-xs ${color}`}>{label}</span>
}
