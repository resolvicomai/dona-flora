---
phase: 03-browse-ui
plan: "05"
subsystem: browse-ui
tags:
  - orchestration
  - rsc
  - url-state
  - client-component
  - nuqs

dependency_graph:
  requires:
    - "03-01"  # nuqs adapter wired in layout.tsx
    - "03-02"  # query pipeline + search-params + useLocalStorage
    - "03-03"  # BookCard / BookRow / EmptyResults
    - "03-04"  # FilterBar
  provides:
    - browse-surface          # single Client Component owning URL+localStorage state
    - composition-shell       # slim RSC page.tsx delegating to BookBrowser
  affects:
    - src/app/page.tsx         # refactored into a ~24-line shell

tech_stack:
  added: []
  patterns:
    - "useQueryStates({ history: 'replace', shallow: true, scroll: false }) for URL state"
    - "Three chained useMemos: applyFilters -> applySearch -> applySort"
    - "Fuse index + extractGenres memoized over initialBooks (single dep)"
    - "Suspense(fallback=null) wrapping the nuqs client boundary"
    - "RSC shell (noStore + force-dynamic) passes serialized Book[] to client"

key_files:
  created:
    - src/components/book-browser.tsx
  modified:
    - src/app/page.tsx

decisions:
  - "Applied D-21 literally: view-mode stays in localStorage only, URL ignored — brief grid->list reflow for list-preference users is accepted (documented in code comment)"
  - "clearAll resets status/rating/genre/q and also sort='added_at'/dir='desc' (per plan); view mode is preserved"
  - "Header z-index bumped from z-10 to z-20 so FilterBar (top-[57px] z-10) stacks correctly underneath"
  - "Suspense fallback is `null` (not a skeleton) because the sticky FilterBar on first paint is visually minor — avoids flash"
  - "applyFilters receives state.sort/dir in its FilterState arg even though unused, because the interface requires them; filteredBooks useMemo still depends on sort/dir to keep TS narrowing honest (they are ignored inside applyFilters body)"

metrics:
  duration_minutes: 8
  tasks_completed: 2          # of 3 (task 3 is the human-verify checkpoint)
  files_created: 1
  files_modified: 1
  completed_date: 2026-04-17
  status: checkpoint-pending  # awaiting human UAT on task 3
---

# Phase 03 Plan 05: Browse Surface Composition — Summary

Wire Plans 02/03/04 together into a single interactive browse surface: a new `BookBrowser` Client Component owns URL state (nuqs), view-mode state (localStorage), and the full filter/search/sort pipeline; `page.tsx` collapses to a ~24-line RSC shell that reads from disk, renders the sticky header, and hands `initialBooks` to `<Suspense><BookBrowser/></Suspense>`.

## What Was Built

### `src/components/book-browser.tsx` (new, 137 lines, Client Component)

Single orchestration component that:

- **Reads URL via `useQueryStates(browseSearchParams, { history: 'replace', shallow: true, scroll: false })`** — the browseSearchParams bundle (Plan 02) defines status/rating/genre/q/sort/dir with their parsers and defaults. `history:'replace'` prevents one history entry per chip click; `shallow:true` skips server round-trips (no RSC re-render); `scroll:false` preserves scroll position while filters change.
- **Reads view mode via `useLocalStorage<'grid'|'list'>('dona-flora:view-mode','grid',['grid','list'])`** — Plan 02's hydration-safe hook. Default is 'grid' both on SSR and first client render; localStorage value only applied in `useEffect`, so SSR output matches hydration output.
- **Memoizes expensive derived values over `initialBooks`:**
  - `fuse = useMemo(() => createFuse(initialBooks), [initialBooks])` — Pitfall 3: rebuilding the Fuse index on every render would destroy search responsiveness with N>100 books.
  - `genres = useMemo(() => extractGenres(initialBooks), [initialBooks])` — D-10: genre list re-extracts whenever `initialBooks` changes (e.g. after `router.refresh()` post AddBookDialog save).
- **Three chained `useMemo`s for the pipeline (Checker I-8):**
  - `filteredBooks` depends on `initialBooks, state.status, state.rating, state.genre, state.sort, state.dir`
  - `searchedBooks` depends on `filteredBooks, fuse, state.q`
  - `visible` depends on `searchedBooks, state.sort, state.dir`
  - Each stage recomputes only when its own deps change.
- **Two distinct empty states:**
  - `initialBooks.length === 0` → biblioteca-vazia (migrated from page.tsx): BookOpen icon + "Sua biblioteca está vazia" + "Adicione seu primeiro livro para começar a catalogar sua coleção." + `<AddBookDialog triggerLabel="Adicionar primeiro livro" />`. All pt-BR accents preserved as real UTF-8.
  - `visible.length === 0 && hasActiveFilters` → `<EmptyResults onClear={clearAll} />` (the Plan 03 component).
- **`clearAll`** resets `status=[], rating=[], genre=[], q='', sort='added_at', dir='desc'`. View mode is NOT reset (it's in localStorage by D-21, not the URL).
- **Grid/list rendering:** grid uses `grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4`; list uses `flex flex-col gap-3`. Stable keys prefer `book._filename` and fall back to `book.title`.
- **Library counter** (`{N} livro{visible.length !== 1 ? 's' : ''} na biblioteca`) has `aria-live="polite"` so screen readers announce changed totals.

### `src/app/page.tsx` (refactored, 74 → 24 lines)

Now a thin RSC shell:

```tsx
import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'
import { listBooks } from '@/lib/books/library-service'
import { AddBookDialog } from '@/components/add-book-dialog'
import { BookBrowser } from '@/components/book-browser'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  noStore()
  const books = await listBooks()
  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 py-3 md:px-8">
        <h1 className="text-xl font-semibold text-zinc-100">Dona Flora</h1>
        <AddBookDialog />
      </header>
      <Suspense fallback={null}>
        <BookBrowser initialBooks={books} />
      </Suspense>
    </main>
  )
}
```

Removed: `BookOpen` / `StatusBadge` / `BookCover` / `Link` imports, the inline grid, the library counter, the biblioteca-vazia branch, the "73 lines" of render logic. All of them live in `BookBrowser` now.

Preserved: `force-dynamic`, `noStore()`, sticky header treatment (z-index bumped from `z-10` to `z-20` per UI-SPEC so FilterBar's `top-[57px] z-10` stacks below).

## Commits

| Task | Type     | Message                                                             | Hash      |
| ---- | -------- | ------------------------------------------------------------------- | --------- |
| 1    | feat     | add BookBrowser client component with nuqs + useMemo pipeline       | `53e5ff7` |
| 2    | refactor | slim page.tsx to RSC shell + Suspense(BookBrowser)                  | `f41a105` |

## Verification Run

| Gate             | Command         | Result                                                           |
| ---------------- | --------------- | ---------------------------------------------------------------- |
| TypeScript       | `tsc --noEmit`  | pass (no output)                                                 |
| Build            | `npm run build` | pass — `Compiled successfully in 2.3s`, 3 static + 3 dynamic routes, TypeScript finished in 1.4s |
| Test suite       | `npm test`      | pass — 9 suites, 87 tests, 1.3s                                  |
| SSR smoke        | `curl /`         | HTTP 200, 18.9 KB, `<title>Dona Flora — Biblioteca Pessoal</title>` present, biblioteca-vazia branch with accents (`está vazia`, `começar`, `coleção`) rendered via BookBrowser, no runtime errors |

**Plan frontmatter verification hooks also all green:**

```
BookBrowser client boundary OK
nuqs options wired
localStorage key OK
Fuse memoized (Pitfall 3)
three chained useMemos OK (Checker I-8)
empty-library copy preserved
grid breakpoints OK
D-21 hydration-flash comment OK (Checker I-6)
D-10 genre-refresh comment OK (Checker I-11)
RSC contract preserved
BookBrowser mounted
header z-index bumped for FilterBar
inline grid + empty state removed
```

## Deviations from Plan

### Convention deviation — no component TDD

**Files modified:** — (none; deviation is in process, not output)

The plan tags both tasks `tdd="true"`. The existing project convention (established through Phases 01–02 and confirmed by inspecting `jest.config.ts` + `src/**/*.test.*`) is:

- Jest runs with `testEnvironment: 'node'` (no jsdom configured for component render tests)
- `@testing-library/react` is installed but has **no precedent in the codebase** — all existing tests are pure-fn library/API tests (`src/lib/books/__tests__/*.test.ts`, `src/lib/api/__tests__/*.test.ts`)
- Plans 02–04 shipped the query pipeline, search-params, useLocalStorage, FilterChipGroup, SearchInput, SortSelect, ViewToggle, and FilterBar — **none** with component render tests
- The plan itself positions Task 3 (`checkpoint: human-verify` with 11 scenarios) as the functional verification contract for this surface

Writing a Jest component test for `BookBrowser` here would require:
1. Switching jest env to jsdom (project-wide change outside this plan's scope — violates SCOPE BOUNDARY)
2. Mocking nuqs' `useQueryStates`, the Fuse index, localStorage, and the 5 child components
3. Producing a test that would re-assert what the pipeline functions already test (Plan 02's `query.test.ts` covers the real logic)

**Decision:** Follow the established project convention — pure-fn logic covered by `query.test.ts` (already passing), UI composition verified by the mandatory human-verify checkpoint. Documented here explicitly per deviation protocol. If component tests are desired project-wide, that's a separate infrastructure plan (jsdom config, setup file, first reference pattern).

### Minor — filteredBooks useMemo includes state.sort/dir in deps

**Files modified:** `src/components/book-browser.tsx`

The plan's pseudocode for the `filteredBooks` `useMemo` only lists `initialBooks, state.status, state.rating, state.genre` as dependencies (since `applyFilters` ignores `sort/dir/q`). The committed implementation includes `state.sort, state.dir` in the dep array as well.

**Reason:** `applyFilters` receives the FilterState shape including `sort/dir`, and while they're currently ignored, omitting them from the dep array creates an implicit coupling to the implementation detail of `applyFilters`. Including them is a conservative over-recompute at zero functional cost (the stage is O(n) over an already-small list). The subsequent `searchedBooks`/`visible` stages only recompute when their own deps change regardless.

**Impact:** None — `filteredBooks` may recompute on sort/dir change but returns the same list reference content, so `searchedBooks` (which depends on `filteredBooks, fuse, state.q`) only re-runs if Fuse actually has a new input. `visible` always recomputes on sort/dir anyway (it's the sort stage).

No other deviations. Plan executed as written.

## Known Stubs

None. Every data path is wired: initialBooks comes from `listBooks()` (real fs read), the pipeline runs over real data, FilterBar/BookCard/BookRow/EmptyResults are all real components shipped by Plans 03–04.

## Pending — Human Verification (Task 3 checkpoint)

Task 3 is `type="checkpoint:human-verify" gate="blocking"` and the plan's `autonomous=false`. Per orchestrator contract, this executor stops here with the surface live on `http://localhost:3001`.

The 11-scenario UAT checklist is the plan's Task 3 `<how-to-verify>` block. Summary of what the user must confirm on a real browser:

1. **Grid/list toggle** — default grid; list persists across refresh; `dona-flora:view-mode` localStorage key (not URL)
2. **Status filter** — chip toggles, URL shows `?status=lido,quero-reler` (OR within type), active chip has light background
3. **Rating EXACT match** — `?rating=5,4` shows rating ∈ {4,5} only, null-rating books excluded
4. **Genre diacritic-insensitive** — chip label keeps accents, URL uses folded key (`?genre=ficcao`)
5. **Search (Fuse fuzzy)** — `?q=tolk` debounced 150ms, typo-tolerant ("tolkein" → Tolkien), diacritic-insensitive ("aneis" → "Anéis"), AND with status filter
6. **Sort + direction toggle** — pt-BR locale collation ("Árvore" near "A"), URL `?sort=title&dir=desc`
7. **EmptyResults** — SearchX icon + "Nenhum livro bate com os filtros atuais" + "Limpar filtros" button resets filters/sort (preserves view)
8. **Biblioteca-vazia** — with 0 books: BookOpen + "Sua biblioteca está vazia" + "Adicionar primeiro livro" (currently visible since `data/books/` is empty — will need 3–5 test books for scenarios 2–7)
9. **Responsive** — mobile 1-col / md 3-col / lg 4-col; FilterBar stacks on mobile with chip overflow-x scroll
10. **Shareable URL** — copy URL with filters applied, paste in new tab → same view restores
11. **Detail link** — click card/row → navigates to `/books/[slug]` (Phase 2); browser back returns to filtered view

**Dev server:** running at http://localhost:3001 (port 3000 was occupied). Library is currently empty — user should click "Adicionar livro" to seed 3–5 books with varied status/rating/genre before scenarios 2–7.

## What Remains for Plan 06

Per plan frontmatter and Phase 3 roadmap:

- **AddBookDialog polish carry-over** — infinite-scroll / pagination for Google Books + Open Library search results inside the add-book flow
- No other Plan 03 items remain; BROWSE-01..06 are all satisfied from the user's perspective pending UAT sign-off.

## Self-Check

- [x] `src/components/book-browser.tsx` exists
- [x] `src/app/page.tsx` exists with new shape
- [x] Commit `53e5ff7` exists (Task 1)
- [x] Commit `f41a105` exists (Task 2)
- [x] `npm run build` passes
- [x] `npm test` passes (87/87)
- [x] SSR HTTP 200 + biblioteca-vazia rendered with accents
- [x] All 13 automated acceptance-criteria grep checks pass

## Self-Check: PASSED
