---
status: issues_found
phase: 04-ai-librarian
depth: standard
reviewed_at: 2026-04-19T18:03:00Z
diff_base: be5eb65
files_reviewed: 39
findings:
  critical: 2
  warning: 11
  info: 14
  total: 27
---

# Phase 4: Code Review Report

Phase 4 (AI Librarian chat UI + API + persistence) is overall solid. API boundaries have consistent Zod kebab/alphanumeric regexes, `SAFE_MATTER_OPTIONS` (CVE-2025-65108) is applied on every `matter()` call, `rehype-sanitize` is wired on both client `MessageText` and server `renderMarkdown`, and the UAT bug fix (system prompt as a top-level `streamText` param) is correctly placed.

Issues concentrate in three areas:

- System-message shape: top-level `system` param works functionally but the Anthropic prompt-cache optimization may be silently lost.
- React hook dep lists and lifecycle: a handful of effects have stale-dep / race / input-loss smells.
- Input validation gaps on inbound payloads (`messages` not shape-validated; trail `book_refs` not cross-checked against known slugs; `title` allows punctuation-only).

No Critical-severity security holes. Defense-in-depth on `chatId` / `slug` / trail book-refs is consistent.

## Critical

### CR-01 — `system` parameter shape may defeat Anthropic prompt-cache

**File:** `src/app/api/chat/route.ts:83-100`

The UAT fix correctly moved the persona prompt to top-level `streamText.system`. The value is a `SystemModelMessage` with `providerOptions` at the message shell — but Anthropic's cache-control is documented to ride on a **content part** (`content: [{ type: 'text', text, providerOptions }]`), not on the message-level `providerOptions`. The stream itself works; however, AI-SPEC §4's ~90% prompt-cache cost saving may be silently lost.

**Verify via Context7** the current AI SDK v6 contract for system-message cache-control before closing (this is the pitfall #4 call-out in AI-SPEC §3). If the part-level shape is required, update to:

```ts
system: {
  role: 'system',
  content: [{ type: 'text', text: buildSystemPrompt(libraryContext),
              providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } }],
}
```

### CR-02 — `messages` body not shape-validated → persistent injection surface

**File:** `src/app/api/chat/route.ts:47-57, 102, 116, 122`

`ChatRequestSchema.messages` is `z.array(z.any()).min(1)`. The raw value flows through `convertToModelMessages`, `toUIMessageStreamResponse.originalMessages`, and eventually `saveChat(messages)`. A malicious client could post `role: 'system'`, forged tool-output parts with bogus slugs, or oversized text — any of which persists to `data/chats/{id}.md` and is re-read on next visit. Low practical impact (local personal app) but the filesystem-as-truth posture warrants closing this.

Define a discriminated Zod schema for message parts and reject `role: 'system'` at the boundary; cap array size and per-text length.

## Warning

- **WR-01** `chat-main.tsx:90-104` — seed `useEffect` suppresses exhaustive-deps; `router.replace('/chat')` fires even when seed was NOT applied (strips `?about` early). Guard `replace` behind `seedApplied`.
- **WR-02** `chat-main.tsx:80-85` — `onFinish` calls `router.refresh()` on every assistant turn; `listChats()` reads the whole `data/chats/` dir + parses each `.md`. Refresh only on first completion.
- **WR-03** `composer.tsx:104` — textarea `disabled={status === 'submitted'}` drops IME compositions and steals focus; use `aria-busy` + opacity instead.
- **WR-04** `chat-main.tsx:73-85` — `initialMessages` is a fresh reference each render; `useChat` v6 behavior with changing `messages` prop is undocumented. Memoize once with `useMemo(() => ..., [])`.
- **WR-05** `chat-main.tsx:145-147` — retry calls `regenerate()` without `stop()` first; can double-stream + double-persist.
- **WR-06** `api/trails/route.ts` + `trails/store.ts` — `book_refs[]` regex blocks path-traversal chars but never cross-checks against `loadKnownSlugs()`. Reject unknown refs at the boundary.
- **WR-07** `chats/serialize.ts:92-93` — `WIKILINK_RE` accepts anything between `[[...]]`. Hand-edited chat files can inject traversal-shaped slugs that round-trip. Apply `KEBAB` filter in `tokenizeBody`.
- **WR-08** `chats/schema.ts:14-20` — `ChatFrontmatterSchema.id` only `z.string().min(1)`. Tighten to the same regex used at the API boundary.
- **WR-09** `trails/store.ts:61-62` — title like `"!!!"` passes schema and lands as filename `trilha.md`. Reject punctuation-only titles at schema.
- **WR-10** `message-bubble.tsx:35-57` — `detectTrail` returns `groups[0]`; second/third consecutive-card groups are silently discarded. Either render all groups or `console.info` in dev.
- **WR-11** `chats/list.ts` + `chat-sidebar.tsx` — 4000-char content excerpt × N chats lands in the initial HTML payload. Fine for v1 personal scale; consider `/api/chats/search?q=` server-side if the chat list grows.

## Info

- **IN-01** Add rationale to remaining `eslint-disable-next-line @typescript-eslint/no-explicit-any` in `route.ts:101-102, 115-116`.
- **IN-02** `message-bubble.tsx:174-176` `console.warn` on unknown part can flood during streaming — gate behind a once-per-message ref.
- **IN-03** `chat-shell.tsx:7, 19` — stale "Plan 06 placeholder" comments; rewrite as past-tense or drop.
- **IN-04** `message-list.tsx:45` — `void error` pattern is misleading; surface `error.message` in dev or drop the prop.
- **IN-05** `chat-sidebar-item.tsx:43-46` — invalid-date fallback is an empty string; render `"data desconhecida"`.
- **IN-06** `chats/store.ts:39` — `deriveTitle` truncates at 60 mid-word; slice at last word boundary.
- **IN-07** `welcome-state.tsx:42-53` — two copy branches risk diverging; consolidate with `Intl.PluralRules`.
- **IN-08** `route.ts:92-94` — `createOpenRouter(...)` runs per-request; hoist to module scope.
- **IN-09** `route.ts:104` — `stepCountIs(4)` is a magic number; extract as `MAX_TOOL_ROUNDS` with spec reference.
- **IN-10** `slug-set.ts` — reviewer's read returned only line 1; manually verify the full body against the `useKnownSlugs` commentary.
- **IN-11** `chat-main.tsx:51-55` — `crypto.randomUUID` fallback is dead weight on Next 16 browsers.
- **IN-12** `reading-trail-artifact.tsx:11` — `suggestedTitle` prop declared but no caller passes it; remove or wire.
- **IN-13** pt-BR strings scattered across components — optional centralization in `src/lib/copy.ts`.
- **IN-14** `'ready' | 'submitted' | 'streaming' | 'error'` declared in 2 files; export shared `ChatStatus` alias.

## UAT fix verification (commit ea2f7a8)

The fix is correctly placed — `buildSystemPrompt(libraryContext)` flows into top-level `streamText.system`; no system-role messages prepended to `messages[]`. The original regression is verifiably fixed. The only open question is whether the Anthropic cache-control is actually being honored at the current SDK shape — see **CR-01**.

## Recommended next step

Run `/gsd-code-review-fix 04` to auto-fix the Critical + Warning findings, or close the phase now and track CR-01/CR-02/WR-06/WR-08 as a Phase 4.1 polish pass.
