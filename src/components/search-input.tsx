'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
}

/**
 * Controlled search input with a lucide Search icon on the leading side.
 *
 * NO internal debounce — Plan 02's `search-params.ts` applies `throttleMs: 150`
 * on the nuqs `q` parser, so every keystroke can flow straight up.
 *
 * Default placeholder (UI-SPEC Copywriting Contract): `Buscar por título, autor ou notas...`
 * Width recipe (PATTERNS §search-input.tsx): `md:w-72` — mobile expands via parent `flex-1`.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar por título, autor ou notas...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative md:w-72', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar na biblioteca"
        className="h-8 rounded-md border-border bg-card/90 pl-9 shadow-mac-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}
