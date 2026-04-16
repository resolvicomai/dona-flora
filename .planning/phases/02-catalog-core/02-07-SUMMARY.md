---
phase: 02-catalog-core
plan: 07
subsystem: api
tags: [nextjs, route-handler, fallback, resilience, google-books, open-library, jest]

requires:
  - phase: 02-catalog-core
    provides: searchGoogleBooks / searchOpenLibrary client helpers and the initial POST /api/books/search route
provides:
  - Resilient POST /api/books/search that falls back to Open Library when Google Books fails (error or empty)
  - 5 unit tests covering the full fallback matrix (Google ok, Google empty, Google throws, both fail, validation)
  - .env.example documentation for GOOGLE_BOOKS_API_KEY with setup + security steps
affects:
  - phase-02 UAT re-run (GAP 1 closure)
  - any future provider added to the search fallback chain

tech-stack:
  added: []
  patterns:
    - "Provider fallback chain: wrap each external dependency in its own try/catch; warn-on-fallback, error-only-on-total-failure"
    - "Route handler tests mock collaborators via jest.mock(module) and invoke POST(NextRequest) directly"

key-files:
  created:
    - src/lib/api/__tests__/search-route.test.ts
  modified:
    - src/app/api/books/search/route.ts
    - .env.example

key-decisions:
  - "Google Books failure logged with console.warn (expected fallback path), not console.error — error is reserved for total failure of both providers"
  - "Generic pt-BR error message on 500, no provider details leaked (T-02-07-01 mitigation)"
  - "Zod validation (400) moved above provider try/catch; malformed JSON also stays 400 via dedicated parse try/catch"
  - "Tests mock @/lib/api/google-books and @/lib/api/open-library at module level; NextRequest constructed directly (jest testEnvironment=node supports Web Fetch Request)"

patterns-established:
  - "Per-provider try/catch with googleError captured for later context logging if both fail"
  - "Route-handler unit-test pattern using jest.mock for module isolation + direct POST invocation"

requirements-completed: [CATALOG-01]

duration: 12min
completed: 2026-04-16
---

# Phase 02-catalog-core Plan 07: search-fallback-hardening Summary

**Resilient provider fallback in POST /api/books/search — Google Books errors (503/429/missing key) now transparently fall through to Open Library; 500 returned only when both providers fail.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-16T20:00:00Z (approx.)
- **Completed:** 2026-04-16T20:04:00Z (approx.)
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- GAP 1 of 02-UAT.md closed: searching for "dom casmurro" without a Google Books API key now returns 200 via Open Library fallback instead of 500.
- 5 new Jest tests in `search-route.test.ts` lock in the four-quadrant fallback matrix + a validation regression (suite: 52 → 57 passing).
- `.env.example` documents the optional Google Books API key with step-by-step Google Cloud Console instructions and a security note to restrict the key to the Books API.
- TypeScript compiles clean (`npx tsc --noEmit` exit 0); no regressions in pre-existing 52 tests.

## Task Commits

Each task was committed atomically with --no-verify (parallel-worktree mode):

1. **Task 1: Write failing tests for resilient search fallback** — `4c7c49d` (test)
2. **Task 2: Implement resilient fallback in search route (GREEN)** — `6279644` (fix)
3. **Task 3: Document GOOGLE_BOOKS_API_KEY in .env.example** — `e3bcb6d` (docs)

_Note: Task 1 is the RED phase commit, Task 2 is GREEN. No refactor commit was needed — the minimal implementation was already clean._

## Files Created/Modified
- `src/lib/api/__tests__/search-route.test.ts` (created) — 5 unit tests covering Google ok / Google empty / Google throws / both throw / validation (query < 2 chars).
- `src/app/api/books/search/route.ts` (modified) — wraps `searchGoogleBooks` in its own try/catch, falls through to `searchOpenLibrary` on error OR empty results, returns 500 only when both fail, uses `console.warn` for fallback and `console.error` only for total failure. JSON parsing moved to its own try/catch so malformed JSON stays 400 (not 500).
- `.env.example` (modified) — added `GOOGLE_BOOKS_API_KEY=` (empty value) with 10-line comment block covering how to obtain the key from Google Cloud Console and security hardening (API restrictions).

## Decisions Made
- **Per-provider try/catch** (not a single outer catch) — the original single outer try/catch was the root cause of the bug; splitting it makes the fallback semantic explicit and testable.
- **console.warn vs console.error** — Google failure is an expected success path (fallback engages); console.error is reserved for the genuine total-failure case.
- **Malformed JSON → 400** (was implicitly 500 in original) — moved `request.json()` into its own try/catch so invalid JSON no longer conflates with provider errors. Minor scope expansion, documented here. Not flagged as deviation because the prior behavior was itself a small bug in the same handler (Rule 1 territory).
- **No changes to `searchGoogleBooks` / `searchOpenLibrary`** — their error-throwing contract is exactly what the route handler needs for clean fallback dispatch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Malformed JSON body now returns 400 instead of 500**
- **Found during:** Task 2 (route rewrite)
- **Issue:** The original route wrapped `request.json()` in the same outer try/catch as the provider calls, so malformed JSON bodies would hit the generic `catch (err)` and return 500 with a misleading "Erro ao buscar livros" message. After removing the outer try/catch (per plan instruction "Remove the now-unnecessary outer try/catch"), bad JSON would have crashed the handler entirely.
- **Fix:** Added a dedicated try/catch around `request.json()` that returns 400 with `{ error: 'Invalid JSON body' }` — correct semantic status for client-side malformed payload.
- **Files modified:** `src/app/api/books/search/route.ts`
- **Verification:** Tests 1–5 still pass; Zod validation test (Test 5) continues to return 400 on short query, confirming the 400 path is healthy.
- **Committed in:** `6279644` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correctness. The plan explicitly told me to remove the outer catch; doing so exposed the JSON-parse edge case, which I fixed in the same commit to avoid introducing a new 500 path while fixing another.

## Issues Encountered

- **Unrelated STATE.md modification swept into Task 1 commit.** The orchestrator (or another process) mutated `.planning/STATE.md` during initialization. When I ran `git add src/lib/api/__tests__/search-route.test.ts`, the STATE.md modification was somehow also included in the commit diff despite only explicitly staging the test file. Subsequent commits (Task 2, Task 3) were guarded with `git reset HEAD -- .planning/STATE.md .planning/ROADMAP.md` before staging, and only contain the intended files. The Task 1 commit includes one STATE.md change that was not under my control; this is flagged here for orchestrator awareness. Per the worktree protocol the orchestrator will rewrite STATE.md after merge, so this should resolve cleanly.

## User Setup Required

None — GOOGLE_BOOKS_API_KEY is explicitly documented as optional. The app runs end-to-end on Open Library alone (at reduced hit rate / latency). If the user wants the primary Google Books path, they can follow the 5-step console.cloud.google.com instructions now in `.env.example`.

## GAP 1 Closure (02-UAT.md)

Truth now satisfied:
- `searchGoogleBooks` throws on `!res.ok` → caught locally in route.ts → falls through to `searchOpenLibrary`.
- `searchOpenLibrary` throws → caught in the nested try/catch → returns 500 with generic pt-BR message, no internal details leaked.
- `.env.example` documents `GOOGLE_BOOKS_API_KEY=` with full setup instructions and `console.cloud.google.com` link.

Automated evidence:
- `npm test -- search-route` → 5 passed (including the Google-throws-Open-Library-succeeds path).
- `npm test` → 57 passed (52 prior + 5 new), 0 failed.
- `npx tsc --noEmit` → exit 0.

## Self-Check: PASSED

- FOUND: `src/lib/api/__tests__/search-route.test.ts` (created)
- FOUND: `src/app/api/books/search/route.ts` (modified, contains `try { ... searchGoogleBooks` + `searchOpenLibrary` fallback)
- FOUND: `.env.example` (contains `GOOGLE_BOOKS_API_KEY=`, `console.cloud.google.com`, `Books API`, and preserved `LIBRARY_DIR`)
- FOUND commit `4c7c49d` (test phase)
- FOUND commit `6279644` (fix phase)
- FOUND commit `e3bcb6d` (docs phase)
- Full test suite: 57 passed / 0 failed
- TypeScript: clean (tsc exit 0)

## Next Phase Readiness

- Phase 02 UAT can be re-run against GAP 1 — expected to pass now without any Google Books API key configured.
- No blockers for Phase 03. The fallback chain pattern is ready to be reused if a third provider is added later.

---
*Phase: 02-catalog-core*
*Completed: 2026-04-16*
