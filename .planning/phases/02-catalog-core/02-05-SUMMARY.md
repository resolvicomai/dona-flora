---
phase: 02-catalog-core
plan: "05"
subsystem: home-page-ui
tags: [ui, home-page, dialog, search, book-grid, next-js, react, tailwind]
dependency_graph:
  requires:
    - 02-03  # StatusBadge, BookCover shared components
    - 02-04  # POST /api/books and POST /api/books/search endpoints
  provides:
    - Home page with responsive book grid
    - AddBookDialog component (search, preview, manual add)
  affects:
    - 02-06  # Book detail page will follow same layout patterns
tech_stack:
  added: []
  patterns:
    - Client component with step state machine (search/results/preview/manual/saving)
    - useRef + setTimeout/clearTimeout for debounce (no external library)
    - router.refresh() to refresh Server Component data after mutation
    - force-dynamic + noStore() for CATALOG-08 compliance
    - Single responsive trigger button (hidden text on mobile via CSS)
    - DialogTrigger with render prop (base-ui pattern)
key_files:
  created:
    - src/components/add-book-dialog.tsx
  modified:
    - src/app/page.tsx
decisions:
  - "Single DialogTrigger with hidden/visible span for mobile/desktop instead of two separate triggers — avoids base-ui multiple trigger ambiguity"
  - "Select onValueChange receives string | null from base-ui — guard with 'if (v)' before setState"
  - "isSaving derived from step === 'saving' rather than separate boolean state — single source of truth"
metrics:
  duration_minutes: 20
  completed_date: "2026-04-16"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 02 Plan 05: Home Page UI and AddBookDialog Summary

**One-liner:** Responsive book catalog home page with sticky header, grid/list layout, and AddBookDialog implementing debounced search, result thumbnails, preview step, and manual add fallback — all wired to existing API routes.

## What Was Built

### Task 1 — AddBookDialog component (commit `ec824d1`)

**`src/components/add-book-dialog.tsx`**

A `'use client'` component implementing the full add-book flow per D-01, D-02, D-03 and UI-SPEC.md:

- **5-step state machine:** `search | results | preview | manual | saving`
- **Debounced search:** 400ms debounce via `useRef` + `setTimeout`/`clearTimeout` (no external library), min 3 chars before triggering
- **Search results:** Up to 5 results with `BookCover` thumbnail (sm), title, authors — each clickable to move to preview step
- **Preview step:** Shows cover, title, authors, genre, year + status select (defaulting to "quero-ler") before saving
- **Save flow:** POST `/api/books` → closes dialog → calls `router.refresh()` to update Server Component data
- **Manual add fallback:** "Nao encontrei meu livro" link switches to manual form with title (required), author (required), and status select
- **Error handling:** Inline red text below input/buttons, generic messages (no stack traces exposed to UI)
- **Loading states:** `Loader2` spinner inside search input (right side), "Adicionando..." button text during save
- **Dialog reset:** `resetDialog()` called on `onOpenChange(false)` — clears all state
- **triggerLabel prop:** Optional prop for empty-state CTA that renders a full-width button with custom label
- **Responsive trigger:** Single button with `<span className="hidden md:inline">Adicionar livro</span>` — shows icon-only on mobile, full text on desktop

### Task 2 — Home page redesign (commit `e27521b`)

**`src/app/page.tsx`**

Transformed from Phase 1 placeholder (just book count) into full catalog view:

- **Sticky header:** `sticky top-0 z-10` with `backdrop-blur-sm` — title left, AddBookDialog right
- **Responsive grid:** `grid-cols-1` on mobile (horizontal list: cover left, text right), `md:grid-cols-3 lg:grid-cols-4` on desktop (vertical cards)
- **Book cards:** Each is a `<Link>` to `/books/{slug}` — shows `BookCover` (sm), title (truncated), author (truncated), `StatusBadge`
- **Slug derivation:** `book._filename?.replace('.md', '')` — consistent with library-service slug generation
- **Empty state:** `BookOpen` icon + "Sua biblioteca esta vazia" heading + body text + `AddBookDialog` CTA with `triggerLabel="Adicionar primeiro livro"`
- **Book count:** `"{n} livro(s) na biblioteca"` per copywriting contract
- **CATALOG-08 compliance:** `export const dynamic = 'force-dynamic'` + `noStore()` — every load reads fresh from disk

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Select onValueChange type incompatibility**
- **Found during:** Task 1 TypeScript compilation
- **Issue:** base-ui `Select.Root.onValueChange` signature is `(value: string | null, ...) => void`, but `setPreviewStatus` and `setManualStatus` are `Dispatch<SetStateAction<string>>` — TypeScript error TS2322 because `null` is not assignable to `string`.
- **Fix:** Wrapped calls in guard `(v) => { if (v) setState(v) }` — null value (no selection) is a no-op, which is the correct UX behavior.
- **Files modified:** `src/components/add-book-dialog.tsx`
- **Commit:** `ec824d1` (fixed inline before commit)

**2. [Rule 2 - Design] Simplified dual-trigger to single responsive trigger**
- **Found during:** Task 1 implementation review
- **Issue:** Plan spec suggested separate mobile (icon-only) and desktop (icon + text) trigger buttons, which would require two `DialogTrigger` elements — potentially ambiguous with base-ui's Dialog primitive managing open state.
- **Fix:** Single `DialogTrigger` with a button containing `<span className="hidden md:inline">Adicionar livro</span>` — achieves the same responsive visual while maintaining a single trigger association.
- **Files modified:** `src/components/add-book-dialog.tsx`
- **Commit:** `ec824d1` (applied before commit)

## Threat Model Coverage

| Threat ID | Disposition | Mitigation Applied |
|-----------|-------------|-------------------|
| T-02-14 | accept | Book data displayed is user's own personal data — single-user app, no access control needed |
| T-02-15 | mitigate | API calls go to server-side routes with Zod validation; client shows only generic error messages ("Erro ao buscar. Tente novamente.") |

## Known Stubs

None — AddBookDialog is fully wired to `/api/books/search` and `/api/books` endpoints created in Plan 04.

## Threat Flags

No new security surface introduced beyond what was planned (client-side fetch to existing API routes).

## Self-Check

Files exist:
- FOUND: `src/components/add-book-dialog.tsx` — created
- FOUND: `src/app/page.tsx` — modified

Commits verified: `ec824d1`, `e27521b`

## Self-Check: PASSED
