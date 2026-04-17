---
phase: 04-ai-librarian
plan: 06
subsystem: ui
tags: [chat, ai-sdk-v6, use-chat, streaming, react-markdown, textarea, keyboard-shortcuts, aria-live, deep-link]

requires:
  - phase: 04-ai-librarian
    plan: 03
    provides: POST /api/chat streaming endpoint + LibrarianClientMessage UIMessage type + LibrarianTools tool shapes
  - phase: 04-ai-librarian
    plan: 04
    provides: AvatarMonogram, MessageText, LibraryBookCardInline, ExternalBookMention leaf primitives + KnownLibraryProvider / useKnownSlugs context
  - phase: 04-ai-librarian
    plan: 05
    provides: ChatShell, ChatSidebarDrawer (trigger contract), /chat and /chat/[id] entry points, ChatMain placeholder signature

provides:
  - ChatMain (real implementation) wired to useChat via DefaultChatTransport, overwriting the Plan 05 placeholder without changing the exported signature
  - Composer with Enter/Shift+Enter/Escape keyboard shortcuts, auto-expanding textarea, and contextual Send/Stop button that auto-focuses while busy
  - MessageList with WelcomeState / TypingDots bubble / MessageErrorState routing and scroll-pause-at-120px-above-bottom auto-scroll
  - MessageBubble dispatching on UIMessage.parts with layered AI-08 guard (useKnownSlugs pre-mount check BEFORE LibraryBookCardInline mount)
  - WelcomeState with pluralization-aware persona greeting for 0/1/N book counts
  - MessageErrorState inline retry card, StreamingCursor inline tail bar, TypingDots pre-first-token indicator

affects:
  - 04-07-PLAN (deployment/UAT) — full chat surface is live; /chat and /chat/[id] render a functioning conversation with streaming, cards, and deep-link seeding

tech-stack:
  added: []
  patterns:
    - Layered defense: MessageBubble checks useKnownSlugs().has(slug) BEFORE mounting LibraryBookCardInline, which still runs its own useBookMeta() fallback (defense in depth for D-14 / AI-08)
    - Stable chat id via useRef-seeded crypto.randomUUID() — persists for the component's lifetime so useChat state does not re-key on re-render
    - Deep-link seed pattern: server resolves ?about=slug → seedBook prop → client pre-fills composer on first mount via seedApplied ref guard, strips ?about= via router.replace('/chat') to prevent refresh re-trigger
    - One-shot aria-live announcement for "submitted" state ("Dona Flora está respondendo.") plus a separate sr-only aria-live='polite' region in MessageList that mirrors the current assistant's concatenated text
    - Enter-always-preventsDefault pattern in Composer — plain Enter never inserts a newline even when the submit preconditions aren't met, matching user expectations from ChatGPT/Claude

key-files:
  created:
    - src/components/chat/typing-dots.tsx
    - src/components/chat/streaming-cursor.tsx
    - src/components/chat/welcome-state.tsx
    - src/components/chat/message-error-state.tsx
    - src/components/chat/message-bubble.tsx
    - src/components/chat/message-list.tsx
    - src/components/chat/composer.tsx
    - src/components/chat/__tests__/welcome-state.test.tsx
    - src/components/chat/__tests__/message-bubble.test.tsx
    - src/components/chat/__tests__/composer.test.tsx
  modified:
    - src/components/chat/chat-main.tsx
    - jest.config.ts

key-decisions:
  - "useStableChatId uses crypto.randomUUID() for new conversations; UUIDs always start alphanumerically and contain only [0-9A-Fa-f-], passing the Plan 03 Zod regex ^[A-Za-z0-9][A-Za-z0-9_-]*$ on the server."
  - "Plain Enter in the composer always preventDefaults. Even when the submit preconditions aren't met (input empty OR status !== 'ready'), we still block the newline so users never see a stray linebreak when they meant to submit. Shift+Enter remains the unambiguous newline shortcut."
  - "Auto-scroll state lives in a ref (isAtBottomRef), not useState. The scroll-position check runs on every scroll event; re-rendering MessageList on each pixel of user scroll would be wasteful and unnecessary because the only consumer of the flag is the messages-effect that reads it on commit."
  - "Tool parts with state !== 'output-available' render a layout-stable skeleton (for library book card) or null (for external mention). The skeleton prevents the bubble from jumping when the tool resolves; the external mention is small enough that a placeholder would be more disruptive than helpful."
  - "Error prop on MessageList accepted as `error: Error | null` to match the plan's interface, even though useChat returns `Error | undefined`. ChatMain normalizes via `error ?? null`. The value is currently unused by MessageList — MessageErrorState receives only onRetry — but keeping it in the prop shape reserves space for future error-copy variants without a breaking change."
  - "Rule 3 auto-fix: jest.config.ts transformIgnorePatterns allowlist extended with react-markdown and its ESM transitive dependencies (hast-util-to-jsx-runtime, html-url-attributes, estree-util-is-identifier-name, mdast-util-mdx-*, mdast-util-to-markdown, parse-entities, longest-streak, is-alphabetical/alphanumerical/decimal/hexadecimal). Plan 04's MessageText primitive was never transitively required by any Plan 04 test (none of avatar-monogram / external-book-mention / library-book-card-inline / known-library-context imports it); Plan 06's message-bubble.test.tsx is the first test that pulls react-markdown into the transform graph."

patterns-established:
  - "Streaming cursor is hung on the LAST text part of the LAST assistant message only, never on tool parts or mid-message text parts. MessageBubble computes `lastTextIndex` with a forward sweep; MessageList passes `isLastAssistantStreaming = status==='streaming' && lastMessage?.role==='assistant' && i === messages.length - 1` to the bubble."
  - "Composer is a dumb controlled component: the parent (ChatMain) owns both the input state and the submit/stop/regenerate handlers. This keeps seed pre-fill, router.replace(), and useChat wiring contained in one place and lets Composer be unit-tested against a tiny Harness without mocking useChat."

requirements-completed: [AI-01, AI-02, AI-03, AI-05, AI-06, AI-07, AI-08]

duration: ~15min
completed: 2026-04-17
---

# Phase 04 Plan 06: Streaming chat surface + deep-link seed (ChatMain, Composer, MessageList, MessageBubble) Summary

**Replaced Plan 05's ChatMain placeholder with a full useChat-driven streaming surface: MessageBubble dispatches text / library card / external mention parts with a layered AI-08 guard, MessageList handles welcome + submitted + streaming + error states with aria-live, Composer honors Enter/Shift+Enter/Escape and auto-focuses Stop while busy, and deep-link `?about=` seeds the composer in pt-BR then strips the query param.**

## Performance

- **Duration:** ~15 minutes of executor time (2026-04-17T20:08Z first commit, 20:13Z last commit; plus upfront context read + jest-config fix + full-suite verification)
- **Started:** 2026-04-17T19:58Z (approx)
- **Completed:** 2026-04-17T20:13Z
- **Tasks:** 3 (all autonomous; no TDD gates mandated by plan)
- **Files created:** 10 (7 components + 3 test files)
- **Files modified:** 2 (chat-main.tsx overwritten, jest.config.ts allowlist extended)
- **Tests added:** 20 (5 WelcomeState + 7 MessageBubble + 8 Composer)
- **Full project suite:** 227/227 passing
- **npm run build:** green

## Accomplishments

- **The chat is live.** `/chat` (new) and `/chat/[id]` (resume) both render a working streaming conversation: user types → `useChat.sendMessage` → `/api/chat` → streamed UIMessage parts → MessageList renders bubbles with text, library book cards, and external mentions. onFinish calls `router.refresh()` so the sidebar list (owned by the server component in Plan 05) repopulates with the newly persisted conversation.
- **AI-08 guardrail is now two-layered.** MessageBubble pre-validates every `tool-render_library_book_card` slug against `useKnownSlugs()` BEFORE mounting `LibraryBookCardInline`. If the model hallucinates a slug, the bubble renders the D-14 neutral span directly and the card component is never mounted. Inside the card, the existing `useBookMeta(slug) === null` fallback remains as defense-in-depth.
- **Deep-link flow works.** `/chat?about=slug` → server resolves the slug to title/author → ChatMain pre-fills the composer in pt-BR ("Conte-me mais sobre \"...\" de .... O que você acha dessa minha escolha?") → `router.replace('/chat')` strips the query param so refreshes don't re-seed → user edits or sends.
- **Keyboard contract respected.** Enter always preventDefaults (submits if preconditions met; blocks accidental newlines otherwise); Shift+Enter newlines; Escape aborts during streaming. Stop button auto-focuses when busy so keyboard users can abort without hunting.
- **A11y:** one-shot aria-live announcement of "Dona Flora está respondendo." when status transitions to 'submitted', plus a continuously-updated sr-only aria-live region in MessageList mirroring the current assistant text.
- **Reduced-motion respected:** TypingDots and StreamingCursor use `motion-safe:animate-pulse` so `prefers-reduced-motion: reduce` suppresses animation.
- **iOS safe area respected** on the Composer (`pb-[env(safe-area-inset-bottom)]`).
- **Touch targets ≥ 44×44px** on Send and Stop buttons.

## Task Commits

Each task was committed atomically.

1. **Task 1: TypingDots + StreamingCursor + WelcomeState + MessageErrorState** — `f9c2661` (feat)
2. **Task 2: MessageBubble + MessageList with layered D-14 guard** — `9265361` (feat, includes Rule 3 jest.config.ts fix)
3. **Task 3: Composer + ChatMain wire useChat to /api/chat (overwrites placeholder)** — `6101b33` (feat)

## Files Created/Modified

### New chat components

- `src/components/chat/typing-dots.tsx` — 3-dot indicator for `status==='submitted'`, aria-hidden, `motion-safe:animate-pulse` with staggered `animationDelay: 0/200/400ms`.
- `src/components/chat/streaming-cursor.tsx` — 2px × 1em blinking bar for the tail of the last streaming text part, aria-hidden.
- `src/components/chat/welcome-state.tsx` — persona greeting with three pluralization branches (0/1/N books). The 0-book branch renders a CTA `<Button render={<Link href="/" />}>Ir para a biblioteca</Button>`.
- `src/components/chat/message-error-state.tsx` — red-toned inline retry card with "Erro ao gerar resposta." heading, pt-BR body, and "Tentar novamente" button.
- `src/components/chat/message-bubble.tsx` — per-message renderer with role-based alignment/palette and `part.type` dispatch: text → MessageText, tool-render_library_book_card → useKnownSlugs guard + LibraryBookCardInline OR D-14 span, tool-render_external_book_mention → ExternalBookMention, unknown → warn+null. StreamingCursor appended to the last text part when `isLastAssistantStreaming` is true.
- `src/components/chat/message-list.tsx` — scroll container with auto-scroll-pause-at-120px, WelcomeState for empty conversations, TypingDots bubble during 'submitted' after user turn, MessageErrorState under last bubble on 'error', aria-live sr-only region mirroring current assistant text.
- `src/components/chat/composer.tsx` — sticky-bottom form with controlled Textarea (auto-expand to max-h-48) + Send/Stop contextual button. Keyboard: Enter submits (always preventDefault), Shift+Enter newlines, Escape aborts when busy. `autoFocusOnMount` places the cursor at end of prefill for seedBook flow.

### Modified

- `src/components/chat/chat-main.tsx` — **overwritten** (Plan 05 placeholder replaced; ChatMain + ChatMainProps exported signatures preserved exactly). Wires `useChat<LibrarianClientMessage>` via `DefaultChatTransport({ api: '/api/chat', body: { chatId } })`; `onFinish` calls `router.refresh()`; `useStableChatId` hook produces a persistent id via `crypto.randomUUID()` for new conversations. Deep-link seed effect pre-fills composer on first mount when seedBook is present, guarded by a `seedApplied` ref so only fires once per mount.
- `jest.config.ts` — extended the `ESM_PACKAGES` allowlist with `react-markdown`, `hast-util-to-jsx-runtime`, `html-url-attributes`, `estree-util-is-identifier-name`, `mdast-util-mdx-expression`, `mdast-util-mdx-jsx`, `mdast-util-mdxjs-esm`, `mdast-util-to-markdown`, `parse-entities`, `longest-streak`, `is-alphabetical`, `is-alphanumerical`, `is-decimal`, `is-hexadecimal`. Required because Plan 06's MessageBubble test is the first test that transitively pulls react-markdown into the babel-jest transform graph.

### Tests

- `src/components/chat/__tests__/welcome-state.test.tsx` — 5 tests (heading, plural/singular/zero branches, BookHeart aria-hidden).
- `src/components/chat/__tests__/message-bubble.test.tsx` — 7 tests covering every dispatch branch. The critical AI-08 test asserts that an unknown slug renders the italic fallback text AND zero `<a>` elements (the card was never mounted).
- `src/components/chat/__tests__/composer.test.tsx` — 8 tests covering Enter/Shift+Enter/Escape keyboard, Send button disabled states, Stop button swap during busy states, and the `aria-label="Mensagem para a Dona Flora"` a11y contract. userEvent.setup() is used for the realistic keyboard sequence test.

## Decisions Made

- **Stable chat id via useRef + crypto.randomUUID().** useChat keys internal state by `id`; if that id changed across renders the hook would reset. Using a useRef that's seeded once on first render (guarded by `ref.current === null`) gives us a stable id for the component's lifetime without recomputing on re-renders. UUIDs always start with an alphanumeric hex digit and contain only `[0-9A-Fa-f-]`, so they match the Plan 03 chatId Zod regex without any sanitization step.
- **Deep-link seed is side-effectful on first mount only.** The effect runs on `seedBook` change, but a `seedApplied` ref makes it a one-shot: even if React re-invokes the effect (StrictMode in dev, fast refresh, etc.), the ref guard prevents re-applying the seed. After applying, `router.replace('/chat')` drops the `?about=` param so a browser refresh starts a clean conversation rather than re-seeding.
- **Enter always preventDefaults in the Composer keydown handler.** The alternative (only preventDefault when `canSend`) would leak a newline into the textarea when users hit Enter during a busy state or with an empty input. Keyboard-first users expect Enter to be "the submit key" unambiguously; preventing the default in all cases matches that mental model. Shift+Enter is the unambiguous newline shortcut.
- **isAtBottomRef is a ref, not useState.** The scroll-position flag is a guard variable consumed once per message change; storing it in state would re-render MessageList on every scroll event, which is wasteful because nothing visual depends on the flag's value between messages.
- **Tool-part skeleton vs. null for state !== 'output-available'.** Library book cards render a layout-stable `h-16 w-64 rounded-xl bg-zinc-800/70` skeleton so the bubble doesn't jump when the tool resolves. External mentions render null during input-streaming / input-available because their payload is tiny — an inline skeleton would be more visually disruptive than a brief "nothing here yet" gap.
- **MessageList accepts `error: Error | null` even though it currently doesn't consume it.** The plan's interface specified this prop, and it's worth keeping in the API for future error-copy variants (e.g., rate-limit vs. network-failure branches in MessageErrorState). ChatMain normalizes `error ?? null` because `useChat` returns `Error | undefined`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jest.config.ts transformIgnorePatterns missing ESM transitive deps of react-markdown**

- **Found during:** Task 2 (first run of `message-bubble.test.tsx`)
- **Issue:** `MessageText` (created in Plan 04) imports `react-markdown`, which is ESM-only. Plan 04's test files never transitively loaded `MessageText` — they only tested AvatarMonogram, ExternalBookMention, LibraryBookCardInline, and KnownLibraryContext. Plan 06's `message-bubble.test.tsx` is the first test that renders a text part, which mounts MessageText, which imports `react-markdown`, which Jest failed to transform because neither `react-markdown` nor its transitive ESM deps (`hast-util-to-jsx-runtime`, `html-url-attributes`, `estree-util-is-identifier-name`, `mdast-util-mdx-expression`, `mdast-util-mdx-jsx`, `mdast-util-mdxjs-esm`, `mdast-util-to-markdown`, `parse-entities`, `longest-streak`, `is-alphabetical`, `is-alphanumerical`, `is-decimal`, `is-hexadecimal`) were in the ESM_PACKAGES allowlist.
- **Fix:** Added the 14 missing packages to `jest.config.ts` ESM_PACKAGES array (kept alphabetically sorted). babel-jest now transforms them on demand.
- **Files modified:** `jest.config.ts`
- **Verification:** `npx jest src/components/chat --no-coverage` passes 54/54; full project `npx jest` passes 227/227.
- **Committed in:** `9265361` (Task 2 commit).

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The fix was a pure test-infrastructure adjustment; no production code changed. The gap was latent in Plan 04 — MessageText would have needed these packages the moment any test exercised it. Discovering and fixing it now pre-empts flakiness for Plans 07+ that test more chat surface area.

## Issues Encountered

- **Worktree had no node_modules.** Same issue Plan 04's executor hit (documented in `04-04-SUMMARY.md`). Resolved by copying the main tree's `node_modules` into the worktree with `cp -R`. This was the first action after the initial worktree-base check; all subsequent `npx jest` / `npm run build` runs resolved against the worktree-local copy.
- **base-ui Button emits a dev-time warning when rendered with `render={<Link />}` in jsdom.** Error text: "A component that acts as a button expected a native `<button>` because the `nativeButton` prop is true." The warning does NOT fail tests (all 5 WelcomeState tests pass). The pattern is already in production use in `chat-sidebar.tsx` without a test fixture there, so we follow the existing project convention. If the warning becomes noisy, a follow-up plan can set `nativeButton={false}` on every Button that renders an `<a>`, but that's a cross-cutting refactor out of scope for Plan 06.

## User Setup Required

None — no environment variables, API keys, or dashboard configuration introduced by this plan. `ANTHROPIC_API_KEY` was already required by Plan 03.

## Next Phase Readiness

**Ready for Plan 07 (UAT / smoke-test):**

- `/chat` opens a fresh conversation with a persona welcome matching the user's library count.
- User can type and send. Streaming text appears token-by-token with a blinking cursor at the tail.
- Library book cards and external book mentions render inside assistant bubbles per the AI-SPEC part-type dispatch.
- Stop button aborts streaming; Escape from the textarea also aborts.
- `/chat/[id]` resumes an existing conversation via `loadChat(id)` → `initialMessages`.
- `/chat?about={slug}` pre-fills the composer and strips the query param.
- Sidebar repopulates after `onFinish` via `router.refresh()`.

**No blockers. No concerns.**

The only open question for Plan 07 is whether the reading-trail artifact (UI-D11) needs to ship in this phase or can defer. The plan explicitly deferred it to a later phase; MessageBubble's dispatch table already has an `unknown part` → warn+null branch so any future data-part won't crash the surface.

## TDD Gate Compliance

Plan 06 does NOT declare any `tdd="true"` tasks — the `<verify><automated>` jest runs were treated as post-hoc verification rather than RED/GREEN gates. All test commits are bundled with the corresponding feat commits, which is consistent with the plan's `type="auto"` task declarations.

## Self-Check: PASSED

Verified post-write:

- Created files exist:
  - `src/components/chat/typing-dots.tsx` — FOUND
  - `src/components/chat/streaming-cursor.tsx` — FOUND
  - `src/components/chat/welcome-state.tsx` — FOUND
  - `src/components/chat/message-error-state.tsx` — FOUND
  - `src/components/chat/message-bubble.tsx` — FOUND
  - `src/components/chat/message-list.tsx` — FOUND
  - `src/components/chat/composer.tsx` — FOUND
  - `src/components/chat/__tests__/welcome-state.test.tsx` — FOUND
  - `src/components/chat/__tests__/message-bubble.test.tsx` — FOUND
  - `src/components/chat/__tests__/composer.test.tsx` — FOUND
- Commits exist in git log:
  - `f9c2661` — FOUND
  - `9265361` — FOUND
  - `6101b33` — FOUND
- ChatMain placeholder comment ("PLACEHOLDER") was removed from `src/components/chat/chat-main.tsx`.
- `ChatMain` and `ChatMainProps` exported signatures preserved (ChatShell's import site unchanged).
- `npm run build` exits 0.
- Full jest suite passes 227/227 (pre-existing 207 + 20 new).

---
*Phase: 04-ai-librarian*
*Completed: 2026-04-17*
