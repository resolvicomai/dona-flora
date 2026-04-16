---
phase: "02-catalog-core"
plan: "03"
subsystem: "ui-components"
tags: ["shadcn", "components", "next-image", "accessibility"]
dependency_graph:
  requires:
    - "02-01: BookSchema/BookStatus type"
    - "02-02: LibraryService (data layer)"
  provides:
    - "StarRating component"
    - "StatusBadge component"
    - "BookCover component"
    - "shadcn/ui component library"
    - "next/image remotePatterns for external book covers"
  affects:
    - "02-04: home page (uses all 3 components)"
    - "02-05: book detail page (uses all 3 components)"
tech_stack:
  added:
    - "shadcn/ui (dialog, select, alert-dialog, input, button, label, textarea, card, badge)"
    - "lucide-react (Star, BookOpen icons)"
  patterns:
    - "cn() utility for conditional class merging (clsx + tailwind-merge)"
    - "next/image with remotePatterns for external image domains"
    - "44x44px touch targets for interactive star rating buttons"
key_files:
  created:
    - "src/components/star-rating.tsx"
    - "src/components/status-badge.tsx"
    - "src/components/book-cover.tsx"
  modified:
    - "next.config.ts (added images.remotePatterns)"
    - "src/app/globals.css (corrected Geist font variable references)"
    - "src/components/ui/* (9 shadcn components added)"
decisions:
  - "Badge uses @base-ui/react under the hood (not Radix) -- StatusBadge uses variant='secondary' as documented in the installed badge component"
  - "remotePatterns uses exact hostnames without wildcards -- no wildcard domains (T-02-08 mitigation)"
metrics:
  duration: "~10min"
  completed: "2026-04-16T16:51:05Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 10
---

# Phase 02 Plan 03: UI Components and shadcn/ui Setup Summary

**One-liner:** shadcn/ui initialized with zinc dark theme; StarRating (accessible 44px touch targets), StatusBadge (5-color pt-BR status labels), and BookCover (next/image with placeholder) created as shared components.

## What Was Built

### Task 1: shadcn/ui initialization and next.config.ts image patterns (601e050)

shadcn/ui was already initialized (from a prior session bootstrap). This task committed the 9 installed shadcn components, corrected the globals.css Geist font variable definitions, and added `images.remotePatterns` to `next.config.ts` restricting external image loading to `books.google.com` and `covers.openlibrary.org` only (T-02-08 mitigation).

**Components installed:** dialog, select, alert-dialog, input, button, label, textarea, card, badge.

### Task 2: StarRating, StatusBadge, BookCover components (b0f1c04)

Three shared UI components created following UI-SPEC.md contracts:

- **StarRating** (`src/components/star-rating.tsx`): Client component with 5 clickable star buttons. Each button has `min-w-[44px] min-h-[44px]` touch target, `aria-label="Nota {n} de 5"`, `role="group"` wrapper, `disabled` in readonly mode. Filled stars use `fill-yellow-400 text-yellow-400`; empty stars use `text-zinc-600`.

- **StatusBadge** (`src/components/status-badge.tsx`): Wraps shadcn Badge with status-specific colors. All 5 statuses covered with pt-BR labels and zinc dark theme colors (blue-900/50 for lendo, green-900/50 for lido, amber-900/50 for quero-reler, zinc-800 for quero-ler and abandonado).

- **BookCover** (`src/components/book-cover.tsx`): next/image with three pre-defined sizes (sm: 48x72, md: 128x192, lg: 192x288). Falls back to a zinc-800 div with centered BookOpen icon and `aria-label="Sem capa disponivel"` when no src provided.

## Deviations from Plan

### Pre-existing shadcn/ui initialization

**Found during:** Task 1
**Issue:** shadcn/ui was already initialized prior to this plan execution (components.json existed, src/lib/utils.ts with cn() existed, 9 UI components were already installed as untracked files).
**Handling:** Skipped re-running `npx shadcn init` (would have overwritten existing setup). Committed the pre-existing untracked components and globals.css changes as part of Task 1. No behavioral deviation — end state matches plan requirements exactly.

### Badge uses @base-ui/react (not standard Radix shadcn)

**Found during:** Task 2
**Issue:** The installed badge.tsx uses `@base-ui/react/use-render` and `@base-ui/react/merge-props` instead of the standard Radix-based shadcn badge. The `variant="secondary"` prop is still valid and accepted.
**Handling:** StatusBadge uses `variant="secondary"` as intended — the base-ui badge accepts the same variant API. No code change needed.

## Known Stubs

None. All three components are fully wired — StarRating accepts live `value`/`onChange` props, StatusBadge reads from `STATUS_CONFIG` record keyed by BookStatus enum values, BookCover renders real next/image or placeholder based on `src` prop.

## Threat Flags

No new threat surface introduced beyond what was planned. T-02-08 mitigated via `remotePatterns` with exact hostnames (no wildcards).

## Self-Check

### Created files exist:

- FOUND: src/components/star-rating.tsx
- FOUND: src/components/status-badge.tsx
- FOUND: src/components/book-cover.tsx
- FOUND: next.config.ts (remotePatterns)
- FOUND: components.json

### Commits exist:

- FOUND: 601e050 (Task 1 — shadcn/ui + remotePatterns)
- FOUND: b0f1c04 (Task 2 — StarRating, StatusBadge, BookCover)

## Self-Check: PASSED
