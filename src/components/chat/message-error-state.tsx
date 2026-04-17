'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageErrorStateProps {
  onRetry: () => void
}

/**
 * Inline error card rendered below the last message when `status === 'error'`
 * (UI-SPEC §Copywriting "Error / abort states"). The retry CTA calls
 * `useChat.regenerate()` via the `onRetry` prop.
 *
 * Visual: red-toned border + subtle red-950 background; composer stays enabled
 * above, so the user may also type a new question instead of retrying.
 */
export function MessageErrorState({ onRetry }: MessageErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-red-900/40 bg-red-950/20 p-4 my-4">
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-semibold">Erro ao gerar resposta.</p>
      </div>
      <p className="text-sm text-zinc-400">
        Algo deu errado na conversa. Tente de novo em alguns segundos.
      </p>
      <Button onClick={onRetry} variant="secondary" size="sm">
        Tentar novamente
      </Button>
    </div>
  )
}
