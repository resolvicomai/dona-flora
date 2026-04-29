'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
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
 * Default placeholder (UI-SPEC Copywriting Contract): `Buscar por título, autor ou notas…`
 * Width recipe (PATTERNS §search-input.tsx): `md:w-72` — mobile expands via parent `flex-1`.
 */
export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  const { locale } = useAppLanguage()
  const copy = {
    'pt-BR': {
      ariaLabel: 'Buscar na biblioteca',
      placeholder: 'Buscar por título, autor ou notas…',
    },
    en: {
      ariaLabel: 'Search the library',
      placeholder: 'Search by title, author, or notes…',
    },
    es: {
      ariaLabel: 'Buscar en la biblioteca',
      placeholder: 'Buscar por título, autor o notas…',
    },
    'zh-CN': {
      ariaLabel: '搜索书库',
      placeholder: '按标题、作者或笔记搜索…',
    },
  }[locale]

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? copy.placeholder}
        aria-label={copy.ariaLabel}
        className="h-11 rounded-md pl-11 pr-4"
      />
    </div>
  )
}
