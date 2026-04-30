'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BookmarkPlus, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { LibraryBookCardInline } from './library-book-card-inline'
import { getChatCopy } from './chat-language'

interface Props {
  isPending?: boolean
  slugs: string[]
  suggestedTitle?: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * AI-04 capture artifact rendered below an assistant message when the
 * librarian produces a sequence of 2+ library book cards.
 *
 * Layout (UI-SPEC §Component Inventory line 184):
 *   - Card wrapper with a heading + save control at top.
 *   - Ordered list of LibraryBookCardInline entries numbered 1..N in a left
 *     chip.
 *
 * Save flow (UI-SPEC §Persistence point 3 + UI-D20):
 *   - idle: `Salvar trilha` button (BookmarkPlus icon)
 *   - saving: loading spinner, disabled button with aria-busy
 *   - saved: Check icon + "Trilha salva" plus a direct link to the saved trail
 *     page, so the user has an obvious place to continue.
 *   - error: pt-BR error copy + retry button that invokes handleSave again.
 *
 * Persistence target: POST /api/trails (Plan 03). The route Zod-validates
 * every book_refs entry against the kebab-case slug regex, so slugs built
 * from tool outputs still pass through a server-side gate — the client
 * never writes directly to the filesystem.
 */
export function ReadingTrailArtifact({ isPending = false, slugs, suggestedTitle }: Props) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const [state, setState] = useState<SaveState>('idle')
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const canSave = slugs.length >= 2 && !isPending

  async function handleSave() {
    setState('saving')
    try {
      const title = suggestedTitle?.trim() || copy.trail.defaultTitle
      const res = await fetch('/api/trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, book_refs: slugs }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = (await res.json()) as { slug?: string }
      setSavedSlug(payload.slug ?? null)
      setState('saved')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="brand-panel my-4 flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-card-foreground">
            {isPending ? copy.trail.assembling : copy.trail.title}
          </h3>
          {isPending ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {copy.trail.assemblingBody}
            </p>
          ) : null}
        </div>
        {state === 'idle' && (
          <Button size="sm" onClick={handleSave} disabled={!canSave}>
            <BookmarkPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            {copy.trail.save}
          </Button>
        )}
        {state === 'saving' && (
          <Button size="sm" disabled aria-busy="true">
            <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            {copy.trail.saving}
          </Button>
        )}
        {state === 'saved' && (
          <div className="flex items-center gap-2">
            <span className="brand-chip inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-foreground">
              <Check className="h-4 w-4" aria-hidden="true" />
              {copy.trail.saved}
            </span>
            {savedSlug ? (
              <Button size="sm" variant="secondary" render={<Link href={`/trails/${savedSlug}`} />}>
                {copy.trail.open}
              </Button>
            ) : null}
          </div>
        )}
        {state === 'error' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-destructive">{copy.trail.error}</span>
            <Button size="sm" variant="secondary" onClick={handleSave}>
              {copy.trail.retry}
            </Button>
          </div>
        )}
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {slugs.map((slug, i) => (
          <li key={`${slug}-${i}`} className="flex items-start gap-3">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-hairline bg-surface font-mono text-xs font-medium text-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <LibraryBookCardInline slug={slug} />
            </div>
          </li>
        ))}
        {isPending ? (
          <li className="flex items-start gap-3" aria-hidden="true">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-hairline bg-surface font-mono text-xs font-medium text-muted-foreground">
              ...
            </span>
            <div className="h-16 min-w-0 flex-1 rounded-md border border-hairline bg-surface motion-safe:animate-pulse" />
          </li>
        ) : null}
      </ol>
    </div>
  )
}
