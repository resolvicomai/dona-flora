'use client'

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { StarRating } from '@/components/star-rating'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

type TagMode = 'replace' | 'add' | 'remove'

interface BulkEditBooksDialogProps {
  selectedSlugs: string[]
  onComplete: () => void
}

type SaveStatus =
  | {
      kind: 'error' | 'success'
      message: string
    }
  | null

const BULK_COPY: Record<
  AppLanguage,
  {
    apply: string
    applying: string
    cancel: string
    currentPageDescription: string
    currentPageLabel: string
    currentPagePlaceholder: string
    emptyRemoves: string
    fieldRequired: string
    noRating: string
    noSelection: string
    priorityDescription: string
    priorityLabel: string
    priorityPlaceholder: string
    progressDescription: string
    progressLabel: string
    progressPlaceholder: string
    ratingDescription: string
    ratingLabel: string
    statusDescription: string
    statusLabel: string
    submit: string
    success: (updatedCount: number) => string
    partialSuccess: (updatedCount: number, failedCount: number) => string
    tagsDescription: string
    tagsLabel: string
    tagsPlaceholder: string
    tagModes: Record<TagMode, string>
    title: (count: number) => string
    updateError: string
    explanation: string
  }
> = {
  'pt-BR': {
    apply: 'Aplicar mudanças',
    applying: 'Aplicando...',
    cancel: 'Cancelar',
    currentPageDescription: 'Página atual',
    currentPageLabel: 'Página',
    currentPagePlaceholder: 'ex: 42',
    emptyRemoves: 'Vazio remove o campo.',
    fieldRequired: 'Escolha pelo menos um campo para atualizar.',
    noRating: 'Sem nota',
    noSelection: 'Selecione pelo menos um livro antes de aplicar.',
    priorityDescription: '1 a 5',
    priorityLabel: 'Prioridade',
    priorityPlaceholder: 'ex: 5',
    progressDescription: '0 a 100%',
    progressLabel: 'Progresso',
    progressPlaceholder: 'ex: 100',
    ratingDescription: 'Use zero estrelas para remover a nota dos livros selecionados.',
    ratingLabel: 'Nota',
    statusDescription: 'Bom para marcar vários livros como lidos, lendo ou quero reler.',
    statusLabel: 'Status',
    submit: 'Editar em massa',
    success: (updatedCount) => `${updatedCount} livro(s) atualizado(s).`,
    partialSuccess: (updatedCount, failedCount) =>
      `${updatedCount} livro(s) atualizado(s), ${failedCount} com erro.`,
    tagsDescription: 'Separe por vírgula. Use substituir vazio para limpar tags.',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'filosofia, estudar, favoritos',
    tagModes: {
      add: 'Adicionar',
      remove: 'Remover',
      replace: 'Substituir',
    },
    title: (count) => `Editar ${count} livro(s)`,
    updateError: 'Não foi possível atualizar os livros.',
    explanation:
      'Só os campos marcados serão alterados. Os outros metadados do Markdown permanecem como estão.',
  },
  en: {
    apply: 'Apply changes',
    applying: 'Applying...',
    cancel: 'Cancel',
    currentPageDescription: 'Current page',
    currentPageLabel: 'Page',
    currentPagePlaceholder: 'e.g. 42',
    emptyRemoves: 'Empty removes the field.',
    fieldRequired: 'Choose at least one field to update.',
    noRating: 'No rating',
    noSelection: 'Select at least one book before applying.',
    priorityDescription: '1 to 5',
    priorityLabel: 'Priority',
    priorityPlaceholder: 'e.g. 5',
    progressDescription: '0 to 100%',
    progressLabel: 'Progress',
    progressPlaceholder: 'e.g. 100',
    ratingDescription: 'Use zero stars to remove the rating from selected books.',
    ratingLabel: 'Rating',
    statusDescription: 'Useful for marking several books as read, reading, or want to reread.',
    statusLabel: 'Status',
    submit: 'Bulk edit',
    success: (updatedCount) => `${updatedCount} book(s) updated.`,
    partialSuccess: (updatedCount, failedCount) =>
      `${updatedCount} book(s) updated, ${failedCount} failed.`,
    tagsDescription: 'Separate with commas. Use empty replace to clear tags.',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'philosophy, study, favorites',
    tagModes: {
      add: 'Add',
      remove: 'Remove',
      replace: 'Replace',
    },
    title: (count) => `Edit ${count} book(s)`,
    updateError: 'Could not update the books.',
    explanation:
      'Only checked fields will change. Other Markdown metadata stays as it is.',
  },
  es: {
    apply: 'Aplicar cambios',
    applying: 'Aplicando...',
    cancel: 'Cancelar',
    currentPageDescription: 'Página actual',
    currentPageLabel: 'Página',
    currentPagePlaceholder: 'ej: 42',
    emptyRemoves: 'Vacío elimina el campo.',
    fieldRequired: 'Elige al menos un campo para actualizar.',
    noRating: 'Sin nota',
    noSelection: 'Selecciona al menos un libro antes de aplicar.',
    priorityDescription: '1 a 5',
    priorityLabel: 'Prioridad',
    priorityPlaceholder: 'ej: 5',
    progressDescription: '0 a 100%',
    progressLabel: 'Progreso',
    progressPlaceholder: 'ej: 100',
    ratingDescription: 'Usa cero estrellas para quitar la nota de los libros seleccionados.',
    ratingLabel: 'Nota',
    statusDescription: 'Útil para marcar varios libros como leídos, leyendo o quiero releer.',
    statusLabel: 'Estado',
    submit: 'Editar en masa',
    success: (updatedCount) => `${updatedCount} libro(s) actualizado(s).`,
    partialSuccess: (updatedCount, failedCount) =>
      `${updatedCount} libro(s) actualizado(s), ${failedCount} con error.`,
    tagsDescription: 'Separa por comas. Usa reemplazar vacío para limpiar tags.',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'filosofía, estudiar, favoritos',
    tagModes: {
      add: 'Agregar',
      remove: 'Eliminar',
      replace: 'Reemplazar',
    },
    title: (count) => `Editar ${count} libro(s)`,
    updateError: 'No se pudieron actualizar los libros.',
    explanation:
      'Solo se cambiarán los campos marcados. Los demás metadatos del Markdown quedan como están.',
  },
  'zh-CN': {
    apply: '应用更改',
    applying: '应用中...',
    cancel: '取消',
    currentPageDescription: '当前页码',
    currentPageLabel: '页码',
    currentPagePlaceholder: '例如：42',
    emptyRemoves: '留空会移除此字段。',
    fieldRequired: '至少选择一个要更新的字段。',
    noRating: '无评分',
    noSelection: '应用前请至少选择一本书。',
    priorityDescription: '1 到 5',
    priorityLabel: '优先级',
    priorityPlaceholder: '例如：5',
    progressDescription: '0 到 100%',
    progressLabel: '进度',
    progressPlaceholder: '例如：100',
    ratingDescription: '使用零星可移除所选图书的评分。',
    ratingLabel: '评分',
    statusDescription: '适合批量标记为已读、在读或想重读。',
    statusLabel: '状态',
    submit: '批量编辑',
    success: (updatedCount) => `已更新 ${updatedCount} 本书。`,
    partialSuccess: (updatedCount, failedCount) =>
      `已更新 ${updatedCount} 本书，${failedCount} 本失败。`,
    tagsDescription: '用逗号分隔。选择替换并留空可清除标签。',
    tagsLabel: '标签',
    tagsPlaceholder: '哲学, 学习, 收藏',
    tagModes: {
      add: '添加',
      remove: '移除',
      replace: '替换',
    },
    title: (count) => `编辑 ${count} 本书`,
    updateError: '无法更新图书。',
    explanation: '只会更改勾选的字段。其他 Markdown 元数据会保持不变。',
  },
}

function parseTags(input: string) {
  return input
    .split(/[,\n]/)
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean)
}

export function BulkEditBooksDialog({
  selectedSlugs,
  onComplete,
}: BulkEditBooksDialogProps) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const copy = BULK_COPY[locale]
  const statusOptions = getStatusOptions(locale)
  const selectedCount = selectedSlugs.length
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null)

  const [applyStatus, setApplyStatus] = useState(true)
  const [status, setStatus] = useState<BookStatus>('lido')
  const [applyRating, setApplyRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [applyPriority, setApplyPriority] = useState(false)
  const [priority, setPriority] = useState('')
  const [applyProgress, setApplyProgress] = useState(false)
  const [progress, setProgress] = useState('')
  const [applyCurrentPage, setApplyCurrentPage] = useState(false)
  const [currentPage, setCurrentPage] = useState('')
  const [applyTags, setApplyTags] = useState(false)
  const [tagMode, setTagMode] = useState<TagMode>('add')
  const [tagsInput, setTagsInput] = useState('')

  const hasAnyUpdate =
    applyStatus ||
    applyRating ||
    applyPriority ||
    applyProgress ||
    applyCurrentPage ||
    applyTags

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveStatus(null)

    if (selectedSlugs.length === 0) {
      setSaveStatus({
        kind: 'error',
        message: copy.noSelection,
      })
      return
    }

    const updates: Record<string, unknown> = {}
    if (applyStatus) updates.status = status
    if (applyRating) updates.rating = rating > 0 ? rating : null
    if (applyPriority) {
      updates.priority = priority.trim() ? Number(priority) : null
    }
    if (applyProgress) {
      updates.progress = progress.trim() ? Number(progress) : null
    }
    if (applyCurrentPage) {
      updates.current_page = currentPage.trim() ? Number(currentPage) : null
    }
    if (applyTags) {
      const tags = parseTags(tagsInput)
      updates.tagMode = tagMode
      updates.tags = tagMode === 'replace' && tags.length === 0 ? null : tags
    }

    if (Object.keys(updates).length === 0) {
      setSaveStatus({
        kind: 'error',
        message: copy.fieldRequired,
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/books/bulk', {
        body: JSON.stringify({ slugs: selectedSlugs, updates }),
        headers: { 'content-type': 'application/json' },
        method: 'PATCH',
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        failed?: Array<{ slug: string }>
        updatedCount?: number
      } | null

      if (response.status >= 400) {
        throw new Error(payload?.error ?? copy.updateError)
      }

      const failedCount = payload?.failed?.length ?? 0
      const updatedCount = payload?.updatedCount ?? 0
      setSaveStatus({
        kind: failedCount > 0 ? 'error' : 'success',
        message:
          failedCount > 0
            ? copy.partialSuccess(updatedCount, failedCount)
            : copy.success(updatedCount),
      })

      if (updatedCount > 0) {
        router.refresh()
        onComplete()
      }
      if (failedCount === 0) {
        setOpen(false)
      }
    } catch (err) {
      setSaveStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : copy.updateError,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button disabled={selectedCount === 0} type="button">
            {copy.submit}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.title(selectedCount)}</DialogTitle>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <p className="text-sm leading-6 text-muted-foreground">
            {copy.explanation}
          </p>

          {saveStatus ? (
            <div
              className={
                saveStatus.kind === 'success'
                  ? 'brand-inset px-4 py-3 text-sm text-foreground'
                  : 'rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'
              }
            >
              {saveStatus.message}
            </div>
          ) : null}

          <BulkField
            checked={applyStatus}
            description={copy.statusDescription}
            label={copy.statusLabel}
            onCheckedChange={setApplyStatus}
          >
            <Select
              value={status}
              onValueChange={(value) => value && setStatus(value as BookStatus)}
            >
              <SelectTrigger className="w-full md:max-w-xs">
                <SelectValue>{(value) => getStatusLabel(value, locale)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </BulkField>

          <BulkField
            checked={applyRating}
            description={copy.ratingDescription}
            label={copy.ratingLabel}
            onCheckedChange={setApplyRating}
          >
            <div className="flex flex-wrap items-center gap-3">
              <StarRating value={rating} onChange={setRating} />
              <Button
                onClick={() => setRating(0)}
                type="button"
                variant="ghost"
              >
                {copy.noRating}
              </Button>
            </div>
          </BulkField>

          <div className="grid gap-3 md:grid-cols-3">
            <NumberBulkField
              checked={applyPriority}
              description={copy.priorityDescription}
              emptyRemoves={copy.emptyRemoves}
              label={copy.priorityLabel}
              max={5}
              min={1}
              onCheckedChange={setApplyPriority}
              onValueChange={setPriority}
              placeholder={copy.priorityPlaceholder}
              value={priority}
            />
            <NumberBulkField
              checked={applyProgress}
              description={copy.progressDescription}
              emptyRemoves={copy.emptyRemoves}
              label={copy.progressLabel}
              max={100}
              min={0}
              onCheckedChange={setApplyProgress}
              onValueChange={setProgress}
              placeholder={copy.progressPlaceholder}
              value={progress}
            />
            <NumberBulkField
              checked={applyCurrentPage}
              description={copy.currentPageDescription}
              emptyRemoves={copy.emptyRemoves}
              label={copy.currentPageLabel}
              min={0}
              onCheckedChange={setApplyCurrentPage}
              onValueChange={setCurrentPage}
              placeholder={copy.currentPagePlaceholder}
              value={currentPage}
            />
          </div>

          <BulkField
            checked={applyTags}
            description={copy.tagsDescription}
            label={copy.tagsLabel}
            onCheckedChange={setApplyTags}
          >
            <div className="grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)]">
              <Select
                value={tagMode}
                onValueChange={(value) => value && setTagMode(value as TagMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">{copy.tagModes.add}</SelectItem>
                  <SelectItem value="remove">{copy.tagModes.remove}</SelectItem>
                  <SelectItem value="replace">{copy.tagModes.replace}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder={copy.tagsPlaceholder}
                value={tagsInput}
              />
            </div>
          </BulkField>

          <div className="flex flex-col-reverse gap-2 border-t border-hairline pt-4 sm:flex-row sm:justify-end">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              {copy.cancel}
            </Button>
            <Button disabled={saving || !hasAnyUpdate} type="submit">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {copy.applying}
                </>
              ) : (
                copy.apply
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BulkField({
  checked,
  children,
  description,
  label,
  onCheckedChange,
}: {
  checked: boolean
  children: ReactNode
  description: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <section className="brand-inset space-y-3 px-4 py-3">
      <label className="flex items-start gap-3">
        <input
          checked={checked}
          className="mt-1 h-4 w-4 accent-[var(--primary)]"
          onChange={(event) => onCheckedChange(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block font-medium text-foreground">{label}</span>
          <span className="block text-sm leading-6 text-muted-foreground">
            {description}
          </span>
        </span>
      </label>
      {checked ? children : null}
    </section>
  )
}

function NumberBulkField({
  checked,
  description,
  emptyRemoves,
  label,
  max,
  min,
  onCheckedChange,
  onValueChange,
  placeholder,
  value,
}: {
  checked: boolean
  description: string
  emptyRemoves: string
  label: string
  max?: number
  min: number
  onCheckedChange: (checked: boolean) => void
  onValueChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <BulkField
      checked={checked}
      description={`${description}. ${emptyRemoves}`}
      label={label}
      onCheckedChange={onCheckedChange}
    >
      <Label className="sr-only">{label}</Label>
      <Input
        max={max}
        min={min}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        type="number"
        value={value}
      />
    </BulkField>
  )
}
