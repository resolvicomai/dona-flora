import { parseAsArrayOf, parseAsString, parseAsStringLiteral, parseAsInteger } from 'nuqs'
import { BookStatusEnum } from './schema'

const STATUS_VALUES = BookStatusEnum.options
const SORT_KEYS = ['added_at', 'title', 'author', 'rating'] as const
const SORT_DIRS = ['asc', 'desc'] as const

/**
 * Single source of truth for the browse page URL state.
 * Every filter, the search query, and the sort config live in the URL so
 * the view is shareable/bookmarkable. `q` is throttled at 150ms (D-12) to
 * avoid one history entry per keystroke.
 */
export const browseSearchParams = {
  status: parseAsArrayOf(parseAsStringLiteral(STATUS_VALUES)).withDefault([]),
  rating: parseAsArrayOf(parseAsInteger).withDefault([]),
  genre: parseAsArrayOf(parseAsString).withDefault([]),
  q: parseAsString.withDefault('').withOptions({ throttleMs: 150 }),
  sort: parseAsStringLiteral(SORT_KEYS).withDefault('added_at'),
  dir: parseAsStringLiteral(SORT_DIRS).withDefault('desc'),
}

export type SortKey = (typeof SORT_KEYS)[number]
export type SortDir = (typeof SORT_DIRS)[number]
