'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { StarRating } from '@/components/books/star-rating'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BookStatus } from '@/lib/books/schema'
import { getStatusLabel, getStatusOptions } from '@/lib/books/status-labels'
import { BulkField, NumberBulkField } from './bulk-field'
import { BULK_COPY } from './copy'
import type { BulkEditBooksDialogProps, SaveStatus, TagMode } from './types'

function parseTags(input: string) {
  return input
    .split(/[,\n]/)
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean)
}

export function BulkEditBooksDialog({ selectedSlugs, onComplete }: BulkEditBooksDialogProps) {
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
    applyStatus || applyRating || applyPriority || applyProgress || applyCurrentPage || applyTags

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
        message: err instanceof Error ? err.message : copy.updateError,
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
          <p className="text-sm leading-6 text-muted-foreground">{copy.explanation}</p>

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
              <Button onClick={() => setRating(0)} type="button" variant="ghost">
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
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
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
