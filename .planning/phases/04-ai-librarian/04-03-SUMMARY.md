---
phase: 04-ai-librarian
plan: 03
type: execute
wave: 3
status: complete
depends_on: ["04-02"]

requirements-completed: [AI-02, AI-03, AI-04, AI-06, AI-07, AI-08]

files_modified:
  - package.json
  - .env.example
  - src/app/api/chat/route.ts
  - src/app/api/chat/__tests__/route.test.ts
  - src/app/api/trails/route.ts
  - src/app/api/trails/__tests__/route.test.ts
  - src/lib/ai/system-prompt.ts
  - src/lib/ai/tools.ts
  - src/lib/ai/__tests__/system-prompt.test.ts

key-files:
  created:
    - src/lib/ai/system-prompt.ts
    - src/lib/ai/tools.ts
    - src/lib/ai/__tests__/system-prompt.test.ts
    - src/app/api/chat/route.ts
    - src/app/api/chat/__tests__/route.test.ts
    - src/app/api/trails/route.ts
    - src/app/api/trails/__tests__/route.test.ts
  modified:
    - package.json
    - .env.example

completion: executor hit usage limit after all feature code and tests were committed; SUMMARY.md written post-hoc by orchestrator. All 4 feature commits + tests verified on disk.
---

## O que foi construído

Servidor do AI Librarian ligado ao stack Vercel AI SDK v6 + Anthropic:

- **`src/lib/ai/system-prompt.ts`** — monta o prompt do bibliotecário com o `<LIBRARY>` block estável (de `loadLibraryContext`), aplicado com prompt-cache para economia de ~90% (AI-SPEC §4).
- **`src/lib/ai/tools.ts`** — declara as duas ferramentas read-only de UI: `showLibraryBookDetail(slug)` e `resolveExternalBookMention(title, author)`.
- **`src/app/api/chat/route.ts`** — POST streaming via `streamText` + Anthropic provider (Claude Sonnet 4.6). Valida body com Zod. Persiste cada conversa finalizada em `data/chats/{id}.md` via `onFinish` callback (reusa `saveChat` de 04-02).
- **`src/app/api/trails/route.ts`** — POST `/api/trails` cria `data/trails/{slug}.md`. Valida slug contra biblioteca (guard `AI-08` de alucinação), resolve colisões via `resolveSlugCollision`.
- **`.env.example`** — documenta `ANTHROPIC_API_KEY` e `ANTHROPIC_MODEL` (default: `claude-sonnet-4-5`).

## Commits (em ordem)

- `6107c85` — test(04-03): add failing tests for system-prompt + librarianTools
- `dec62d2` — feat(04-03): install AI SDK v6 + system prompt + librarian tools
- `e45e5a2` — test(04-03): add failing tests for chat + trails API routes
- `e3cb677` — feat(04-03): POST /api/chat streaming + POST /api/trails create

TDD discipline: cada task teve RED → GREEN commits consecutivos.

## Requirements

- AI-02: biblioteca acessível ao agente via `loadLibraryContext` no system prompt
- AI-03: recomendações habilitadas pelo streaming (front-end consome em Plan 06)
- AI-04: persistência de trail via `POST /api/trails`
- AI-06: Portuguese-first system prompt
- AI-07: streaming end-to-end via `streamText` + `onFinish`
- AI-08: guardrail de slugs conhecidos valida path-traversal e alucinação

## Dependências novas

- `ai ^6.0.x` (Vercel AI SDK)
- `@ai-sdk/react ^6.0.x` (useChat hook — usado por Plan 06)
- `@ai-sdk/anthropic ^3.x` (Anthropic provider)

## Desvios do plano

Nenhum desvio funcional. SUMMARY.md foi escrito pelo orquestrador após o executor bater o limite de uso — todo o código de feature e testes já estava committed e verificado (207/207 testes passando no gate pós-merge da Wave 3).

## Handoff para Plan 06

Plan 06 consumirá `POST /api/chat` via `useChat` do `@ai-sdk/react`. O system prompt já fica no servidor e não precisa ser reenviado. Tools são renderizadas no cliente via `UIMessage.parts` — a forma das tool-invocations está declarada em `src/lib/ai/tools.ts`.
