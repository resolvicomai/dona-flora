import fs from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionStorageContext,
  requireVerifiedRequestSession,
} from '@/lib/auth/server'
import { getBook } from '@/lib/books/library-service'
import {
  buildCoverPlaceholderSVG,
  cacheRemoteCover,
  findCachedCover,
} from '@/lib/covers/cache'
import { ensureStorageContext } from '@/lib/storage/context'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const { slug } = await params
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    return NextResponse.json({ error: 'Slug invalido.' }, { status: 400 })
  }

  const context = await ensureStorageContext(
    getSessionStorageContext(authResult.session),
  )
  const cached = await findCachedCover(context, slug)
  if (cached) {
    const body = await fs.readFile(cached.filepath)
    return new NextResponse(body, {
      headers: {
        'cache-control': 'private, max-age=86400',
        'content-type': cached.contentType,
      },
    })
  }

  const book = await getBook(slug, context)
  if (!book) {
    return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 })
  }

  if (book.cover) {
    const remote = await cacheRemoteCover({
      context,
      slug,
      url: book.cover,
    })

    if (remote) {
      const body = await fs.readFile(remote.filepath)
      return new NextResponse(body, {
        headers: {
          'cache-control': 'private, max-age=86400',
          'content-type': remote.contentType,
        },
      })
    }
  }

  return new NextResponse(buildCoverPlaceholderSVG(book), {
    headers: {
      'cache-control': 'private, max-age=3600',
      'content-type': 'image/svg+xml; charset=utf-8',
    },
  })
}
