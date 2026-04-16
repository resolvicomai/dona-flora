import type { BookStatus } from './schema'

/**
 * Single source of truth for pt-BR labels of each BookStatus.
 * Consumed by Select trigger render functions, StatusBadge, and any future
 * UI surface that needs to display a human-readable status.
 */
export const STATUS_LABELS: Record<BookStatus, string> = {
  'quero-ler': 'Quero ler',
  'lendo': 'Lendo',
  'lido': 'Lido',
  'quero-reler': 'Quero reler',
  'abandonado': 'Abandonado',
}

/**
 * Ordered option list for dropdowns. Preserves the preferred display order:
 * backlog (quero-ler) -> active (lendo) -> done (lido) -> replay (quero-reler) -> dropped (abandonado).
 */
export const STATUS_OPTIONS: ReadonlyArray<{ value: BookStatus; label: string }> = [
  { value: 'quero-ler', label: STATUS_LABELS['quero-ler'] },
  { value: 'lendo', label: STATUS_LABELS['lendo'] },
  { value: 'lido', label: STATUS_LABELS['lido'] },
  { value: 'quero-reler', label: STATUS_LABELS['quero-reler'] },
  { value: 'abandonado', label: STATUS_LABELS['abandonado'] },
] as const

/**
 * Resolve a status value to its pt-BR label.
 * - Known BookStatus -> mapped label
 * - null/undefined   -> generic placeholder (used when Select has no value yet)
 * - Unknown string   -> the string itself (resilience: never blank out a legacy .md file
 *                       that a user hand-edited with a custom status value)
 */
export function getStatusLabel(
  value: BookStatus | string | null | undefined,
): string {
  if (value == null) return 'Selecione um status'
  if (value in STATUS_LABELS) return STATUS_LABELS[value as BookStatus]
  return value
}
