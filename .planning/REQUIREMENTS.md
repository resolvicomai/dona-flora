# Dona Flora — Requisitos v1

## v1 Requirements

### INFRA — Infraestrutura

- [x] **INFRA-01**: Sistema roda via Docker (docker-compose up) com volume montado para os arquivos Markdown
- [x] **INFRA-02**: Sistema roda em VPS com Next.js standalone + volume persistente para os arquivos Markdown
- [x] **INFRA-03**: Arquivos Markdown ficam em `/data/books/` (configurável via env var), montado como volume externo

### CATALOG — Catálogo de Livros

- [ ] **CATALOG-01**: Usuário pode adicionar livro digitando título ou ISBN — sistema busca dados automaticamente (Google Books → Open Library como fallback)
- [x] **CATALOG-02**: Cada livro cadastrado gera um arquivo Markdown em `/data/books/` com frontmatter YAML (título, autor, ISBN, sinopse, capa, gênero, ano, status, nota, notas pessoais)
- [x] **CATALOG-03**: Usuário pode definir status do livro: `quero-ler` / `lendo` / `lido` / `quero-reler` / `abandonado`
- [x] **CATALOG-04**: Usuário pode atribuir nota de 1 a 5 estrelas a qualquer livro
- [x] **CATALOG-05**: Usuário pode escrever notas pessoais em texto livre para cada livro
- [x] **CATALOG-06**: Usuário pode editar metadados de um livro já cadastrado (status, nota, notas)
- [x] **CATALOG-07**: Usuário pode remover um livro do catálogo (apaga o arquivo Markdown)
- [x] **CATALOG-08**: Alterações feitas manualmente no arquivo Markdown são refletidas na interface (leitura sempre do disco)

### BROWSE — Navegação e Filtros

- [ ] **BROWSE-01**: Usuário vê todos os livros do catálogo em uma grade/lista responsiva (web + mobile)
- [ ] **BROWSE-02**: Usuário pode filtrar catálogo por status (quero-ler, lendo, lido, quero-reler, abandonado)
- [ ] **BROWSE-03**: Usuário pode filtrar catálogo por nota (ex: 4+ estrelas)
- [ ] **BROWSE-04**: Usuário pode filtrar catálogo por gênero/tag
- [ ] **BROWSE-05**: Usuário pode buscar livros por título ou nome do autor
- [ ] **BROWSE-06**: Usuário vê página de detalhes de cada livro com todos os metadados, status, nota e notas pessoais

### AI — Bibliotecário Pessoal IA

- [ ] **AI-01**: Usuário acessa interface de chat com o bibliotecário pessoal
- [ ] **AI-02**: Bibliotecário tem acesso à biblioteca completa do usuário (todos os livros, status, notas, avaliações) como contexto
- [ ] **AI-03**: Bibliotecário recomenda próximo livro para ler através de diálogo — considera o que já foi lido, notas atribuídas, e o que o usuário quer reler
- [ ] **AI-04**: Bibliotecário monta trilha de leitura (sequência sugerida) quando usuário define um objetivo (ex: "quero entender filosofia estoica")
- [ ] **AI-05**: Bibliotecário discute um livro específico com o usuário — sobre conteúdo, nota que deu, suas notas pessoais
- [ ] **AI-06**: Bibliotecário responde em português brasileiro
- [ ] **AI-07**: Respostas do bibliotecário são em streaming (aparece palavra a palavra)
- [ ] **AI-08**: Bibliotecário valida recomendações contra a biblioteca real — nunca inventa livros que o usuário não tem

---

## v2 (Deferido)

- Importação em lote (CSV, Goodreads export)
- Localização por prateleira física ("prateleira A, fileira 3")
- Estatísticas de leitura (livros lidos por mês, gêneros mais lidos)
- Histórico de conversas com o bibliotecário persistido entre sessões
- Watchlist de livros a comprar (não tenho mas quero)
- Tags personalizadas além de gênero
- File watching com chokidar (detecta edições manuais enquanto o app está rodando)

---

## Fora de Escopo

- Multi-usuário / autenticação — sistema pessoal, sem contas
- App mobile nativo — responsivo basta
- E-books / livros digitais — foco em acervo físico
- Integração com Goodreads, StoryGraph ou outras redes — isolado por design
- Busca por câmera/barcode scanner — entrada manual basta para web
- Gamificação / badges / streaks — não é o foco

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1: Foundation & Data Layer | Complete |
| INFRA-02 | Phase 1: Foundation & Data Layer | Complete |
| INFRA-03 | Phase 1: Foundation & Data Layer | Complete |
| CATALOG-01 | Phase 2: Catalog Core | Pending |
| CATALOG-02 | Phase 2: Catalog Core | Complete |
| CATALOG-03 | Phase 2: Catalog Core | Complete |
| CATALOG-04 | Phase 2: Catalog Core | Complete |
| CATALOG-05 | Phase 2: Catalog Core | Complete |
| CATALOG-06 | Phase 2: Catalog Core | Complete |
| CATALOG-07 | Phase 2: Catalog Core | Complete |
| CATALOG-08 | Phase 2: Catalog Core | Complete |
| BROWSE-01 | Phase 3: Browse & UI | Pending |
| BROWSE-02 | Phase 3: Browse & UI | Pending |
| BROWSE-03 | Phase 3: Browse & UI | Pending |
| BROWSE-04 | Phase 3: Browse & UI | Pending |
| BROWSE-05 | Phase 3: Browse & UI | Pending |
| BROWSE-06 | Phase 3: Browse & UI | Pending |
| AI-01 | Phase 4: AI Librarian | Pending |
| AI-02 | Phase 4: AI Librarian | Pending |
| AI-03 | Phase 4: AI Librarian | Pending |
| AI-04 | Phase 4: AI Librarian | Pending |
| AI-05 | Phase 4: AI Librarian | Pending |
| AI-06 | Phase 4: AI Librarian | Pending |
| AI-07 | Phase 4: AI Librarian | Pending |
| AI-08 | Phase 4: AI Librarian | Pending |
