'use client'

import { cn } from '@/lib/utils'

interface AvatarMonogramProps {
  className?: string
}

/**
 * Monogram avatar for Dona Flora, the librarian persona. Appears next
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
        'crt-screen flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md',
        className,
      )}
    >
      <span className="font-mono text-sm font-semibold" aria-hidden="true">
        DF
      </span>
    </div>
  )
}
