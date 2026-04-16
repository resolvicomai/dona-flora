---
phase: 02-catalog-core
plan: "06"
subsystem: book-detail-page
tags: [ui, book-detail, edit, delete, markdown, server-component, next-js, react, tailwind]
dependency_graph:
  requires:
    - 02-03  # StarRating, StatusBadge, BookCover shared components
    - 02-04  # PUT /api/books/[slug] and DELETE /api/books/[slug] endpoints
  provides:
    - Book detail page at /books/[slug] with inline editing
    - MarkdownContent Server Component for XSS-safe note rendering
    - BookEditForm Client Component for status/rating/notes editing
    - DeleteBookButton Client Component with AlertDialog confirmation
  affects:
    - 03-librarian-ai  # AI librarian needs book detail context (status, rating, notes)
tech_stack:
  added:
    - "@tailwindcss/typography (for prose Markdown rendering classes)"
  patterns:
    - Server Component pre-renders sanitized notes HTML, passes to Client Component as prop
    - BookEditForm dirty-state tracking (isDirty) prevents accidental saves
    - router.refresh() after PUT save to re-fetch Server Component data
    - force-dynamic + noStore() for CATALOG-08 compliance (reads fresh from disk)
    - async params pattern for Next.js 15+ (await params before accessing slug)
    - notFound() from next/navigation for 404 on missing slug
key_files:
  created:
    - src/components/markdown-content.tsx
    - src/components/book-edit-form.tsx
    - src/components/delete-book-button.tsx
    - src/app/books/[slug]/page.tsx
  modified:
    - src/lib/books/library-service.ts  # fix: remove leading slash from default LIBRARY_DIR
decisions:
  - "Server pre-renders Markdown notes as sanitized HTML, passes renderedNotes prop to BookEditForm — avoids client-side Markdown parsing and keeps XSS sanitization on the server"
  - "null rating converted to undefined before updateBook — WriteBookInput has no null, Zod schema needs nullable for UI clear-rating UX"
  - "LIBRARY_DIR leading slash removed — path.join with absolute LIBRARY_DIR and relative default coexistence"
metrics:
  duration_minutes: 18
  completed_date: "2026-04-16"
  tasks_completed: 3
  files_created: 4
  files_modified: 1
---

# Phase 02 Plan 06: Book Detail Page with Inline Editing Summary

**One-liner:** Book detail page at `/books/[slug]` with Server Component Markdown rendering, client-side inline editing of status/rating/notes via PUT API, and AlertDialog-confirmed deletion — completing the full CRUD cycle for the personal book catalog.

## What Was Built

### Task 1 — MarkdownContent, BookEditForm, and DeleteBookButton (commit `a283c38`)

**`src/components/markdown-content.tsx`** (Server Component — no `'use client'`):

- Async Server Component that calls `renderMarkdown()` (unified/remark/rehype/rehype-sanitize pipeline)
- Uses `dangerouslySetInnerHTML` — safe because rehype-sanitize strips scripts and event handlers upstream
- Empty notes fallback: italic Portuguese placeholder text
- `prose prose-invert prose-sm prose-zinc max-w-none` classes for Tailwind Typography rendering

**`src/components/book-edit-form.tsx`** (Client Component):

- **Status select:** shadcn Select with 5 BookStatus options in Portuguese labels
- **Star rating:** `StarRating` component with `onChange` callback
- **Notes toggle:** "Editar notas" / "Concluir edicao" switch between rendered HTML view and auto-resizing textarea
- **Dirty tracking:** `isDirty` computed from comparing current vs initial values — Save button disabled when clean
- **Save flow:** PUT `/api/books/${slug}` with `{ status, rating?, notes? }` → `router.refresh()` → 3s success feedback
- **Error handling:** "Erro ao salvar. Tente novamente." in red text on fetch failure
- **Textarea auto-resize:** CSS `field-sizing: content` with JS `scrollHeight` fallback
- **renderedNotes prop:** Receives pre-rendered HTML from Server Component — no client-side Markdown parsing

**`src/components/delete-book-button.tsx`** (Client Component):

- Ghost button styled with `text-red-600` — destructive appearance without primary prominence
- AlertDialog: "Excluir livro?" title, filename in description for user clarity
- Two actions: "Cancelar" (neutral) and "Excluir livro" (red destructive)
- On confirm: DELETE `/api/books/${slug}` → `router.push('/')` to redirect home
- "Excluindo..." loading state on confirm button

### Task 2 — Book detail page at /books/[slug] (commits `1310e0e`, `61e361c`)

**`src/app/books/[slug]/page.tsx`** (Server Component):

- `export const dynamic = 'force-dynamic'` + `noStore()` — CATALOG-08 compliance, reads disk on every request
- `await params` — Next.js 15+ async params pattern (critical correctness requirement)
- `notFound()` when `getBook(slug)` returns null — browser receives proper 404
- Server pre-renders `book._notes` via `renderMarkdown()` → passes `renderedNotes` string to BookEditForm
- **Layout:** `flex-col md:flex-row` — stacked on mobile, side-by-side on desktop per UI-SPEC
- **Cover variants:** `size="lg"` visible on desktop (`hidden md:block`), `size="md"` visible on mobile (`md:hidden`)
- **Static metadata:** Genre, year, ISBN shown as label:value pairs (conditionally rendered)
- **Typography:** `text-[28px] font-semibold leading-tight` for book title per Display spec
- **Back navigation:** ArrowLeft icon + "Voltar" link to `/`
- **DeleteBookButton:** Separated at page bottom by zinc-800 border

### Task 3 — End-to-end verification (human approval)

User confirmed all 7 test scenarios passed:

1. Empty state shows "Sua biblioteca esta vazia" with CTA button
2. Book search and add via Google Books API works (results, preview, confirm)
3. Manual book add fallback ("Nao encontrei meu livro") works
4. Inline editing (status dropdown, star rating, notes textarea toggle) persists to .md file
5. Delete with AlertDialog confirmation removes file and redirects home
6. Manual .md file edit syncs to UI on browser refresh (CATALOG-08)
7. Mobile responsive layout works (single-column, stacked detail view)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LIBRARY_DIR leading slash causing path resolution failure**
- **Found during:** Task 2 end-to-end testing
- **Issue:** Default `LIBRARY_DIR` value had a leading slash (`/data/books`) which, when combined with `path.join(process.cwd(), libraryDir)`, produced a path that ignored `process.cwd()` on some environments because `path.join` with an absolute segment resets the path.
- **Fix:** Removed the leading slash — default is now `data/books` (relative). `getLibraryDir()` always joins with `process.cwd()`.
- **Files modified:** `src/lib/books/library-service.ts`
- **Commit:** `61e361c`

## Threat Model Coverage

| Threat ID | Disposition | Mitigation Applied |
|-----------|-------------|-------------------|
| T-02-16 | mitigate | `getBook(slug)` joins with `getLibraryDir()` via `path.join`; slugs contain only alphanumeric + hyphens from `generateSlug(strict:true)` — path traversal not possible |
| T-02-17 | mitigate | `renderMarkdown()` uses `rehype-sanitize` to strip scripts/event handlers before HTML is passed to `dangerouslySetInnerHTML` |
| T-02-18 | accept | Single-user personal app — no audit trail needed; git history provides implicit trail if library folder is version-controlled |

## Known Stubs

None — all CRUD operations are fully wired to the filesystem via LibraryService. No hardcoded data, no placeholder renders.

## Threat Flags

No new security surface beyond the planned threat register. All three boundaries (URL slug, user notes HTML, form PUT) are mitigated as designed.

## Self-Check

Files exist:
- FOUND: `src/components/markdown-content.tsx`
- FOUND: `src/components/book-edit-form.tsx`
- FOUND: `src/components/delete-book-button.tsx`
- FOUND: `src/app/books/[slug]/page.tsx`

Commits verified:
- `a283c38` — feat(02-06): add MarkdownContent, BookEditForm, and DeleteBookButton components
- `1310e0e` — feat(02-06): create book detail page at /books/[slug]
- `61e361c` — fix(02-06): remove leading slash from default LIBRARY_DIR path

Requirements delivered:
- CATALOG-03: Book detail page at /books/[slug] — DONE
- CATALOG-04: Status editable via dropdown — DONE
- CATALOG-05: Rating editable via star clicks — DONE
- CATALOG-06: Notes editable in textarea, rendered as Markdown — DONE
- CATALOG-07: Delete with confirmation dialog — DONE

## Self-Check: PASSED
