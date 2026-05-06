import type { BookSearchResult } from './google-books'
import { dedupeBooks, stripDiacritics } from './dedupe'
import { matchesBookLanguageFilter } from '@/lib/books/language'
import { normalizeISBN } from '@/lib/books/isbn'

const ALTA_BOOKS_STORE_API = 'https://altabooks.com.br/wp-json/wc/store/v1/products'
const ALTA_BOOKS_PUBLISHER = 'Alta Books'

type AltaBooksImage = {
  src?: string
}

type AltaBooksProduct = {
  images?: AltaBooksImage[]
  name?: string
  short_description?: string
  sku?: string
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function htmlToText(value: string | undefined): string | undefined {
  if (!value) return undefined

  const text = decodeHtml(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()

  return text || undefined
}

function extractTitleAttribute(html: string | undefined): string | undefined {
  const match = html?.match(/title="([^"]+)"/i)
  return match?.[1] ? decodeHtml(match[1]).trim() : undefined
}

function extractAuthors(text: string | undefined): string[] {
  const match = text?.match(/Autor(?:\(es\))?:\s*([^\n]+)/i)
  if (!match?.[1]) return []

  return match[1]
    .split(/\s*(?:,|;|\se\s)\s*/i)
    .map((author) => author.trim())
    .filter(Boolean)
}

function stripMetadataLines(text: string | undefined): string | undefined {
  if (!text) return undefined

  const cleaned = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^Autor(?:\(es\))?:/i.test(line))
    .join('\n')
    .trim()

  return cleaned || undefined
}

function formatBrazilianISBN13(value: string): string | null {
  const normalized = normalizeISBN(value)
  if (normalized?.kind !== 'isbn_13') return null

  const digits = normalized.value
  if (!digits.startsWith('97885') && !digits.startsWith('97985')) return null

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8, 12)}-${digits.slice(12)}`
}

function queryVariants(query: string): string[] {
  const trimmed = query.trim()
  const variants = new Set<string>([trimmed])
  const normalizedISBN = normalizeISBN(trimmed)

  if (normalizedISBN) {
    variants.add(normalizedISBN.value)
    const brazilianISBN = formatBrazilianISBN13(normalizedISBN.value)
    if (brazilianISBN) variants.add(brazilianISBN)
  }

  const accentless = stripDiacritics(trimmed)
  if (accentless !== trimmed) variants.add(accentless)

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (!normalizedISBN && words.length > 2) {
    variants.add(words.slice(0, 2).join(' '))
    variants.add(stripDiacritics(words.slice(0, 2).join(' ')))
  }

  return [...variants].filter(Boolean)
}

function toBookSearchResult(product: AltaBooksProduct): BookSearchResult | null {
  const title = htmlToText(product.name)?.trim()
  if (!title) return null

  const normalizedISBN = normalizeISBN(product.sku)
  const descriptionText = htmlToText(product.short_description)
  const subtitle = extractTitleAttribute(product.short_description)
  const authors = extractAuthors(descriptionText)
  const synopsis = stripMetadataLines(descriptionText)
  const cover = product.images?.find((image) => image.src)?.src

  return {
    title,
    authors,
    isbn: normalizedISBN?.value,
    isbn10: normalizedISBN?.kind === 'isbn_10' ? normalizedISBN.value : undefined,
    isbn13: normalizedISBN?.kind === 'isbn_13' ? normalizedISBN.value : undefined,
    subtitle,
    publisher: ALTA_BOOKS_PUBLISHER,
    synopsis,
    synopsisSource: ALTA_BOOKS_PUBLISHER,
    cover,
    coverSource: cover ? 'alta-books' : undefined,
    source: 'alta-books',
    language: 'pt-BR',
  }
}

async function fetchAltaBooksOnce(query: string, limit: number): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    per_page: String(limit),
    search: query,
  })

  const response = await fetch(`${ALTA_BOOKS_STORE_API}?${params}`, {
    headers: { 'User-Agent': 'DonaFlora/1.0 (personal book catalog)' },
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) {
    throw new Error(`[AltaBooks] API error: ${response.status}`)
  }

  const products = (await response.json()) as AltaBooksProduct[]
  return products.map(toBookSearchResult).filter((book): book is BookSearchResult => book !== null)
}

export async function searchAltaBooks(
  query: string,
  limit = 5,
  language?: string,
): Promise<BookSearchResult[]> {
  if (query.trim().length < 3) return []
  if (language && !matchesBookLanguageFilter('pt-BR', language)) return []

  const settled = await Promise.allSettled(
    queryVariants(query).map((variant) => fetchAltaBooksOnce(variant, limit)),
  )
  const successes = settled
    .filter((result): result is PromiseFulfilledResult<BookSearchResult[]> => {
      return result.status === 'fulfilled'
    })
    .flatMap((result) => result.value)

  if (successes.length > 0) {
    return dedupeBooks(successes, limit)
  }

  const firstError = settled.find((result) => result.status === 'rejected')
  if (firstError?.status === 'rejected') {
    throw firstError.reason
  }

  return []
}
