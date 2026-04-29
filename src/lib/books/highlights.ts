export interface BookHighlight {
  note?: string
  page?: number
  quote: string
}

function extractHighlightsSection(markdown: string) {
  const match = /(?:^|\n)##\s+Highlights\s*\n([\s\S]*?)(?=\n##\s+|\s*$)/i.exec(
    markdown,
  )

  return match?.[1] ?? ''
}

export function parseHighlights(markdown: string): BookHighlight[] {
  const section = extractHighlightsSection(markdown)
  if (!section.trim()) {
    return []
  }

  const highlights: BookHighlight[] = []
  const lines = section.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('-')) continue

    const item = trimmed.replace(/^-\s*/, '')
    const match =
      /^(?:p\.?\s*(\d+)\s*:?\s*)?["“](.+?)["”]\s*(?:[—-]\s*(.+))?$/u.exec(
        item,
      )
    if (!match) continue

    const page = match[1] ? Number(match[1]) : undefined
    const quote = match[2]?.trim()
    const note = match[3]?.trim()

    if (!quote) continue

    highlights.push({
      ...(note ? { note } : {}),
      ...(page != null ? { page } : {}),
      quote,
    })
  }

  return highlights
}
