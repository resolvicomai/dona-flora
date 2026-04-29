'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function LibraryWatchRefresh() {
  const router = useRouter()

  useEffect(() => {
    const events = new EventSource('/api/library/events')
    events.addEventListener('library-change', () => {
      router.refresh()
    })
    events.addEventListener('disabled', () => {
      events.close()
    })
    events.onerror = () => {
      events.close()
    }

    return () => events.close()
  }, [router])

  return null
}
