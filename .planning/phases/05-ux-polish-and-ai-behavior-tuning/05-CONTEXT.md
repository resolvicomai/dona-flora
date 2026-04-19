---
phase: 05-ux-polish-and-ai-behavior-tuning
type: context
created: 2026-04-19
status: ready-for-planning
---

# Phase 5 — Context: UX Polish & AI Behavior Tuning

## Source of scope

UAT feedback from the user on 2026-04-19 after Phase 4 approval. Seven concerns
that don't introduce new capabilities — they refine what v1.0 already ships.
Goal: eleva a barra estética e conversacional pra algo que pareça um produto
maduro (referência explícita: "Apple macOS-like"), sem reescopar features.

## Domain boundary

**In scope:**

- Visual refinement across all surfaces (browse, book detail, chat, entry points)
- Dual-theme system (light + dark) — currently dark-only
- Unified navigation chrome across routes
- Filter UI restructure (current: unfolded; target: chips-with-popovers)
- Empty-state polish for the "add first book" moment
- ExternalBookMention visual redesign to differentiate from LibraryBookCardInline
- AI system prompt tuning: discernment over library-bias; conditional composer toggle

**Out of scope (deferred to backlog):**

- New features (search-in-chat was already added Phase 4; delete was already added Phase 4)
- New book metadata fields or AI capabilities
- Mobile-native wrappers (responsive is already covered)

---

## Canonical refs

No external ADRs or specs drive Phase 5 — the scope is internal product polish.
Primary inputs are:

- `.planning/phases/04-ai-librarian/04-UI-SPEC.md` — baseline that Phase 5 refines
- `.planning/phases/03-browse-ui/03-UI-SPEC.md` — filter patterns Phase 5 restructures
- `src/app/globals.css` — theme tokens to extend
- `src/components/chat/` + `src/components/*book*.tsx` — components to retrofit

---

## Decisions (locked)

### D-01 — Theme system: system-preference default + manual override

- **Default:** `prefers-color-scheme` on first visit (no flash: use inline script in `<head>` to apply theme class before hydration).
- **Toggle:** manual control in the unified top nav (see D-05). Flips between light/dark/system. Persists in `localStorage` under `dona-flora-theme`.
- **Implementation:** CSS variables in `:root` (light) and `[data-theme="dark"]` (or `.dark` class). Tailwind v4 `@theme` directive consumes them. No `dark:` prefix spam — tokens flip automatically.
- **Scope:** both modes must ship on day 1. No "light-first, dark-later" split.

### D-02 — macOS-like visual language (4 pilares confirmados)

All four confirmed as pillars — every wave should respect them:

1. **Typography:** system stack `-apple-system, BlinkMacSystemFont, "Segoe UI Variable", ui-sans-serif, system-ui, sans-serif` on `<body>`. Tabular-nums for numeric fields (ratings, counts). Weight scale: 400 body / 500 emphasis / 600 headings. **Never 700** — macOS avoids heavy weights.
2. **Border-radius + spacing:** cap at `rounded-xl` (14px). `rounded-lg` (10px) is default for cards. Kill `rounded-2xl`/`rounded-3xl`. Spacing compresses: `gap-2`/`gap-3` default instead of `gap-4`/`gap-6`.
3. **Translucency:** `backdrop-blur-xl` + `bg-*/80` on sticky surfaces (top nav, sidebars, popovers, sheet overlays, composer when floating).
4. **Pill / traffic-light controls:** destructive/warning/success actions render as pills with a saturated accent (destructive = red, warning = amber, success = emerald). Small size, rounded-full, bg-{color}/10 text-{color}-500.

### D-03 — Filter restructure: individual chips per group with popovers

- **Pattern:** each filter group (Status, Nota, Gênero, Autor) is its own chip in a horizontal row above the grid. Clicking a chip opens a popover containing ONLY that group's options.
- **Visual state:**
  - Inactive chip → `outline` variant, label only (`Status`).
  - Active chip → `filled` variant with brand accent, shows count (`Status · 2`).
  - Reset-all "×" appears at the end of the chip row only when ≥1 chip is active.
- **Search input stays separate** from chips. It sits at the top of the filter bar as its own input with Search icon. It is NOT a chip.
- **Reference for analog:** Apple Podcasts / Finder column filter pills (Catalyst-era).

### D-04 — AI behavior gate: discernment + conditional toggle

- **Default behavior:** the model decides when to ask. System prompt adds: *"Antes de recomendar, se o contexto da pergunta for ambíguo entre 'do meu acervo' e 'algo novo', pergunte ao usuário qual ele prefere. Registre a preferência dele na conversa e respeite até o usuário mudar."*
- **UI toggle (conditional):** a small segmented control appears just above the Composer (`Acervo · Ambos · Externo`) ONLY when the last 2 assistant turns produced external mentions AND the user did not reject them. When it appears, selecting a mode pins the preference for the current conversation (injected into the next user turn's metadata).
- **Storage:** preference lives in `useChat` metadata for the active session. Does NOT persist across chats.
- **Never pop up the toggle in the first turn** — always trust the user's first message.

### D-05 — Unified top navigation across all routes

- **Component:** single `<AppShell>` top nav rendered by `src/app/layout.tsx` (or a dedicated `AppShellProvider`).
- **Contents (left to right):**
  - Logo / home link (Biblioteca)
  - Segmented toggle `Biblioteca · Chat` — reflects the active route, clicking navigates.
  - (Flex gap)
  - Theme toggle (D-01)
- **Height:** `h-12` (smaller than Phase 4's `h-14`) — macOS density.
- **Translucency:** `bg-background/80 backdrop-blur-xl` per D-02.
- **Chat sidebar repositions:** in `/chat` the sidebar renders BELOW the top nav (not full-height from viewport top). Mobile drawer `Sheet` still slides over full viewport.

### D-06 — Empty state `/books` (when 0 livros catalogados)

- **Pattern:** small illustration + CTA in-flow (not a giant centered placeholder).
- **Size:** ~25% of viewport height max. Centered vertically within the content area (not the whole viewport).
- **Content:**
  - Micro-illustration: a simple SVG of 3 book spines (two leaning + one upright) in muted tones respecting current theme.
  - Title: `Seu acervo está esperando`
  - Subline: `Adicione o primeiro livro por ISBN ou título e a Dona Flora começa a conhecer você.`
  - Primary CTA: `Adicionar primeiro livro` (opens AddBookDialog).
- **Not in scope:** onboarding multi-step wizard (user rejected it).

### D-07 — ExternalBookMention visual redesign

- **Pattern:** compact card with dashed border + badge.
- **Specs:**
  - Height: ~60% of `LibraryBookCardInline` (roughly `h-14` vs `h-20`).
  - Width: same as LibraryBookCardInline so they line up in the message flow.
  - Border: `border border-dashed border-border/60` (currency-muted).
  - Badge: top-right corner, small pill `Fora do acervo` in amber tone (per D-02 pill system).
  - Content: title + author in one line; reason on a second muted line.
  - No cover image — external refs don't have trusted covers.
- **Accessibility:** badge text read by screen readers before title ("Livro fora do acervo: {title}").
- **Does not block AI D-04** — even with discernment gate active, the user may still opt into externals, so this component must look good when it appears.

---

## Proposed wave structure

Four waves, ordered by dependency. The planner should respect this ordering
unless a reason to resequence emerges from research.

### Wave 1 — Design foundation (no user-visible change yet)

- Extend `src/app/globals.css` with dual-theme tokens (light + dark) via `@theme`
- Typography system stack + tabular-nums utility
- Shadow tokens (`--shadow-mac-sm/md/lg`)
- Backdrop-blur utility (`.bg-surface-blur` or token-driven)
- Rounded scale refinement (kill `rounded-2xl+` at the token level)
- `<ThemeProvider>` component + inline head script to prevent FOUC
- `<ThemeToggle>` component (used in Wave 2)

**Goal:** every existing page still works; tokens are upgraded under the hood.

### Wave 2 — Chrome (navigation + translucency retrofit)

- `<AppShell>` component in `src/app/layout.tsx`
- TopNav with logo + Biblioteca/Chat segmented toggle + ThemeToggle
- Retrofit `/` to live inside AppShell
- Retrofit `/books/[slug]` to live inside AppShell (remove duplicate header)
- Retrofit `/chat` and `/chat/[id]` so the sidebar lives BELOW the top nav
- Apply backdrop-blur to sidebars, popovers, sticky headers, sheet overlays

**Goal:** navigation feels coherent; translucency present everywhere it should be.

### Wave 3 — UI polish (browse + chat visual)

- Filter restructure: `<FilterChip>` component + per-group popovers replacing flat FilterBar groups
- Search input separation from chips
- Book grid/row refinements (radius, shadows, padding) per D-02
- Empty state `/books` per D-06 (illustration + CTA)
- Chat visual refresh:
  - MessageBubble: softer radius, tighter spacing, D-02 alignment
  - Composer: pill send button, rounded-lg container, backdrop-blur when floating
  - `LibraryBookCardInline` refinements (shadow/radius token updates)
- `<ExternalBookMention>` redesign per D-07 (dashed border + amber badge)

**Goal:** every surface reflects the macOS-like visual language.

### Wave 4 — AI behavior tuning

- Update `src/lib/ai/system-prompt.ts` with D-04 "discernment + pin preference" instruction
- Detect "external mentions in last N turns" logic in the chat client
- Render conditional `<ExternalPreferenceToggle>` above Composer when trigger fires
- Inject pinned preference as metadata on next user turn
- Tests: golden-path conversations asserting toggle appears only when expected
- Regression: verify existing UAT-5 behaviors still pass

**Goal:** the librarian feels thoughtful, not eager.

---

## Deferred ideas

(Captured so the scope can't balloon but nothing is lost.)

- **Mobile-native feel touches** (pull-to-refresh, haptic-style animations) — Phase 5.1 or later
- **Command palette (Cmd+K)** unifying navigation + filtering — interesting but product-level, not polish
- **Avatar / user menu in TopNav** — no auth system exists; premature
- **Multi-step onboarding** — rejected in D-06
- **Light-mode-only release path** — rejected in D-01 (dual ships together)
- **Search-in-chat improvements beyond v1** — v1 search (title + body) shipped in Phase 4

---

## Known unknowns for the planner

Research phase should resolve:

1. **No-FOUC theme script pattern for Next 16 App Router** — where to inject the inline theme script so it runs before hydration. `<head>` via `app/layout.tsx` is the obvious candidate but validate against Next 16 RSC behavior.
2. **Tailwind v4 `@theme` vs CSS custom properties split** — which tokens live in `@theme` (available as Tailwind utilities) vs pure CSS vars (consumed manually). Both are valid; the choice affects ergonomics downstream.
3. **Conditional toggle trigger accuracy** — how many turns of "external mentions not rejected" before the toggle appears? 2 seems reasonable but tune during implementation based on feel.
4. **Illustration asset for empty state** — hand-authored SVG vs lucide-react icon composition vs external asset. Planner should decide based on bundle cost vs fidelity.
5. **Backdrop-blur browser support** — Safari 9+ and Chrome 76+ cover the target audience; confirm no fallback is needed.
