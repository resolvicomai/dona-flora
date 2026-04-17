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

(None yet — ship to validate)

### Active

**Catálogo:**
- [ ] Usuário pode adicionar livro por título ou ISBN (busca dados automaticamente via API)
- [ ] Cada livro gera/atualiza um arquivo Markdown com seus metadados (título, autor, sinopse, capa, ISBN)
- [ ] Usuário pode definir status do livro: quero ler / lendo / lido / quero reler / abandonado
- [ ] Usuário pode atribuir nota (1–5 estrelas) a livros lidos
- [ ] Usuário pode adicionar notas pessoais a cada livro
- [ ] Usuário pode visualizar e filtrar catálogo por status, nota, gênero, autor

**Bibliotecário IA:**
- [ ] Interface de chat com bibliotecário pessoal alimentado por IA
- [ ] IA tem acesso a toda a biblioteca (livros, status, notas, avaliações)
- [ ] IA recomenda próximo livro através de diálogo contextualizado
- [ ] IA pode montar trilha de leitura baseada em objetivo declarado pelo usuário
- [ ] IA considera histórico completo: lidos, notas, quero reler

**Infraestrutura:**
- [ ] Arquivos Markdown são a fonte de verdade (editáveis manualmente)
- [ ] Interface web responsiva (funciona no mobile também)

### Out of Scope

- Multi-usuário / compartilhamento — é pessoal, sem contas de terceiros
- E-books / livros digitais — foco em acervo físico
- Integração com Goodreads / outras plataformas — começa do zero
- App mobile nativo — responsivo basta por enquanto

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown como fonte de verdade | Editável manualmente no Obsidian/VS Code, portável, sem lock-in | Pending |
| Google Books + Open Library | Melhor cobertura combinada, nenhum custo | Pending |
| Web responsivo em vez de app nativo | Menor complexidade, funciona em qualquer device | Pending |

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
*Last updated: 2026-04-17 — Phase 03 (Browse & UI) complete*
