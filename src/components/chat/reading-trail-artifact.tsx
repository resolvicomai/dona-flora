'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookmarkPlus, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LibraryBookCardInline } from './library-book-card-inline'

interface Props {
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
 *   - saved: Check icon + "Trilha salva" chip visible for 3 seconds, then
 *     automatically returns to idle (the row simply becomes the idle button
 *     again — this is the "sumiço após 3s" contract in §UI-D20).
 *   - error: pt-BR error copy + retry button that invokes handleSave again.
 *
 * Persistence target: POST /api/trails (Plan 03). The route Zod-validates
 * every book_refs entry against the kebab-case slug regex, so slugs built
 * from tool outputs still pass through a server-side gate — the client
 * never writes directly to the filesystem.
 */
export function ReadingTrailArtifact({ slugs, suggestedTitle }: Props) {
  const router = useRouter()
  const [state, setState] = useState<SaveState>('idle')

  async function handleSave() {
    setState('saving')
    try {
      const title = suggestedTitle?.trim() || 'Trilha de leitura'
      const res = await fetch('/api/trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, book_refs: slugs }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setState('saved')
      router.refresh()
      // Transient 3-second "Trilha salva" chip — reverts to idle without
      // forcing the user to dismiss anything (UI-D20).
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('error')
    }
  }

  return (
    <div className="my-4 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">
          Trilha de leitura sugerida
        </h3>
        {state === 'idle' && (
          <Button size="sm" onClick={handleSave}>
            <BookmarkPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Salvar trilha
          </Button>
        )}
        {state === 'saving' && (
          <Button size="sm" disabled aria-busy="true">
            <Loader2
              className="mr-2 h-4 w-4 motion-safe:animate-spin"
              aria-hidden="true"
            />
            Salvando…
          </Button>
        )}
        {state === 'saved' && (
          <span className="inline-flex items-center gap-2 text-sm text-green-500">
            <Check className="h-4 w-4" aria-hidden="true" />
            Trilha salva
          </span>
        )}
        {state === 'error' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-500">
              Não consegui salvar a trilha.
            </span>
            <Button size="sm" variant="secondary" onClick={handleSave}>
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {slugs.map((slug, i) => (
          <li key={`${slug}-${i}`} className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <LibraryBookCardInline slug={slug} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
