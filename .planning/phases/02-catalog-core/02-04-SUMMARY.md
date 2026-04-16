---
phase: 02-catalog-core
plan: "04"
subsystem: api-routes
tags: [api, crud, books, zod, validation, next-js]
dependency_graph:
  requires:
    - 02-01  # library-service (writeBook, updateBook, deleteBook)
    - 02-02  # google-books + open-library search functions
  provides:
    - POST /api/books
    - POST /api/books/search
    - PUT /api/books/[slug]
    - DELETE /api/books/[slug]
  affects:
    - 02-05  # AddBookDialog and BookEditForm will call these endpoints
tech_stack:
  added: []
  patterns:
    - Zod safeParse for all request body validation
    - force-dynamic on all API routes
    - async params (Next.js 15+) with await params
    - ENOENT -> 404 pattern for missing book files
key_files:
  created:
    - src/app/api/books/route.ts
    - src/app/api/books/search/route.ts
    - src/app/api/books/[slug]/route.ts
  modified: []
decisions:
  - "null rating converted to undefined before updateBook call — WriteBookInput does not accept null, nullable Zod schema needed for UI clear-rating UX"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-16"
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 02 Plan 04: API Routes (CRUD + Search) Summary

**One-liner:** Three Next.js route handlers for book CRUD and external search, with Zod validation, force-dynamic, and async params per Next.js 15+ requirements.

## What Was Built

### Task 1 — POST /api/books and POST /api/books/search (commit `7d0e56a`)

**`src/app/api/books/route.ts`**
- POST handler validates request body with `CreateBookSchema` (Zod)
- All fields validated: title/author required, cover as URL, year/rating with `z.coerce.number()`
- Calls `writeBook()` from library-service, returns `{ slug }` with status 201
- Returns 400 with `error.flatten()` on validation failure, 500 on unexpected errors

**`src/app/api/books/search/route.ts`**
- POST handler validates `{ query }` with min 2 chars
- Calls `searchGoogleBooks` first; falls back to `searchOpenLibrary` if 0 results
- Returns `BookSearchResult[]` directly — same shape from both providers
- API keys stay server-side (no NEXT_PUBLIC_ exposure)

### Task 2 — PUT and DELETE /api/books/[slug] (commit `d02ad13`)

**`src/app/api/books/[slug]/route.ts`**
- PUT handler validates partial updates with `UpdateBookSchema` (all fields optional)
- Uses `await params` — required by Next.js 15+ async params pattern
- Converts `null` rating to `undefined` before calling `updateBook` (type safety fix)
- DELETE handler calls `deleteBook(slug)` and returns 204 No Content
- Both handlers return 404 when ENOENT is detected (file not found = book not found)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Null rating type mismatch between Zod schema and WriteBookInput**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `UpdateBookSchema` defined `rating` as `.optional().nullable()` to support clearing a rating, but `WriteBookInput.rating` is typed as `number | undefined` (no null). TypeScript error TS2345.
- **Fix:** Added explicit conversion `rating: result.data.rating ?? undefined` before calling `updateBook()`, translating null (clear intent) to undefined (unset).
- **Files modified:** `src/app/api/books/[slug]/route.ts`
- **Commit:** `d02ad13`

## Threat Model Coverage

All mitigations from the plan's threat register were applied:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-02-10 | All inputs validated via Zod safeParse — invalid data returns 400, never reaches filesystem |
| T-02-11 | ENOENT on fs.unlink/readFile propagates as 404; slug is URL param processed by generateSlug (strips path traversal chars) |
| T-02-12 | Zod errors use `.flatten()` (safe, no stack traces); server errors return generic messages, details only in console.error |
| T-02-13 | Accepted — single-user app, client-side debounce in Plan 05 |

## Known Stubs

None — all routes are fully wired to library-service and external API functions.

## Self-Check

Files exist:
- `src/app/api/books/route.ts` — created
- `src/app/api/books/search/route.ts` — created
- `src/app/api/books/[slug]/route.ts` — created

Commits verified: `7d0e56a`, `d02ad13`
