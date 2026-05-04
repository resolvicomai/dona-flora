'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks the height of the on-screen virtual keyboard via the VisualViewport
 * API so sticky-bottom UI (the chat composer, mobile drawers) can lift above
 * it instead of getting buried.
 *
 * iOS Safari/Chrome do not adjust `100vh`, `position: sticky`, or
 * `position: fixed` in response to the keyboard opening — the layout viewport
 * stays the same while the visual viewport shrinks. The difference between
 * `window.innerHeight` and `window.visualViewport.height` is the keyboard
 * height (or, more accurately, the obscured area: keyboard + accessory bars).
 *
 * Returns 0 when:
 *  - the API is not available (older browsers, server-side render)
 *  - no keyboard is open
 *  - the difference is below the noise threshold (10px) which would otherwise
 *    flicker on each scroll due to URL bar dynamics
 *
 * Consumers can either:
 *  - use the returned number (e.g. as inline style)
 *  - read `--keyboard-inset` on the root, which this hook also writes
 */
export function useVirtualKeyboard(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) return

    function update() {
      if (!vv) return
      // window.innerHeight is the layout viewport; vv.height is the visual one.
      // When the keyboard opens, vv.height shrinks. vv.offsetTop also moves.
      const obscured = window.innerHeight - vv.height - vv.offsetTop
      const next = obscured > 10 ? Math.round(obscured) : 0
      setKeyboardHeight((prev) => (prev === next ? prev : next))
      document.documentElement.style.setProperty('--keyboard-inset', `${next}px`)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      document.documentElement.style.setProperty('--keyboard-inset', '0px')
    }
  }, [])

  return keyboardHeight
}
