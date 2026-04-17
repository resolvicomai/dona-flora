---
status: partial
phase: 03-browse-ui
source: [03-VERIFICATION.md]
started: 2026-04-17T14:27:29.041Z
updated: 2026-04-17T14:27:29.041Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Grade/Lista + persistência localStorage
expected: Vista padrão é grade; alternando para lista e recarregando a página, a lista persiste; `dona-flora:view-mode` aparece no DevTools → Application → Local Storage; a URL NÃO contém o valor
result: [pending]

### 2. Filtro de status com URL state
expected: Clicar 'Lido' filtra a grade e atualiza URL para `?status=lido`; clicar 'Quero reler' expande para `?status=lido,quero-reler`; chip ativo recebe `bg-zinc-100 text-zinc-900`
result: [pending]

### 3. Filtro de nota — match EXATO (BROWSE-03)
expected: `?rating=5,4` mostra apenas livros com nota 4 ou 5; livros sem nota são excluídos; livros com nota 3 não aparecem
result: [pending]

### 4. Filtro de gênero — insensível a diacríticos (BROWSE-04)
expected: Chip mostra rótulo com acentos (ex: 'Ficção'); URL usa a chave normalizada (`?genre=ficcao`); clicar corresponde corretamente independente do capitalização no frontmatter
result: [pending]

### 5. Busca fuzzy com Fuse.js — combinada com filtros (BROWSE-05)
expected: Digitando 'tolk' → `?q=tolk` após ~150ms, livros de Tolkien aparecem; typo 'tolkein' ainda encontra Tolkien; 'aneis' encontra 'Anéis'; combinando com filtro de status → AND entre busca e filtro
result: [pending]

### 6. Ordenação pt-BR + toggle de direção
expected: Ordenação padrão é 'Adicionado recentemente' DESC; mudar para 'Título' reordena por collation pt-BR ('Árvore' próximo de 'A'); botão ArrowUpDown inverte; URL reflete `?sort=title&dir=desc`
result: [pending]

### 7. Estado EmptyResults — 'Limpar filtros' (D-16)
expected: Busca nonsense como 'zzzzxx' → componente EmptyResults com ícone SearchX, heading 'Nenhum livro bate com os filtros atuais', botão 'Limpar filtros'; clicar → chips desmarcam, busca limpa, sort volta para 'Adicionado/desc', URL vira `/`, lista completa retorna; preferência grid/list NÃO é resetada
result: [pending]

### 8. Estado 'biblioteca vazia' (0 livros)
expected: Com `data/books/` vazio: ícone BookOpen + 'Sua biblioteca está vazia' + botão 'Adicionar primeiro livro' (ESTADO DIFERENTE do EmptyResults com filtros ativos)
result: [pending]

### 9. Responsividade (BROWSE-01) — UI-SPEC §Layout
expected: Mobile ~375px: grade 1 coluna, FilterBar em 2 linhas com chip-row com overflow-x scroll; md 768px+: 3 colunas, FilterBar em linha única; lg 1024px+: 4 colunas
result: [pending]

### 10. URL compartilhável
expected: Aplicar filtros + busca, copiar URL, colar em nova aba → mesma vista filtrada restaura
result: [pending]

### 11. Link para detalhe do livro (BROWSE-06)
expected: Clicar em qualquer BookCard ou BookRow navega para `/books/[slug]`; botão voltar retorna à vista filtrada
result: [pending]

### 12. Infinite scroll no AddBookDialog (D-23)
expected: Na busca de livros, ao chegar no fim da lista de resultados, mais resultados são carregados automaticamente; resultados duplicados não aparecem; quando não há mais resultados, o carregamento para
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0
blocked: 0

## Gaps
