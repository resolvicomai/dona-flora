# Roadmap: Dona Flora

## Overview

Dona Flora is built in four phases that follow a strict dependency chain: infrastructure first (self-hosted Docker deployment with Markdown data layer), then catalog CRUD (the data-generating engine), then browse/filter UI (making the catalog pleasant to use daily), and finally the AI librarian (the differentiator that needs a populated catalog to shine). Each phase delivers a complete, verifiable capability. The project self-hosts on Docker/VPS because Vercel serverless has a read-only filesystem incompatible with writing Markdown files at runtime.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Layer** - Docker deployment, Markdown schema, LibraryService, Next.js skeleton (completed 2026-04-16)
- [ ] **Phase 2: Catalog Core** - Add/edit/delete books, status workflow, ratings, notes, manual edit sync
- [ ] **Phase 3: Browse & UI** - Responsive catalog view, filters, search, book detail page
- [ ] **Phase 4: AI Librarian** - Chat interface, full library context, recommendations, reading trails

## Phase Details

### Phase 1: Foundation & Data Layer
**Goal**: The application runs in Docker with a working Markdown data layer that can read and write book files
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. Running `docker-compose up` starts the application and it is accessible in a browser
  2. The application reads Markdown files from a configurable directory mounted as a Docker volume
  3. A sample book Markdown file with YAML frontmatter is parsed and its data is accessible via LibraryService
  4. The Next.js skeleton renders a page that confirms the data layer is connected (e.g., displays count of books found)
**Plans:** 2/2 plans complete
Plans:
- [x] 01-01-PLAN.md -- Next.js scaffold, Zod book schema, LibraryService, unit tests
- [x] 01-02-PLAN.md -- Docker infrastructure (Dockerfile, docker-compose.yml) and smoke test

### Phase 2: Catalog Core
**Goal**: User can build and manage their personal book catalog entirely through the web interface
**Depends on**: Phase 1
**Requirements**: CATALOG-01, CATALOG-02, CATALOG-03, CATALOG-04, CATALOG-05, CATALOG-06, CATALOG-07, CATALOG-08
**Success Criteria** (what must be TRUE):
  1. User can search for a book by title or ISBN, select a result, and it appears in the catalog with auto-populated metadata (title, author, cover, synopsis)
  2. User can change a book's status (quero-ler, lendo, lido, quero-reler, abandonado), rate it 1-5 stars, and write personal notes -- all persisted to the Markdown file
  3. User can edit metadata and delete a book from the catalog
  4. A Markdown file edited manually outside the app (e.g., in Obsidian) shows updated data when the interface is refreshed
**Plans**: TBD
**UI hint**: yes

### Phase 3: Browse & UI
**Goal**: User can comfortably browse, search, and filter their catalog on any device
**Depends on**: Phase 2
**Requirements**: BROWSE-01, BROWSE-02, BROWSE-03, BROWSE-04, BROWSE-05, BROWSE-06
**Success Criteria** (what must be TRUE):
  1. User sees all cataloged books in a responsive grid/list that works on both desktop and mobile
  2. User can filter the catalog by status, rating, and genre -- filters combine and results update immediately
  3. User can search books by title or author name and get matching results
  4. User can open a book detail page showing all metadata, status, rating, and personal notes
**Plans**: TBD
**UI hint**: yes

### Phase 4: AI Librarian
**Goal**: User can have a contextual conversation with an AI librarian that knows their entire library
**Depends on**: Phase 3
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08
**Success Criteria** (what must be TRUE):
  1. User can open a chat interface and converse with the AI librarian in Brazilian Portuguese with streaming responses
  2. The librarian demonstrates awareness of the user's library -- references specific books, their status, ratings, and notes in conversation
  3. The librarian recommends a next book to read based on the user's history and preferences, and never recommends books the user does not own
  4. The librarian can build a reading trail (sequenced book list) when the user states a learning goal
  5. The librarian can discuss a specific book with the user, referencing the user's own notes and rating
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Layer | 2/2 | Complete   | 2026-04-16 |
| 2. Catalog Core | 0/TBD | Not started | - |
| 3. Browse & UI | 0/TBD | Not started | - |
| 4. AI Librarian | 0/TBD | Not started | - |
