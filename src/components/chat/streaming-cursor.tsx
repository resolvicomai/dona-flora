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
      className="inline-block w-[2px] h-[1em] bg-zinc-400 ml-[1px] motion-safe:animate-pulse align-baseline"
      aria-hidden="true"
    />
  )
}
