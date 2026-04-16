---
phase: 02-catalog-core
plan: "01"
subsystem: books-data-layer
tags: [crud, slug, markdown, tdd, gray-matter, filesystem]
dependency_graph:
  requires: []
  provides:
    - writeBook (creates .md files with YAML frontmatter)
    - updateBook (partial merge of frontmatter + notes body)
    - deleteBook (removes .md file from disk)
    - generateSlug (UTF-8 title -> lowercase ASCII slug)
    - resolveSlugCollision (appends -2, -3 on filename conflict)
  affects:
    - All subsequent plans that create or modify books
tech_stack:
  added:
    - slugify@^1.6.9 (slug generation with Portuguese locale support)
  patterns:
    - TDD (RED -> GREEN per function group)
    - matter.stringify() for YAML frontmatter serialization
    - SAFE_MATTER_OPTIONS in all read paths (CVE-2025-65108 mitigation)
    - fs.unlink throws on missing file (explicit error, no silent swallowing)
key_files:
  created:
    - src/lib/books/slug.ts
    - src/lib/books/__tests__/slug.test.ts
  modified:
    - src/lib/books/library-service.ts
    - src/lib/books/__tests__/library-service.test.ts
    - package.json
    - package-lock.json
decisions:
  - slugify strict:true strips all non-alphanumeric chars preventing path traversal by design
  - locale:pt handles Portuguese accent transliteration (ação -> acao)
  - Counter for collision starts at 1, increments before assignment, yielding -2, -3 suffix pattern
  - added_at set to YYYY-MM-DD ISO date on writeBook only, never overwritten by updateBook
  - deleteBook delegates error to fs.unlink (no try/catch) so callers get explicit ENOENT
metrics:
  duration: 12min
  completed_date: "2026-04-16"
  tasks_completed: 2
  files_changed: 6
---

# Phase 02 Plan 01: LibraryService CRUD + Slug Utilities Summary

**One-liner:** Full CRUD for Markdown book files using gray-matter serialization and slugify-based collision-safe filenames.

## What Was Built

Extended the existing read-only LibraryService with write, update, and delete operations, and created a dedicated slug utility module. All code was developed using TDD (RED test commit → GREEN implementation commit per task).

### slug.ts

- `generateSlug(title)` — uses `slugify` with `{ lower: true, strict: true, locale: 'pt' }`. The `strict: true` option strips all characters except alphanumeric and hyphens, which eliminates path traversal characters (`..`, `/`, `\`) by design.
- `resolveSlugCollision(baseSlug)` — checks disk with `fs.access` and increments a counter until a free filename is found. Collision suffix pattern: `-2`, `-3`, etc. (per D-10 decision).

### library-service.ts additions

- `WriteBookInput` interface — exported so API routes can import the shape.
- `writeBook(input)` — generates slug, resolves collisions, serializes with `matter.stringify()`, writes file. Returns `{ slug }`.
- `updateBook(slug, updates)` — reads file with `SAFE_MATTER_OPTIONS`, merges partial frontmatter updates, optionally replaces notes body, rewrites file.
- `deleteBook(slug)` — calls `fs.unlink`, lets the ENOENT error propagate to callers.

## Test Coverage

| Suite | Tests | Result |
|-------|-------|--------|
| slug.test.ts | 11 | PASS |
| library-service.test.ts | 21 (13 existing + 8 new) | PASS |
| **Full suite** | **32** | **PASS** |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| ed4fa75 | test | Failing tests for slug generation (RED) |
| f14c909 | feat | generateSlug + resolveSlugCollision implementation (GREEN) |
| b0dbe19 | test | Failing tests for writeBook/updateBook/deleteBook (RED) |
| d394b31 | feat | writeBook, updateBook, deleteBook implementation (GREEN) |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Verification

All three threats from the plan's threat register were mitigated:

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-02-01 | `slugify({ strict: true })` strips path traversal chars; test confirms no `..`, `/`, `\` in output | Implemented + tested |
| T-02-02 | `matter.stringify()` handles YAML escaping; no manual YAML template strings | Implemented |
| T-02-03 | `SAFE_MATTER_OPTIONS` used in `updateBook()` read step (disables JS engine) | Implemented + tested |

## Known Stubs

None — all exported functions are fully implemented with real filesystem I/O.

## Self-Check: PASSED

Files exist:
- src/lib/books/slug.ts — FOUND
- src/lib/books/library-service.ts — FOUND (extended)
- src/lib/books/__tests__/slug.test.ts — FOUND
- src/lib/books/__tests__/library-service.test.ts — FOUND (extended)

Commits verified: ed4fa75, f14c909, b0dbe19, d394b31 — all in git log.
