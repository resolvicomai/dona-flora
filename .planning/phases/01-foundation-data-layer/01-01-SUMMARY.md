---
phase: 01-foundation-data-layer
plan: 01
subsystem: infra
tags: [nextjs, gray-matter, zod, markdown, typescript, jest]

requires: []
provides:
  - "BookSchema Zod object with D-04 frontmatter fields"
  - "LibraryService with listBooks() and getBook() reading from configurable LIBRARY_DIR"
  - "SAFE_MATTER_OPTIONS constant mitigating CVE-2025-65108"
  - "Unit tests covering schema validation, UTF-8, malformed files, CVE mitigation"
affects: [catalog-core, ai-librarian]

tech-stack:
  added: [next@16.2.4, react@19.2.4, gray-matter@4.0.3, zod@4.3.6, tailwindcss@4, jest@30, ts-jest@29]
  patterns: [markdown-as-database, safe-gray-matter-options, skip-and-log-malformed, utf8-explicit-encoding]

key-files:
  created:
    - src/lib/books/schema.ts
    - src/lib/books/library-service.ts
    - src/lib/books/__tests__/library-service.test.ts
    - data/books/dom-casmurro.md
    - data/books/精通python.md
    - data/books/malformed-example.md
    - jest.config.ts
    - .env.example
  modified:
    - src/app/page.tsx
    - next.config.ts
    - package.json
    - .gitignore

key-decisions:
  - "gray-matter CVE-2025-65108 mitigated with javascript engine key override (not js)"
  - "Malformed frontmatter files skipped with console.warn, never crash the service"
  - "z.coerce.number() used for year and rating to handle YAML string-to-number edge cases"
  - "try/catch wraps matter() call to catch JS-engine throws from malicious frontmatter"

patterns-established:
  - "SAFE_MATTER_OPTIONS: every call to matter() must use this constant"
  - "LibraryService abstraction: all file I/O goes through listBooks/getBook"
  - "Skip-and-log: malformed files produce console.warn, never throw"
  - "UTF-8 explicit: readFile always uses 'utf-8' encoding"

requirements-completed: [INFRA-03]

duration: 24min
completed: 2026-04-16
---

# Phase 1 Plan 1: Next.js Scaffold + Book Data Layer Summary

**Next.js 16 project with Zod book schema, LibraryService reading Markdown files from configurable directory, CVE-2025-65108 mitigated, 13 unit tests passing**

## Performance

- **Duration:** 24 min
- **Started:** 2026-04-16T11:02:02Z
- **Completed:** 2026-04-16T11:26:16Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Next.js 16.2.4 project scaffolded with standalone output, Tailwind v4, Jest + ts-jest
- BookSchema with all D-04 frontmatter fields validated by Zod (title, author required; status enum; rating 1-5; _notes from body)
- LibraryService reads .md files from LIBRARY_DIR with UTF-8, skips malformed files, mitigates CVE-2025-65108
- 13 unit tests passing: schema validation, listBooks, getBook, UTF-8 Portuguese/Chinese, CVE mitigation
- Skeleton page displays book count from data/books/ directory (2 valid, 1 malformed skipped)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project and install dependencies** - `64d987e` (feat)
2. **Task 2: Implement Zod book schema, LibraryService, sample fixtures, and unit tests** - `3a437e1` (feat)

## Files Created/Modified
- `src/lib/books/schema.ts` - Zod BookSchema with BookStatusEnum, Book type, BookStatus type
- `src/lib/books/library-service.ts` - LibraryService with listBooks, getBook, SAFE_MATTER_OPTIONS
- `src/lib/books/__tests__/library-service.test.ts` - 13 unit tests covering all INFRA-03 behaviors
- `src/lib/books/__tests__/fixtures/` - 4 test fixtures (valid, Chinese, malformed, JS-engine attack)
- `data/books/dom-casmurro.md` - Sample Brazilian literature book
- `data/books/精通python.md` - Sample Chinese-titled book (UTF-8 test)
- `data/books/malformed-example.md` - Intentionally malformed (missing author, status)
- `src/app/page.tsx` - Skeleton page showing book count from LibraryService
- `next.config.ts` - Standalone output for Docker/VPS deployment
- `jest.config.ts` - Jest with ts-jest preset and @/ alias mapping
- `package.json` - Dependencies: gray-matter, zod, jest, ts-jest
- `.env.example` - LIBRARY_DIR configuration documentation
- `.gitignore` - Standard Next.js ignores + .env.local

## Decisions Made
- Used `z.coerce.number()` for `year` and `rating` fields to handle YAML parsing that may return strings for numbers
- Added `_filename` field to BookSchema for future getBook/deleteBook identification
- Wrapped `matter()` call in try/catch inside listBooks loop to gracefully handle JS-engine throws from malicious frontmatter files (deviation from plan which only had safeParse)
- Used `create-next-app` in temp directory and copied files due to npm naming restrictions on project directory with spaces

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app refused non-URL-safe directory name**
- **Found during:** Task 1
- **Issue:** `npx create-next-app . --yes` failed because "Dona Flora" contains a space and uppercase letters
- **Fix:** Created project in /tmp/dona-flora-scaffold and copied files to project directory
- **Files modified:** All scaffolded files
- **Verification:** npm install and npm run build both succeed
- **Committed in:** 64d987e

**2. [Rule 1 - Bug] Added try/catch around matter() in listBooks loop**
- **Found during:** Task 2
- **Issue:** Plan's listBooks only used safeParse for validation but matter() itself throws when encountering JS-engine frontmatter -- the throw would break the entire loop
- **Fix:** Wrapped matter() call in try/catch, logging the error and continuing to next file
- **Files modified:** src/lib/books/library-service.ts
- **Verification:** listBooks correctly skips javascript-engine-attack.md without crashing; all 13 tests pass
- **Committed in:** 3a437e1

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LibraryService and BookSchema are ready for Phase 1 Plan 2 (Docker configuration)
- LibraryService is read-only -- write operations (writeBook, deleteBook) will be added in Phase 2
- LIBRARY_DIR env var is configurable for both local dev (.env.local) and Docker (environment section)

## Self-Check: PASSED

All 10 key files verified on disk. Both task commits (64d987e, 3a437e1) verified in git log.

---
*Phase: 01-foundation-data-layer*
*Completed: 2026-04-16*
