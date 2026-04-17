---
phase: 04-ai-librarian
plan: 01
subsystem: ai
tags: [ai-sdk, claude, gray-matter, zod, markdown, system-prompt, prompt-cache, serialization]

requires:
  - phase: 01-foundation-data-layer
    provides: SAFE_MATTER_OPTIONS (CVE-2025-65108 mitigation), getLibraryDir helper
  - phase: 02-catalog-core
    provides: Book / BookStatus schema, library-service.ts loop pattern

provides:
  - loadLibraryContext() — stable-sorted <LIBRARY> block for the Claude system prompt
  - loadKnownSlugs() — Set<string> of on-disk slugs for the D-14 hallucination guardrail
  - LibrarianMessage contract — shared between route.ts (Plan 03) and store.ts (Plan 02)
  - ChatFrontmatterSchema / ChatSummary — validates data/chats/*.md frontmatter
  - serializeTranscript() / parseTranscript() — Obsidian-friendly Markdown <-> UIMessage[]

affects: [04-02-chat-store, 04-03-route-and-streaming, 04-04-chat-client, 04-05-sidebar]

tech-stack:
  added: []   # no new npm dependencies — zod + gray-matter already in use
  patterns:
    - "Reuse SAFE_MATTER_OPTIONS import (never re-implement the CVE-2025-65108 mitigation)"
    - "Lexical sort of context entries for Anthropic prompt-cache prefix stability"
    - "Skip-malformed-with-console.warn (matches library-service.ts precedent)"
    - "Inline wiki-link + > external: tokens — keeps transcript 100% Obsidian-friendly"
    - "Deterministic UTC HH:MM time label for transcript headings (test stability)"

key-files:
  created:
    - src/lib/library/context.ts
    - src/lib/library/slug-set.ts
    - src/lib/library/__tests__/context.test.ts
    - src/lib/library/__tests__/slug-set.test.ts
    - src/lib/library/__tests__/fixtures/books/a-livro-cheio.md
    - src/lib/library/__tests__/fixtures/books/b-livro-minimal.md
    - src/lib/library/__tests__/fixtures/books/z-malformado.md
    - src/lib/library/__tests__/fixtures/slug-set/foo.md
    - src/lib/library/__tests__/fixtures/slug-set/bar.md
    - src/lib/library/__tests__/fixtures/slug-set/not-a-book.txt
    - src/lib/chats/types.ts
    - src/lib/chats/schema.ts
    - src/lib/chats/serialize.ts
    - src/lib/chats/__tests__/serialize.test.ts
  modified: []

key-decisions:
  - "External-mention token (> external: T — A — R) is INLINE, not line-anchored — parser uses a lookahead for \\n|$ instead of ^...$ multiline"
  - "LibrarianMessage defined structurally in src/lib/chats/types.ts (not imported from ai / @ai-sdk) to avoid circular install dependency; Plan 03 will bridge via `as UIMessage<...>`"
  - "Time label is UTC HH:MM (via toISOString().slice(11,16)) to keep tests deterministic regardless of the running process TZ"
  - "Round-trip intentionally loses metadata.createdAt and id — documented in serialize.ts top-of-file comment"

patterns-established:
  - "Library-service fixture pattern: process.env.LIBRARY_DIR = FIXTURES_DIR in beforeEach, delete in afterEach"
  - "Fixture-per-behavior: separate fixtures dirs for context vs slug-set so failures are localized"
  - "Token-sort-and-interleave parser: collect all token matches with offsets, sort by start, emit text fragments between them"

requirements-completed: [AI-02, AI-08]

duration: 4min
completed: 2026-04-17
---

# Phase 04 Plan 01: Context Loader + Chat Types + Transcript Serializer Summary

**Library-to-prompt context builder, slug-set guardrail, shared LibrarianMessage contract, and Obsidian-friendly UIMessage[] ↔ Markdown serializer — all plumbing that Plan 02 and Plan 03 consume.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-17T18:43:54Z
- **Completed:** 2026-04-17T18:47:46Z
- **Tasks:** 2 (both TDD)
- **Files created:** 14 (4 modules, 2 test files, 6 fixtures, 2 schema/types files)

## Accomplishments

- `loadLibraryContext()` reads every `.md` in `data/books`, skips malformed files with `console.warn`, and emits a lexically-sorted string matching the AI-SPEC §4 canonical shape. The sort is the single most important invariant — it keeps the Anthropic prompt-cache prefix stable across requests (see CONTEXT line 642 on prompt caching).
- `loadKnownSlugs()` returns the same set of slugs the client needs to validate every `tool-render_library_book_card` output against — this is the D-14 "nunca inventar slugs" guardrail.
- `LibrarianMessage` (and its three Part variants) are declared in `src/lib/chats/types.ts` without pulling in `ai`/`@ai-sdk/*` packages. When Plan 03 installs the SDK, it can bridge with `as unknown as UIMessage<never, UIDataTypes, LibrarianTools>`.
- `ChatFrontmatterSchema` mirrors the `BookSchema.added_at` convention — `z.string()` rather than `z.string().datetime()` — so persisted chats survive YAML Date-auto-parsing. Plan 02's `store.ts` is responsible for normalizing Date → ISO string before validation.
- `serializeTranscript` / `parseTranscript` round-trip a 4-message conversation (text + library cards + external mention) preserving role order and part order/content. Round-trip losses (createdAt, id) are documented at the top of `serialize.ts`.

## Task Commits

1. **Task 1 RED: failing tests for context + slug-set** — `2c7ff03` (test)
2. **Task 1 GREEN: loadLibraryContext + loadKnownSlugs** — `f3d184e` (feat)
3. **Task 2 RED: failing tests for transcript serializer** — `be306c3` (test)
4. **Task 2 GREEN: types + schema + serialize** — `98012cd` (feat)

_TDD gates confirmed: each task has a `test(...)` commit followed by a `feat(...)` commit. No REFACTOR commits were needed — the implementations passed cleanly on first green._

## Files Created/Modified

**`src/lib/library/`**
- `context.ts` — `loadLibraryContext()` reads library, skips malformed, sorts, joins `\n\n`. Reuses `SAFE_MATTER_OPTIONS` + `getLibraryDir` from `@/lib/books/library-service`.
- `slug-set.ts` — `loadKnownSlugs()` returns `Set<string>` of `.md` basenames.
- `__tests__/context.test.ts` — 10 tests covering happy path, stable sort, truncation, skip-malformed.
- `__tests__/slug-set.test.ts` — 3 tests for Set correctness and missing-dir.
- `__tests__/fixtures/books/{a,b,z}*.md` + `__tests__/fixtures/slug-set/{foo,bar}.md, not-a-book.txt` — independent fixture dirs per test file.

**`src/lib/chats/`**
- `types.ts` — `LibrarianMessage`, three Part variants, `LibrarianToolName`. Structural-only, no SDK dependency.
- `schema.ts` — `ChatFrontmatterSchema` (Zod) with `book_refs.default([])`; `ChatSummary` alias.
- `serialize.ts` — `serializeTranscript` (UIMessage[] → Markdown), `parseTranscript` (Markdown → UIMessage[]); token-sort-and-interleave parser; UTC HH:MM time label.
- `__tests__/serialize.test.ts` — 12 tests including the 4-message round-trip.

## Test Coverage

- `src/lib/library`: 13 tests / 2 suites passing
- `src/lib/chats`: 12 tests / 1 suite passing
- **Total: 25 tests / 3 suites passing, 0 failing**

```
$ npx jest src/lib/library src/lib/chats --no-coverage
Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
```

## Decisions Made

1. **External-mention token is inline** — the AI-SPEC §4 canonical example (lines 611-620) puts `> external:` in the middle of a sentence, so the parser's regex uses `(?=\n|$)` lookahead instead of `^...$` multiline. This matched the serializer's `.join(' ')` output and unblocked the round-trip test.
2. **No `ai` / `@ai-sdk/*` dependency in Plan 01** — declaring `LibrarianMessage` structurally in `chats/types.ts` lets Plan 02 (store.ts) and Plan 03 (route.ts) agree on the same shape without forcing a premature install. Plan 03 bridges to `UIMessage<never, UIDataTypes, LibrarianTools>` when the SDK lands.
3. **UTC HH:MM via `toISOString().slice(11,16)`** — earlier attempts using `toLocaleTimeString('pt-BR')` would produce different output depending on the TZ of the running Jest process. The UTC slice is deterministic and matches the AI-SPEC example (`15:35` for a `T15:35:00Z` input).
4. **`book_refs` defaults to `[]`** — chat `.md` files written before the sidebar feature (D-10) still parse; matches the `BookSchema._notes.default('')` idiom from the books layer.

## Deviations from Plan

None — plan executed exactly as written.

Minor detail on the external-token regex: the plan text (`behavior` section) described the pattern as "one per line", but the AI-SPEC §4 canonical example shows the token inline within a sentence. The plan's `Task 2` also says "Inline token `> external: ...`" explicitly in the interface grammar. The implementation follows the canonical inline interpretation — this is not a deviation, it reconciles two slightly ambiguous plan paragraphs using the canonical reference as tiebreaker.

## Issues Encountered

- Initial round-trip test failed because the first parser used `^> external:` (line-anchored). Debug logging confirmed the serializer emits the token inline (via `.join(' ')`). Fixed by switching the regex to an inline lookahead `(?=\n|$)`. Resolved in the same Task 2 GREEN commit.

## CVE-2025-65108 Mitigation

Reused via import — `src/lib/library/context.ts` imports `SAFE_MATTER_OPTIONS` from `@/lib/books/library-service` and passes it to every `matter()` call:

```typescript
const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
```

Acceptance check `grep -q "SAFE_MATTER_OPTIONS" src/lib/library/context.ts` passes; no test file re-implements the `javascript: () => {}` override.

## Known Round-Trip Losses

Documented in the top-of-file comment of `src/lib/chats/serialize.ts`:

- `metadata.createdAt` — only `HH:MM` is in the Markdown; parse returns `undefined`. Consumers read `started_at`/`updated_at` from frontmatter.
- `id` — parse assigns deterministic `msg-<index>`; input ids are not preserved. Message ORDER is preserved.
- `system` role — serialize drops system messages entirely (never persisted).

These are intentional and flagged for Plan 02 / Plan 03 consumers.

## Dependency Check

- No new npm dependencies: `git diff package.json` shows no change.
- `npx jest src/lib/library src/lib/chats --no-coverage` exits 0.

## Next Plan Readiness

Plan 02 (chat store) can now:
- Import `serializeTranscript` / `parseTranscript` from `@/lib/chats/serialize`
- Import `ChatFrontmatterSchema` from `@/lib/chats/schema`
- Reuse `LibrarianMessage` from `@/lib/chats/types`
- Follow the exact `library-service.ts` readdir loop + `SAFE_MATTER_OPTIONS` pattern for `data/chats/`

Plan 03 (route.ts + streaming) can now:
- Call `loadLibraryContext()` inside the route handler and wrap the result in `<LIBRARY>...</LIBRARY>` delimiters with `cacheControl: 'ephemeral'` on the static block.
- Use `LibrarianMessage` as the message shape everywhere, bridging to `UIMessage<never, UIDataTypes, LibrarianTools>` at the edge.

## Self-Check: PASSED

Verified files exist on disk:
- `src/lib/library/context.ts` — FOUND
- `src/lib/library/slug-set.ts` — FOUND
- `src/lib/chats/types.ts` — FOUND
- `src/lib/chats/schema.ts` — FOUND
- `src/lib/chats/serialize.ts` — FOUND

Verified commits exist:
- `2c7ff03` — FOUND (Task 1 RED)
- `f3d184e` — FOUND (Task 1 GREEN)
- `be306c3` — FOUND (Task 2 RED)
- `98012cd` — FOUND (Task 2 GREEN)

---
*Phase: 04-ai-librarian*
*Completed: 2026-04-17*
