'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/star-rating'
import { Button } from '@/components/ui/button'
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
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Track dirty state
  const isDirty =
    status !== initialStatus ||
    rating !== (initialRating ?? 0) ||
    notes !== initialNotes

  // Auto-resize textarea
  useEffect(() => {
    if (editingNotes && textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  }, [editingNotes, notes])

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      const body: Record<string, unknown> = { status }
      if (rating > 0) body.rating = rating
      if (notes !== initialNotes) body.notes = notes
      const res = await fetch(`/api/books/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setFeedback('Alteracoes salvas.')
      setTimeout(() => setFeedback(null), 3000)
      router.refresh()
    } catch {
      setFeedback('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status select */}
      <div className="flex items-center gap-4">
        <Label className="text-sm text-zinc-400 w-16">Status:</Label>
        <Select
          value={status}
          onValueChange={(v) => {
            if (v) setStatus(v as BookStatus)
          }}
        >
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
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-4">
        <Label className="text-sm text-zinc-400 w-16">Nota:</Label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {/* Notes section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-zinc-400">Minhas notas</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingNotes(!editingNotes)}
          >
            {editingNotes ? 'Concluir edicao' : 'Editar notas'}
          </Button>
        </div>

        {editingNotes ? (
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Suas notas pessoais sobre este livro..."
            className="min-h-[120px] bg-zinc-800 border-zinc-700 resize-none"
          />
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            {renderedNotes ? (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: renderedNotes }}
              />
            ) : (
              <p className="text-sm text-zinc-500 italic">
                Nenhuma nota ainda. Clique em &apos;Editar notas&apos; para
                comecar.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save button + feedback */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
        >
          {saving ? 'Salvando...' : 'Salvar alteracoes'}
        </Button>
        {feedback && (
          <p
            className={`text-sm ${
              feedback.includes('Erro') ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {feedback}
          </p>
        )}
      </div>
    </div>
  )
}
