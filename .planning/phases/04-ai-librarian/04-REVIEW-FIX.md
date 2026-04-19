---
status: applied
phase: 04-ai-librarian
iteration: 1
fixed_at: 2026-04-19T18:20:00Z
review_path: .planning/phases/04-ai-librarian/04-REVIEW.md
findings_in_scope: 13
fixed_count: 12
deferred_count: 0
skipped_count: 15
commits:
  - hash: e983354
    finding: CR-01
    file: src/app/api/chat/route.ts
  - hash: e983354
    finding: CR-01
    file: src/app/api/chat/__tests__/route.test.ts
  - hash: 3bdd1de
    finding: CR-02
    file: src/app/api/chat/route.ts
  - hash: 3bdd1de
    finding: CR-02
    file: src/app/api/chat/__tests__/route.test.ts
  - hash: 410b0be
    finding: WR-01
    file: src/components/chat/chat-main.tsx
  - hash: 410b0be
    finding: WR-02
    file: src/components/chat/chat-main.tsx
  - hash: 410b0be
    finding: WR-04
    file: src/components/chat/chat-main.tsx
  - hash: 410b0be
    finding: WR-05
    file: src/components/chat/chat-main.tsx
  - hash: cefcbdb
    finding: WR-03
    file: src/components/chat/composer.tsx
  - hash: 4ef3863
    finding: WR-06
    file: src/app/api/trails/route.ts
  - hash: 4ef3863
    finding: WR-06
    file: src/app/api/trails/__tests__/route.test.ts
  - hash: c7d34b4
    finding: WR-07
    file: src/lib/chats/serialize.ts
  - hash: c7d34b4
    finding: WR-07
    file: src/lib/chats/__tests__/serialize.test.ts
  - hash: 8f65e9b
    finding: WR-08
    file: src/lib/chats/schema.ts
  - hash: 7329b8c
    finding: WR-09
    file: src/lib/trails/schema.ts
  - hash: 7329b8c
    finding: WR-09
    file: src/app/api/trails/route.ts
  - hash: 7329b8c
    finding: WR-09
    file: src/app/api/trails/__tests__/route.test.ts
  - hash: 7329b8c
    finding: WR-09
    file: src/lib/trails/__tests__/store.test.ts
  - hash: 0ba5763
    finding: WR-10
    file: src/components/chat/message-bubble.tsx
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-04-19T18:20:00Z
**Source review:** .planning/phases/04-ai-librarian/04-REVIEW.md
**Iteration:** 1
**Fix scope:** critical_warning (CR-* + WR-*)

**Summary:**
- Findings in scope: 13 (CR-01, CR-02, WR-01..WR-11)
- Fixed: 12 (2 critical + 10 warnings)
- Skipped (in-scope, by design): 1 (WR-11 per priority guidance — payload size is v1 acceptable)
- Skipped (out of scope): 14 info findings (IN-01..IN-14) — not touched per fix_scope
- Test delta: **243 passing at baseline → 251 passing after fixes** (+8 new regression tests)

## Fixed Issues

### CR-01 — system-message cache-control shape (verified correct + hardened)

**Files modified:** `src/app/api/chat/route.ts`, `src/app/api/chat/__tests__/route.test.ts`
**Commit:** e983354

**Context7-equivalent verification.** The reviewer asked whether the current `system:
SystemModelMessage` shape silently loses Anthropic's prompt-cache optimization. I
verified by reading the installed package types and provider source directly (the
MCP Context7 tools are not available as direct function calls in this environment,
so I inspected the runtime artifacts — the most authoritative source of the actual
contract):

1. **`@ai-sdk/provider-utils` line 905–913** types `SystemModelMessage` as
   `{ role: 'system'; content: string; providerOptions?: ProviderOptions }`.
   **`content` is strictly `string`** — the reviewer's proposed parts-array shape
   (`content: [{ type: 'text', ..., providerOptions }]`) would NOT typecheck under
   AI SDK v6.
2. **`ai` package `standardizePrompt` (dist/index.mjs line 1333-1337)** converts the
   top-level `system` param to a `{ role: 'system', content, providerOptions }`
   message in the prompt array, preserving `providerOptions` verbatim.
3. **`@openrouter/ai-sdk-provider` `convertToOpenRouterChatMessages` (dist/index.mjs
   line 2854-2877)** reads `providerOptions.anthropic.cacheControl` OR
   `providerOptions.openrouter.cacheControl` at the message level and emits a
   `cache_control` marker on the first content part of the system message sent to
   Anthropic. The pre-fix code (`providerOptions.anthropic.cacheControl`) was ALREADY
   hitting the cache correctly on this provider stack.

**Applied fix (defensive hardening):** Added `providerOptions.openrouter.cacheControl`
as a parallel key so prompt caching still activates if a future OpenRouter provider
release drops the `anthropic` key path. Also expanded the inline documentation to
explain the AI SDK v6 type constraint and why the reviewer's proposed shape cannot
be adopted on this stack. Test updated to assert both keys are present.

---

### CR-02 — `messages` body shape validation

**Files modified:** `src/app/api/chat/route.ts`, `src/app/api/chat/__tests__/route.test.ts`
**Commit:** 3bdd1de

**Applied fix:** Replaced `z.array(z.any()).min(1)` with a `z.unknown().superRefine`
validator that:
- Requires every message to have `role ∈ {'user', 'assistant'}` — rejects
  `role: 'system'` (the server injects the persona server-side; a client-supplied
  system role is always an injection attempt)
- Requires `parts: any[]` on every message
- Bounds per-text-part content to **16 000 chars** (`MAX_TEXT_CHARS`)
- Bounds the messages array to **200 entries** (`MAX_MESSAGES`)
- For `tool-render_library_book_card` parts: regex-checks `output.slug` against
  kebab-slug pattern + 200-char cap (defense-in-depth with D-14)
- For `tool-render_external_book_mention` parts: bounds title/author/reason lengths
- For forward-compat: unknown part types pass through opaquely but still bound any
  stringy `text` field

**Rationale for `superRefine` over `discriminatedUnion`:** useChat emits
reasoning / step-start / dynamic-tool parts I do not want to enumerate up front.
A discriminated union would have to list every possible `type` value; superRefine
lets me validate only the known parts tightly while still rejecting clearly bogus
inputs.

Added 5 boundary tests (system-role rejection, missing parts[], oversize text,
bogus slug, 201-message cap).

---

### WR-01 — guarded seed effect

**Files modified:** `src/components/chat/chat-main.tsx`
**Commit:** 410b0be (combined with WR-02/04/05 — all in the same component lifecycle)

**Applied fix:** Restructured the seed `useEffect` to early-return on every
precondition failure. `router.replace('/chat')` now fires only when the seed was
actually applied (`seedApplied.current = true` is set immediately before the replace).
A stray re-render can no longer strip `?about` from the URL before the seed has a
chance to take.

---

### WR-02 — single refresh-on-finish

**Files modified:** `src/components/chat/chat-main.tsx`
**Commit:** 410b0be

**Applied fix:** Added `hasRefreshedSidebar` ref (seeded to `Boolean(chatId)` — if
the URL already has an id, the sidebar already lists this conversation on mount).
`onFinish` now refreshes at most ONCE per component lifetime, which is when the
sidebar entry first needs to appear. Subsequent turns only bump `updated_at`; the
sidebar entry is already there, so spending a `listChats()` pass on each turn (which
readdirs + parses every `data/chats/*.md`) was pure waste.

---

### WR-03 — aria-busy instead of disabled textarea

**Files modified:** `src/components/chat/composer.tsx`
**Commit:** cefcbdb

**Applied fix:** Replaced `disabled={status === 'submitted'}` with
`aria-busy={status === 'submitted'}`. IME compositions (pt-BR accents) no longer
drop mid-keystroke when the previous turn enters 'submitted'. Submit gating is
still enforced via `canSend` in the Enter handler + the Stop button replacing Send,
so the composer is still effectively input-locked against accidental submits.
Doc comment updated to explain the trade-off.

---

### WR-04 — memoized initialMessages

**Files modified:** `src/components/chat/chat-main.tsx`
**Commit:** 410b0be

**Applied fix:** `memoInitialMessages` now uses `useRef(...).current` so the
`messages` prop passed to `useChat` has a STABLE identity across re-renders.
useChat v6 does not document its behavior when the `messages` prop's identity
changes mid-session; freezing to the first-mount value matches the "hydrate
once" Plan 06 contract.

---

### WR-05 — stop() before regenerate

**Files modified:** `src/components/chat/chat-main.tsx`
**Commit:** 410b0be

**Applied fix:** `onRetry` now calls `stop()` before `regenerate()` when a stream
is pending (`status ∈ {'submitted', 'streaming'}`). Prevents two streams from
racing on the same chatId — which would double-persist via `onFinish` and render
interleaved tokens during the interim.

---

### WR-06 — cross-check trail book_refs against loadKnownSlugs

**Files modified:** `src/app/api/trails/route.ts`, `src/app/api/trails/__tests__/route.test.ts`
**Commit:** 4ef3863

**Applied fix:** After the kebab regex passes in `CreateTrailSchema`, every ref
is also checked against `loadKnownSlugs()`. Unknown refs yield a 400 with a
structured `fieldErrors.book_refs` message listing them. Prevents persisting a
dangling reference that would silently render as "(livro mencionado indisponível)"
via the D-14 client fallback on every subsequent page load.

Added a test with a mocked `loadKnownSlugs` returning a restricted set and a
`book_refs` list that mixes known and unknown slugs.

---

### WR-07 — KEBAB filter in wikilink tokenizer

**Files modified:** `src/lib/chats/serialize.ts`, `src/lib/chats/__tests__/serialize.test.ts`
**Commit:** c7d34b4

**Applied fix:** The lexer regex `WIKILINK_RE` stays permissive (anything between
`[[...]]`) so malformed transcripts do not swallow adjacent text, but the captured
content must now match `^[a-z0-9]+(?:-[a-z0-9]+)*$` to be lifted into a
`tool-render_library_book_card` part. Non-kebab captures (traversal shapes,
punctuation, Unicode) stay in the text flow.

Defense-in-depth: a malicious user dropping `[[../../etc/passwd]]` into a
hand-edited `data/chats/*.md` can no longer forge a tool-output part on next
re-read. Added a regression test covering both `../../etc/passwd` and
`Título Qualquer` captures.

---

### WR-08 — tighten ChatFrontmatterSchema.id to match API boundary

**Files modified:** `src/lib/chats/schema.ts`
**Commit:** 8f65e9b

**Applied fix:** `ChatFrontmatterSchema.id` now uses the same regex the
`POST /api/chat` boundary enforces (`^[A-Za-z0-9][A-Za-z0-9_-]*$`, max 128 chars).
Hand-edited chat files whose frontmatter id would collide with a traversal
sequence are now rejected at `listChats`/`loadChat` parse time instead of
propagating downstream. No test changes needed — the existing fixture files all
use conforming ids, and the one malformed-frontmatter test in the chats suite
already exercises the rejection path.

---

### WR-09 — reject punctuation-only trail titles

**Files modified:** `src/lib/trails/schema.ts`, `src/app/api/trails/route.ts`, `src/app/api/trails/__tests__/route.test.ts`, `src/lib/trails/__tests__/store.test.ts`
**Commit:** 7329b8c

**Applied fix:** Added `HAS_SLUG_CHAR = /[a-z0-9]/i` refinement in BOTH
`TrailFrontmatterSchema.title` (so the store throws on punctuation-only) AND
`CreateTrailSchema.title` (so the API returns 400 instead of 500). This kills the
old fallback behavior where `title: '!!!'` would slugify empty and collide on the
literal `trilha.md`, causing every subsequent punctuation-only title to land as
`trilha-2.md`, `trilha-3.md`, etc.

**Test delta:** The two pre-existing store tests that asserted the FALLBACK
behavior (`uses 'trilha' base slug when generateSlug produces empty string` and
`handles collision chain for fallback slug too`) were replaced with two new
tests that assert the NEW rejection invariant. This is an intentional contract
change, clearly documented in both commit message and inline comments.

**Logic bug caveat:** this fix changes an observable contract (old trail writes
with punctuation-only titles would have succeeded; they now fail). Flagged for
**human verification** to confirm no existing `data/trails/*.md` files depend
on the old fallback.

---

### WR-10 — detectTrail single-group behavior

**Files modified:** `src/components/chat/message-bubble.tsx`
**Commit:** 0ba5763

**Applied fix:** The single-group render policy is now documented as INTENTIONAL
in the function docstring (not an oversight). Added a dev-only `console.info`
when 2+ groups are found so the case surfaces during development without spamming
prod consoles.

## Skipped Issues (in scope, by design)

### WR-11 — 4000-char content excerpt in initial HTML payload

**File:** `src/lib/chats/list.ts` + `src/components/chat/chat-sidebar.tsx`
**Reason:** Explicitly marked "skip — payload size is v1 acceptable" in the fix
scope priority guidance. The reviewer's own recommendation was to consider a
`/api/chats/search?q=` server-side endpoint only if the chat list grows. Not
fixed this iteration; tracked for potential Phase 4.1.

## Skipped Issues (out of scope — info findings)

IN-01 through IN-14 (14 total) are Info-severity findings. The fix scope for
this run was `critical_warning` per the `/gsd-code-review-fix` config; these
remain documented in `04-REVIEW.md` for a future polish pass.

## Verification

- **Test suite:** 243 → 251 passing (+8 new regression tests: 5 for CR-02, 1
  each for WR-06 / WR-07 / WR-09)
- **Lint:** no NEW errors introduced. Pre-existing `react-hooks/purity` errors
  in `useStableChatId` and `use-local-storage.ts` were not touched by any fix
  commit.
- **CR-01 verification method:** direct inspection of installed AI SDK v6 type
  definitions (`@ai-sdk/provider-utils/dist/index.d.ts` line 905-913) and
  OpenRouter provider source (`@openrouter/ai-sdk-provider/dist/index.mjs`
  line 2854-2877). Context7 MCP server was not directly invokable as a function
  call in this environment; the installed runtime artifacts are the
  ground-truth equivalent for the version constraints.

## Logic-fix verification flags

Per the fix-agent contract, the following finding is flagged for explicit human
review because its fix changes an observable contract:

- **WR-09** (punctuation-only trail titles now rejected) — confirm no existing
  `data/trails/*.md` files depend on the old `trilha.md` fallback before
  closing.

---

_Fixed: 2026-04-19T18:20:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
