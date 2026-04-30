'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const REFRESH_DEBOUNCE_MS = 900

export function LibraryWatchRefresh() {
  const router = useRouter()

  useEffect(() => {
    const events = new EventSource('/api/library/events')
    let refreshTimer: number | null = null

    function scheduleRefresh() {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer)
      }
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null
        router.refresh()
      }, REFRESH_DEBOUNCE_MS)
    }

    events.addEventListener('library-change', () => {
      scheduleRefresh()
    })
    events.addEventListener('disabled', () => {
      events.close()
    })
    events.onerror = () => {
      events.close()
    }

    return () => {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer)
      }
      events.close()
    }
  }, [router])

  return null
}
