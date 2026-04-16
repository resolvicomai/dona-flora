---
phase: 02-catalog-core
plan: 08
subsystem: ui-polish
tags: [gap-closure, pt-br-labels, typography, feedback, tdd]
status: awaiting-checkpoint
typography_version: "0.5.0-alpha.3"
dependency_graph:
  requires:
    - plan: 02-06
      artifact: BookEditForm
    - plan: 02-05
      artifact: AddBookDialog
    - plan: 02-03
      artifact: Select wrapper in src/components/ui/select.tsx
  provides:
    - module: "@/lib/books/status-labels"
      exports: [STATUS_LABELS, STATUS_OPTIONS, getStatusLabel]
    - css: "@plugin @tailwindcss/typography enabled globally"
  affects:
    - src/components/book-edit-form.tsx
    - src/components/add-book-dialog.tsx
    - src/components/ui/select.tsx
    - src/app/globals.css
tech_stack:
  added:
    - "@tailwindcss/typography@next (resolved 0.5.0-alpha.3)"
  patterns:
    - "Shared label module pattern: co-locate pt-BR strings + ordered options + resolver in one file per domain concept."
    - "Base UI Select render-prop pattern: <SelectValue>{(v) => getStatusLabel(v)}</SelectValue> displays human label while value stays as canonical slug."
    - "React 19 startTransition around router.refresh to preserve client state across Server Component re-fetch."
key_files:
  created:
    - src/lib/books/status-labels.ts
    - src/lib/books/__tests__/status-labels.test.ts
  modified:
    - src/components/ui/select.tsx
    - src/components/book-edit-form.tsx
    - src/components/add-book-dialog.tsx
    - src/app/globals.css
    - package.json
    - package-lock.json
decisions:
  - "Typography plugin pinned to @next tag (resolved 0.5.0-alpha.3) for Tailwind 4 compat — stable 0.5.x may not fully support v4 @plugin at-rule."
  - "Kept legacy .markdown-content CSS rules in globals.css as dormant fallback — removing them now risks breaking other components that may still reference the class; delete in a later cleanup pass."
  - "Fixed pt-BR spelling: 'Alteracoes salvas.' → 'Alterações salvas.' (com acento) per review decision 2026-04-16."
  - "getStatusLabel passes through unknown values as-is (not hidden) so hand-edited .md files with non-standard status never render blank."
metrics:
  duration_min: 4
  tasks_complete: 2
  tasks_total: 3
  files_added: 2
  files_modified: 6
  tests_added: 5
  tests_total_after: 57
  lines_added: 110
  lines_removed: 27
completed_date: 2026-04-16
---

# Phase 02 Plan 08: UI/UX Gap Closure Summary

**One-liner:** Closes 4 UX gaps from 02-UAT (raw kebab-case status trigger, stale error on step transition, plain-HTML notes, lost save feedback) by introducing a shared status-labels module, widening SelectValue to accept render-prop children, installing @tailwindcss/typography@next, and preserving feedback across router.refresh via React 19 startTransition.

## What Was Built

### Task 1 — Shared status labels + pt-BR Select trigger

- Created `src/lib/books/status-labels.ts` as single source of truth for pt-BR labels (`STATUS_LABELS`, `STATUS_OPTIONS`, `getStatusLabel`).
- Widened `SelectValue` wrapper in `src/components/ui/select.tsx` so its `children` prop accepts a render function `(value: string | null) => ReactNode`.
- `BookEditForm` and `AddBookDialog` now render the pt-BR label via `<SelectValue>{(v) => getStatusLabel(v)}</SelectValue>` — triggers display "Quero ler", "Lendo", etc. instead of raw "quero-ler".
- Removed duplicated local `STATUS_OPTIONS` arrays from both components (DRY).
- 5 new unit tests in `src/lib/books/__tests__/status-labels.test.ts`, all passing.

### Task 2 — Typography, error reset, feedback preservation

- Installed `@tailwindcss/typography@next` (resolved to `0.5.0-alpha.3`) as a devDependency.
- Enabled via `@plugin "@tailwindcss/typography";` in `src/app/globals.css` (Tailwind v4 CSS-first).
- Rendered notes div in `BookEditForm` now uses `prose prose-invert prose-sm prose-zinc max-w-none` for consistent typography hierarchy (headers, bold, lists, inline code, blockquote).
- Added `setError(null)` before `setStep('manual')` on the "Nao encontrei meu livro" handler — prevents stale search error from bleeding into manual form.
- `handleSave` in `BookEditForm` now:
  - Sets feedback BEFORE calling `router.refresh()` so the toast paints before the Server Component re-fetch returns new initial props.
  - Wraps `router.refresh()` in `startTransition` (React 19 standalone) so state updates commit first.
  - Fixes pt-BR spelling: "Alteracoes salvas." → "Alterações salvas." (com acento).

### Task 3 — Human checkpoint (PENDING)

Task 3 is a `checkpoint:human-verify` that asks a human (or agent-browser) to visually verify the 4 gap fixes in a running dev server. The orchestrator must spawn a continuation agent after human approval; this executor has stopped here per checkpoint protocol.

## Commits Created

| Task | Commit  | Message |
|------|---------|---------|
| 1 RED   | `e5df4d3` | test(02-08): add failing status-labels unit tests |
| 1 GREEN | `eeb24bf` | feat(02-08): extract STATUS_LABELS to src/lib/books/status-labels.ts |
| 1 FIX   | `a63b214` | fix(02-08): render pt-BR status label in Select trigger |
| 2 A     | `facf77d` | chore(02-08): install @tailwindcss/typography@next |
| 2 B+C   | `b90d6f0` | fix(02-08): enable typography plugin and apply prose classes to rendered notes |
| 2 D     | `855aac7` | fix(02-08): preserve 'Alterações salvas' feedback across router.refresh |
| 2 E     | `58f1645` | fix(02-08): clear search error when transitioning to manual form |

## Verification

Automated (green):
- `npm test` → 57 tests pass (5 new status-labels tests + 52 pre-existing).
- `npx tsc --noEmit` → clean.
- `npm run build` → builds without Tailwind plugin errors; route table unchanged.

Grep acceptance (Task 1):
- `STATUS_OPTIONS = [` local copies: `0/0` in book-edit-form / add-book-dialog (both removed).
- `getStatusLabel` usages: 2 in book-edit-form, 3 in add-book-dialog.
- `ChevronDownIcon` in select.tsx: 3 (Trigger + 2 ScrollArrows — preserved).

Grep acceptance (Task 2):
- `prose prose-invert` in book-edit-form.tsx: 1.
- `markdown-content` in book-edit-form.tsx JSX: 0 (className removed from JSX; legacy CSS rules kept dormant in globals.css).
- `@tailwindcss/typography` in globals.css: 1 (via `@plugin` at-rule).
- `@tailwindcss/typography` in package.json: 1 (devDependencies).
- `setError(null)` immediately before `setStep('manual')`: 1 match (positional).
- Total `setError(null)` occurrences in add-book-dialog: 5 (matches expected).
- `startTransition` in book-edit-form.tsx: 2 (import + call site).
- `Alterações salvas` (with acento) in book-edit-form.tsx: 1.
- `Alteracoes salvas` (no acento) in book-edit-form.tsx: 0.

Human verification: PENDING at Task 3 checkpoint. The continuation agent will:
1. Start `npm run dev` and visually verify GAP 2 (trigger label), GAP 3 (error clear), GAP 4 (prose typography), GAP 5 (feedback ~3s).
2. For GAP 4: confirm `<strong>` has `font-weight >= 600` and header hierarchy is visible.
3. For GAP 5: snapshot ~1s after save click confirms `<p>Alterações salvas.</p>` in DOM.
4. Record pass/fail per gap in this SUMMARY under a new "Human Verification Results" section.

## Deviations from Plan

None — plan executed exactly as written. All deviation rules were unnecessary: no bugs found in existing code that required Rule 1 fixes, no missing critical functionality beyond scope, no blocking issues, no architectural changes needed.

Minor plan-intrinsic decisions taken exactly as documented in the plan's Step A and Step B:
- Typography plugin resolved to `0.5.0-alpha.3` (this is the current `@next` tag) — documented in `typography_version` frontmatter field.
- Kept `.markdown-content` CSS rules in globals.css as dormant (per plan Step B "DECISION" block).
- startTransition + setFeedback-before-refresh path used (primary approach in plan Step D); fallback alternatives not needed.

## Known Stubs

None — this is a polish plan that wires existing behavior, not a feature plan with data flows that could stub out.

## Self-Check: PASSED

Files verified on disk:
- FOUND: `src/lib/books/status-labels.ts`
- FOUND: `src/lib/books/__tests__/status-labels.test.ts`
- FOUND: `src/components/ui/select.tsx` (modified)
- FOUND: `src/components/book-edit-form.tsx` (modified)
- FOUND: `src/components/add-book-dialog.tsx` (modified)
- FOUND: `src/app/globals.css` (modified)
- FOUND: `package.json` (modified)

Commits verified in git log:
- FOUND: `e5df4d3`
- FOUND: `eeb24bf`
- FOUND: `a63b214`
- FOUND: `facf77d`
- FOUND: `b90d6f0`
- FOUND: `855aac7`
- FOUND: `58f1645`

Tasks 1 and 2 are fully complete. Task 3 (human-verify checkpoint) is pending; the orchestrator is expected to pause this executor, present the verification script to the user, and spawn a continuation agent once "approved" is received.
