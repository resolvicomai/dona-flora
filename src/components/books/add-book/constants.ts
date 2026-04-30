import type { BookLanguageFilter } from '@/lib/books/language'

export type Step = 'search' | 'results' | 'preview' | 'manual' | 'saving'

export const BOOK_LANGUAGE_FILTER_OPTIONS: Array<{
  label: string
  value: BookLanguageFilter
}> = [
  { label: 'PT-BR', value: 'pt-BR' },
  { label: 'EN', value: 'en' },
  { label: 'ES', value: 'es' },
  { label: '中文', value: 'zh-CN' },
]
