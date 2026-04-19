---
phase: 04-ai-librarian
plan: 07
subsystem: ui + ai-librarian
status: complete
human_verify_approved: 2026-04-19
tags: [chat, entry-points, reading-trail, ai-04, ai-05, ai-01, human-verify]

requires:
  - phase: 04-ai-librarian
    plan: 03
    provides: POST /api/trails endpoint accepting { title, book_refs[] } with kebab-case Zod validation
  - phase: 04-ai-librarian
    plan: 04
    provides: LibraryBookCardInline primitive + KnownLibraryProvider/useKnownSlugs context
  - phase: 04-ai-librarian
    plan: 05
    provides: /chat and /chat/[id] routes with seedBook deep-link plumbing
  - phase: 04-ai-librarian
    plan: 06
    provides: MessageBubble dispatch table for UIMessage.parts (text, library card, external mention)

provides:
  - ChatHeaderEntryButton — Sparkles ghost icon in app header navigating to /chat (AI-01 entry point)
  - ConversarSobreLivroButton — default CTA on /books/[slug] deep-linking /chat?about={slug} (AI-05 entry point)
  - ReadingTrailArtifact — inline artifact rendered under assistant bubbles with 2+ consecutive library cards, Salvar trilha POSTs /api/trails with 3s feedback chip (AI-04 capture)
  - detectTrail helper inside message-bubble.tsx — pure heuristic scanning parts for consecutive known-slug card groups

affects:
  - Phase 4 verification (ROADMAP success criteria 1-5) — all entry points + save flow now live; only the human-verify checkpoint remains between this plan and phase close

tech-stack:
  added: []
  patterns:
    - "Entry-point components use base-ui Button with render={<Link />} so Next.js client navigation is preserved without losing the Button's touch target / focus-visible ring / aria-label wiring"
    - "AI-04 heuristic = pure function over UIMessage.parts; no server-side tool declaration added (keeps tools minimal and defers persistence decision to the user)"
    - "Save-trail flow uses jest.useFakeTimers + act + advanceTimersByTime to assert the 3s transient chip contract without real wall-clock waits"

key-files:
  created:
    - src/components/chat/chat-header-entry-button.tsx
    - src/components/chat/conversar-sobre-livro-button.tsx
    - src/components/chat/reading-trail-artifact.tsx
    - src/components/chat/__tests__/chat-header-entry-button.test.tsx
    - src/components/chat/__tests__/conversar-sobre-livro-button.test.tsx
    - src/components/chat/__tests__/reading-trail-artifact.test.tsx
  modified:
    - src/app/page.tsx
    - src/app/books/[slug]/page.tsx
    - src/components/chat/message-bubble.tsx

key-decisions:
  - "encodeURIComponent applied to the slug inside ConversarSobreLivroButton even though Phase 2 slugs are already kebab-case ASCII — defensive layer that keeps the URL safe if the slug format ever loosens (T-04-30 mitigation)"
  - "Tooltip wrapping on ChatHeaderEntryButton deferred per UI-SPEC allowance — aria-label alone satisfies accessibility, and the test suite asserts it. A future cross-cutting Tooltip pass can add visual tooltips without touching this component's contract."
  - "Trail artifact renders BELOW the assistant bubble (same outer row changed to flex-col) rather than replacing the inline cards. Keeps conversational transparency and avoids guessing whether the assistant intended the sequence as a persistable trail."
  - "Trail detection is a client-only heuristic — no new AI tool added. The server-side /api/trails Zod gate is the single source of truth for persisted trail shape, so a hallucinated slug cannot make it to disk regardless of UI behavior."
  - "Numeric position chip in the ordered list is NOT aria-hidden; screen readers benefit from hearing '1 Grande Sertão', '2 Doutor Pasavento', etc. The <ol> already adds list semantics; the visible number reinforces order for sighted users."

patterns-established:
  - "Global fetch + useRouter mocks are the standard idiom for testing client mutations in this project — reading-trail-artifact.test.tsx mirrors the shape used by delete-book-button / add-book-dialog tests."

requirements-completed: [AI-01, AI-04, AI-05]

duration: ~25min
completed: 2026-04-17
---

# Phase 04 Plan 07: Chat entry points + Reading trail artifact + human-verify checkpoint

**Entry points are wired (home Sparkles → /chat; book detail CTA → /chat?about={slug}), the AI-04 reading-trail artifact renders under any assistant message with 2+ consecutive known-library cards and persists to `data/trails/` via `POST /api/trails` with a 3s "Trilha salva" chip. Phase close blocks on the human-verify checkpoint.**

## Status

`awaiting-human-verify` — Tasks 1 and 2 are implemented, tested, and committed. Task 3 is a blocking human-verify checkpoint that must exercise the 5 ROADMAP success criteria and the 8 AI-0x requirements end-to-end. This SUMMARY is preliminary; the orchestrator will update `status: complete` after the user approves the checkpoint OR re-run the executor to address failures.

## Performance

- **Duration so far:** ~25 minutes
- **Tasks:** 2/3 complete (Task 3 is the blocking human-verify checkpoint)
- **Files created:** 6 (3 components + 3 test files)
- **Files modified:** 3 (src/app/page.tsx, src/app/books/[slug]/page.tsx, src/components/chat/message-bubble.tsx)
- **Tests added:** 16 (3 ChatHeaderEntryButton + 5 ConversarSobreLivroButton + 8 ReadingTrailArtifact)
- **Full project suite:** 243/243 passing (plan started at 227)
- **`npm run build`:** green

## Accomplishments (Tasks 1 & 2 completed)

- **AI-01 entry point live.** Home header right-cluster now wraps `<AddBookDialog />` and `<ChatHeaderEntryButton />` per UI-SPEC line 295. The Sparkles button is a ghost icon button with `aria-label="Conversar com a Dona Flora"` — tooltip visual deferred, aria-label carries the full a11y contract.
- **AI-05 deep-link entry point live.** Book detail page (`/books/[slug]`) now renders `<ConversarSobreLivroButton slug={slug} titulo={book.title} />` at the end of the metadata column — mobile-centered, desktop `md:justify-end`. URL uses `encodeURIComponent(slug)` for URL safety.
- **AI-04 trail artifact wired.** `MessageBubble` runs `detectTrail(parts, knownSlugs)` on every assistant message. A qualifying group (2+ consecutive `tool-render_library_book_card` parts with `state='output-available'` and known slugs) renders `<ReadingTrailArtifact>` below the bubble.
- **Save-trail flow implemented.** Click → `POST /api/trails` with `{ title, book_refs }` → 3s "Trilha salva" chip → automatic revert to idle. `router.refresh()` fires so any future sidebar view that lists trails picks it up.
- **Error recovery live.** Failed POST → pt-BR "Não consegui salvar a trilha." + "Tentar novamente" button that re-invokes `handleSave()`.
- **Defense in depth preserved.** Trail detection only emits slugs that pass `useKnownSlugs().has(slug)` — so even if the model smuggles an inventive slug into a tool output, the artifact never tries to persist it. The server `/api/trails` Zod gate is the authoritative kebab-case validator (T-04-31 mitigated).

## Task Commits

1. **Task 1 RED** — `830d8b8` test(04-07): add failing tests for chat entry-point buttons
2. **Task 1 GREEN** — `9ad81fc` feat(04-07): wire chat entry-point buttons on home + book detail
3. **Task 2 RED** — `166631e` test(04-07): add failing tests for ReadingTrailArtifact
4. **Task 2 GREEN** — `09f43b5` feat(04-07): ReadingTrailArtifact + MessageBubble trail detection heuristic

Task 3 (human-verify) pending — no commit yet.

## Files Created / Modified

### Created

- `src/components/chat/chat-header-entry-button.tsx` — Sparkles ghost button → /chat, aria-label "Conversar com a Dona Flora"
- `src/components/chat/conversar-sobre-livro-button.tsx` — Default CTA `<Sparkles /> Conversar sobre este livro` → /chat?about=encoded
- `src/components/chat/reading-trail-artifact.tsx` — Numbered ordered list + Save/Saving/Saved/Error state machine; fetches POST /api/trails; router.refresh() + setTimeout(...,3000) on success
- `src/components/chat/__tests__/chat-header-entry-button.test.tsx` — 3 tests
- `src/components/chat/__tests__/conversar-sobre-livro-button.test.tsx` — 5 tests (includes encodeURIComponent coverage)
- `src/components/chat/__tests__/reading-trail-artifact.test.tsx` — 8 tests (idle/saving/saved/error states, 3s timer via fake timers, router.refresh, suggestedTitle override)

### Modified

- `src/app/page.tsx` — header right-side wrapped in `<div className="flex items-center gap-2">` containing AddBookDialog + ChatHeaderEntryButton; preserved existing `<header>` classes.
- `src/app/books/[slug]/page.tsx` — imported ConversarSobreLivroButton; metadata column now `flex flex-1 flex-col`; CTA inserted at bottom of the column with `mt-4 flex justify-center md:mt-auto md:justify-end` so it's centered on mobile and right-aligned on desktop.
- `src/components/chat/message-bubble.tsx` — added `detectTrail()` module-scope helper; assistant branch wrapped in `flex flex-col items-start gap-0` so the artifact sits below the avatar+bubble sub-row; trail artifact rendered with `ml-10 w-full max-w-[75ch]` to align with the bubble's left edge under the avatar.

## Decisions Made

- **Inline cards kept alongside the trail artifact.** UI-SPEC UI-D11 is a "wrapper appears when pattern detected" — it doesn't mandate replacing the inline cards. Keeping both preserves the conversation flow (the librarian's prose around each card stays legible) and avoids a surprising visual shuffle. If the artifact feels redundant in practice, a follow-up can suppress the inline cards when a trail is detected.
- **Tooltip on the header Sparkles button deferred.** Wiring shadcn Tooltip requires a TooltipProvider at the layout level and all other icon-only buttons in the project (sidebar, drawer) don't have tooltips yet. Adding one here would be a lone instance. Aria-label satisfies the a11y contract today; a future cross-cutting pass can introduce Tooltips uniformly.
- **Trail artifact stays client-side only.** No new AI tool was added (e.g., `render_trail`), so the server agent stays on the minimal 2-tool set (library card + external mention). The heuristic runs purely on data the agent already produces. If the agent starts producing a lot of non-trail "two-card-in-a-row" pairs that don't semantically form trails, a follow-up can add a dedicated tool and deprecate the heuristic.
- **Numeric position chip is semantic, not decorative.** Removed `aria-hidden="true"` so screen readers announce "1", "2", "3" alongside each card's aria-label — reinforces the ordered nature of the trail when listened to linearly.
- **encodeURIComponent in ConversarSobreLivroButton.** Even though Phase 2 slugs are strictly kebab ASCII today, URL-encoding is cheap and removes a latent foot-gun if the slug format is ever relaxed (T-04-30 defensive mitigation).

## Deviations from Plan

None so far for Tasks 1 and 2. The plan was executed exactly as written.

## Known UAT Debt

To be filled after the human-verify checkpoint. Common items the plan's how-to-verify flags:

- If `ANTHROPIC_API_KEY` is missing, /api/chat returns 500 — documentation gap surfaces here.
- If the pinned model id (`claude-sonnet-4-5`) 404s at runtime, /api/chat will error — update to the live Anthropic model id and log the override.
- If library context dumping exceeds Anthropic's token limit (very large libraries > ~150k tokens), the current full-context-in-prompt strategy needs the two-tier trigger from AI-SPEC §4.

Any observed failures during the checkpoint will be recorded here with resolution notes.

## Awaiting Human-verify Checkpoint (Task 3)

The plan's Task 3 is a blocking human-verify checkpoint exercising the 5 ROADMAP success criteria and the 8 AI-0x requirements end-to-end. The executor has STOPPED at this point per the plan's `autonomous: false` flag.

Next step: the orchestrator relays the checkpoint to the user. On `approved`, a follow-up pass updates this SUMMARY with results and drops `status: awaiting-human-verify`.

## TDD Gate Compliance

Both Task 1 and Task 2 declared `tdd="true"` and honored the RED/GREEN sequence in git log:

- RED for Task 1: `830d8b8` (test commit, failing)
- GREEN for Task 1: `9ad81fc` (feat commit, tests passing)
- RED for Task 2: `166631e` (test commit, failing)
- GREEN for Task 2: `09f43b5` (feat commit, tests passing)

No refactor-only commits were needed — the implementations landed clean on the first GREEN pass.

## Self-Check: PASSED (pre-checkpoint)

- Created files exist:
  - `src/components/chat/chat-header-entry-button.tsx` — FOUND
  - `src/components/chat/conversar-sobre-livro-button.tsx` — FOUND
  - `src/components/chat/reading-trail-artifact.tsx` — FOUND
  - `src/components/chat/__tests__/chat-header-entry-button.test.tsx` — FOUND
  - `src/components/chat/__tests__/conversar-sobre-livro-button.test.tsx` — FOUND
  - `src/components/chat/__tests__/reading-trail-artifact.test.tsx` — FOUND
- Commits in git log:
  - `830d8b8` — FOUND (Task 1 RED)
  - `9ad81fc` — FOUND (Task 1 GREEN)
  - `166631e` — FOUND (Task 2 RED)
  - `09f43b5` — FOUND (Task 2 GREEN)
- Wiring preserved:
  - `<AddBookDialog` still present in `src/app/page.tsx` — FOUND
  - `<ChatHeaderEntryButton` rendered alongside AddBookDialog — FOUND
  - `<ConversarSobreLivroButton` imported and rendered in `src/app/books/[slug]/page.tsx` — FOUND
- `npm run build` exits 0 — PASS
- Full jest suite passes 243/243 — PASS
- Chat suite passes 70/70 (no regressions in Plan 04/05/06 output) — PASS

---

*Phase: 04-ai-librarian*
*Last pre-checkpoint update: 2026-04-17*
