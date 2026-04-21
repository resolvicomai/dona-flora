import type { AppLanguage } from '@/lib/i18n/app-language'

import type { BookStatus } from './schema'

/**
 * Localized source of truth for each BookStatus. Consumed by Select trigger
 * render functions, StatusBadge, and browse surfaces that need a
 * human-readable status.
 */
export const STATUS_LABELS: Record<AppLanguage, Record<BookStatus, string>> = {
  'pt-BR': {
    'quero-ler': 'Quero ler',
    'lendo': 'Lendo',
    'lido': 'Lido',
    'quero-reler': 'Quero reler',
    'abandonado': 'Abandonado',
  },
  en: {
    'quero-ler': 'Want to read',
    'lendo': 'Reading',
    'lido': 'Read',
    'quero-reler': 'Want to reread',
    'abandonado': 'Dropped',
  },
  es: {
    'quero-ler': 'Quiero leer',
    'lendo': 'Leyendo',
    'lido': 'Leído',
    'quero-reler': 'Quiero releer',
    'abandonado': 'Abandonado',
  },
  'zh-CN': {
    'quero-ler': '想读',
    'lendo': '在读',
    'lido': '已读',
    'quero-reler': '想重读',
    'abandonado': '已弃读',
  },
}

const STATUS_PLACEHOLDERS: Record<AppLanguage, string> = {
  'pt-BR': 'Selecione um status',
  en: 'Select a status',
  es: 'Selecciona un estado',
  'zh-CN': '请选择状态',
}

/**
 * Ordered option list for dropdowns. Preserves the preferred display order:
 * backlog (quero-ler) -> active (lendo) -> done (lido) -> replay (quero-reler) -> dropped (abandonado).
 */
const STATUS_ORDER: BookStatus[] = [
  'quero-ler',
  'lendo',
  'lido',
  'quero-reler',
  'abandonado',
]

export function getStatusOptions(locale: AppLanguage = 'pt-BR') {
  return STATUS_ORDER.map((value) => ({
    value,
    label: STATUS_LABELS[locale][value],
  }))
}

/**
 * Resolve a status value to its localized label.
 * - Known BookStatus -> mapped label
 * - null/undefined   -> generic placeholder (used when Select has no value yet)
 * - Unknown string   -> the string itself (resilience: never blank out a legacy .md file
 *                       that a user hand-edited with a custom status value)
 */
export function getStatusLabel(
  value: BookStatus | string | null | undefined,
  locale: AppLanguage = 'pt-BR',
): string {
  if (value == null) return STATUS_PLACEHOLDERS[locale]
  if (value in STATUS_LABELS[locale]) return STATUS_LABELS[locale][value as BookStatus]
  return value
}
