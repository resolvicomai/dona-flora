import { z } from 'zod'

/**
 * Zod schema for `data/trails/{slug}.md` frontmatter.
 *
 * Canonical shape per 04-CONTEXT.md D-09:
 * - `title`: user-facing trail name (displayed in lists / UI)
 * - `goal`: learning objective declared by the user (may be empty)
 * - `created_at`: ISO date-time (z.string() — YAML may coerce to Date,
 *    store.ts normalizes before validation; matches BookSchema.added_at)
 * - `book_refs`: slugs in reading ORDER — order is semantically significant;
 *    min(1) because an empty trail is meaningless
 * - `notes`: free-form description (rendered as body in the .md file)
 */
// WR-09: reject titles that carry zero slug-eligible characters (e.g. "!!!",
// "------", "***"). Without this guard `generateSlug(title)` returns an
// empty string and falls back to the literal 'trilha', so every "!!!" trail
// would collide with every other punctuation-only title and land as
// trilha-2.md, trilha-3.md, etc. — pure surprise UX.
const HAS_SLUG_CHAR = /[a-z0-9]/i

export const TrailFrontmatterSchema = z.object({
  title: z
    .string()
    .min(1)
    .refine((s) => HAS_SLUG_CHAR.test(s), {
      message: 'título precisa conter pelo menos uma letra ou número',
    }),
  goal: z.string().default(''),
  created_at: z.string(),
  book_refs: z.array(z.string()).min(1),
  notes: z.string().default(''),
})

export type TrailFrontmatter = z.infer<typeof TrailFrontmatterSchema>
