import fs from 'fs/promises'
import path from 'path'
import type { StorageContext } from '@/lib/storage/context'
import type { Book } from '@/lib/books/schema'
import { getBookAuthorsDisplay } from '@/lib/books/authors'
export { getBookCoverRoute, getCoverRoute } from './url'

const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const EXTERNAL_PLACEHOLDER_HOSTS = new Set(['placehold.co', 'placehold.it', 'via.placeholder.com'])

function safeSlug(slug: string) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    return null
  }

  return slug
}

export function isExternalPlaceholderCover(url: string) {
  try {
    const parsed = new URL(url)
    return EXTERNAL_PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export async function findCachedCover(context: StorageContext, slug: string) {
  const safe = safeSlug(slug)
  if (!safe) return null

  for (const extension of COVER_EXTENSIONS) {
    const filepath = path.join(
      /* turbopackIgnore: true */ context.coversDir,
      `${safe}.${extension}`,
    )
    try {
      await fs.access(filepath)
      return {
        contentType: CONTENT_TYPE_BY_EXTENSION[extension],
        filepath,
      }
    } catch {
      // keep looking
    }
  }

  return null
}

export async function cacheRemoteCover(input: {
  context: StorageContext
  slug: string
  url: string
}) {
  const safe = safeSlug(input.slug)
  if (!safe) return null

  let response: Response
  try {
    response = await fetch(input.url, {
      signal: AbortSignal.timeout(2500),
    })
  } catch {
    return null
  }

  if (!response.ok) {
    return null
  }

  const contentType = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType]
  if (!extension) {
    return null
  }

  await fs.mkdir(input.context.coversDir, { recursive: true })
  const filepath = path.join(
    /* turbopackIgnore: true */ input.context.coversDir,
    `${safe}.${extension}`,
  )
  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(filepath, buffer)

  return { contentType, filepath }
}

function escapeSVG(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function splitLongWord(word: string, maxLength: number) {
  const chunks: string[] = []
  for (let index = 0; index < word.length; index += maxLength) {
    chunks.push(word.slice(index, index + maxLength))
  }
  return chunks
}

function ellipsize(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function wrapText(value: string, maxLineLength: number, maxLines: number) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const words = normalized
    .split(' ')
    .flatMap((word) => (word.length > maxLineLength ? splitLongWord(word, maxLineLength) : [word]))
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxLineLength) {
      current = next
      continue
    }

    if (current) lines.push(current)
    current = word

    if (lines.length === maxLines) break
  }

  if (lines.length < maxLines && current) {
    lines.push(current)
  }

  if (lines.length > maxLines) {
    lines.length = maxLines
  }

  const consumed = lines.join(' ')
  if (consumed.length < normalized.length && lines.length > 0) {
    lines[lines.length - 1] = ellipsize(lines[lines.length - 1], maxLineLength)
  }

  return lines
}

function renderTextLines(lines: string[], startY: number, lineHeight: number) {
  return lines
    .map(
      (line, index) =>
        `<tspan x="300" y="${startY + index * lineHeight}">${escapeSVG(line)}</tspan>`,
    )
    .join('')
}

export function buildCoverPlaceholderSVG(book: Pick<Book, 'author' | 'title'>) {
  const title = book.title.trim() || 'Livro'
  const author = getBookAuthorsDisplay(book)
  const palette = [
    ['#f3efe2', '#1f2a24', '#bf5f37'],
    ['#e8ead9', '#273f36', '#846c46'],
    ['#f0e4d8', '#2f2a26', '#8c3f2f'],
    ['#dde6df', '#172c2a', '#9a6b2e'],
  ] as const
  const [background, foreground, accent] = palette[hashString(`${title}${author}`) % palette.length]
  const titleLines = wrapText(title, 20, 4)
  const authorLines = wrapText(author, 24, 2)
  const titleStartY = 336 - Math.max(0, titleLines.length - 1) * 26
  const authorStartY = 522 + Math.max(0, titleLines.length - 2) * 12

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img">
  <rect width="600" height="900" fill="${background}"/>
  <rect x="42" y="42" width="516" height="816" rx="28" fill="none" stroke="${foreground}" stroke-opacity="0.22" stroke-width="3"/>
  <path d="M84 157h432M84 744h432" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
  <text text-anchor="middle" fill="${foreground}" font-family="Georgia, serif" font-size="42" font-weight="700" letter-spacing="-0.8">
    ${renderTextLines(titleLines, titleStartY, 52)}
  </text>
  <text text-anchor="middle" fill="${foreground}" fill-opacity="0.75" font-family="Georgia, serif" font-size="27">
    ${renderTextLines(authorLines, authorStartY, 38)}
  </text>
</svg>`
}
