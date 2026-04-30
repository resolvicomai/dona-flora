'use client'

import { useEffect, useRef } from 'react'
import { SendHorizontal, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { cn } from '@/lib/utils'
import { getChatCopy } from './chat-language'

interface ComposerProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  autoFocusOnMount?: boolean
}

/**
 * Sticky-bottom form with a controlled Textarea + contextual Send/Stop button.
 *
 * Keyboard contract (UI-SPEC §Keyboard Shortcuts):
 *  - Enter (no shift): submit if input non-empty AND status === 'ready'.
 *  - Shift+Enter: default textarea behavior (newline).
 *  - Escape (while busy): calls onStop() to abort the stream.
 *
 * The textarea auto-expands from `min-h-14` up to `max-h-48`. The textarea
 * primitive already uses CSS `field-sizing: content`; the ref-based height
 * adjustment is a belt-and-suspenders fallback for older browsers (same
 * pattern as `book-edit-form.tsx`).
 *
 * Busy states:
 *  - 'submitted': textarea stays enabled but paints as "busy" via
 *    `aria-busy` + `opacity-60`. A `disabled` textarea drops in-flight IME
 *    compositions (pt-BR users typing accents) and steals focus away mid-
 *    keystroke — the WR-03 regression from iteration 1. Stop button is the
 *    visible affordance; Enter is swallowed by the canSend guard so the
 *    composer is still effectively input-locked against submits.
 *  - 'streaming': textarea stays enabled (user may queue the next question);
 *    Stop button still autoFocused.
 *  - 'ready': Send button, disabled until `input.trim().length > 0`.
 *  - 'error': same as 'ready' — composer enabled so the user may type again.
 *
 * Touch targets are ≥ 44×44px on both buttons (UI-SPEC §Accessibility).
 * iOS safe area honored via `pb-[env(safe-area-inset-bottom)]`.
 */
export function Composer({
  input,
  onInputChange,
  onSubmit,
  onStop,
  status,
  autoFocusOnMount,
}: ComposerProps) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Height adjustment: auto → scrollHeight (capped at 192px ≈ max-h-48).
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 192)}px`
  }, [input])

  useEffect(() => {
    if (autoFocusOnMount && textareaRef.current) {
      textareaRef.current.focus()
      // Put cursor at the end so seed-pre-filled text is editable without
      // selecting-then-replacing.
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [autoFocusOnMount])

  const isBusy = status === 'submitted' || status === 'streaming'
  const canSend = status === 'ready' && input.trim().length > 0

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Never insert a newline on plain Enter — it's a submit key here.
      // Only actually submit when preconditions are met.
      e.preventDefault()
      if (canSend) onSubmit()
      return
    }
    if (e.key === 'Escape' && isBusy) {
      e.preventDefault()
      onStop()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSubmit()
      }}
      className="sticky bottom-0 z-20 shrink-0 border-t border-hairline-strong bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex w-full max-w-4xl items-end gap-3 p-4 md:px-6">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label={copy.composer.ariaLabel}
          placeholder={copy.composer.placeholder}
          rows={1}
          // WR-03: aria-busy instead of disabled — lets IME compositions
          // (pt-BR accents, diacritics) complete without stealing focus.
          // Submit gating lives in canSend; aria-busy tells assistive tech
          // that the response is in flight.
          aria-busy={status === 'submitted'}
          className={cn(
            '!min-h-14 max-h-48 flex-1 resize-none !rounded-md !border-hairline-strong !bg-background/55 px-4 py-3 text-sm shadow-none placeholder:text-muted-foreground',
            status === 'submitted' && 'opacity-60',
          )}
        />
        {isBusy ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={copy.composer.stopAria}
            onClick={onStop}
            autoFocus
            className="h-11 w-11 min-h-[44px] min-w-[44px]"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            aria-label={copy.composer.sendAria}
            disabled={!canSend}
            className="h-11 w-11 min-h-[44px] min-w-[44px]"
          >
            <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </form>
  )
}
