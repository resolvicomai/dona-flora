'use client'

import { cn } from '@/lib/utils'

interface AvatarMonogramProps {
  className?: string
}

/**
 * Circular monogram avatar for Dona Flora, the librarian persona. Appears next
 * to every assistant message (UI-D3) as the persona's visible signature.
 *
 * Accessibility contract (UI-SPEC §Accessibility):
 * - Wrapper is role="img" with aria-label="Dona Flora" so screen readers
 *   announce the persona name rather than spelling out the letters.
 * - The inner 'DF' text is aria-hidden to prevent duplicate "D F" reading.
 */
export function AvatarMonogram({ className }: AvatarMonogramProps) {
  return (
    <div
      role="img"
      aria-label="Dona Flora"
      className={cn(
        'glass-pill flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-glass-border bg-zinc-800/70 text-white',
        className,
      )}
    >
      <span className="text-sm font-semibold tracking-[-0.03em]" aria-hidden="true">
        DF
      </span>
    </div>
  )
}
