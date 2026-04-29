import { NextRequest } from 'next/server'
import {
  getSessionStorageContext,
  requireVerifiedRequestSession,
} from '@/lib/auth/server'
import {
  isLibraryWatchEnabled,
  subscribeToLibraryChanges,
} from '@/lib/library/watch'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function encodeEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const encoder = new TextEncoder()

  if (!isLibraryWatchEnabled()) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(encodeEvent('disabled', {})))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'cache-control': 'no-cache',
        connection: 'keep-alive',
        'content-type': 'text/event-stream; charset=utf-8',
      },
    })
  }

  const context = getSessionStorageContext(authResult.session)
  let unsubscribe: (() => Promise<void>) | null = null

  const stream = new ReadableStream({
    async cancel() {
      await unsubscribe?.()
    },
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(encodeEvent(event, data)))
      }

      send('ready', { booksDir: context.booksDir })
      unsubscribe = await subscribeToLibraryChanges({
        booksDir: context.booksDir,
        onChange: () => send('library-change', { at: Date.now() }),
        userId: authResult.session.user.id,
      })

      request.signal.addEventListener('abort', () => {
        unsubscribe?.().catch(() => {})
      })
    },
  })

  return new Response(stream, {
    headers: {
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'content-type': 'text/event-stream; charset=utf-8',
    },
  })
}
