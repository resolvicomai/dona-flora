import { z } from 'zod'

/**
 * Validates the YAML frontmatter of every `data/chats/{id}.md` file.
 *
 * `started_at` and `updated_at` are `z.string()` rather than `z.string().datetime()`
 * because unquoted ISO date-times in YAML are parsed by `js-yaml` into `Date` objects;
 * the persistence layer (store.ts, Plan 02) normalizes those back to ISO strings
 * before validation — see the same workaround in `BookSchema.added_at`.
 *
 * `book_refs` defaults to `[]` so files written before the sidebar feature (D-10)
 * still parse.
 */
export const ChatFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  started_at: z.string(),
  updated_at: z.string(),
  book_refs: z.array(z.string()).default([]),
})

export type ChatFrontmatter = z.infer<typeof ChatFrontmatterSchema>

/**
 * Alias for list rendering in the chat sidebar (D-10). Same shape as
 * `ChatFrontmatter` — frontmatter is already everything the sidebar needs.
 */
export type ChatSummary = ChatFrontmatter
