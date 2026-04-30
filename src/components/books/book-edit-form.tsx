'use client'

import { useState, useRef, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/books/star-rating'
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
import type { AppLanguage } from '@/lib/i18n/app-language'

interface BookEditFormProps {
  slug: string
  initialStatus: BookStatus
  initialRating: number | undefined
  initialNotes: string
  renderedNotes: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const EDIT_COPY: Record<
  AppLanguage,
  {
    clickToAddNotes: string
    clickToEdit: string
    markdownHelp: string
    notes: string
    notesPlaceholder: string
    rating: string
    saved: string
    saving: string
    saveError: string
    sectionEyebrow: string
    status: string
    title: string
  }
> = {
  'pt-BR': {
    clickToAddNotes: 'Clique para adicionar notas em Markdown…',
    clickToEdit: 'Clique para editar',
    markdownHelp:
      'Suporta Markdown: `# título`, `**negrito**`, `*itálico*`, `- lista`, `` `código` ``. Clique fora pra salvar.',
    notes: 'Minhas notas',
    notesPlaceholder: 'Suas notas pessoais sobre este livro…',
    rating: 'Nota',
    saved: 'Alterações salvas.',
    saving: 'Salvando…',
    saveError: 'Erro ao salvar.',
    sectionEyebrow: 'Leitura',
    status: 'Status',
    title: 'Anotações e progresso',
  },
  en: {
    clickToAddNotes: 'Click to add Markdown notes…',
    clickToEdit: 'Click to edit',
    markdownHelp:
      'Supports Markdown: `# heading`, `**bold**`, `*italic*`, `- list`, `` `code` ``. Click outside to save.',
    notes: 'My notes',
    notesPlaceholder: 'Your personal notes about this book…',
    rating: 'Rating',
    saved: 'Changes saved.',
    saving: 'Saving…',
    saveError: 'Could not save.',
    sectionEyebrow: 'Reading',
    status: 'Status',
    title: 'Notes and progress',
  },
  es: {
    clickToAddNotes: 'Haz clic para agregar notas en Markdown…',
    clickToEdit: 'Haz clic para editar',
    markdownHelp:
      'Soporta Markdown: `# título`, `**negrita**`, `*cursiva*`, `- lista`, `` `código` ``. Haz clic fuera para guardar.',
    notes: 'Mis notas',
    notesPlaceholder: 'Tus notas personales sobre este libro…',
    rating: 'Nota',
    saved: 'Cambios guardados.',
    saving: 'Guardando…',
    saveError: 'Error al guardar.',
    sectionEyebrow: 'Lectura',
    status: 'Estado',
    title: 'Notas y progreso',
  },
  'zh-CN': {
    clickToAddNotes: '点击添加 Markdown 笔记…',
    clickToEdit: '点击编辑',
    markdownHelp:
      '支持 Markdown：`# 标题`、`**粗体**`、`*斜体*`、`- 列表`、`` `代码` ``。点击外部保存。',
    notes: '我的笔记',
    notesPlaceholder: '你对这本书的个人笔记…',
    rating: '评分',
    saved: '更改已保存。',
    saving: '保存中…',
    saveError: '保存失败。',
    sectionEyebrow: '阅读',
    status: '状态',
    title: '笔记与进度',
  },
}

export function BookEditForm({
  slug,
  initialStatus,
  initialRating,
  initialNotes,
  renderedNotes,
}: BookEditFormProps) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const copy = EDIT_COPY[locale]
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
    <div className="brand-window space-y-6 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{copy.sectionEyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-foreground">
            {copy.title}
          </h2>
        </div>
        <SaveIndicator copy={copy} state={saveState} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="space-y-3">
          <Label className="eyebrow">{copy.status}</Label>
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
          <Label className="eyebrow">{copy.rating}</Label>
          <StarRating value={rating} onChange={handleRatingChange} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="eyebrow">{copy.notes}</Label>

        {editingNotes ? (
          <Textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder={copy.notesPlaceholder}
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
            className="surface-transition min-h-[140px] cursor-text rounded-lg border border-hairline bg-surface p-5 hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-ring"
            title={copy.clickToEdit}
          >
            {renderedNotes ? (
              <div
                className="markdown-content max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedNotes }}
              />
            ) : (
              <p className="text-sm italic text-muted-foreground">{copy.clickToAddNotes}</p>
            )}
          </div>
        )}

        <p className="text-xs leading-6 text-muted-foreground">{copy.markdownHelp}</p>
      </div>
    </div>
  )
}

function SaveIndicator({
  copy,
  state,
}: {
  copy: (typeof EDIT_COPY)[AppLanguage]
  state: SaveState
}) {
  if (state === 'idle') return null
  const label = state === 'saving' ? copy.saving : state === 'saved' ? copy.saved : copy.saveError
  const tone =
    state === 'error'
      ? 'border-destructive/20 bg-destructive/10 text-destructive'
      : 'border-hairline bg-surface text-foreground'

  return (
    <span
      className={`inline-flex w-fit items-center rounded-md border px-3 py-1 font-mono text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  )
}
