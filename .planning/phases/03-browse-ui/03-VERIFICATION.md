---
phase: 03-browse-ui
verified: 2026-04-17T14:30:00-03:00
status: human_needed
score: 9/9 must-haves verified (code complete)
overrides_applied: 0
human_verification:
  - test: "Grade/Lista + persistência localStorage"
    expected: "Vista padrão é grade; alternando para lista e recarregando a página, a lista persiste; `dona-flora:view-mode` aparece no DevTools → Application → Local Storage; a URL NÃO contém o valor"
    why_human: "Comportamento de localStorage pós-hidratação e persistência entre reloads não é verificável estaticamente"
  - test: "Filtro de status com URL state"
    expected: "Clicar 'Lido' filtra a grade e atualiza URL para `?status=lido`; clicar 'Quero reler' expande para `?status=lido,quero-reler`; chip ativo recebe `bg-zinc-100 text-zinc-900`"
    why_human: "Interação de chip, renderização de estado ativo e atualização da URL requerem browser real com nuqs wired"
  - test: "Filtro de nota — match EXATO (BROWSE-03)"
    expected: "`?rating=5,4` mostra apenas livros com nota 4 ou 5; livros sem nota são excluídos; livros com nota 3 não aparecem"
    why_human: "Semântica de match exato vs. 'maior-ou-igual' só é verificável visualmente com dados reais"
  - test: "Filtro de gênero — insensível a diacríticos (BROWSE-04)"
    expected: "Chip mostra rótulo com acentos (ex: 'Ficção'); URL usa a chave normalizada (`?genre=ficcao`); clicar corresponde corretamente independente do capitalização no frontmatter"
    why_human: "Round-trip de normalização NFD entre chip label/URL key requer dados reais de livros com géneros acentuados"
  - test: "Busca fuzzy com Fuse.js — combinada com filtros (BROWSE-05)"
    expected: "Digitando 'tolk' → `?q=tolk` após ~150ms, livros de Tolkien aparecem; typo 'tolkein' ainda encontra Tolkien; 'aneis' encontra 'Anéis'; combinando com filtro de status → AND entre busca e filtro"
    why_human: "Comportamento fuzzy, debounce de 150ms e combinação AND com filtros de status requerem interação real no browser"
  - test: "Ordenação pt-BR + toggle de direção"
    expected: "Ordenação padrão é 'Adicionado recentemente' DESC; mudar para 'Título' reordena por collation pt-BR ('Árvore' próximo de 'A'); botão ArrowUpDown inverte; URL reflete `?sort=title&dir=desc`"
    why_human: "Collation pt-BR e resposta visual do toggle de direção requerem browser real"
  - test: "Estado EmptyResults — 'Limpar filtros' (D-16)"
    expected: "Busca nonsense como 'zzzzxx' → componente EmptyResults com ícone SearchX, heading 'Nenhum livro bate com os filtros atuais', botão 'Limpar filtros'; clicar → chips desmarcam, busca limpa, sort volta para 'Adicionado/desc', URL vira `/`, lista completa retorna; preferência grid/list NÃO é resetada"
    why_human: "Fluxo completo de clearAll + preservação do localStorage só é verificável interativamente"
  - test: "Estado 'biblioteca vazia' (0 livros)"
    expected: "Com `data/books/` vazio: ícone BookOpen + 'Sua biblioteca está vazia' + botão 'Adicionar primeiro livro' (ESTADO DIFERENTE do EmptyResults com filtros ativos)"
    why_human: "Requer esvaziar manualmente o diretório de livros e confirmar que o estado correto é renderizado"
  - test: "Responsividade (BROWSE-01) — UI-SPEC §Layout"
    expected: "Mobile ~375px: grade 1 coluna, FilterBar em 2 linhas com chip-row com overflow-x scroll; md 768px+: 3 colunas, FilterBar em linha única; lg 1024px+: 4 colunas"
    why_human: "Breakpoints responsivos e comportamento de overflow-x scroll no chip-row requerem inspeção visual em múltiplos viewports"
  - test: "URL compartilhável"
    expected: "Aplicar filtros + busca, copiar URL, colar em nova aba → mesma vista filtrada restaura"
    why_human: "Serialização/desserialização de estado via nuqs entre abas requer browser real"
  - test: "Link para detalhe do livro (BROWSE-06)"
    expected: "Clicar em qualquer BookCard ou BookRow navega para `/books/[slug]`; botão voltar retorna à vista filtrada"
    why_human: "Navegação e preservação de estado de filtro no back requerem browser real"
  - test: "Infinite scroll no AddBookDialog (D-23)"
    expected: "Na busca de livros, ao chegar no fim da lista de resultados, mais resultados são carregados automaticamente; resultados duplicados não aparecem; quando não há mais resultados, o carregamento para"
    why_human: "IntersectionObserver só funciona com DOM real; Google Books API retorna 503 intermitentemente"
---

# Phase 03: Browse & UI — Relatório de Verificação

**Objetivo da Fase:** O usuário consegue navegar, buscar e filtrar seu catálogo confortavelmente em qualquer dispositivo
**Verificado:** 2026-04-17T14:30:00-03:00
**Status:** human_needed
**Re-verificação:** Não — verificação inicial

## Resumo

Todos os 9 must-haves de código foram verificados. O código está completo, o build passa (`npm run build` limpo) e os testes passam (98/98). A fase está aguardando UAT humano — os checkpoints de Plans 03-05 e 03-06 foram diferidos para o final da fase por decisão do usuário, e o Google Books API retorna 503 intermitentemente. Nenhuma lacuna de código foi encontrada.

---

## Truths Observáveis

| # | Truth | Status | Evidência |
|---|-------|--------|-----------|
| 1 | Usuário vê todos os livros em grade/lista responsiva (BROWSE-01) | VERIFIED | `book-browser.tsx` renderiza grade (`grid grid-cols-1 md:grid-cols-3 md:gap-6 lg:grid-cols-4`) e lista (`flex flex-col gap-3`); toggle via `useLocalStorage` |
| 2 | Usuário pode filtrar por status, nota e gênero com resultados imediatos (BROWSE-02/03/04) | VERIFIED | `applyFilters` em `query.ts:73-80` — AND entre tipos, OR dentro; nuqs sincroniza URL instantaneamente |
| 3 | Busca fuzzy por título/autor funciona (BROWSE-05) | VERIFIED | `createFuse` com `ignoreDiacritics:true`, `threshold:0.4`, pesos title=3/author=2/_notes=1; `browseSearchParams` com `throttleMs:150` |
| 4 | Página de detalhes do livro acessível via clique (BROWSE-06) | VERIFIED | `BookCard` e `BookRow` têm `href={/books/${slug}}`; rota `/books/[slug]` existe (confirmado no build output) |
| 5 | Home page é RSC com `force-dynamic` + `noStore()` e lê do disco (CATALOG-08 preservado) | VERIFIED | `page.tsx:8-11` — `export const dynamic = 'force-dynamic'` + `noStore()` + `listBooks()` |
| 6 | BookBrowser é o único Client Component proprietário do estado URL (nuqs) e view (localStorage) | VERIFIED | `book-browser.tsx:1` — `'use client'`; `useQueryStates(browseSearchParams, { history:'replace', shallow:true, scroll:false })` |
| 7 | Estado vazio biblioteca (0 livros) e estado zero-resultados com filtros ativos são distintos | VERIFIED | `book-browser.tsx:89-101` — `initialBooks.length === 0` → biblioteca-vazia com BookOpen + AccentText; `visible.length === 0 && hasActiveFilters` → `<EmptyResults onClear={clearAll} />` |
| 8 | Página envolve BookBrowser em `<Suspense>` (RESEARCH Pitfall 5) | VERIFIED | `page.tsx:20-22` — `<Suspense fallback={null}><BookBrowser initialBooks={books} /></Suspense>` |
| 9 | AddBookDialog tem infinite scroll com IntersectionObserver e reset de paginação por query (D-23) | VERIFIED | `add-book-dialog.tsx:61-224` — estado `nextStart/nextPage/hasMore/loadingMore`, `resetDialog()` limpa paginação, `IntersectionObserver` com sentinel div |

**Pontuação:** 9/9 truths verificados (código)

---

## Artefatos Obrigatórios

| Artefato | Esperado | Status | Detalhes |
|----------|----------|--------|----------|
| `src/components/book-browser.tsx` | BookBrowser com nuqs + pipeline useMemo + renderização grade/lista | VERIFIED | 137 linhas, `'use client'`, exporta `BookBrowser`, 3 useMemos encadeados |
| `src/app/page.tsx` | RSC shell com Suspense(BookBrowser) | VERIFIED | 25 linhas, sem `'use client'`, `force-dynamic`, z-20 no header |
| `src/lib/books/query.ts` | FilterState + createFuse + applyFilters + applySearch + applySort + extractGenres + foldGenre | VERIFIED | Todos exportados; `fuse.js` importado; pt-BR collation em applySort |
| `src/lib/books/search-params.ts` | browseSearchParams como fonte única de URL parsers | VERIFIED | 6 parsers (status/rating/genre/q/sort/dir); `throttleMs:150` em q |
| `src/lib/use-local-storage.ts` | Hook hidratação-seguro para localStorage | VERIFIED | `useState(fallback)` no render, `useEffect` para ler localStorage |
| `src/app/layout.tsx` | NuqsAdapter envolvendo {children} | VERIFIED | `import { NuqsAdapter } from 'nuqs/adapters/next/app'`; linha 32 envolve children |
| `src/lib/api/dedupe.ts` | stripDiacritics + dedupeKey + dedupeBooks | VERIFIED | 32 linhas; todos exportados |
| `src/components/filter-bar.tsx` | FilterBar sticky `top-[57px] z-10` compondo 3 FilterChipGroups + SearchInput + SortSelect + ViewToggle | VERIFIED | linha 126: `sticky top-[57px] z-10`; 6 referências a FilterChipGroup |
| `src/components/book-card.tsx` | BookCard com link para /books/[slug] | VERIFIED | `href={/books/${slug}}`; line-clamp-2 no título; StatusBadge |
| `src/components/book-row.tsx` | BookRow com layout horizontal e link para /books/[slug] | VERIFIED | `href={/books/${slug}}`; line-clamp-1 mobile / line-clamp-2 desktop |
| `src/components/empty-results.tsx` | EmptyResults com SearchX + 'Limpar filtros' | VERIFIED | SearchX icon; "Nenhum livro bate com os filtros atuais"; Button onClear |
| `src/components/book-cover.tsx` | Placeholder gradiente + inicial do título | VERIFIED | `bg-gradient-to-br from-zinc-800 to-zinc-900` presente |
| `src/lib/api/google-books.ts` | searchGoogleBooks com startIndex param | VERIFIED | linha 21: `startIndex = 0`; linha 29: `startIndex: String(startIndex)` |
| `src/lib/api/open-library.ts` | searchOpenLibrary com page param | VERIFIED | linha 47: `page = 1`; linha 12: `page: String(page)` em URLSearchParams |
| `src/app/api/books/search/route.ts` | SearchSchema com startIndex + page opcionais | VERIFIED | linhas 11-12: `startIndex: z.coerce.number()...default(0)`, `page: z.coerce.number()...min(1)...default(1)` |

---

## Verificação de Links-Chave

| De | Para | Via | Status | Detalhes |
|----|------|-----|--------|---------|
| `book-browser.tsx` | `search-params.ts` | `useQueryStates(browseSearchParams)` | WIRED | linha 32; history/shallow/scroll options presentes |
| `book-browser.tsx` | `query.ts` | `applyFilters/applySearch/applySort/createFuse/extractGenres` | WIRED | linhas 9-15; 3 useMemos encadeados corretos |
| `page.tsx` | `book-browser.tsx` | `<BookBrowser initialBooks={books} />` dentro de `<Suspense>` | WIRED | linhas 20-22 |
| `layout.tsx` | `nuqs` | `NuqsAdapter` | WIRED | linha 3 e linha 32 |
| `open-library.ts` | `dedupe.ts` | `import { stripDiacritics, dedupeKey } from './dedupe'` | WIRED | linha 2 |
| `add-book-dialog.tsx` | `dedupe.ts` | `import { dedupeBooks }` | WIRED | linha 27; usado em `fetchMore` linha 153 |
| `add-book-dialog.tsx` | `/api/books/search` | `fetch('/api/books/search', { body: { query, startIndex, page } })` | WIRED | linhas 116-119 (initial), 142-146 (fetchMore) |
| `filter-chip-group.tsx` | `ui/toggle-group.tsx` | `import { ToggleGroup, ToggleGroupItem }` | WIRED | confirmado por build passing |

---

## Cobertura de Requisitos

| Requisito | Planos Fonte | Descrição | Status | Evidência |
|-----------|-------------|-----------|--------|-----------|
| BROWSE-01 | 03-01, 03-03, 03-04, 03-05 | Grade/lista responsiva em web + mobile | CODE VERIFIED / UAT PENDING | `book-browser.tsx` grade md:3-col lg:4-col + lista; toggle via localStorage |
| BROWSE-02 | 03-02, 03-04, 03-05 | Filtro por status | CODE VERIFIED / UAT PENDING | `applyFilters` + FilterChipGroup status + nuqs URL sync |
| BROWSE-03 | 03-02, 03-04, 03-05 | Filtro por nota | CODE VERIFIED / UAT PENDING | `applyFilters` com match EXATO (não >=); rating chip group |
| BROWSE-04 | 03-02, 03-04, 03-05 | Filtro por gênero/tag | CODE VERIFIED / UAT PENDING | `foldGenre` NFD + `extractGenres` + genre FilterChipGroup |
| BROWSE-05 | 03-02, 03-04, 03-05 | Busca por título/autor | CODE VERIFIED / UAT PENDING | Fuse.js index com `ignoreDiacritics`, `threshold:0.4`, weights 3/2/1; throttleMs:150 |
| BROWSE-06 | 03-03, 03-05 | Página de detalhes | CODE VERIFIED / UAT PENDING | `BookCard`/`BookRow` apontam para `/books/[slug]`; rota existe |

---

## Spot-Checks Comportamentais

| Comportamento | Comando | Resultado | Status |
|---------------|---------|-----------|--------|
| Build limpo | `npm run build` | 3 static + 3 dynamic routes, sem erros | PASS |
| Suite de testes completa | `npm test` | 98/98 passando, 9 suites | PASS |
| Commit da Plan 05 Task 1 existe | `git log --oneline` | `53e5ff7 feat(03-05): add BookBrowser...` | PASS |
| Commit da Plan 05 Task 2 existe | `git log --oneline` | `f41a105 refactor(03-05): slim page.tsx...` | PASS |
| google-books.test.ts está completo | `wc -l` + `tail` | 160 linhas, teste de backward compat com body completo | PASS |
| search-route.test.ts está completo | `wc -l` + `tail` | 182 linhas, último teste tem body completo | PASS |

Nota: IN-03 e IN-04 do code review (testes truncados) estavam CORRIGIDOS quando verificados — os arquivos têm corpos completos de teste. Todos os 98 testes passam.

---

## Anti-Padrões Encontrados

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `src/lib/api/google-books.ts` | 43 | `(item: any)` e `(id: any)` no parser Google Books | Aviso (CR-02 do code review) | Risco de crash latente se shape da API divergir; não bloqueia objetivo da fase |
| `src/lib/books/library-service.ts` | 89-157 | Path traversal em getBook/updateBook/deleteBook (slug não sanitizado) | Aviso (CR-01 do code review) | Risco de segurança para fases futuras; não afeta o objetivo de navegação desta fase |
| `src/components/add-book-dialog.tsx` | 330 | `"Nao encontrei meu livro"` — falta cedilha | Info (IN-01 do code review) | Typo visível no dialog de busca; NÃO bloqueia BROWSE-01..06 |
| `src/components/filter-bar.tsx` | 102-103 | Comentário JSDoc stale (`z-10` quando já é `z-20`) | Info (IN-02 do code review) | Documentação desatualizada apenas; sem impacto funcional |
| `src/components/book-browser.tsx` | 124, 130 | `key={book._filename ?? book.title}` — fallback para title pode colidir | Aviso (WR-01 do code review) | `_filename` é sempre populado por `listBooks()` na prática; fallback é código morto mas cria risco se schema mudar |
| `src/components/add-book-dialog.tsx` | 212-224 | `fetchMore` captura closure stale no IntersectionObserver | Aviso (WR-02 do code review) | Risco de enviar `startIndex` errado se o observer disparar entre updates de estado; mitigado pelos guards `hasMore/loadingMore` |

**Classificação:** Nenhum bloqueador de objetivo. Todos os anti-padrões são avisos ou info — documentados no `03-REVIEW.md` para tratamento em fase posterior ou hotfix dedicado.

---

## Verificação Humana Necessária

### 1. Grade/Lista — toggle e persistência localStorage (BROWSE-01, D-02, D-21)

**Teste:** Abrir `http://localhost:3000/`, clicar no ícone de lista na barra sticky, recarregar a página.
**Esperado:** Vista lista persiste; DevTools → Application → Local Storage mostra `dona-flora:view-mode = "list"`; URL não muda.
**Por que humano:** Comportamento de localStorage pós-hidratação não é verificável estaticamente.

### 2. Filtro de Status (BROWSE-02, D-06, D-07)

**Teste:** Clicar chips de status (ex: "Lido" depois "Quero reler"); observar URL e resultados.
**Esperado:** URL mostra `?status=lido,quero-reler`; chip ativo tem fundo claro (`bg-zinc-100`); deselecionar um chip o remove da URL.
**Por que humano:** Interação de chip e renderização de estado ativo requerem browser real com nuqs.

### 3. Filtro de Nota — match EXATO (BROWSE-03, A2)

**Teste:** Clicar "5 estrelas" depois "4 estrelas".
**Esperado:** URL `?rating=5,4`; apenas livros com nota 4 OU 5 aparecem; livros com nota 3 e livros sem nota são excluídos.
**Por que humano:** Semântica EXATO vs. >= só é verificável com dados reais.

### 4. Filtro de Gênero — insensível a diacríticos (BROWSE-04, D-10)

**Teste:** Ter livros com gênero "Ficção" e clicar o chip correspondente.
**Esperado:** Chip label mostra "Ficção" (com acento); URL usa `?genre=ficcao` (normalizado); filtro corresponde corretamente.
**Por que humano:** Round-trip NFD entre label/URL key requer dados reais.

### 5. Busca Fuzzy + combinação com filtros (BROWSE-05, D-12, D-14, D-15)

**Teste:** Digitar "tolk" na caixa de busca; tentar typo "tolkein"; tentar "aneis"; combinar com filtro de status.
**Esperado:** `?q=tolk` aparece após ~150ms; Tolkien encontrado com typo; "Anéis" encontrado sem acento; com filtro de status ativo, AND é respeitado.
**Por que humano:** Fuzzy search, debounce de 150ms e combinação AND requerem interação real.

### 6. Ordenação pt-BR + toggle de direção (D-17, D-18, D-19)

**Teste:** Mudar sort para "Título"; clicar botão ArrowUpDown; verificar URL.
**Esperado:** Livros reordenam por collation pt-BR; botão inverte ordem; URL reflete `?sort=title&dir=desc`.
**Por que humano:** Collation pt-BR e resposta visual requerem browser real.

### 7. EmptyResults + clearAll (D-16)

**Teste:** Digitar "zzzzxx" na busca.
**Esperado:** Componente EmptyResults com ícone SearchX, "Nenhum livro bate com os filtros atuais", botão "Limpar filtros"; clicar → tudo reseta exceto preferência grid/list.
**Por que humano:** Fluxo clearAll completo com preservação de localStorage só é verificável interativamente.

### 8. Estado Biblioteca Vazia

**Teste:** Esvaziar `data/books/` temporariamente e recarregar.
**Esperado:** BookOpen icon + "Sua biblioteca está vazia" + "Adicionar primeiro livro" — estado DIFERENTE do EmptyResults.
**Por que humano:** Requer manipulação manual do diretório de dados.

### 9. Responsividade (BROWSE-01, UI-SPEC §Layout)

**Teste:** Resize para mobile ~375px, depois 768px, depois 1024px.
**Esperado:** 1 coluna mobile, FilterBar em 2 linhas com chip-row scrollável; 3 colunas em md; 4 colunas em lg.
**Por que humano:** Breakpoints e overflow-x scroll no chip-row requerem inspeção visual.

### 10. URL Compartilhável

**Teste:** Aplicar filtros + busca, copiar URL, colar em nova aba.
**Esperado:** A mesma vista filtrada restaura na nova aba.
**Por que humano:** Serialização nuqs entre abas requer browser real.

### 11. Link para Detalhe do Livro (BROWSE-06)

**Teste:** Clicar em qualquer BookCard ou BookRow.
**Esperado:** Navega para `/books/[slug]`; botão voltar retorna com filtros preservados.
**Por que humano:** Navegação e preservação de estado via nuqs requerem browser real.

### 12. Infinite Scroll no AddBookDialog (D-23)

**Teste:** Abrir o dialog, buscar "tolkien" ou outro autor prolífico, scrollar até o fim da lista de resultados.
**Esperado:** Mais resultados carregam automaticamente; sem duplicatas; quando esgotado, carregamento para.
**Por que humano:** IntersectionObserver só funciona com DOM real; Google Books API retorna 503 intermitentemente — testar também o fallback Open Library.

---

## Resumo de Lacunas

Sem lacunas de código. Todos os 9 must-haves de código foram verificados na base de código real:

- Infraestrutura (Plan 01): nuqs, fuse.js, NuqsAdapter, dedupe.ts — todos presentes e conectados.
- Camada de dados (Plan 02): query.ts, search-params.ts, useLocalStorage, backfill added_at — todos verificados.
- Primitivos visuais (Plan 03): BookCard, BookRow, EmptyResults, BookCover placeholder — todos verificados.
- Controles de filtro (Plan 04): FilterBar, FilterChipGroup, SearchInput, SortSelect, ViewToggle — todos verificados.
- Composição da superfície (Plan 05): BookBrowser + page.tsx slim — verificados.
- Infinite scroll (Plan 06): providers paginados, SearchSchema estendido, IntersectionObserver — verificados.
- Build limpo e 98/98 testes passando.

**O status `human_needed` reflete os 12 itens de UAT acima (checkpoints bloqueadores das Plans 03-05 e 03-06 diferidos para o final da fase por decisão do usuário).** Nenhum item de UAT deve falhar por razão de código — todos os comportamentos esperados estão implementados. O objetivo do UAT é confirmar que a experiência funcionou em um browser real antes de marcar os requisitos BROWSE-01..06 como completos.

---

_Verificado: 2026-04-17T14:30:00-03:00_
_Verificador: Claude (gsd-verifier)_
