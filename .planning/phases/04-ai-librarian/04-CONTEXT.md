# Phase 4: AI Librarian - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar o bibliotecário pessoal IA — chat conversacional pt-BR com streaming, que conhece toda a biblioteca do usuário (livros, status, notas, avaliações) via contexto completo, recomenda próximas leituras, monta trilhas de leitura para objetivos declarados, e discute livros específicos. Cobre AI-01 a AI-08.

**Fora do escopo:** integração com Goodreads/outras plataformas, multi-usuário, chat com outros usuários, voz/áudio, análise quantitativa de hábitos de leitura (isso pode virar fase futura).

</domain>

<decisions>
## Implementation Decisions

### Superfície e ciclo do chat
- **D-01:** Chat vive em página dedicada `/chat` (rota própria, tela inteira). Mobile: mesma página responsiva. Desacoplado do browse — usuário entra e sai explicitamente.
- **D-02:** Estado inicial mostra **welcome message do bibliotecário** (ex: "Oi! Sou sua bibliotecária. Você tem 47 livros aqui. Como posso ajudar?"). Personalidade viva desde o primeiro contato.
- **D-03:** Entrada principal = **ícone no header** (💬 ou `Sparkles` da lucide-react) ao lado do botão "Adicionar livro". Discreto, sempre visível, consistente com o padrão visual atual.
- **D-04:** **Atalho contextual** em `/books/[slug]`: botão "Conversar sobre este livro" que navega para `/chat` com primeira mensagem pré-preenchida referenciando aquele livro (cobre AI-05 com entrada direta).

### Escopo de ações do agente
- **D-05:** Agente é **read-only** — apenas lê contexto da biblioteca e conversa. Nenhuma tool de escrita (mudar status, setar nota, etc). Qualquer ação o usuário faz manualmente na UI.
- **D-06:** **Recomendações renderizadas como cards inline** na mensagem. Mensagem do bibliotecário pode intercalar texto + cards (capa + título + autor) para livros referenciados. Click no card navega para `/books/[slug]`.
- **D-07:** Contexto completo injetado via system prompt (não RAG, decisão já existente no projeto). Biblioteca inteira cabe em 200K tokens do Claude Sonnet.

### Persistência de conversa e trilha
- **D-08:** Conversas persistem como **arquivos `.md` editáveis em Obsidian** em `data/chats/{YYYY-MM-DD-HHMM}-{slug}.md`. Cada arquivo tem YAML frontmatter (title, started_at, updated_at, book_refs[]) + transcript em Markdown. Slug pode ser derivado do título gerado pela IA ou da primeira pergunta. Respeita manifesto "filesystem é o banco".
- **D-09:** **Trilhas de leitura (AI-04) são artefatos `.md` em `data/trails/{slug}.md`** com frontmatter (goal, created_at, book_refs[] ordenados, notes) + corpo com descrição da trilha. Cria-se quando o usuário declara um objetivo; permite revisitar e acompanhar progresso. Não é só mensagem inline.
- **D-10:** **Sidebar/drawer com lista de conversas** na página `/chat`. Lista cronológica reversa, cada item mostra título (gerado pela IA ou primeira mensagem truncada) + timestamp. Click abre a conversa. Padrão familiar (tipo ChatGPT/Claude).

### Guardrails anti-alucinação (AI-08 revisto)
- **D-11:** **Interpretação AI-08 atualizada pelo usuário:** o bibliotecário PODE falar sobre qualquer livro, inclusive os fora da biblioteca — **descoberta de novos livros é parte do valor**. O que NÃO pode é inventar livros (títulos/autores que não existem). O foco continua na biblioteca do usuário; livros externos entram como sugestões complementares.
- **D-12:** **Diferenciação visual**: livros da biblioteca renderizam como **cards inline linkados** (capa+título+autor → `/books/{slug}`). Livros externos renderizam como **texto simples** (ou formatação distinta, a definir no UI-SPEC) — o usuário sabe imediatamente "isso eu tenho vs isso é sugestão externa".
- **D-13:** **System prompt** instrui: (a) priorizar sempre livros da biblioteca em recomendações; (b) ao mencionar externo, marcar explicitamente ("Não está na sua biblioteca, mas..."); (c) nunca inventar títulos/autores — usar apenas obras reais conhecidas.
- **D-14:** **Validação pós-resposta**: regex/parse pelos títulos mencionados → resolve contra slugs da biblioteca → renderiza cards para os que batem, texto simples para os que não batem. Se a mensagem mencionar livro externo sem marcação ("Não está na sua biblioteca..."), logar para observabilidade/ajuste do system prompt (não bloquear a mensagem).

### Claude's Discretion
- Formato exato do YAML frontmatter dos arquivos `data/chats/*.md` e `data/trails/*.md` (campos, nomes, tipos).
- Algoritmo de geração do título da conversa (IA summariza primeira troca? Primeira pergunta truncada?).
- Heurística para "trigger" de criação automática de trilha (detectar intent "quero entender X" → propõe trilha, ou sempre esperar comando explícito?).
- Tom/voz do bibliotecário no system prompt (calorosa, neutra, com nome próprio "Dona Flora"?) — researcher/planner podem recomendar baseado em referências UX.
- Tratamento de tokens: two-tier trigger (quando a biblioteca crescer, o que resumir vs o que injetar full?) — decidir no planning após validar baseline.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level
- `.planning/PROJECT.md` — Core value (o bibliotecário pessoal que você nunca teve), decisões-mestras, out-of-scope.
- `.planning/REQUIREMENTS.md` §AI — Bibliotecário Pessoal IA — AI-01 a AI-08 com critérios de aceitação.
- `.planning/ROADMAP.md` §Phase 4 — AI Librarian — goal, success criteria, dependências em Phase 3.
- `CLAUDE.md` §Technology Stack — AI Layer — Vercel AI SDK v6 com ToolLoopAgent, @ai-sdk/anthropic, Claude Sonnet, 200K context, full context injection.

### Phase prior-art
- `.planning/phases/01-foundation-data-layer/01-CONTEXT.md` §D-01..D-04 — schema de frontmatter e filosofia Markdown.
- `.planning/phases/02-catalog-core/02-CONTEXT.md` §D-01, D-04 — padrões de Dialog e `/books/[slug]`.
- `.planning/phases/03-browse-ui/03-CONTEXT.md` §D-01..D-05 — padrões visuais (cards, StatusBadge, header sticky).
- `.planning/phases/02-catalog-core/02-UI-SPEC.md` — Accessibility Contract (44×44 touch targets, pt-BR).
- `.planning/phases/03-browse-ui/03-UI-SPEC.md` — design system consolidado (cores zinc, tipografia, responsive breakpoints).

### External docs downstream agents should verify with Context7
- Vercel AI SDK v6 (`ai` package) — `streamText`, `useChat` hook, message streaming protocol.
- `@ai-sdk/react` — `useChat`, `sendMessage`, rendering custom message parts (para cards inline).
- `@ai-sdk/anthropic` — provider config, Claude Sonnet model IDs, max tokens.
- `gray-matter` + YAML — serialização segura de conversas e trilhas em `.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/books/library-service.ts` — `listBooks()` já retorna `Book[]` tipado com toda a biblioteca. Ponto único de injeção de contexto para o bibliotecário.
- `src/lib/books/schema.ts` — tipo `Book` e `BookStatus` (pt-BR). Agent usa o mesmo shape pra descrever livros.
- `src/components/book-cover.tsx`, `book-card.tsx` — primitivos visuais prontos para renderizar cards inline nas mensagens do chat.
- `src/lib/api/dedupe.ts` — `stripDiacritics()` já disponível para matching fuzzy de títulos mencionados.
- Layout zinc/dark do Phase 3 — base para a UI do chat (header sticky, spacing, tipografia).

### Established Patterns
- **Server Components para leitura de filesystem** — `page.tsx` com `force-dynamic` + `noStore()`, passa dados para Client Components. `/chat` deve seguir: RSC lê biblioteca, passa contexto inicial para chat client.
- **Client Components com `'use client'`** para interatividade (AddBookDialog, BookBrowser). Chat UI também.
- **Slug como identificador canônico** — todos os links usam `/books/[slug]`. Cards inline do chat devem resolver menções para slugs.
- **API routes em `src/app/api/**`** para operações server-side. Chat stream provavelmente em `src/app/api/chat/route.ts` usando `streamText` do AI SDK.
- **Env vars** — `GOOGLE_BOOKS_API_KEY` como precedente. `ANTHROPIC_API_KEY` segue mesmo padrão (server-only, sem `NEXT_PUBLIC_`).

### Integration Points
- Header (`src/app/page.tsx` atual) — adicionar botão de chat ao lado do "Adicionar livro".
- `/books/[slug]` (Phase 2 Plan 06) — adicionar botão "Conversar sobre este livro" na página de detalhes.
- Novo: `src/app/chat/page.tsx` (RSC wrapper), `src/app/chat/chat-ui.tsx` (Client com useChat), `src/app/api/chat/route.ts` (streaming endpoint), `data/chats/` + `data/trails/` (novos diretórios para artefatos).
- Next.js remotePatterns já cobrem `books.google.com` e `covers.openlibrary.org` — cards inline reutilizam.

</code_context>

<specifics>
## Specific Ideas

- Nome do produto ("Dona Flora") sugere que a bibliotecária PODE ter voz/personalidade própria — decisão de tom fica a cargo do researcher/planner com base em referências de UX para assistentes com persona.
- Welcome message dinâmico: "Você tem X livros aqui" deve ler `listBooks().length` na hora (Server Component) e passar como prop.
- Recomendações com cards inline precisam de message parts customizados no AI SDK v6 — a mensagem do assistant pode conter text + data parts ou tool invocations mesmo em modo read-only (usar `tool` só pra renderização estruturada, sem side-effects).
- Descoberta fora da biblioteca: quando o bibliotecário menciona livro externo, UI poderia sugerir "Adicionar à biblioteca?" (CTA sutil) — mas isso é Claude's Discretion.

</specifics>

<deferred>
## Deferred Ideas

- **Voz/áudio** — conversar falando com a bibliotecária. Fase futura (pós-v1.0), depende do valor entregue pelo texto.
- **Análise quantitativa de hábitos** — "quantos livros por mês", "gêneros favoritos", estatísticas visuais. Separar em fase "Insights" futura.
- **Integração com Goodreads/importação em massa** — já está em Out of Scope do PROJECT.md, mantém.
- **Compartilhamento de trilhas** — exportar/compartilhar trilha como link público. Depende de auth, fora do escopo de produto pessoal.
- **Two-tier context strategy** — concreta implementação depende de volume real da biblioteca. Reavaliar quando `listBooks().length * avgTokens > 150K`. Por ora, full dump basta.
- **Histórico de progresso em trilhas** — UI pra tachar livros conforme lê a trilha. Primeiro entregar a trilha como artefato; UI de progresso vem depois.

</deferred>

---

*Phase: 04-ai-librarian*
*Context gathered: 2026-04-17*
