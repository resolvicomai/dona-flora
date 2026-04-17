---
phase: 03-browse-ui
plan: 04
subsystem: ui
tags:
  - react
  - base-ui
  - toggle-group
  - select
  - lucide-react
  - tailwind
  - filter-bar
  - interactive
  - presentational

# Dependency graph
requires:
  - phase: 03-browse-ui
    plan: 01
    provides: shadcn toggle-group + toggle primitives (base-ui variant), existing Input/Select/Button primitives
  - phase: 03-browse-ui
    plan: 02
    provides: SortKey / SortDir types (src/lib/books/search-params.ts)
  - phase: 02-catalog-core
    provides: BookStatus type, STATUS_OPTIONS, cn helper
provides:
  - FilterChipGroup<T extends string> generic multi-select chip wrapper
  - SearchInput controlled text input with lucide Search icon (pt-BR placeholder)
  - ViewToggle single-select grid/list toggle
  - SortSelect base-ui Select + ArrowUpDown direction Button
  - SORT_OPTIONS and SORT_DEFAULT_DIR for reuse by Plan 05 BookBrowser
  - FilterBar composing all of the above in a sticky strip (top-[57px] z-10)
affects:
  - 03-05-PLAN (BookBrowser drops <FilterBar state/onChange/view/onViewChange/genres /> directly)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "base-ui ToggleGroup uses `multiple` boolean prop (NOT Radix-style `type=multiple`); value is always Value[] even in single-select mode."
    - "base-ui Select single-mode onValueChange receives `string | null`; guard with `if (!v) return` (Phase 2 D-15 precedent)."
    - "Dual mobile/desktop layout via `md:contents` to lift children into the parent flex row; `md:ml-auto md:order-last` pushes sort+view to the right segment."
    - "Chip active/inactive styling keyed off `data-[pressed]` from the Toggle primitive (confirmed in @base-ui/react/toggle/ToggleDataAttributes)."
    - "Generic FilterChipGroup<T extends string> with explicit cast `as ('1'|'2'|'3'|'4'|'5')[]` so rating chip group infers the tight literal union (Checker I-5)."
    - "Rating chips exact-match semantic (RESEARCH A2), number[] <-> string[] round-trip at the component boundary."

key-files:
  created:
    - src/components/filter-chip-group.tsx
    - src/components/search-input.tsx
    - src/components/view-toggle.tsx
    - src/components/sort-select.tsx
    - src/components/filter-bar.tsx
  modified: []

key-decisions:
  - "ViewToggle uses base-ui single-select semantics: value prop passes `[value]` (array-wrapped) and onValueChange reads `next[0]` — ToggleGroup.Props.value is typed as `readonly Value[]` even without `multiple`. Guard rejects anything other than 'grid' | 'list' (Phase 2 D-15 precedent extended to ToggleGroup)."
  - "FilterChipGroup adds `spacing={8}` (px) and ViewToggle `spacing={4}` — the installed shadcn ToggleGroup reads spacing from context and applies gap via CSS var. Explicit values prevent the rounded-full chips from collapsing into the default grouped-pill look meant for segmented toolbars."
  - "Rating chip value type narrowed to literal union `'1' | '2' | '3' | '4' | '5'` via explicit cast on the stringified array — avoids TS widening to `string[]` and preserves type safety at the FilterChipGroup boundary (Checker I-5)."
  - "SearchInput receives `min-h-[44px] md:min-h-9` to meet the UI-SPEC Accessibility Contract touch target (44x44 mobile, 36px desktop). The primitive Input defaults to `h-8`, so the min-h classes win via tailwind-merge."
  - "Kept only `data-[pressed]` variants (NOT `data-[state=on]`) — the installed base-ui ToggleDataAttributes enum exposes only `pressed`. Dropping the unused `data-[state=on]` variants removes ~48 bytes and aligns with the verified primitive API."

threat-flags-scanned: true
threat-flags: []

requirements-completed:
  - BROWSE-01
  - BROWSE-02
  - BROWSE-03
  - BROWSE-04
  - BROWSE-05

metrics:
  tasks_completed: 2
  commits: 2
  files_created: 5
  files_modified: 0
  lines_added: 469
  duration_minutes: 20
  completed_at: 2026-04-17T13:53:53Z
---

# Phase 03 Plan 04: Filter Controls Summary

Delivered the five presentational/controlled components that make up the FilterBar: FilterChipGroup (generic base-ui ToggleGroup wrapper), SearchInput, ViewToggle, SortSelect (with independent ArrowUpDown direction toggle), and FilterBar itself (sticky strip composing them with mobile 2-row / desktop 1-row layout).

## Objective & Outcome

**Objective:** Build the surface area for BROWSE-01..05 as controlled, stateless components — no URL, localStorage, or fetch coupling — so Plan 05's BookBrowser can own all state wiring.

**Outcome:** Five new files under `src/components/`, totaling 469 lines, all `'use client'`, fully typed against the installed `@base-ui/react` primitives. `npm run build` and `npm test` both pass.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `b80e8c3` | feat(03-04): add FilterChipGroup, SearchInput, ViewToggle wrappers |
| 2 | `a6eecf8` | feat(03-04): add SortSelect and FilterBar composing the sticky filter strip |

## Files

### Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/filter-chip-group.tsx` | 64 | `FilterChipGroup<T extends string>` — generic multi-select pill wrapping base-ui `ToggleGroup multiple`. Chips styled with `data-[pressed]:bg-zinc-100 text-zinc-900` active state; `border-zinc-700 text-zinc-300` inactive; 44px mobile / 36px desktop touch target; focus-visible ring per UI-SPEC. Supports optional `leading` ReactNode per option (used by rating chips for the yellow Star icon). |
| `src/components/search-input.tsx` | 44 | `SearchInput` — controlled Input with lucide `Search` icon absolute-positioned, pt-BR default placeholder `"Buscar por título, autor ou notas..."`, aria-label `"Buscar na biblioteca"`, `md:w-72` desktop width, no internal debounce (nuqs handles throttle in `search-params.ts`). |
| `src/components/view-toggle.tsx` | 64 | `ViewToggle` — single-select grid/list toggle. Wraps its value in `[value]` and reads `next[0]` on callback because base-ui ToggleGroup always uses `Value[]`. Lucide `LayoutGrid` / `List` icons with aria-labels `"Visualizar em grade"` / `"Visualizar em lista"`. |
| `src/components/sort-select.tsx` | 111 | `SortSelect` — base-ui Select emitting key + default direction on change, plus an independent ArrowUpDown `Button` that flips `asc`/`desc` keeping key intact. Exports `SORT_OPTIONS` and `SORT_DEFAULT_DIR` (added_at/rating DESC, title/author ASC) for any other consumer. Label `"Ordenar por"` is `sr-only md:not-sr-only`. |
| `src/components/filter-bar.tsx` | 186 | `FilterBar` — sticky `top-[57px] z-10` container with `bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800` to sit visually contiguous with the page header. Composes SearchInput + three FilterChipGroups (status/rating/genre) + SortSelect + ViewToggle. Mobile 2-row layout, desktop single-row via `md:contents` flex unwrap. `role="group" aria-label="Filtros"` on the chip container. |

### Modified

None.

## Verification

| Check | Result |
|-------|--------|
| All 5 files exist | PASS |
| `'use client'` directive on all 5 | PASS |
| `multiple` boolean prop on FilterChipGroup (NOT `type="multiple"`) | PASS |
| SearchInput placeholder exact UTF-8 (`"Buscar por título, autor ou notas..."`) | PASS |
| ViewToggle aria-labels (`"Visualizar em grade"` / `"Visualizar em lista"`) | PASS |
| `min-h-[44px]` + `md:min-h-9` on chip/toggle/sort | PASS |
| Focus-visible ring `ring-2 ring-zinc-400 offset-2 offset-zinc-950` | PASS |
| SortSelect exports `SORT_OPTIONS`, `SORT_DEFAULT_DIR`, `ArrowUpDown` button | PASS |
| FilterBar sticky `top-[57px] z-10` + chip `overflow-x-auto` (D-08) | PASS |
| FilterBar pt-BR labels (`Filtrar por status` / `nota` / `gênero`) | PASS |
| Rating string cast `as ('1' | '2' | '3' | '4' | '5')[]` | PASS |
| No `useQueryStates` / `useRouter` / `useSearchParams` / `window.localStorage` / `fetch(` in any of the 5 files | PASS |
| `npm run build` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm test` (existing 87 tests) | PASS — 0 regressions |

## Deviations from Plan

**Auto-fixed issues (Rule 1 — Bugs):**

1. **[Rule 1 - Bug] ViewToggle single-select value/onValueChange signature corrected against installed base-ui API**
   - **Found during:** Task 1 (ViewToggle authoring).
   - **Issue:** Plan's `action` step prescribed `value={value}` (string) and a `next === 'grid' || next === 'list'` guard. Inspecting `@base-ui/react/toggle-group/ToggleGroup.d.ts` (line 36 / 46) showed `value?: readonly Value[]` and `onValueChange?: (Value[], ...) => void` — always arrays, even when `multiple` is omitted. A string-typed value would have been a type error, and the guard would never match an array payload.
   - **Fix:** Pass `value={[value]}` (wrap) and read `next[0]` before the `'grid' | 'list'` guard.
   - **Files modified:** `src/components/view-toggle.tsx` (written correctly on first pass).
   - **Commit:** `b80e8c3`.

2. **[Rule 1 - Bug] FilterChipGroup header comment triggered verify regex for forbidden Radix API**
   - **Found during:** Task 1 verify block.
   - **Issue:** The JSDoc header's "Radix uses `type=\"multiple\"` — DO NOT" contained the literal `type="multiple"`, which the plan's `! grep -q 'type="multiple"' src/components/filter-chip-group.tsx` verify check treats as a failure — it does not distinguish code from comments.
   - **Fix:** Reworded the comment to `(do NOT use Radix-style type=multiple)` — preserves the intent without matching the exact literal the verifier bans.
   - **Files modified:** `src/components/filter-chip-group.tsx`.
   - **Commit:** included in `b80e8c3`.

**Auto-added missing functionality (Rule 2):**

1. **[Rule 2 - Touch target] SearchInput min-h touch target**
   - **Found during:** Task 1 authoring.
   - **Issue:** The primitive `Input` defaults to `h-8` (32px), which violates UI-SPEC Accessibility Contract "touch targets ≥ 44×44 on mobile". The plan's action step did not include a min-h class for SearchInput.
   - **Fix:** Added `min-h-[44px] md:min-h-9` via tailwind-merge-aware `cn()` on the inner Input.
   - **Files modified:** `src/components/search-input.tsx`.
   - **Commit:** `b80e8c3`.

**Simplifications documented (post-hoc review, not a rule-triggered fix):**

1. **Dropped unused `data-[state=on]` variants.** The plan's action step included both `data-[pressed]:*` and `data-[state=on]:*` variants "as a safety belt". Inspection of `@base-ui/react/toggle/ToggleDataAttributes` (enum with only `pressed = "data-pressed"`) confirmed only the `pressed` attribute is emitted. Keeping only the verified variants cuts redundant classes without losing coverage. Documented in `key-decisions`.

2. **Added `spacing` prop to ToggleGroup instances.** The installed `src/components/ui/toggle-group.tsx` wrapper exposes a `spacing` numeric prop (default 0) that controls the CSS gap var. Without it, chips collapse into a segmented-pill look (meant for toolbar-style toggles) rather than separated rounded-full pills. `spacing={8}` for FilterChipGroup, `spacing={4}` for ViewToggle. Documented in `key-decisions`.

## Authentication Gates

None.

## Known Stubs

None. All five components fully satisfy their interface contracts.

## Threat Surface Notes

All five components are interactive but stateless (value + onChange props). No fetch, no fs, no storage. TypeScript generics + explicit guards (Select `if (!v) return`, ViewToggle `if (picked === 'grid' || picked === 'list')`) mitigate the only identified threat (T-03-04-01 — malicious parent passing unexpected value). Rating chip user input is rendered nowhere as HTML and flows to the parent unchanged; React escapes (T-03-04-02 accepted as planned).

No new threat surfaces introduced. `threat_flags: []`.

## Self-Check: PASSED

- FOUND: src/components/filter-chip-group.tsx
- FOUND: src/components/search-input.tsx
- FOUND: src/components/view-toggle.tsx
- FOUND: src/components/sort-select.tsx
- FOUND: src/components/filter-bar.tsx
- FOUND commit: b80e8c3 (feat(03-04): add FilterChipGroup, SearchInput, ViewToggle wrappers)
- FOUND commit: a6eecf8 (feat(03-04): add SortSelect and FilterBar composing the sticky filter strip)
- npm run build: PASS
- npm test: 87/87 PASS

## Handoff to Plan 05

Plan 05 (BookBrowser) can `import { FilterBar } from '@/components/filter-bar'` and drop it directly:

```tsx
<FilterBar
  state={{ status, rating, genre, q, sort, dir }}
  onChange={(patch) => setQueryStates(patch)}
  view={view}
  onViewChange={setView}
  genres={extractGenres(books)}
/>
```

BookBrowser owns: `useQueryStates(browseSearchParams)` for URL state, `useLocalStorage('dona-flora:view-mode', 'grid')` for view persistence, and `extractGenres(books)` to derive the genre chip list. None of that lives in the components Plan 04 delivered.
