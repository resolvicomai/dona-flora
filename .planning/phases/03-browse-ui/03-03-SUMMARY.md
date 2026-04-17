---
phase: 03-browse-ui
plan: 03
subsystem: ui
tags:
  - react
  - tailwind
  - lucide-react
  - next-link
  - presentational

# Dependency graph
requires:
  - phase: 02-catalog-core
    provides: Book schema (_filename, title, author, status, cover), StatusBadge component, BookCover SIZES map, cn helper, Button primitive
  - phase: 03-browse-ui
    provides: (Plan 01) setup — ui/toggle-group, fuse.js, nuqs already installed in package.json
provides:
  - BookCover gradient+initial placeholder variant (D-03)
  - BookCard grid presentational component
  - BookRow list presentational component
  - EmptyResults zero-results empty state client component (D-16)
affects:
  - 03-browse-ui Plan 04 (FilterBar — no direct dep, parallel work)
  - 03-browse-ui Plan 05 (BookBrowser — composes BookCard, BookRow, EmptyResults)
  - 03-browse-ui Plan 06 (verification)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Props-in/JSX-out presentational components without 'use client' (server-safe, usable from both RSC and client)"
    - "Focus-visible ring classes (focus-visible:ring-2 focus-visible:ring-zinc-400 ring-offset-2 ring-offset-zinc-950) per UI-SPEC §Accessibility Contract"
    - "BookCover placeholder branch with role='img' + aria-label for screen reader announcement"
    - "Title initial fallback via alt.trim().charAt(0).toUpperCase(); '?' when alt is empty/whitespace"

key-files:
  created:
    - src/components/book-card.tsx
    - src/components/book-row.tsx
    - src/components/empty-results.tsx
  modified:
    - src/components/book-cover.tsx

key-decisions:
  - "Removed md:flex-col branching from BookCard — vertical layout only; horizontal variant lives in BookRow (D-04)"
  - "Added role='img' alongside aria-label on placeholder <div> so assistive tech announces it as an image despite being a div"
  - "Empty/whitespace alt renders '?' (not empty span) as defensive fallback — zero runtime cost, prevents blank placeholder"
  - "EmptyResults icon uses aria-hidden='true' to avoid double-announce with h2 heading (UI-SPEC §Accessibility)"

patterns-established:
  - "BookCover placeholder uses bg-gradient-to-br from-zinc-800 to-zinc-900 + initial text-zinc-100 font-semibold (D-03 canonical)"
  - "BookCard and BookRow share identical import list (Link, BookCover, StatusBadge, cn, Book); only layout axis + title line-clamp differ"
  - "Empty state block layout 'flex flex-col items-center justify-center gap-4 py-24 text-center' shared with biblioteca-vazia state (page.tsx)"

requirements-completed:
  - BROWSE-01
  - BROWSE-05
  - BROWSE-06

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 03 Plan 03: Visual Primitives (BookCover placeholder + BookCard + BookRow + EmptyResults) Summary

**Presentational components delivered: gradient-initial BookCover placeholder, grid BookCard, list BookRow, and zero-result EmptyResults — ready for Plan 05 BookBrowser composition.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-17T13:40:42Z
- **Completed:** 2026-04-17T13:43:22Z
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 1

## Accomplishments

- BookCover no-src branch now renders a zinc gradient (`bg-gradient-to-br from-zinc-800 to-zinc-900`) with the book title's uppercase initial at size-scaled typography (sm=text-xl, md=text-2xl, lg=text-4xl), replacing the previous BookOpen icon. Aria-label is now per-book (`Capa de ${title} não disponível`).
- New `BookCard` extracts the inline card from `src/app/page.tsx:47-67`, locks it to vertical layout, and adds focus-visible ring classes. No rating/genre/year rendered (D-01).
- New `BookRow` is the horizontal list variant with `line-clamp-1 md:line-clamp-2` on title (D-04).
- New `EmptyResults` ships the pt-BR zero-result empty state with `SearchX` icon, exact UI-SPEC copy (UTF-8 accents preserved), and a "Limpar filtros" Button calling `onClear`.
- `npm run build` passes cleanly after each task.

## Task Commits

1. **Task 1: Extend BookCover with gradient-initial placeholder (D-03)** — `151474c` (feat)
2. **Task 2: Create BookCard (grid) and BookRow (list)** — `46533ca` (feat)
3. **Task 3: Create EmptyResults (D-16)** — `097cbe8` (feat)

## Files Created/Modified

- `src/components/book-cover.tsx` — MODIFIED. Removed BookOpen import. Added `INITIAL_SIZE` map (sm/md/lg → text-xl/2xl/4xl). Replaced no-src branch with gradient div + initial span. Added JSDoc on component explaining dual use of `alt` (accessible text + visible initial). Added `role="img"`.
- `src/components/book-card.tsx` — NEW. Pure server-safe `{ book: Book; className?: string }` component rendering vertical `<Link>` to `/books/[slug]` with cover + title (line-clamp-2) + author (line-clamp-1) + StatusBadge.
- `src/components/book-row.tsx` — NEW. Same props, horizontal `<Link>` variant with title `line-clamp-1 md:line-clamp-2`.
- `src/components/empty-results.tsx` — NEW. `'use client'` component with `{ onClear }` prop rendering SearchX + h2 + p + Button. Exact pt-BR copy from UI-SPEC Copywriting Contract.

## Decisions Made

- **Locked BookCard to `flex flex-col`** (no `md:flex-col` branching) — the horizontal variant has its own dedicated component (BookRow). This keeps each component single-purpose and avoids responsive branching in what Plan 05 treats as view-mode choices.
- **Added `role="img"` on the gradient placeholder div** — without this, screen readers would announce the aria-label text but not frame it as an image. Pairing role+aria-label matches the Image branch's semantic role.
- **`?` fallback for empty/whitespace alt** — defensive: never render an empty placeholder span, even if a book's title is somehow blank post-validation.
- **Focus-visible ring added to BookCard/BookRow** (`focus-visible:ring-2 focus-visible:ring-zinc-400 ring-offset-2 ring-offset-zinc-950`) — UI-SPEC §Accessibility Contract requires this for all interactive elements; the original inline card in page.tsx lacked it. Plan 05 will inherit the correct state automatically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed worktree node_modules via `npm ci`**

- **Found during:** Task 1 (first `npm run build` invocation)
- **Issue:** The git worktree was freshly created from the base commit and had no `node_modules/` directory. `next build` failed with `Module not found: Package path ./adapters/next/app is not exported from package nuqs`.
- **Fix:** Ran `npm ci` once at the worktree root. 1035 packages installed, 0 vulnerabilities, 0 code changes.
- **Files modified:** None tracked (node_modules is .gitignore'd).
- **Verification:** `npm run build` passes in all three task verifications thereafter.
- **Committed in:** N/A (not a source change).

---

**Total deviations:** 1 auto-fixed (1 blocking environment setup)
**Impact on plan:** None on deliverables — blocking environment issue only. All three tasks executed exactly as specified by the plan, including verbatim code snippets from the `<action>` blocks.

## Issues Encountered

- The plan tagged tasks with `tdd="true"` but the existing project has no component-level test infrastructure (only library/api `__tests__/` folders with jest+node env for pure functions). PATTERNS.md does not mandate component tests for these files; the plan's own `<verify>` blocks use grep + `npm run build` as the test gate. I followed the plan's `<verify>` blocks as the RED/GREEN gate rather than introducing component test infra that the project explicitly does not use. Each grep verification was run post-change and passed.

## TDD Gate Compliance

- Plan frontmatter does NOT have plan-level `type: tdd` (it is `type: execute`). Task-level `tdd="true"` flags were present on each task, but the plan's `<verify>` blocks define the test contract via grep + `npm run build` (not unit tests). All verifications passed post-change. No `test(...)` commits were created; this is consistent with the project's existing pattern of no component-level tests.

## Known Stubs

None. All four components render real data from their props; no hardcoded `[]`/`{}`/null/placeholder strings flow to UI.

## Threat Flags

None. The threat model in the plan's `<threat_model>` block fully covers the components delivered (T-03-03-01 through T-03-03-05). No new trust boundaries introduced:

- Rendering remains React text escaping (T-03-03-01: accept).
- `next/image` remotePatterns (T-03-03-02) unchanged — the placeholder branch emits no remote URL.
- `_filename` → Link href (T-03-03-03) uses the exact pattern inherited from page.tsx; backend `getBook(slug)` in Phase 2 already validates slugs.
- Layout DoS (T-03-03-04): `line-clamp-*` + `break-words` + `min-w-0 overflow-hidden` enforced on all text paths.
- Placeholder initial (T-03-03-05): titles are non-sensitive in a personal library.

## User Setup Required

None — no external service configuration introduced.

## Next Phase Readiness

- Plan 04 (FilterBar) can proceed independently — zero coupling to these components.
- Plan 05 (BookBrowser) can import `BookCard`, `BookRow`, and `EmptyResults` directly and wire them to view-mode state + filter-clear handler.
- BookCover placeholder is live everywhere BookCover is used today: `src/app/page.tsx` (home grid), `src/components/add-book-dialog.tsx` (search results), and `src/app/books/[slug]/page.tsx` (detail). No migration needed.

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: `src/components/book-cover.tsx` (modified — gradient+initial placeholder)
- FOUND: `src/components/book-card.tsx` (new)
- FOUND: `src/components/book-row.tsx` (new)
- FOUND: `src/components/empty-results.tsx` (new)

**Commits verified in `git log --oneline -5`:**
- FOUND: `151474c` — feat(03-03): extend BookCover with gradient+initial placeholder
- FOUND: `46533ca` — feat(03-03): add BookCard and BookRow presentational components
- FOUND: `097cbe8` — feat(03-03): add EmptyResults zero-result empty state

**Verification commands all returned exit 0:**
- All grep assertions from all three task `<verify>` blocks.
- `npm run build` succeeded after each task.
- Plan-level success criteria all confirmed post-Task-3.

---
*Phase: 03-browse-ui*
*Plan: 03*
*Completed: 2026-04-17*
