---
phase: 03-browse-ui
plan: "06"
subsystem: browse-ui
tags:
  - carryover
  - pagination
  - infinite-scroll
  - dialog
  - intersection-observer
  - phase-close

dependency_graph:
  requires:
    - "03-01"  # shared dedupeBooks helper
    - "03-05"  # browse surface composition (unchanged, but the phase envelope)
  provides:
    - provider-pagination        # searchGoogleBooks(startIndex) + searchOpenLibrary(page)
    - route-pagination-schema    # SearchSchema with startIndex + page
    - add-book-infinite-scroll   # IntersectionObserver-driven fetchMore in AddBookDialog
  affects:
    - src/lib/api/google-books.ts
    - src/lib/api/open-library.ts
    - src/app/api/books/search/route.ts
    - src/components/add-book-dialog.tsx

tech_stack:
  added: []
  patterns:
    - "searchGoogleBooks(query, maxResults=5, startIndex=0) — 0-based startIndex forwarded via URLSearchParams"
    - "searchOpenLibrary(query, limit=5, page=1) — 1-based page forwarded via URLSearchParams in fetchOnce"
    - "Zod SearchSchema: startIndex nonnegative optional default 0; page int min 1 optional default 1"
    - "IntersectionObserver with rootMargin '100px' + hasMore/loadingMore guards"
    - "Cross-page dedupe via dedupeBooks([...prev, ...data]) on every fetchMore"
    - "Reset-on-query-change: all pagination state cleared before the debounced fetch fires (Anti-Pattern 9 guard)"

key_files:
  created: []
  modified:
    - src/lib/api/google-books.ts
    - src/lib/api/open-library.ts
    - src/app/api/books/search/route.ts
    - src/components/add-book-dialog.tsx
    - src/lib/api/__tests__/google-books.test.ts
    - src/lib/api/__tests__/open-library.test.ts
    - src/lib/api/__tests__/search-route.test.ts

decisions:
  - "Google Books startIndex stays 0-based (their spec); Open Library page stays 1-based (their spec) — no adapter layer in the client. AddBookDialog tracks nextStart and nextPage as two parallel counters so each provider sees the value in the shape it expects."
  - "Per-page limit stays hard-coded at 20 in the route (existing behaviour); hasMore flips to false when a page returns < 20 rows, and observer auto-disconnects."
  - "searchOpenLibrary's existing inline variants-dedupe (seen/merged loop with dedupeKey) was intentionally NOT swapped for dedupeBooks — it dedupes across the query+diacritic-stripped variants fetched in parallel, which is a different concern from cross-page dedup. Cross-page dedup happens in AddBookDialog via dedupeBooks on each fetchMore append."
  - "IntersectionObserver effect deps are [results.length, hasMore, loadingMore, query] with the exhaustive-deps eslint disable — intentional: fetchMore closes over other state we read inside the effect, and we want the observer to re-attach precisely on those four deps (not on every fetchMore closure identity change)."
  - "No AddBookDialog unit tests added: plan explicitly defers this to manual QA in the human-verify checkpoint (interactive dialog behaviour with IntersectionObserver). Provider + route tests cover the pagination contract."

metrics:
  duration_minutes: 15
  tasks_completed: 2          # of 3 (task 3 is the blocking human-verify checkpoint)
  files_created: 0
  files_modified: 7
  completed_date: 2026-04-17
  status: checkpoint-pending  # awaiting human UAT on task 3
---

# Phase 03 Plan 06: AddBookDialog Infinite Scroll Pagination — Summary

Extend Google Books, Open Library, and the /api/books/search route with pagination params; replace AddBookDialog's fixed 20-result scrollable list with true infinite scroll driven by `IntersectionObserver`, backed by real provider pagination and cross-page dedup via the shared `dedupeBooks` helper from Plan 01. Closes Phase 3 carryover D-23.

## What Was Built

### Provider contracts (Task 1)

- **`searchGoogleBooks(query, maxResults=5, startIndex=0)`** — 3rd positional arg forwards to the Google Books `startIndex` URL param (0-based, capped at 40 by provider). Backward-compatible: existing `(query)` and `(query, maxResults)` callers are untouched.
- **`searchOpenLibrary(query, limit=5, page=1)`** — 3rd positional arg forwards to the Open Library `page` URL param (1-based). The internal `fetchOnce(query, limit, page)` helper propagates `page` into the URLSearchParams. Backward-compatible; variants loop (query + diacritic-stripped) still runs per `fetchOnce`.
- **`POST /api/books/search`** — `SearchSchema` extended with `startIndex: z.coerce.number().int().nonnegative().optional().default(0)` and `page: z.coerce.number().int().min(1).optional().default(1)`. Threaded to `searchGoogleBooks` (primary) and the fallback `searchOpenLibrary` call. Invalid values → 400 (Zod gate).

### AddBookDialog pagination (Task 2)

- New state: `nextStart`, `nextPage`, `hasMore`, `loadingMore`, `loadMoreError`, plus a `sentinelRef: useRef<HTMLDivElement>`.
- `resetDialog()` clears all five pagination fields (dialog close / cancel reset).
- `handleQueryChange(value)` now resets pagination state synchronously *before* scheduling the 400ms debounced fetch (RESEARCH Anti-Pattern 9 guard against stale observer closures). On successful initial fetch: `setHasMore(data.length >= 20)`, `setNextStart(20)`, `setNextPage(2)`.
- `fetchMore()` POSTs `{ query, startIndex: nextStart, page: nextPage }`; on empty response flips `hasMore=false`; on partial response (< 20 rows) still merges via `dedupeBooks([...prev, ...data])` and sets `hasMore=false`; on error surfaces pt-BR copy "Não foi possível carregar mais resultados." with a "Tentar novamente" button.
- `useEffect([results.length, hasMore, loadingMore, query])` attaches a fresh `IntersectionObserver({ rootMargin: '100px' })` to `sentinelRef.current`, disconnects on cleanup. Guards: no-op when `!hasMore`, `loadingMore`, or `results.length === 0`.
- JSX: inside the existing `max-h-[50vh] overflow-y-auto` scroll container, after the `.map(...)`, the sentinel div (`<div ref={sentinelRef} className="h-4" aria-hidden />`) renders only while `hasMore`; below it, the `Loader2` spinner while `loadingMore`; below that, the retry CTA when `loadMoreError` is set. Existing "Não encontrei meu livro" manual-add link is preserved.

### Test coverage (RED-then-GREEN)

- **`google-books.test.ts`** — 3 new tests: forwards `startIndex=40`, defaults to 0 when omitted, backward compat `(query, maxResults)` still defaults `startIndex=0`.
- **`open-library.test.ts`** — 3 new tests: forwards `page=2`, defaults to 1 when omitted, backward compat `(query, limit)` still defaults `page=1`.
- **`search-route.test.ts`** — 5 new tests: threads `startIndex` to Google Books with explicit value, threads `page` to Open Library on fallback, defaults both when omitted, 400 on negative startIndex, 400 on `page=0`.

## How It Works (Execution Flow)

```
User types in AddBookDialog search box
  → handleQueryChange:
      ├── setError(null), setLoadMoreError(null)
      ├── RESET pagination: results=[], nextStart=0, nextPage=1, hasMore=true, loadingMore=false
      ├── clearTimeout(previous debounce)
      ├── value.length < 3? → setStep('search') and return
      └── schedule 400ms debounce:
            fetch POST /api/books/search { query: value }      [no startIndex/page]
            → data.length → setResults(data)
            → setHasMore(data.length >= 20)
            → setNextStart(20), setNextPage(2)

Results rendered inside max-h-[50vh] overflow-y-auto container
  with sentinel div at bottom (only when hasMore)

User scrolls down
  → IntersectionObserver fires (rootMargin: 100px)
  → Guard: !hasMore || loadingMore || !query || query.length < 3 → no-op
  → fetchMore():
      ├── setLoadingMore(true)
      ├── fetch POST /api/books/search { query, startIndex: nextStart, page: nextPage }
      ├── data.length === 0? → setHasMore(false), return
      ├── setResults(prev => dedupeBooks([...prev, ...data]))
      ├── setNextStart(s => s+20), setNextPage(p => p+1)
      ├── data.length < 20? → setHasMore(false)
      └── finally: setLoadingMore(false)

Observer effect re-runs when results.length changes
  → observer.disconnect() (cleanup), then re-attaches to new sentinel
  → continues firing as user scrolls further

User clears search box
  → handleQueryChange('') → full reset → results=[], observer skips (results.length === 0 guard)
  → value.length < 3 → setStep('search') → no fetch
```

## Deviations from Plan

### None

Plan executed exactly as written. No auto-fixes (Rule 1/2/3) were needed; no architectural decisions (Rule 4) escalated.

## Self-Check: PASSED

### Files modified (all present on disk)

- [x] `src/lib/api/google-books.ts` — `startIndex` param wired (lines 21, 29)
- [x] `src/lib/api/open-library.ts` — `page` param wired in `fetchOnce` (lines 9, 14) and `searchOpenLibrary` (lines 47, 53)
- [x] `src/app/api/books/search/route.ts` — SearchSchema extended + both providers threaded
- [x] `src/components/add-book-dialog.tsx` — dedupeBooks import, pagination state, fetchMore, IntersectionObserver, sentinel JSX, retry UI
- [x] `src/lib/api/__tests__/google-books.test.ts` — +3 tests (pagination describe block)
- [x] `src/lib/api/__tests__/open-library.test.ts` — +3 tests (pagination describe block)
- [x] `src/lib/api/__tests__/search-route.test.ts` — +5 tests (pagination describe block)

### Commits (all present in git log)

- [x] `41bbf1a` — `test(03-06): add failing tests for provider + route pagination` (RED gate)
- [x] `85a6114` — `feat(03-06): add pagination params to providers and search route` (GREEN gate: Task 1 implementation)
- [x] `162e51b` — `feat(03-06): infinite-scroll pagination in AddBookDialog` (Task 2 implementation)

### Automated Verify Results

All Task 1 verify greps pass (schema + threading):

- `startIndex: z.coerce.number().int().nonnegative()` ✓
- `page: z.coerce.number().int().min(1)` ✓
- `result.data.startIndex` ✓ / `result.data.page` ✓

All Task 2 verify greps pass:

- `import { dedupeBooks } from '@/lib/api/dedupe'` ✓
- `sentinelRef = useRef<HTMLDivElement>` + `[hasMore` + `[loadingMore` ✓
- `new IntersectionObserver` + `rootMargin: '100px'` ✓
- `async function fetchMore()` + `dedupeBooks([...prev` ✓
- `setResults([])` + `setNextStart(0)` in handleQueryChange ✓
- pt-BR copy "Não foi possível carregar mais resultados." and "Tentar novamente" preserved verbatim ✓

### Test Suite

- `npm test` → **98 passed, 9 test suites, 0 failures** (87 baseline → 98 after +11 pagination tests).
- `npm run build` → compiled successfully, TypeScript green, 9 workers, 3 static pages generated.

### data/books/ untouched

- `git log --oneline HEAD~3..HEAD -- data/books/` → empty (no commits touched data files).
- No data/books/*.md appear in any of the three commits on this plan.

## Phase 3 Closing Note

Plan 03-06 is the final plan of Phase 03 — browse-ui. With this plan shipped:

- **BROWSE-01..BROWSE-06** (all six browse requirements) are implemented across Plans 01–05.
- **D-01..D-22** (all 22 phase-level decisions from 03-CONTEXT.md) were applied across Plans 01–05.
- **D-23** (carryover infinite scroll) is now satisfied by this plan.

No further implementation work remains in Phase 03. Task 3's human-verify checkpoint is the final gate before Phase 03 closes.

## Known Stubs

None. All new code paths are fully wired to real data sources (Google Books + Open Library + the existing `dedupeBooks` helper).

## Checkpoint State (Task 3)

**Status:** Implementation + automated verification complete. Task 3 is a `checkpoint:human-verify` gate — orchestrator defers UAT to phase end.

**What needs human UAT (9 scenarios):**

1. Initial page populates as before (20 results after 400ms debounce).
2. Scroll to bottom of results → spinner appears → 20 more append → repeats until exhausted.
3. `hasMore` stops firing once the provider returns no more rows.
4. No duplicates across pages (dedupeBooks merge).
5. Reset on new query — clearing/retyping gives a clean result list with no leftover rows.
6. Retry path — offline triggers the inline "Não foi possível carregar mais resultados." + "Tentar novamente" UX; resumes cleanly when online.
7. Network tab: first request has body `{"query":"..."}`; subsequent have `{"query":"...","startIndex":20,"page":2}`, then `40/3`, then `60/4`, etc.
8. Manual-add link still works end-to-end.
9. Selecting a result from a scrolled-down position still opens the preview step correctly.

**How the orchestrator should proceed:** Phase 3 verifier runs after all wave-5 plans merge. The 9-scenario UAT can be batched into the phase-end manual review.
