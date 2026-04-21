import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVerifiedRequestSession } from '@/lib/auth/server'
import { searchGoogleBooks } from '@/lib/api/google-books'
import { searchOpenLibrary } from '@/lib/api/open-library'
import type { BookSearchResult } from '@/lib/api/google-books'

export const dynamic = 'force-dynamic'

const SearchSchema = z.object({
  query: z.string().min(2),
  language: z.string().trim().optional().default('all'),
  startIndex: z.coerce.number().int().nonnegative().optional().default(0),
  page: z.coerce.number().int().min(1).optional().default(1),
})

export async function POST(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.error('[API] POST /api/books/search invalid JSON:', err)
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const result = SearchSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const limit = 20
  const requestedLanguage =
    result.data.language === 'all' ? undefined : result.data.language
  let results: BookSearchResult[] = []
  let googleError: unknown = null
  try {
    results = requestedLanguage
      ? await searchGoogleBooks(
          result.data.query,
          limit,
          result.data.startIndex,
          requestedLanguage,
        )
      : await searchGoogleBooks(
          result.data.query,
          limit,
          result.data.startIndex,
        )
  } catch (err) {
    googleError = err
    console.warn(
      '[API] Google Books failed, falling back to Open Library:',
      err instanceof Error ? err.message : err
    )
  }

  if (results.length === 0) {
    try {
      results = requestedLanguage
        ? await searchOpenLibrary(
            result.data.query,
            limit,
            result.data.page,
            requestedLanguage,
          )
        : await searchOpenLibrary(
            result.data.query,
            limit,
            result.data.page,
          )
    } catch (err) {
      console.error(
        '[API] Both providers failed. Google error:',
        googleError,
        'Open Library error:',
        err
      )
      return NextResponse.json(
        { error: 'Erro ao buscar livros. Tente novamente em instantes.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(results)
}
