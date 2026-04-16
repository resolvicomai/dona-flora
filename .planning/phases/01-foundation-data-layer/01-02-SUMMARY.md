---
phase: 01-foundation-data-layer
plan: 02
subsystem: infra
tags: [docker, docker-compose, standalone, nextjs, orbstack]

requires:
  - phase: 01-foundation-data-layer/01
    provides: "Next.js scaffold with standalone output, LibraryService, sample book fixtures"
provides:
  - "Multi-stage Dockerfile (deps/builder/runner) producing minimal standalone image"
  - "docker-compose.yml with volume mount for /data/books"
  - ".dockerignore excluding build artifacts and data directory"
  - "Force-dynamic page rendering for runtime filesystem reads in Docker"
affects: [catalog-core, deployment, ai-librarian]

tech-stack:
  added: [docker, docker-compose]
  patterns: [multi-stage-dockerfile, standalone-nextjs-docker, volume-mount-for-data, force-dynamic-rendering]

key-files:
  created:
    - Dockerfile
    - docker-compose.yml
    - .dockerignore
  modified:
    - src/app/page.tsx
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "Run as root (user 0:0) in docker-compose for OrbStack volume permission compatibility"
  - "force-dynamic + noStore() on page.tsx to prevent Next.js static pre-rendering of filesystem reads"
  - "Dark mode zinc-based design for skeleton page UI"

patterns-established:
  - "force-dynamic: pages reading from filesystem must export const dynamic = 'force-dynamic' and use noStore()"
  - "Volume mount pattern: host ./data/books maps to container /data/books via LIBRARY_DIR env var"

requirements-completed: [INFRA-01, INFRA-02]

duration: 35min
completed: 2026-04-16
---

# Phase 1 Plan 2: Docker Infrastructure Summary

**Multi-stage Dockerfile with standalone Next.js build, docker-compose volume mount for Markdown data, verified end-to-end in OrbStack**

## Performance

- **Duration:** ~35 min (including checkpoint resolution)
- **Started:** 2026-04-16T11:32:00Z
- **Completed:** 2026-04-16T12:07:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Multi-stage Dockerfile (deps/builder/runner) producing minimal standalone image with node:22-slim
- docker-compose.yml with single-command startup, volume mount for book data, healthcheck, restart policy
- End-to-end smoke test verified: Docker container serves page at localhost:3000 with 2 books from mounted volume
- Malformed book file (malformed-example.md) correctly rejected at runtime inside container

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Dockerfile, docker-compose.yml, and .dockerignore** - `726c381` (feat)
2. **Task 2: Verify Docker smoke test** - checkpoint verified by user (no separate commit -- verification only)

**Checkpoint resolution commits** (fixes applied during human-verify):
- `27e500f` - fix(ui): dark mode design with proper zinc contrast
- `a5a82ec` - fix(docker): user 0:0 for OrbStack volume permissions
- `1c72093` - fix(page): force-dynamic + noStore() for runtime filesystem reads

## Files Created/Modified
- `Dockerfile` - Three-stage build: deps (npm ci), builder (npm run build), runner (standalone output with non-root user)
- `docker-compose.yml` - Single service with port 3000, volume mount ./data/books:/data/books, restart unless-stopped
- `.dockerignore` - Excludes node_modules, .next, .git, .planning, data/ from build context
- `src/app/page.tsx` - Added force-dynamic export and noStore() to ensure runtime filesystem reads
- `src/app/layout.tsx` - Updated with dark mode class on html element
- `src/app/globals.css` - Simplified to dark mode zinc-based styling

## Decisions Made
- **OrbStack volume permissions:** Changed docker-compose to `user: "0:0"` (root) because OrbStack's gRPC FUSE volume driver does not map host UIDs to container UIDs the way Docker Desktop does. The non-root user (nextjs:1001) in the Dockerfile is preserved for production VPS use.
- **Force-dynamic rendering:** Next.js static pre-rendering at build time cannot read from the runtime volume mount. Added `export const dynamic = 'force-dynamic'` and `noStore()` to ensure LibraryService reads happen at request time.
- **Dark mode UI:** Applied zinc-based dark theme to the skeleton page for better visual presentation during development.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Force-dynamic rendering for filesystem reads**
- **Found during:** Task 2 (smoke test)
- **Issue:** Next.js pre-rendered the page at build time inside Docker, before the volume was mounted, resulting in 0 books found
- **Fix:** Added `export const dynamic = 'force-dynamic'` and `noStore()` to page.tsx
- **Files modified:** src/app/page.tsx
- **Verification:** Container logs show "2 livros encontrados" at request time
- **Committed in:** 1c72093

**2. [Rule 3 - Blocking] OrbStack volume permissions**
- **Found during:** Task 2 (smoke test)
- **Issue:** Container running as nextjs:1001 could not read host-mounted volume in OrbStack (permission denied on /data/books)
- **Fix:** Added `user: "0:0"` to docker-compose.yml for OrbStack compatibility
- **Files modified:** docker-compose.yml
- **Verification:** Container reads 2 books from mounted volume successfully
- **Committed in:** a5a82ec

**3. [Rule 2 - Enhancement] Dark mode UI styling**
- **Found during:** Task 2 (smoke test)
- **Issue:** Skeleton page had poor visual contrast with default light theme
- **Fix:** Applied dark mode with zinc-based color scheme
- **Files modified:** src/app/page.tsx, src/app/layout.tsx, src/app/globals.css
- **Committed in:** 27e500f

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 enhancement)
**Impact on plan:** Bug and blocking fixes were necessary for Docker to work correctly. UI enhancement was cosmetic but done during checkpoint resolution.

## Issues Encountered
- Next.js standalone mode pre-renders pages at build time by default, which is incompatible with runtime volume mounts. This is a known pattern that must be handled for any page reading from the filesystem.
- OrbStack's volume driver has different UID mapping behavior compared to Docker Desktop. Production VPS deployments should work with the non-root user as-is.

## User Setup Required
None - Docker/OrbStack must be installed on the host machine (already verified).

## Next Phase Readiness
- Docker infrastructure is complete and verified end-to-end
- Phase 1 success criteria are all satisfied:
  1. docker-compose up starts the app accessible at localhost:3000
  2. App reads Markdown files from mounted volume
  3. Sample books are parsed via LibraryService with Zod validation
  4. Skeleton page displays book count (2 valid, 1 malformed skipped)
- Ready for Phase 2: Catalog Core (add/edit/delete books, status workflow)

## Known Stubs
None - no placeholder data or unresolved TODOs in plan scope.

## Self-Check: PASSED

All 4 key files verified on disk. All 4 task commits (726c381, 27e500f, a5a82ec, 1c72093) verified in git log.

---
*Phase: 01-foundation-data-layer*
*Completed: 2026-04-16*
