'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { getChatCopy } from './chat-language'

interface MessageErrorStateProps {
  error?: Error | null
  onRetry: () => void
}

function normalizeErrorMessage(message: string): string {
  return message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Detects errors that look like a chat-incompatible model selection (the
 * "reranker:latest does not support tools" / "model does not support chat
 * completion" family). When true, the error card adds a direct link to
 * Settings \u2192 AI provider so the user can fix the root cause without
 * hunting for the toggle.
 */
function isModelCapabilityError(rawMessage: string, normalized: string): boolean {
  if (!rawMessage) return false
  return (
    normalized.includes('does not support tools') ||
    normalized.includes('does not support chat') ||
    normalized.includes('not support tools') ||
    normalized.includes('especialista') ||
    normalized.includes('embedding') ||
    normalized.includes('reranker') ||
    normalized.includes('autocomplete')
  )
}

function getHelpfulErrorMessage(
  error: Error | null | undefined,
  copy: ReturnType<typeof getChatCopy>,
): string {
  const message = error?.message ?? ''
  const normalized = normalizeErrorMessage(message)

  // Surface the upstream provider's verbatim text when it explains a model
  // capability mismatch \u2014 that's actionable and the user needs to see it.
  if (isModelCapabilityError(message, normalized)) {
    return message
  }

  if (
    normalized.includes('ollama') ||
    normalized.includes('localhost') ||
    normalized.includes('127.0.0.1') ||
    normalized.includes('provider local')
  ) {
    return copy.error.localProviderMessage
  }

  return copy.error.genericMessage
}

/**
 * Inline error card rendered below the last message when `status === 'error'`
 * (UI-SPEC §Copywriting "Error / abort states"). The retry CTA calls
 * `useChat.regenerate()` via the `onRetry` prop.
 *
 * Visual: red-toned border + subtle red-950 background; composer stays enabled
 * above, so the user may also type a new question instead of retrying.
 */
export function MessageErrorState({ error, onRetry }: MessageErrorStateProps) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const helpfulMessage = getHelpfulErrorMessage(error, copy)
  const showSettingsLink = isModelCapabilityError(
    error?.message ?? '',
    normalizeErrorMessage(error?.message ?? ''),
  )

  return (
    <div className="my-4 flex flex-col items-start gap-3 rounded-md border border-destructive/20 bg-destructive/8 p-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-semibold">{copy.error.title}</p>
      </div>
      <p className="text-sm leading-7 text-muted-foreground">{helpfulMessage}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRetry} variant="secondary" size="sm">
          {copy.error.retry}
        </Button>
        {showSettingsLink ? (
          <Button render={<Link href="/settings?panel=local-ai" />} variant="outline" size="sm">
            {copy.error.openSettings}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
