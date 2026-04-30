/**
 * Three-dot "thinking" indicator rendered inside the assistant bubble while
 * status === 'submitted' (UI-SPEC §Streaming Affordances §Typing dots).
 *
 * Accessibility: the dots are purely decorative (aria-hidden). The spoken
 * announcement of "Dona Flora está respondendo." flows through a separate
 * aria-live region in ChatMain / MessageList — see UI-SPEC §Accessibility
 * Contract lines 487-488.
 *
 * Reduced motion: `motion-safe:animate-pulse` — Tailwind suppresses the
 * animation under `prefers-reduced-motion: reduce` (UI-SPEC line 498).
 */
export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 px-1 py-2" aria-hidden="true">
      {[0, 200, 400].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}
