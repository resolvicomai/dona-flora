---
phase: 02-catalog-core
plan: "02"
subsystem: api-clients
tags: [google-books, open-library, markdown, tdd, unified, remark, rehype]
dependency_graph:
  requires: []
  provides: [searchGoogleBooks, searchOpenLibrary, BookSearchResult, renderMarkdown]
  affects: [AddBookDialog, book-detail-page]
tech_stack:
  added: [unified, remark-parse, remark-rehype, rehype-sanitize, rehype-stringify, babel-jest, "@babel/core", "@babel/preset-env", "@babel/preset-typescript"]
  patterns: [TDD red-green, mocked fetch in Jest, babel-jest ESM transform for unified ecosystem]
key_files:
  created:
    - src/lib/api/google-books.ts
    - src/lib/api/open-library.ts
    - src/lib/api/__tests__/google-books.test.ts
    - src/lib/api/__tests__/open-library.test.ts
    - src/lib/markdown.ts
    - src/lib/__tests__/markdown.test.ts
    - babel.config.js
  modified:
    - jest.config.ts
    - package.json
    - package-lock.json
decisions:
  - "babel-jest required alongside ts-jest to transpile ESM-only unified ecosystem packages (unified, remark-parse, rehype-*) in Jest/CJS mode"
  - "langRestrict=pt hardcoded in Google Books query for better Brazilian Portuguese results"
  - "GOOGLE_BOOKS_API_KEY read from process.env without NEXT_PUBLIC_ prefix — stays server-side only"
  - "rehype-sanitize chosen over remark-html (maintenance mode) for XSS-safe Markdown rendering"
metrics:
  duration: "25 minutes"
  completed_date: "2026-04-16"
  tasks_completed: 2
  files_created: 7
  files_modified: 3
  tests_added: 20
---

# Phase 02 Plan 02: API Clients + Markdown Pipeline Summary

**One-liner:** Google Books and Open Library API clients returning typed `BookSearchResult[]`, plus a `rehype-sanitize`-guarded Markdown-to-HTML pipeline using the unified ecosystem.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for API clients | df5c6ce | src/lib/api/__tests__/google-books.test.ts, src/lib/api/__tests__/open-library.test.ts |
| 1 (GREEN) | Google Books + Open Library clients | cb139e3 | src/lib/api/google-books.ts, src/lib/api/open-library.ts |
| 2 (RED) | Failing tests for Markdown pipeline | 76c17b0 | src/lib/__tests__/markdown.test.ts |
| 2 (GREEN) | Markdown rendering pipeline | 67e6070 | src/lib/markdown.ts, jest.config.ts, babel.config.js |

## What Was Built

### Google Books API Client (`src/lib/api/google-books.ts`)

- `searchGoogleBooks(query, maxResults=5)` — fetches `googleapis.com/books/v1/volumes`
- `langRestrict=pt` in every request for better Portuguese results
- `GOOGLE_BOOKS_API_KEY` from `process.env` only (no `NEXT_PUBLIC_` prefix — stays server-side)
- http thumbnail URLs converted to https (security + mixed-content fix)
- ISBN_13 extracted preferentially over ISBN_10
- Exports `BookSearchResult` interface (shared by Open Library)

### Open Library API Client (`src/lib/api/open-library.ts`)

- `searchOpenLibrary(query, limit=5)` — fetches `openlibrary.org/search.json`
- `User-Agent: DonaFlora/1.0 (personal book catalog)` header on every request
- Cover URL built from `cover_i`: `https://covers.openlibrary.org/b/id/{cover_i}-L.jpg`
- Re-uses `BookSearchResult` type from `google-books.ts`

### Markdown Pipeline (`src/lib/markdown.ts`)

- `renderMarkdown(markdown)` — unified pipeline: `remark-parse → remark-rehype → rehype-sanitize → rehype-stringify`
- Returns `''` for empty/whitespace-only input
- `rehype-sanitize` strips `<script>` tags and event handlers (onerror, onclick, etc.)

### Test Infrastructure

- 6 tests for `searchGoogleBooks` (parsing, empty items, http→https, ISBN_13 preference, langRestrict param, error throw)
- 6 tests for `searchOpenLibrary` (parsing, empty docs, cover URL, no cover_i, User-Agent header, error throw)
- 8 tests for `renderMarkdown` (bold, heading, empty, whitespace, XSS script, XSS onerror, fenced code, inline code)
- **Total: 52 tests passing** (20 new + 32 from Phase 01)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Jest could not transform ESM-only unified ecosystem packages**
- **Found during:** Task 2 GREEN phase
- **Issue:** `unified`, `remark-parse`, `rehype-*` and 50+ transitive dependencies ship as ESM-only (`"type": "module"`). Jest's default CJS runtime threw `SyntaxError: Unexpected token 'export'` when importing them.
- **Fix:** Installed `babel-jest` + `@babel/core` + `@babel/preset-env` + `@babel/preset-typescript`. Updated `jest.config.ts` to add explicit `transform` block routing `.js` files through `babel-jest` and `.ts` files through `ts-jest`. Added `transformIgnorePatterns` with all ESM packages. Created `babel.config.js` with `preset-env` targeting current Node.
- **Files modified:** `jest.config.ts`, `babel.config.js`, `package.json`
- **Commits:** 67e6070

## Known Stubs

None — all functions are fully implemented and wired to real external APIs. No placeholder values or hardcoded mock data in production code.

## Threat Surface Scan

All threats from plan's `<threat_model>` were mitigated:

| Threat | Mitigation | Verified |
|--------|-----------|---------|
| T-02-04: API key disclosure | `process.env.GOOGLE_BOOKS_API_KEY` (no `NEXT_PUBLIC_`) | Test confirms `langRestrict` in URL, key absent from test |
| T-02-05: XSS via Markdown | `rehype-sanitize` in pipeline | Tests confirm `<script>` and `onerror` stripped |
| T-02-06: DoS (Open Library) | Accepted — debounce deferred to Plan 05 UI layer | N/A |
| T-02-07: Spoofing from API | Accepted — display-only metadata | N/A |

No new threat surface introduced beyond plan scope.

## Self-Check: PASSED

Files verified:
- [x] `/Users/mauro/projects/Dona Flora/src/lib/api/google-books.ts` — exists
- [x] `/Users/mauro/projects/Dona Flora/src/lib/api/open-library.ts` — exists
- [x] `/Users/mauro/projects/Dona Flora/src/lib/markdown.ts` — exists
- [x] `/Users/mauro/projects/Dona Flora/src/lib/api/__tests__/google-books.test.ts` — exists
- [x] `/Users/mauro/projects/Dona Flora/src/lib/api/__tests__/open-library.test.ts` — exists
- [x] `/Users/mauro/projects/Dona Flora/src/lib/__tests__/markdown.test.ts` — exists

Commits verified: df5c6ce, cb139e3, 76c17b0, 67e6070 — all present in git log.
