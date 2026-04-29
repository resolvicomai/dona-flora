/**
 * Blinking 2px × 1em bar that appears at the tail of the last assistant text
 * part while `status === 'streaming'` (UI-SPEC §Typography line 99 + UI-D19).
 *
 * Purely visual (aria-hidden). Reduced-motion friendly via
 * `motion-safe:animate-pulse`.
 */
export function StreamingCursor() {
  return (
    <span
      className="ml-[1px] inline-block h-[1em] w-[2px] animate-pulse bg-primary align-baseline motion-reduce:animate-none"
      aria-hidden="true"
    />
  )
}
