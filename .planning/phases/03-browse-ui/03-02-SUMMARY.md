---
phase: 03-browse-ui
plan: 02
subsystem: data-layer
tags: [query, fuse.js, nuqs, localStorage, yaml-date, backfill, pt-BR-collation]

requires:
  - phase: 01-foundation-data-layer
    provides: listBooks, BookSchema, SAFE_MATTER_OPTIONS
  - phase: 03-browse-ui (plan 01)
    provides: NuqsAdapter wired at root; fuse.js + nuqs dependencies installed
provides:
  - FilterState interface + pure applyFilters/applySearch/applySort/extractGenres/foldGenre helpers
  - createFuse factory with weighted FUSE_OPTIONS (title 3 / author 2 / _notes 1), threshold 0.4, ignoreDiacritics
  - browseSearchParams (nuqs parser config) as single source of truth for URL state (status, rating, genre, q, sort, dir); q throttled 150ms
  - useLocalStorage<T extends string> hydration-safe hook (allowlisted values)
  - listBooks lazy added_at backfill from fs.stat().mtime + YAML Date coercion — never rewrites .md files
affects: [03-03-filter-sidebar, 03-04-sort-viewmode, 03-05-book-browser, 03-06-integration]

tech-stack:
  added: [fuse.js 7.3, nuqs 2.8 (both pre-installed in Plan 03-01)]
  patterns:
    - "Pure pipeline module: filter -> search -> sort composed by caller; each step is deterministic and testable in isolation"
    - "NFD-fold + lowercase dedupe key for diacritic-insensitive matching (foldGenre reused across extractGenres and applyFilters)"
    - "Lazy backfill in reader (listBooks) — never mutate source files; Obsidian-edit-safe"
    - "Hydration-safe localStorage hook: fallback in useState, read window inside useEffect"
    - "nuqs parseAsStringLiteral(enumValues) for URL-level allowlist enforcement at trust boundary"

key-files:
  created:
    - src/lib/books/query.ts
    - src/lib/books/search-params.ts
    - src/lib/use-local-storage.ts
    - src/lib/books/__tests__/query.test.ts
    - src/lib/books/__tests__/fixtures/book-no-added-at.md
  modified:
    - src/lib/books/library-service.ts
    - src/lib/books/schema.ts
    - src/lib/books/__tests__/library-service.test.ts

key-decisions:
  - "Rating filter semantics: EXACT match (not >= threshold) per D-07/A2 — rating:[4] excludes rating=3 and rating=null"
  - "Null rating sorts LAST on desc via `a.rating ?? 0` — acceptable because rating is not shown in the card listing (D-01) and null means no opinion yet"
  - "foldGenre is the single NFD-fold helper; kept separate from src/lib/api/dedupe.ts stripDiacritics because foldGenre also lowercases+trims for use as a map key"
  - "Lazy backfill of added_at runs inside try-block between matter() and safeParse(); YAML Date coercion runs first so legacy files with unquoted ISO dates never throw"
  - "applySearch intersects fuzzy-match results with the pre-filtered set via _filename allowlist, so combined filter+search respects D-07 AND D-15"

patterns-established:
  - "Pure query module colocated with data layer (src/lib/books/query.ts alongside library-service.ts) — all browse-pipeline logic is file-scoped and UI-agnostic"
  - "Plan-scoped tests with minimal fixtures: new fixture added without deleting existing ones; assertions reuse shared FIXTURES_DIR"
  - "Schema documentation via JSDoc on individual fields to explain runtime contract (lazy backfill) without altering the Zod shape"

requirements-completed:
  - BROWSE-01
  - BROWSE-02
  - BROWSE-03
  - BROWSE-04
  - BROWSE-05

duration: 3min
completed: 2026-04-17
---

# Phase 03 Plan 02: Data Layer + Pure Query Module Summary

**Pure filter/search/sort pipeline (fuse.js + pt-BR collation) + nuqs URL-state config + hydration-safe useLocalStorage + lazy added_at backfill via fs.stat().mtime.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-17T13:40:33Z
- **Completed:** 2026-04-17T13:43:57Z
- **Tasks:** 2
- **Files modified:** 3
- **Files created:** 5

## Accomplishments

- Delivered the `query.ts` pure module (FilterState, createFuse, foldGenre, extractGenres, applyFilters, applySearch, applySort) that every UI component in Plans 03/04/05 will import.
- Wired `search-params.ts` as the single-source-of-truth nuqs parser config for URL state — includes 150ms throttling on `q` per D-12 and typed allowlists for status/sort/dir per D-20.
- Added `useLocalStorage` hook that is hydration-safe (fallback during SSR/first render, window read inside useEffect) — ready for grid/list view-mode persistence in Plan 03-04.
- Hardened `listBooks()` with YAML-Date coercion and lazy `added_at` backfill from `fs.stat().mtime` — never rewrites .md files, preserving Obsidian-safe contract.
- Added 16 new query-module tests + 2 new backfill tests. Full Jest suite: 87 passing (was 69).

## Task Commits

Each task was committed atomically:

1. **Task 1 — RED: query module tests** — `d524cb0` (test)
2. **Task 1 — GREEN: query + search-params + useLocalStorage** — `b14f006` (feat)
3. **Task 2: added_at backfill + YAML coercion** — `1a1086b` (feat)

## Files Created/Modified

- `src/lib/books/query.ts` — Pure pipeline: FilterState, createFuse (Fuse index), foldGenre (NFD-fold), extractGenres (dedupe+sort), applyFilters (AND between types, OR within), applySearch (intersect with pre-filtered set), applySort (pt-BR collation / ISO lex / rating nullable)
- `src/lib/books/search-params.ts` — browseSearchParams (nuqs parsers) with throttleMs:150 on q, allowlisted status/sort/dir; SortKey/SortDir exported types
- `src/lib/use-local-storage.ts` — useLocalStorage<T extends string>(key, fallback, allowed) — hydration-safe client hook
- `src/lib/books/__tests__/query.test.ts` — 16 unit tests covering all query-module behavior
- `src/lib/books/__tests__/fixtures/book-no-added-at.md` — fixture exercising the backfill path
- `src/lib/books/library-service.ts` (modified) — added YAML-Date coercion + lazy backfill block between matter() and safeParse() in listBooks()
- `src/lib/books/schema.ts` (modified) — JSDoc on added_at documenting lazy-backfill contract
- `src/lib/books/__tests__/library-service.test.ts` (modified) — updated expected book count (2→3) + new describe block with two tests asserting backfill populates ISO string and does not mutate the file

## Decisions Made

- **Rating filter = EXACT match.** Per D-07 and the research doc Assumptions A2, rating filter values are treated as a set-membership check, not a >= threshold. A book with rating=null is excluded whenever the rating filter is non-empty.
- **Null rating sorts LAST on desc.** Using `a.rating ?? 0` cleanly places null after rated books for `desc` and before them for `asc`. Because the card listing does not render ratings (D-01), the asymmetry is invisible in UX — comment added inline.
- **foldGenre kept separate from stripDiacritics.** The existing helper in `src/lib/api/dedupe.ts` does NFD-fold only; `foldGenre` also lowercases+trims for use as a Map key. Keeping them conceptually separate avoids coupling the book pipeline to the search-UI dedupe helper.
- **Lazy backfill runs inside the existing try-block** (between `matter()` and `safeParse()`), so any fs.stat failure is caught by the same warning handler as YAML parse errors. Legacy files never crash listBooks.
- **Added two idempotency tests** (one asserting the fixture .md file is byte-identical before/after listBooks) to lock in the "never rewrite on backfill" invariant. This was not explicitly in the plan but strengthens the D-22 contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated existing listBooks count assertion after adding backfill fixture**
- **Found during:** Task 2 (running the test suite after adding the new fixture)
- **Issue:** The existing `it('returns valid books from the fixtures directory')` test hard-coded `expect(books.length).toBe(2)`. Adding the new `book-no-added-at.md` fixture to the same shared fixtures dir would have caused that test to fail (3 valid books now, not 2). That assertion was a fact about the dataset, so it needed to track the dataset change.
- **Fix:** Updated the assertion to `expect(books.length).toBe(3)` and updated the inline comment to mention the new fixture exercises the backfill path.
- **Files modified:** `src/lib/books/__tests__/library-service.test.ts`
- **Verification:** `npm test -- --testPathPatterns="library-service"` → 23/23 passing; full suite 87/87.
- **Committed in:** `1a1086b` (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added idempotency assertion to backfill test**
- **Found during:** Task 2 (writing the backfill describe block)
- **Issue:** The plan specified one test asserting `added_at` matches `/^\d{4}-\d{2}-\d{2}$/`, but not that the source `.md` file is preserved byte-for-byte. The D-22 contract says "never rewrites the file" — an asserted-on invariant should be test-covered, not just commented. Threat T-03-02-03 mitigation relies on this.
- **Fix:** Added a second `it('does not rewrite the .md file on disk after backfill', ...)` test that reads the fixture before and after `listBooks()` and asserts equality.
- **Files modified:** `src/lib/books/__tests__/library-service.test.ts`
- **Verification:** Test passes; full suite green.
- **Committed in:** `1a1086b` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 — missing critical correctness coverage).
**Impact on plan:** Both deviations strengthen the test contract for D-22 without altering production code or plan scope. No scope creep.

## Issues Encountered

- **Initial test run syntax.** Jest 30 renamed `--testPathPattern` to `--testPathPatterns`. Caught on first RED-phase run; switched to the new flag for all subsequent invocations. Verification commands in the plan used the old flag but the intent was clear. Not a plan defect — fixed inline.
- **Fresh worktree had no node_modules.** Ran `npm install` (6s, 1035 packages) before the baseline test run. Documented here in case the orchestrator needs to know.

## User Setup Required

None — no external service configuration required. All changes are in-repo and covered by the existing test infrastructure.

## Next Phase Readiness

- Plan 03 (filter sidebar), Plan 04 (sort + view mode), and Plan 05 (book-browser integration) can all import `FilterState`, `createFuse`, `applyFilters`, `applySearch`, `applySort`, `extractGenres`, `foldGenre` from `@/lib/books/query`.
- Plan 05 must wrap `createFuse` in `useMemo([initialBooks])` to mitigate T-03-02-04 (DoS via rebuild-per-render) — documented in the plan's threat model.
- `browseSearchParams` is ready for `useQueryStates(browseSearchParams)` in the browser component.
- `useLocalStorage` is ready for `useLocalStorage<'grid' | 'list'>('dona-flora:view-mode', 'grid', ['grid', 'list'] as const)` in Plan 03-04.
- No blockers. Backfill verified for legacy .md files; writeBook unchanged so new entries continue to carry an explicit `added_at`.

## Self-Check: PASSED

All declared files exist on disk and all declared commit hashes exist in the git history:

- FOUND: src/lib/books/query.ts
- FOUND: src/lib/books/search-params.ts
- FOUND: src/lib/use-local-storage.ts
- FOUND: src/lib/books/__tests__/query.test.ts
- FOUND: src/lib/books/__tests__/fixtures/book-no-added-at.md
- FOUND: commit d524cb0 (test)
- FOUND: commit b14f006 (feat, query module)
- FOUND: commit 1a1086b (feat, backfill)

---
*Phase: 03-browse-ui*
*Completed: 2026-04-17*
