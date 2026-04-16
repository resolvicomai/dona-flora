import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchGoogleBooks } from '@/lib/api/google-books'
import { searchOpenLibrary } from '@/lib/api/open-library'

export const dynamic = 'force-dynamic'

const SearchSchema = z.object({
  query: z.string().min(2),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = SearchSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    let results = await searchGoogleBooks(result.data.query)
    if (results.length === 0) {
      results = await searchOpenLibrary(result.data.query)
    }
    return NextResponse.json(results)
  } catch (err) {
    console.error('[API] POST /api/books/search error:', err)
    return NextResponse.json(
      { error: 'Erro ao buscar livros.' },
      { status: 500 }
    )
  }
}
