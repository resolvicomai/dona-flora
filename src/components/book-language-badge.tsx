import { formatBookLanguageLabel } from '@/lib/books/language'

interface BookLanguageBadgeProps {
  language?: string | null
}

export function BookLanguageBadge({ language }: BookLanguageBadgeProps) {
  const label = formatBookLanguageLabel(language)
  if (!label) return null

  return (
    <span className="inline-flex items-center rounded-full border border-hairline bg-surface px-2.5 py-1 text-[0.68rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
      {label}
    </span>
  )
}
