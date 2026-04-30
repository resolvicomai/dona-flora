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
 *
 * `id` uses the SAME regex the chat API boundary enforces
 * (`^[A-Za-z0-9][A-Za-z0-9_-]*$`, AI-SPEC §3 threat T-04-09) so a hand-edited
 * chat file whose frontmatter id would collide with a traversal sequence is
 * rejected at listChats/loadChat parse time instead of propagating downstream
 * (WR-08).
 */
export const ChatFrontmatterSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(128)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
      'chatId deve ser alfanumérico/hífen/underscore sem começar com traço',
    ),
  title: z.string(),
  started_at: z.string(),
  updated_at: z.string(),
  book_refs: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  title_locked: z.boolean().default(false),
  generation_status: z.enum(['complete', 'generating', 'error']).default('complete'),
  last_error: z.string().optional(),
})

export type ChatFrontmatter = z.infer<typeof ChatFrontmatterSchema>
export type ChatGenerationStatus = ChatFrontmatter['generation_status']

/**
 * Alias for list rendering in the chat sidebar (D-10). Same shape as
 * `ChatFrontmatter` — frontmatter is already everything the sidebar needs.
 */
export type ChatSummary = ChatFrontmatter
