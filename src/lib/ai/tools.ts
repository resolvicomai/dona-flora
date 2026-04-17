import { tool, type ToolSet, type InferUITools } from 'ai'
import { z } from 'zod'

/**
 * Read-only UI tools for the Dona Flora librarian (D-05/D-06).
 *
 * Both tools are DISPLAY-ONLY: `execute` just echoes the validated input.
 * Any filesystem access here would block the token stream (AI-SPEC §3 pitfall
 * #2). The client maps `slug` to book metadata via the pre-loaded knownSlugs
 * Set + the library directory it already has server-side.
 *
 * The kebab-case regex mirrors Phase 2 D-02 (slugify strict:true output) — it
 * prevents the model from "alucinating" a slug with path-traversal characters
 * or non-ASCII bytes.
 */
const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const librarianTools = {
  render_library_book_card: tool({
    description:
      'Renderiza um card inline para um livro QUE EXISTE na biblioteca do usuário. Use APENAS com slug literal de <LIBRARY>. Não use para livros externos ou imaginados.',
    inputSchema: z.object({
      slug: z
        .string()
        .min(1)
        .regex(KEBAB_SLUG, 'slug deve ser kebab-case ASCII'),
    }),
    execute: async ({ slug }) => ({ slug }),
  }),
  render_external_book_mention: tool({
    description:
      'Renderiza uma menção a um livro EXTERNO (não possuído). Use para livros reais que NÃO estão em <LIBRARY>. Deixe explícito na prosa que o livro não está na biblioteca.',
    inputSchema: z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      reason: z.string().min(1),
    }),
    execute: async (input) => input,
  }),
} satisfies ToolSet

export type LibrarianTools = InferUITools<typeof librarianTools>
