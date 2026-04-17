---
phase: 03-browse-ui
plan: 01
subsystem: infra
tags:
  - setup
  - deps
  - fuse.js
  - nuqs
  - shadcn
  - base-ui
  - toggle-group
  - react-testing-library
  - jest
  - refactor

# Dependency graph
requires:
  - phase: 02-catalog-core
    provides: searchOpenLibrary + BookSearchResult interface + shadcn base-nova preset (components.json)
provides:
  - fuse.js ^7.3.0 runtime dep for client-side fuzzy search (used by Plans 02/03)
  - nuqs ^2.8.9 runtime dep for URL-state in filter/search (used by Plans 02/03/04)
  - NuqsAdapter wrapping {children} in src/app/layout.tsx (prereq for useQueryStates in downstream plans)
  - shadcn toggle-group + toggle primitives (base-ui variant) for FilterChipGroup in Plan 03
  - React Testing Library dev deps (@testing-library/react, jest-dom, user-event, jest-environment-jsdom) for component tests in Plans 02/03/04
  - src/lib/api/dedupe.ts shared module (stripDiacritics, dedupeKey, dedupeBooks) reusable in AddBookDialog and browse list dedupe
affects:
  - 03-02-PLAN (fuzzy search client needs fuse.js + RTL)
  - 03-03-PLAN (filter chips need toggle-group + nuqs + RTL)
  - 03-04-PLAN (URL-state driven filters need NuqsAdapter + nuqs)
  - 03-06-PLAN (AddBookDialog load-more dedupe needs dedupeBooks)

# Tech tracking
tech-stack:
  added:
    - fuse.js ^7.3.0
    - nuqs ^2.8.9
    - "@testing-library/react ^16.3.2"
    - "@testing-library/jest-dom ^6.9.1"
    - "@testing-library/user-event ^14.6.1"
    - jest-environment-jsdom ^30.3.0
  patterns:
    - "shadcn toggle-group generated under base-nova preset resolves to @base-ui/react/toggle-group (not Radix) — confirms base-ui continues to be the project's primitive layer"
    - "Shared pure helpers (dedupe) extracted from API-specific modules live under src/lib/api/<name>.ts and are covered by focused Jest suites"
    - "Root layout wraps {children} in NuqsAdapter once; downstream plans can use useQueryStates without adding providers"

key-files:
  created:
    - src/components/ui/toggle-group.tsx
    - src/components/ui/toggle.tsx
    - src/lib/api/dedupe.ts
    - src/lib/api/__tests__/dedupe.test.ts
  modified:
    - package.json
    - package-lock.json
    - src/app/layout.tsx
    - src/lib/api/open-library.ts

key-decisions:
  - "Accepted auto-created src/components/ui/toggle.tsx — shadcn's toggle-group primitive depends on the toggle primitive; omitting it would leave toggle-group imports unresolved (Rule 3 auto-fix)"
  - "jest.config.ts left untouched — fuse.js 7.3 ships CJS (main: ./dist/fuse.cjs) and full test suite stays green without adding it to ESM_PACKAGES (RESEARCH Assumption A5 confirmed)"
  - "Refactor of open-library.ts was minimal — imported stripDiacritics + dedupeKey from ./dedupe and left the inline seen-Set loop intact (plan explicitly forbids swapping the loop for dedupeBooks in this plan to preserve ordering guarantees)"

patterns-established:
  - "Pattern: base-nova shadcn preset reliably produces base-ui primitives — verified a second time (after Select in Phase 2) for toggle-group; future shadcn installs in this project should assume @base-ui/react imports, not @radix-ui"
  - "Pattern: NuqsAdapter wraps only {children} (not the <html>/<body> shell) so it remains a pure client-side provider with no access to SSR request/response surface"
  - "Pattern: order-preserving dedupe helper (dedupeBooks) with optional cap is the canonical shape for merging paged or multi-source search results"

requirements-completed:
  - BROWSE-01
  - BROWSE-02
  - BROWSE-03
  - BROWSE-04
  - BROWSE-05

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 03 Plan 01: Setup Summary

**Phase 3 groundwork laid — fuse.js + nuqs installed, NuqsAdapter wired in root layout, shadcn toggle-group primitive generated under base-ui, and dedupe helpers extracted to a shared module so AddBookDialog can reuse them in later plans.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-17T13:33:06Z
- **Completed:** 2026-04-17T13:35:46Z
- **Tasks:** 2
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments
- Installed runtime deps `fuse.js@^7.3.0` and `nuqs@^2.8.9` and dev deps `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom` needed by downstream plans' component tests.
- Generated shadcn `toggle-group` + `toggle` primitives via `npx shadcn@latest add toggle-group` — verified both files import from `@base-ui/react` (base-ui variant, not Radix), matching the project's `base-nova` preset.
- Wrapped `{children}` in `<NuqsAdapter>` in `src/app/layout.tsx` so later `useQueryStates` calls actually write to the URL (RESEARCH Pitfall 4 mitigation) while keeping `<html lang="pt-BR">`, font variables, dark class, and metadata export untouched.
- Extracted `stripDiacritics` + `dedupeKey` from `src/lib/api/open-library.ts` into the new `src/lib/api/dedupe.ts` module, added a reusable order-preserving `dedupeBooks(input, cap?)` helper (RESEARCH Pitfall 7 fix surface), and kept `open-library.ts`'s observable behaviour byte-identical (no changes to the `seen: Set` merge loop).
- Added focused unit coverage in `src/lib/api/__tests__/dedupe.test.ts` (NFD folding, ISBN key preference, title+author fallback, ISBN collapse, cap behaviour).
- Full test suite stays green — 8 suites, 69 tests — without touching `jest.config.ts` (fuse.js 7.3's CJS bundle satisfies Jest out of the box, so its ESM allowlist was not expanded).

## Task Commits

1. **Task 1: Install runtime + test deps and shadcn toggle-group, add NuqsAdapter to root layout** — `3dbd5c4` (feat)
2. **Task 2: Extract dedupe helpers to src/lib/api/dedupe.ts, refactor open-library.ts to import them** — `207062b` (refactor)

**Plan metadata:** pending (orchestrator will commit SUMMARY.md in worktree finalisation)

## Files Created/Modified

### Created
- `src/components/ui/toggle-group.tsx` — shadcn ToggleGroup + ToggleGroupItem wrappers around `@base-ui/react/toggle-group` (base-nova preset).
- `src/components/ui/toggle.tsx` — shadcn Toggle wrapper around `@base-ui/react/toggle`; automatic dependency of toggle-group.
- `src/lib/api/dedupe.ts` — exports `stripDiacritics`, `dedupeKey`, `dedupeBooks` (order-preserving, optional cap).
- `src/lib/api/__tests__/dedupe.test.ts` — 5 tests covering NFD folding, ISBN key, title+author fallback, ISBN collapse, cap.

### Modified
- `package.json` — added 2 runtime deps (fuse.js, nuqs) and 4 devDeps (RTL suite + jest-environment-jsdom).
- `package-lock.json` — locked resolved versions.
- `src/app/layout.tsx` — added `import { NuqsAdapter } from "nuqs/adapters/next/app"`; replaced `{children}` with `<NuqsAdapter>{children}</NuqsAdapter>` inside `<body>`. No other changes.
- `src/lib/api/open-library.ts` — added `import { stripDiacritics, dedupeKey } from './dedupe'`; removed the local `stripDiacritics` and `dedupeKey` function definitions. Everything else (fetchOnce, searchOpenLibrary body, the seen-Set merge loop) is byte-identical.

## Decisions Made

- **Keep `jest.config.ts` unchanged.** The plan's step 4 in Task 2 says "only modify `jest.config.ts` if `npm test` fails on fuse.js ESM parsing." The full suite stayed green (69 tests, 8 suites) — so fuse.js is being resolved via its CJS entry (`dist/fuse.cjs`) and no ESM allowlist extension is needed. Assumption A5 from RESEARCH confirmed.
- **Accept the auto-created `src/components/ui/toggle.tsx`.** shadcn's `toggle-group` registry entry depends on `toggle`; the CLI wrote both files. The plan listed only `toggle-group.tsx` under `files_modified`, but omitting `toggle.tsx` would leave the `TogglePrimitive` import in `toggle-group.tsx` unresolved. Classified as deviation Rule 3 (auto-fix blocking) — the whole plan fails at build time without it.
- **Preserve the inline `seen: Set` loop inside `searchOpenLibrary`.** The plan explicitly forbids replacing it with `dedupeBooks(successes, limit)` in this plan because that would change ordering/short-circuit semantics (the inline loop breaks out the moment `merged.length >= limit`, before iterating the rest of `successes`). Left intact — `dedupeBooks` is available for downstream plans to adopt where the semantics fit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Committed the auto-created `src/components/ui/toggle.tsx` alongside `toggle-group.tsx`**
- **Found during:** Task 1 (after `npx shadcn@latest add toggle-group`)
- **Issue:** shadcn's `toggle-group` primitive imports `TogglePrimitive` from the companion `toggle` primitive, so the CLI wrote both files. The plan's `files_modified` list named only `toggle-group.tsx` — ignoring `toggle.tsx` would leave the import unresolved and break the build.
- **Fix:** Staged and committed both `toggle-group.tsx` and `toggle.tsx` together in Task 1's commit.
- **Files modified:** `src/components/ui/toggle-group.tsx`, `src/components/ui/toggle.tsx`
- **Verification:** `npm run build` completes; `grep @base-ui/react src/components/ui/toggle.tsx` shows the base-ui import.
- **Committed in:** `3dbd5c4` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation simply acknowledges shadcn's registry topology (toggle-group pulls in toggle). No behavioural change vs. the plan's intent. No scope creep.

## Issues Encountered

- **`npm test -- --testPathPattern="..."` rejected by Jest 30** — Jest 30 renamed the flag to `--testPathPatterns` (plural). Corrected the command on the second run; no code change required. Does not affect how the suite is run under `npm test` (no flag).
- **Turbopack NFT warning about `next.config.ts` appearing in route trace** — pre-existing warning from Phase 2's `library-service.ts`; not introduced by this plan, flagged here only to confirm I did not miss a regression.

## User Setup Required

None — all installs are local `npm` operations; no external service configuration.

## Next Phase Readiness

- **Plan 02 (client search):** ready. `fuse.js` resolvable, RTL available for `SearchInput.test.tsx`, `dedupeBooks` available if the search result merger needs it.
- **Plan 03 (filter chips):** ready. `toggle-group` primitive present in base-ui form; `nuqs` + `NuqsAdapter` wired; RTL available for chip-group component tests.
- **Plan 04 (URL-driven filters):** ready. `NuqsAdapter` in place; `useQueryStates` will write to the URL as expected.
- **Plan 06 (AddBookDialog load-more):** ready. `dedupeBooks(input, cap?)` is exported from `src/lib/api/dedupe.ts` and can be called on every `fetchMore` merge (Pitfall 7 fix surface).
- **No blockers or concerns identified for the next plan in this phase.**

## Self-Check

Verifying the claims above against the filesystem and git history.

**Files created (expected to exist):**
- `src/components/ui/toggle-group.tsx` — FOUND
- `src/components/ui/toggle.tsx` — FOUND
- `src/lib/api/dedupe.ts` — FOUND
- `src/lib/api/__tests__/dedupe.test.ts` — FOUND

**Files modified (expected to show this plan's changes):**
- `package.json` — contains `"fuse.js"` and `"nuqs"` entries under dependencies, plus the four RTL entries under devDependencies (verified via `node -e` check).
- `src/app/layout.tsx` — contains `import { NuqsAdapter } from "nuqs/adapters/next/app"` and `<NuqsAdapter>{children}</NuqsAdapter>`.
- `src/lib/api/open-library.ts` — contains `from './dedupe'` import; no longer defines `stripDiacritics`/`dedupeKey` locally.

**Commits (expected in `git log`):**
- `3dbd5c4` — feat(03-01): install deps, add toggle-group, wire NuqsAdapter — FOUND
- `207062b` — refactor(03-01): extract dedupe helpers to src/lib/api/dedupe.ts — FOUND

**Phase-level verification checks (from PLAN `<verification>`):**
1. `node -e "require.resolve('fuse.js'); require.resolve('nuqs')"` → prints `deps resolvable` (PASS)
2. `grep -c "import { NuqsAdapter }" src/app/layout.tsx` → `1` (PASS)
3. `grep -c "from '@base-ui/react'" src/components/ui/toggle-group.tsx` → `2` (PASS; matches `@base-ui/react/toggle` and `@base-ui/react/toggle-group`)
4. `npm test` → exit 0, 8 suites passed, 69 tests passed (PASS)
5. `npm run build` → compiles successfully (PASS; pre-existing Turbopack NFT warning unrelated)

## Self-Check: PASSED

---
*Phase: 03-browse-ui*
*Completed: 2026-04-17*
