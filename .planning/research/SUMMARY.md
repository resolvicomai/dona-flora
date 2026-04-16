# Project Research Summary

**Project:** Dona Flora -- Biblioteca Pessoal com IA
**Domain:** Personal book library with AI conversational librarian
**Researched:** 2026-04-15
**Confidence:** HIGH

## Executive Summary

Dona Flora is a personal book cataloging system where Markdown files on disk are the single source of truth, paired with an AI librarian that leverages the full catalog for conversational book recommendations. The expert approach for this kind of system is straightforward: a self-hosted Next.js application using Server Components to read Markdown files directly from the filesystem, gray-matter for frontmatter parsing, and the Vercel AI SDK with Claude for the conversational layer. There is no database -- the `library/` directory of `.md` files IS the database, editable in Obsidian, VS Code, or any text editor.

The recommended approach is to build the catalog first and the AI librarian second, because the AI's quality is directly proportional to the richness of catalog data. The stack is well-established: Next.js 16 + TypeScript, Tailwind CSS 4, shadcn/ui, Vercel AI SDK v6 with the Anthropic provider (Claude Sonnet), and gray-matter + Zod for the Markdown data layer. The full library metadata (up to ~1,000 books) fits comfortably in Claude's 200K context window, making RAG unnecessary and full context injection the correct strategy.

The single biggest risk is the deployment model. Vercel's serverless functions use a read-only filesystem, which is fundamentally incompatible with writing Markdown files at runtime. This project MUST self-host via `next start` or Docker with `output: 'standalone'` on a VPS. This decision must be made and validated in Phase 1 before any features are built. Secondary risks include AI hallucination of non-existent book titles (mitigated by validating AI output against the library index) and Google Books API gaps for Brazilian Portuguese editions (mitigated by a fallback chain to Open Library plus manual entry).

## Key Findings

### Recommended Stack

The stack is a standard Next.js 16 application with one unusual characteristic: no database. All persistence is through Markdown files with YAML frontmatter, parsed by gray-matter and validated by Zod. The AI layer uses Vercel AI SDK v6 (specifically `streamText` and `useChat`) with the Anthropic provider for Claude. This is a well-integrated, low-dependency stack.

**Core technologies:**
- **Next.js 16.2 (App Router)**: Full-stack framework -- Server Components read `.md` files directly; API routes handle chat streaming and book search APIs
- **Vercel AI SDK v6 + @ai-sdk/anthropic**: AI framework -- `streamText` for the chat endpoint, `useChat` for the client, Claude Sonnet for the librarian model
- **gray-matter + Zod**: Data layer -- gray-matter parses/stringifies YAML frontmatter; Zod validates the schema at parse time with graceful defaults
- **Tailwind CSS 4 + shadcn/ui**: UI layer -- utility-first CSS with pre-built accessible components (Dialog, Command, Card, ScrollArea)
- **Google Books API + Open Library API**: Book metadata sources -- Google Books primary (better for Brazilian books), Open Library as fallback

**What NOT to use:** No database (Prisma, Drizzle, SQLite), no MDX, no tRPC, no Auth.js, no Langchain, no RAG/vector database, no Contentlayer/Velite. See STACK.md for full rationale on each exclusion.

### Expected Features

The catalog is table stakes; the AI librarian is the differentiator. The catalog must be pleasant to use FIRST because it generates the data the AI needs.

**Must have (table stakes):**
- Add book by title search or ISBN (auto-populated metadata from APIs)
- Cover image display from API sources
- Reading status workflow: quero-ler, lendo, lido, quero-reler, abandonado
- Star rating (1-5, half-star granularity) and personal notes per book
- Browse/list with grid and list views, filter by status/author/genre, search within library
- Responsive web UI (mobile-first -- the bookstore/bookshelf use case is primary)
- Markdown files as source of truth with clean YAML frontmatter

**Should have (differentiators -- the AI librarian):**
- Conversational chat interface with full library context awareness
- Contextual next-book recommendation based on personal history, not generic popularity
- Reading trail/path builder ("I want to understand stoicism" -> sequenced book list)
- Mood-based suggestions ("something light after that heavy read")
- Book discussion partner with awareness of user's notes and ratings

**Defer (v2+):**
- Reading statistics and visualizations (data exists in frontmatter; UI is not essential for v1)
- Location/shelf tracking (text field in frontmatter, no dedicated UI needed yet)
- Tags/custom categorization (notes field and existing genres suffice initially)
- Conversation memory persistence (start with per-session; add persistence when quality plateaus)
- Multiple editions deduplication (handle when it causes real pain)

### Architecture Approach

The architecture is a standard Next.js application with a LibraryService abstraction that encapsulates all filesystem operations. Server Components read Markdown files directly for the catalog. Server Actions handle mutations (add book, update status, save notes). API routes handle external concerns: Google Books/Open Library search and AI chat streaming. An in-memory index cached on startup provides fast catalog queries without re-parsing all files on every request.

**Major components:**
1. **LibraryService** -- single abstraction for all file I/O: read/write/index Markdown files, cache management, slug generation
2. **UI Layer** -- React client components for catalog grid, book detail, chat interface, filters
3. **API Route: /api/chat** -- AI chat streaming via AI SDK with full library context injection as system prompt
4. **API Route: /api/books/search** -- Google Books + Open Library search proxy
5. **Server Actions** -- mutations (addBook, updateStatus, updateRating, saveNotes) that write `.md` files and invalidate caches
6. **In-Memory Index** -- cached parsed frontmatter for fast catalog queries, rebuilt on startup, invalidated on writes

**Key architectural decisions:**
- Full context injection for AI (NOT RAG) -- entire library fits in Claude's 200K context window
- No database -- in-memory index from `.md` files is sufficient for <1,000 books
- Self-hosted deployment (NOT Vercel serverless) -- read-only filesystem is a hard blocker
- Atomic file writes (temp file + rename) to prevent corruption from concurrent edits

### Critical Pitfalls

1. **Vercel read-only filesystem** -- The app CANNOT deploy to Vercel serverless. Must self-host with `next start` or Docker on a VPS (Fly.io, Hetzner, DigitalOcean). Decide and validate in Phase 1 before building anything else.
2. **AI hallucination of book titles** -- LLMs fabricate plausible-sounding books (~15% of librarian-reported patron queries in 2025 came from AI-hallucinated titles). Mitigate with system prompt constraints, output validation against library index, and separate "library mode" vs "discovery mode."
3. **AI context explosion at scale** -- 500+ books with full notes could approach 250K tokens. Design a two-tier context strategy from day one: compressed index (title + author + status + rating, ~50 tokens/book) always included, full details only for relevant books.
4. **Google Books API gaps for Brazilian editions** -- Incomplete metadata and missing covers for Portuguese-language books. Build fallback chain (Google Books -> Open Library -> manual entry) from the start, with graceful UI for missing data.
5. **Markdown schema evolution** -- No migration mechanism for frontmatter. Define the full schema with optional fields in Phase 1. Include a `schema_version` field. Write a migration script pattern for future schema changes.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Data Layer
**Rationale:** Everything depends on the file I/O layer and deployment model. The Vercel incompatibility must be resolved first. The Markdown schema design affects every subsequent phase.
**Delivers:** Working Next.js project, self-hosted deployment pipeline, LibraryService with read/write/index capabilities, TypeScript types and Zod schemas for book frontmatter, `library/` directory with sample books, in-memory index.
**Addresses:** Markdown as source of truth, deployment infrastructure
**Avoids:** Vercel read-only filesystem (Pitfall 1), schema evolution pain (Pitfall 7), frontmatter parsing security (Pitfall 9)

### Phase 2: Catalog Core (Add and Browse Books)
**Rationale:** The catalog is table stakes and the AI librarian needs populated data to be useful. The book addition flow (API integration + file writing) is the most complex catalog feature and should come early.
**Delivers:** Add book by title/ISBN search, auto-populated metadata, cover images, catalog browse/list view, book detail page, reading status workflow, star rating, personal notes.
**Uses:** Google Books API, Open Library API, gray-matter stringify, Server Actions
**Implements:** Book addition data flow, API fallback chain, UI components (book card, grid, detail page)
**Avoids:** Google Books data gaps (Pitfall 5), Open Library inconsistencies (Pitfall 6), book deduplication issues (Pitfall 11)

### Phase 3: Catalog Polish (Filters, Search, Mobile)
**Rationale:** Filtering, sorting, and search make the catalog usable day-to-day. Mobile responsiveness is critical because the primary use case is checking your library while standing in a bookstore or next to a bookshelf.
**Delivers:** Filter by status/genre/author/rating, sort by title/date/rating, search within library, mobile-first responsive design, performance optimization (caching).
**Avoids:** Performance degradation at scale (Pitfall 8), mobile usability problems (Pitfall 10)

### Phase 4: AI Librarian
**Rationale:** The differentiator, but it requires a populated catalog to be meaningful. By Phase 4, there should be enough books with ratings and notes to make the AI context rich.
**Delivers:** Chat interface with `useChat`, full library context injection as system prompt, next-book recommendations, reading trail builder, mood-based suggestions, book discussion.
**Uses:** Vercel AI SDK v6 streamText, @ai-sdk/anthropic, LibraryService context builder
**Avoids:** AI hallucination (Pitfall 4), context explosion (Pitfall 3)

### Phase 5: Refinement and Edge Cases
**Rationale:** Polish based on real usage. By this point, the core product is working and real-world edge cases emerge.
**Delivers:** Concurrent edit handling (atomic writes, file watching), Obsidian compatibility testing, reading statistics (if desired), conversation memory persistence, migration script tooling.

### Phase Ordering Rationale

- **Phase 1 before everything:** The deployment model (self-host, not Vercel) is a hard constraint that must be validated before building features. The Markdown schema affects every phase.
- **Phase 2 before AI:** The AI librarian's quality scales with catalog richness. A chat interface with zero books is useless. Building the catalog first also validates the Markdown read/write pipeline end-to-end.
- **Phase 3 before AI:** Filters and mobile UX make the catalog pleasant to use, which encourages adding more books (more data for AI). Mobile-first design is harder to retrofit than to build from the start.
- **Phase 4 as the payoff:** By this point, the data layer is solid, the catalog is populated, and the AI has rich context to work with. This is where the product becomes special.
- **Phase 5 as cleanup:** Real usage reveals what actually matters. Don't over-engineer concurrency handling or statistics before they are needed.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Hosting provider selection (Fly.io vs Hetzner vs DigitalOcean vs local Docker) -- needs cost/complexity comparison for a personal project
- **Phase 4:** AI system prompt engineering and output validation -- the hallucination prevention strategy and two-tier context design need careful implementation research

Phases with standard patterns (skip research-phase):
- **Phase 2:** Book API integration and CRUD are well-documented patterns; gray-matter usage is straightforward
- **Phase 3:** Filtering/sorting/search over in-memory data and responsive Tailwind design are standard patterns
- **Phase 5:** File watching and atomic writes are well-documented Node.js patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via official docs and Context7. Versions confirmed current. |
| Features | HIGH | Comprehensive competitive analysis across 8+ reference apps. Feature dependencies well-mapped. |
| Architecture | HIGH | Markdown-as-database pattern verified with gray-matter docs. AI context math validated against Claude token limits. Vercel filesystem limitation confirmed. |
| Pitfalls | HIGH | Critical pitfalls (Vercel filesystem, AI hallucination) backed by official docs and documented CVEs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Hosting provider selection:** Research identified self-hosting as mandatory but did not compare specific providers. Fly.io is likely simplest (Docker + persistent volume), but cost and setup need validation during Phase 1 planning.
- **Brazilian book metadata coverage:** Google Books coverage for Brazilian Portuguese editions is inferred as weak but not quantitatively measured. Phase 2 should track the percentage of books with missing metadata and adjust the fallback strategy.
- **AI token budget at scale:** The math says 500 books at ~500 tokens fits in 250K context, but real-world notes could be much longer. Phase 4 should implement token counting and the two-tier strategy from the start rather than waiting for problems.
- **gray-matter CVE (CVE-2025-65108):** The RCE vulnerability is low risk for a personal app but should be mitigated during Phase 1 setup by disabling JS evaluation in gray-matter config.
- **`process.cwd()` in standalone mode:** Next.js `output: 'standalone'` may change the working directory. The `LIBRARY_DIR` path resolution needs testing in the actual deployment environment during Phase 1.

## Sources

### Primary (HIGH confidence)
- Context7: gray-matter docs -- frontmatter parsing, stringify, configuration
- Context7: Vercel AI SDK v6 docs -- useChat, streamText, system prompts, ToolLoopAgent
- Vercel EROFS Discussion (github.com/vercel/community/discussions/314) -- read-only filesystem confirmed
- Claude Context Windows docs -- 200K standard, 1M extended
- Google Books API v1 documentation -- search, volumes, rate limits
- Next.js 16.2 release blog -- App Router, Server Components, standalone output
- Zod v4 documentation -- schema validation
- Tailwind CSS v4 / shadcn/ui v4 documentation -- UI layer

### Secondary (MEDIUM confidence)
- Google Books API coverage for Brazilian editions -- inferred from general API behavior
- Open Library API inconsistencies -- documented in GitHub issues (#10851)
- StoryGraph/Goodreads feature analysis -- multiple review articles cross-referenced

### Tertiary (LOW confidence)
- gray-matter CVE-2025-65108 severity assessment -- CVE is real but applicability to personal app needs validation
- Performance projections at 1,000+ books -- theoretical, based on filesystem I/O benchmarks, not measured

---
*Research completed: 2026-04-15*
*Ready for roadmap: yes*
