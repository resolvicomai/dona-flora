---
phase: 04-ai-librarian
plan: 04
subsystem: ui
tags: [chat, react-context, react-markdown, date-fns, rehype-sanitize, shadcn, base-ui, lucide-react, tdd]

requires:
  - phase: 02-catalog-core
    provides: BookCover, StatusBadge, BookStatus enum, markdown-content sanitize chain
  - phase: 03-browse
    provides: book-row horizontal card layout conventions (reused 1:1 in LibraryBookCardInline)

provides:
  - shadcn primitives scroll-area, sheet, tooltip, skeleton installed under src/components/ui (available to Plans 05 and 06)
  - react-markdown ^9 and date-fns ^4 runtime dependencies wired into package.json
  - KnownLibraryProvider + useBookMeta + useKnownSlugs React context for slug→ChatBookMeta lookup in the chat tree
  - AvatarMonogram component (Dona Flora persona avatar, UI-D1/UI-D3 contract)
  - ExternalBookMention component (UI-D4 external book mention, non-interactive span)
  - MessageText component (client-side Markdown renderer with rehype-sanitize, T-04-17 mitigation)
  - LibraryBookCardInline component with D-14 anti-hallucination fallback (client-side half of AI-08 guardrail)

affects:
  - 04-05-PLAN (ChatShell — will provide ChatBookMeta[] to KnownLibraryProvider)
  - 04-06-PLAN (MessageBubble — will compose MessageText, LibraryBookCardInline, ExternalBookMention, AvatarMonogram)

tech-stack:
  added: [react-markdown@^9, date-fns@^4, shadcn/ui scroll-area, shadcn/ui sheet, shadcn/ui tooltip, shadcn/ui skeleton]
  patterns:
    - React Context for chat-tree data (KnownLibraryContext pattern — avoids prop-drilling slug→BookMeta through MessageList/MessageBubble)
    - TDD RED/GREEN commit cadence for leaf UI primitives (test commit before feat commit)
    - jsdom test environment opt-in via `@jest-environment jsdom` file-level pragma (jest.config.ts defaults to 'node' for existing Phase 1-3 pure-function tests; React component tests override per-file)
    - Client-side Markdown rendering with rehype-sanitize plugin chain (mirrors server-side src/lib/markdown.ts sanitizer contract)
    - Guardrail as graceful-degradation pattern (useBookMeta returns null → component renders neutral span instead of throwing)

key-files:
  created:
    - src/components/chat/known-library-context.tsx
    - src/components/chat/avatar-monogram.tsx
    - src/components/chat/external-book-mention.tsx
    - src/components/chat/message-text.tsx
    - src/components/chat/library-book-card-inline.tsx
    - src/components/chat/__tests__/known-library-context.test.tsx
    - src/components/chat/__tests__/avatar-monogram.test.tsx
    - src/components/chat/__tests__/external-book-mention.test.tsx
    - src/components/chat/__tests__/library-book-card-inline.test.tsx
    - src/components/ui/scroll-area.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/tooltip.tsx
    - src/components/ui/skeleton.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "OQ-1 resolved: react-markdown (v9) over remark+remark-html+DOMPurify. Streaming-friendly, client-side React component, rehype-sanitize applies via rehypePlugins array."
  - "Component tests opt into jsdom via @jest-environment pragma rather than globally flipping jest.config.ts (keeps existing Phase 1-3 node-env tests cheaper)."
  - "next/image mocked in library-book-card-inline.test.tsx to render a plain <img>; next/link is NOT mocked because jsdom handles its default <a> rendering natively."
  - "BookCover does not expose a `variant` prop; auto-falls-back to placeholder when `src` is undefined. Plan spec referenced `variant='placeholder'` aspirationally — we pass `src={book.cover}` and let BookCover handle both branches."
  - "h1 and h2 downgraded to h3 in MessageText via react-markdown `components` override (UI-SPEC §Typography limits response headings to h3-h5)."
  - "ExternalBookMention surfaces `reason` via native `title` attribute; Plan 06 may wrap in shadcn Tooltip at the MessageBubble layer — primitive stays dumb."

patterns-established:
  - "KnownLibraryContext: single React context providing a Map<slug, ChatBookMeta> built once at shell mount. Descendants read via useBookMeta(slug) hook returning `null` for unknown slugs."
  - "D-14 client-side guardrail: LibraryBookCardInline's first action is useBookMeta(slug); null branch renders the exact copy '(livro mencionado indisponível)' in text-muted-foreground italic, never a broken link."
  - "TDD gate cadence: RED commit (test:) shows failing tests; GREEN commit (feat:) shows passing implementation. Verified in git log: 0d6aa76 (test) → 88aeb99 (feat), 8e6679d (test) → fee5258 (feat)."

requirements-completed: [AI-01, AI-06, AI-08]

duration: 5min
completed: 2026-04-17
---

# Phase 04 Plan 04: Leaf Chat Primitives Summary

**Installed 4 shadcn primitives (scroll-area, sheet, tooltip, skeleton) and react-markdown@^9 + date-fns@^4; shipped a KnownLibraryContext lookup and 4 pure chat components (AvatarMonogram, ExternalBookMention, MessageText, LibraryBookCardInline) with the D-14 anti-hallucination fallback encoded directly in LibraryBookCardInline.**

## Performance

- **Duration:** 5 minutes
- **Started:** 2026-04-17T18:43:15Z
- **Completed:** 2026-04-17T18:48:32Z
- **Tasks:** 3
- **Files created:** 13 (4 components, 1 context, 4 component tests, 4 shadcn primitives)
- **Files modified:** 2 (package.json, package-lock.json)
- **Tests added:** 22 (all passing, full project 120/120 green)

## Accomplishments

- Wave 1 leaf-level UI primitives shipped without touching any downstream plan's concerns (no streaming, no network, no routing).
- `KnownLibraryProvider` + `useBookMeta` + `useKnownSlugs` give the chat tree an O(1) slug lookup without prop-drilling through MessageList/MessageBubble.
- `LibraryBookCardInline` encodes the D-14 guardrail at its own first line: a hallucinated slug cannot produce a broken link from this component because `useBookMeta(slug) === null` routes to a neutral italic span before the `<Link>` branch is considered. Unit-tested (test case "renders neutral italic fallback span when slug is NOT in the library").
- `MessageText` applies `rehype-sanitize` on the client (T-04-17 mitigation); `rehype-raw` is deliberately excluded so raw HTML in the stream is dropped before it reaches the DOM.
- `AvatarMonogram` and `ExternalBookMention` match the UI-SPEC color row 131/133 contracts and the §Accessibility contract (aria-label, role=note, aria-hidden on the monogram letters, non-interactive span for external mentions).
- TDD gates cleanly preserved in git history for tasks 2 and 3.

## Task Commits

Each task was committed atomically. Tasks 2 and 3 follow TDD RED/GREEN cadence.

1. **Task 1: shadcn primitives + react-markdown + date-fns + KnownLibraryContext** — `4b63888` (feat)
2. **Task 2 RED: failing tests for AvatarMonogram and ExternalBookMention** — `0d6aa76` (test)
3. **Task 2 GREEN: implement AvatarMonogram and ExternalBookMention** — `88aeb99` (feat)
4. **Task 3 RED: failing test for LibraryBookCardInline** — `8e6679d` (test)
5. **Task 3 GREEN: implement MessageText and LibraryBookCardInline** — `fee5258` (feat)

No refactor commits needed; implementations passed on first GREEN run.

## Files Created/Modified

### Context + components
- `src/components/chat/known-library-context.tsx` — React context: `KnownLibraryProvider`, `useBookMeta(slug)`, `useKnownSlugs()`; exposes `ChatBookMeta` type.
- `src/components/chat/avatar-monogram.tsx` — 32px circular 'DF' avatar; role=img aria-label="Dona Flora"; text aria-hidden.
- `src/components/chat/external-book-mention.tsx` — Inline non-interactive `<span role="note">` with dashed border, italic, "externo" chip, `ArrowUpRight` icon; `title` attr carries reason.
- `src/components/chat/message-text.tsx` — Client-side `ReactMarkdown` wrapped in `prose prose-invert prose-sm max-w-none break-words`; `rehypePlugins=[rehypeSanitize]`; h1/h2 downgraded to h3.
- `src/components/chat/library-book-card-inline.tsx` — Horizontal zinc-800 card reusing `BookCover` + `StatusBadge`; D-14 fallback span when `useBookMeta(slug)===null`.

### Component tests (jsdom-overridden)
- `src/components/chat/__tests__/known-library-context.test.tsx` — 4 tests
- `src/components/chat/__tests__/avatar-monogram.test.tsx` — 4 tests
- `src/components/chat/__tests__/external-book-mention.test.tsx` — 8 tests
- `src/components/chat/__tests__/library-book-card-inline.test.tsx` — 6 tests

### shadcn primitives (generated by `npx shadcn@latest add`)
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/skeleton.tsx`

### Dependencies
- `package.json` + `package-lock.json` — added `react-markdown ^9.1.0`, `date-fns ^4.1.0` (date-fns was already present in node_modules but not declared; now locked in dependencies).

## Decisions Made

- **OQ-1 closed → `react-markdown@^9`.** Streaming-friendly (re-parses on every prop change), accepts the same `rehype-sanitize` plugin already in the project's stack, zero integration with `dangerouslySetInnerHTML` keeps the attack surface narrow.
- **jsdom per-file opt-in.** Jest default env remains `node` for Phase 1-3 pure-function tests; React component tests use `/** @jest-environment jsdom */` pragma to avoid slowing down unrelated suites.
- **`next/image` mock in one test.** `library-book-card-inline.test.tsx` mocks `next/image` to a plain `<img>` (jsdom cannot run Next's image optimization pipeline). `next/link` is NOT mocked — its default jsdom behavior (renders `<a>`) is sufficient for our assertions.
- **`BookCover` used without a `variant` prop.** Plan text referenced `variant="placeholder"` as a hint; the actual component's API auto-selects the placeholder branch when `src` is undefined. Passing `book.cover` (which is `string | undefined`) drives both branches without a prop addition.
- **`h1`/`h2` downgraded to `h3` in `MessageText`.** Per UI-SPEC §Typography rule "headings inside response limited to h3-h5". Implemented via `components` override in `ReactMarkdown`.

## Deviations from Plan

None — plan executed exactly as written. Adjustments above (BookCover variant, next/image mock) were disambiguations of the plan's prescriptive text against the real APIs and are documented as Decisions, not Rule-1/2/3 deviations.

## Issues Encountered

- **No node_modules in worktree.** Initial `ls node_modules` failed in the agent's worktree. Resolved by copying the main tree's `node_modules` into the worktree (not a symlink, because npm install in the worktree would mutate the shared tree). After the copy, `npx shadcn@latest add` and `npm install react-markdown date-fns` wrote to the worktree copy only.
- **`date-fns` already present but undeclared.** `node_modules/date-fns` existed at v4.1.0 but was not in `package.json` dependencies. Adding it explicitly declared the transitive dependency as a direct one (per plan) and locked the version.

## TDD Gate Compliance

Plan has two `tdd="true"` tasks (2 and 3). Git log shows both gates present:

- Task 2: `test(04-04): add failing tests for AvatarMonogram and ExternalBookMention` (`0d6aa76`) → `feat(04-04): implement AvatarMonogram and ExternalBookMention` (`88aeb99`) ✓
- Task 3: `test(04-04): add failing tests for LibraryBookCardInline` (`8e6679d`) → `feat(04-04): implement MessageText and LibraryBookCardInline` (`fee5258`) ✓

RED phase was verified with a local jest run showing "Cannot find module" failures before each implementation commit.

## User Setup Required

None — no environment variables, API keys, or dashboard configuration needed at this plan. `ANTHROPIC_API_KEY` is required by Plan 03 (already shipped in Wave 0 of this phase).

## Next Phase Readiness

**Ready for Plan 05 (Wave 2 — ChatShell + sidebar):**
- `KnownLibraryProvider` API is stable — ChatShell passes `books: ChatBookMeta[]` once on mount.
- shadcn `scroll-area`, `sheet`, `tooltip`, `skeleton` are installed under `src/components/ui/` and ready for import.
- `date-fns` locked at v4 for sidebar timestamp formatting (`formatDistanceToNow` with `locale: ptBR`).

**Ready for Plan 06 (Wave 2 — MessageList + MessageBubble):**
- `AvatarMonogram`, `MessageText`, `LibraryBookCardInline`, `ExternalBookMention` are the four primitives MessageBubble composes. All carry tested accessibility semantics.
- `useBookMeta` + `useKnownSlugs` let MessageBubble decide between inline-card and fallback without re-fetching.
- Integration testing of `MessageText` inside streaming `MessageBubble` is deferred to Plan 06 (partial-Markdown streaming is a Plan 06 concern).

No blockers. No concerns.

## Self-Check: PASSED

Verified post-write:

- Created files exist:
  - `src/components/chat/known-library-context.tsx` — FOUND
  - `src/components/chat/avatar-monogram.tsx` — FOUND
  - `src/components/chat/external-book-mention.tsx` — FOUND
  - `src/components/chat/message-text.tsx` — FOUND
  - `src/components/chat/library-book-card-inline.tsx` — FOUND
  - All 4 test files under `src/components/chat/__tests__/` — FOUND
  - All 4 shadcn primitives under `src/components/ui/` — FOUND
- Commits exist in git log:
  - `4b63888` — FOUND
  - `0d6aa76` — FOUND
  - `88aeb99` — FOUND
  - `8e6679d` — FOUND
  - `fee5258` — FOUND
- All 22 chat tests pass; full project 120/120.

---
*Phase: 04-ai-librarian*
*Completed: 2026-04-17*
