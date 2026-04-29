import { formatBookLanguageLabel } from '@/lib/books/language'

interface BookLanguageBadgeProps {
  language?: string | null
}

export function BookLanguageBadge({ language }: BookLanguageBadgeProps) {
  const label = formatBookLanguageLabel(language)
  if (!label) return null

  return (
    <span className="inline-flex items-center rounded-md border border-hairline bg-surface-strong px-2 py-1 font-mono text-[0.68rem] font-semibold tracking-normal text-foreground/78">
      {label}
    </span>
  )
}
