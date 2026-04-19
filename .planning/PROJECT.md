# Dona Flora — Biblioteca Pessoal com IA

## What This Is

Um sistema de catalogação de livros físicos pessoal onde os dados vivem em arquivos Markdown (legíveis e editáveis por qualquer editor como Obsidian ou VS Code), com uma interface web responsiva para catalogar, organizar e conversar com um bibliotecário pessoal alimentado por IA.

O diferencial não é o catálogo — é o **bibliotecário**: uma IA conversacional que conhece profundamente tudo que você leu, avaliou, quer ler e quer reler, e dialoga com você pra descobrir o que faz sentido ler a seguir.

## Core Value

**O bibliotecário pessoal que você nunca teve** — uma IA que realmente conhece sua biblioteca e conversa com você sobre ela de forma contextualizada, não genérica.

## Context

- **Quem usa:** Uso pessoal (Mauro)
- **Ponto de partida:** Biblioteca física, começando do zero no sistema
- **Plataforma:** Web + mobile (responsivo)
- **Dados:** Arquivos Markdown no disco — editáveis pelo sistema E manualmente
- **Identificação de livros:** Qualquer identificador (ISBN, título) → busca dados em APIs externas (Google Books + Open Library como fallback)

## Requirements

### Validated

**Catálogo (Phases 01-03):**
- [x] Usuário adiciona livro por título ou ISBN (Google Books + Open Library fallback) — *Phase 02*
- [x] Cada livro gera/atualiza `.md` com frontmatter completo (título, autor, sinopse, capa, ISBN, status, rating, notes) — *Phase 01*
- [x] Usuário define status (quero_ler / lendo / lido / quero_reler / abandonado) — *Phase 02*
- [x] Usuário atribui nota 1–5 estrelas — *Phase 02*
- [x] Usuário adiciona notas pessoais (markdown body) — *Phase 02*
- [x] Usuário visualiza e filtra catálogo por status, nota, gênero, autor — *Phase 03*

**Bibliotecário IA (Phase 04):**
- [x] Chat com bibliotecário pessoal alimentado por Claude Sonnet 4.6 via OpenRouter — *Phase 04, AI-01*
- [x] IA acessa toda a biblioteca via `<LIBRARY>` no system prompt com prompt-caching ephemeral — *Phase 04, AI-02*
- [x] IA recomenda próximo livro através de diálogo contextualizado — *Phase 04, AI-03*
- [x] IA monta trilha de leitura (heurística cliente + persistência em `data/trails/`) — *Phase 04, AI-04*
- [x] IA discute livro específico via deep-link `/books/[slug]` → `/chat?about={slug}` — *Phase 04, AI-05*
- [x] Respostas em pt-BR streaming token-by-token — *Phase 04, AI-06/AI-07*
- [x] Guardrail D-14 em dois níveis contra alucinação (`useKnownSlugs` client + kebab-regex server) — *Phase 04, AI-08*

**Infraestrutura:**
- [x] Arquivos Markdown são a fonte de verdade (editáveis em Obsidian/VS Code) — *Phase 01*
- [x] Interface web responsiva (sidebar desktop + Sheet drawer mobile) — *Phases 02-04*

### Active

(None — milestone v1.0 feature-complete)

### Out of Scope

- Multi-usuário / compartilhamento — é pessoal, sem contas de terceiros
- E-books / livros digitais — foco em acervo físico
- Integração com Goodreads / outras plataformas — começa do zero
- App mobile nativo — responsivo basta por enquanto

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown como fonte de verdade | Editável manualmente no Obsidian/VS Code, portável, sem lock-in | **Validated** — 4 phases shipped; files stay human-readable |
| Google Books + Open Library | Melhor cobertura combinada, nenhum custo | **Validated** — Phase 02 fallback pattern works |
| Web responsivo em vez de app nativo | Menor complexidade, funciona em qualquer device | **Validated** — shadcn Sheet drawer cobre mobile |
| Claude Sonnet 4.6 via OpenRouter (não Anthropic direto) | Trocou durante UAT de Phase 04; OpenRouter permite trocar modelo sem recompile | **Validated** — live smoke test de Phase 04 |
| System prompt com `cacheControl: ephemeral` no nível da mensagem | AI SDK v6 `SystemModelMessage.content` é `string`; providerOptions no message-level é a forma tipada | **Validated** — verificado contra node_modules/@ai-sdk/provider-utils + @openrouter/ai-sdk-provider |

## Evolution

Este documento evolui a cada transição de fase e marco de milestone.

**Após cada fase** (via `/gsd-transition`):
1. Requisitos invalidados? → Mover para Out of Scope com motivo
2. Requisitos validados? → Mover para Validated com referência da fase
3. Novos requisitos emergiram? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions

**Após cada milestone** (via `/gsd-complete-milestone`):
1. Revisão completa de todas as seções
2. Core Value ainda é a prioridade certa?
3. Auditar Out of Scope — motivos ainda válidos?

---
*Last updated: 2026-04-19 — Phase 04 (AI Librarian) complete, milestone v1.0 feature-complete*
