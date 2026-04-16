# Domain Pitfalls

**Domain:** Personal book library with Markdown data layer and AI librarian
**Researched:** 2026-04-15

## Critical Pitfalls

Mistakes that cause rewrites or fundamental architecture problems.

### Pitfall 1: Vercel's Read-Only Filesystem Kills Markdown-as-Database

**What goes wrong:** The entire premise of Dona Flora is reading AND writing Markdown files at runtime. Vercel serverless functions run on a read-only filesystem (EROFS error). Deploying to Vercel without addressing this means the app can read existing books but never add, edit, or update any Markdown file.

**Why it happens:** Developers build locally where `fs.writeFile` works perfectly, then discover the deployment target prohibits writes. This is the single biggest architectural risk for Dona Flora.

**Consequences:** Complete inability to add books, update reading status, or save notes in production. The core functionality is broken.

**Prevention:**
- **Option A (Recommended for personal use):** Self-host with `output: 'standalone'` on a VPS (Hetzner, DigitalOcean, Fly.io) where you control the filesystem. A simple Docker container with a mounted volume gives full read/write access to Markdown files.
- **Option B:** Use Vercel + Git-backed storage (commit Markdown changes to a repo via GitHub API), but this adds massive complexity and latency for a personal app.
- **Option C:** Abandon Markdown-on-disk for production and use Vercel Blob or a database, but this defeats the project's core design philosophy of human-editable files.

**Detection:** Test deployment early (Phase 1). Do not wait until you have features built.

**Phase impact:** Must be decided in Phase 1 (Infrastructure). Every subsequent phase depends on this.

**Confidence:** HIGH -- Vercel's read-only filesystem is well-documented and confirmed across multiple sources.

---

### Pitfall 2: Concurrent Edits Between System and Human

**What goes wrong:** User edits a book's Markdown file in Obsidian/VS Code while the web app simultaneously writes to the same file (e.g., updating reading status). One write silently overwrites the other. There is no merge strategy -- last write wins, and data is lost.

**Why it happens:** Markdown files have no built-in locking mechanism. Unlike databases with transactions, plain files offer no concurrency control. The project explicitly supports both manual editing AND system editing of the same files.

**Consequences:** Lost reading notes, reverted status changes, corrupted frontmatter. Worst case: a partial write leaves invalid YAML that breaks the parser.

**Prevention:**
- Use atomic writes: write to a temp file, then rename (rename is atomic on most filesystems).
- Implement a simple file-level lock (`.lock` file or `proper-lockfile` npm package) for system writes.
- Use `chokidar` with `awaitWriteFinish` to detect external changes and reload state.
- Design frontmatter schema to be idempotent where possible (timestamps help detect conflicts).
- Accept that for a single-user personal app, true simultaneous edits are rare. A "last write wins with reload" strategy may be sufficient.

**Detection:** Symptom is data appearing to "revert" after manual edits. Test by editing a file in VS Code while the web app is running.

**Phase impact:** Phase 1 (file I/O layer design). The write strategy must be established before any feature writes files.

**Confidence:** HIGH -- well-understood filesystem concurrency issue.

---

### Pitfall 3: AI Context Explosion as Library Grows

**What goes wrong:** With 50 books, you can stuff the entire library into a prompt. With 500+ books (each having title, author, synopsis, personal notes, rating, status), the token count exceeds practical limits. The AI librarian either gets truncated context, becomes slow, or becomes expensive.

**Why it happens:** Naive implementation sends all book data in every chat message. A book entry with synopsis, notes, and metadata is roughly 300-500 tokens. At 500 books, that is 150K-250K tokens per request -- approaching or exceeding most model context windows, and making every conversation extremely expensive.

**Consequences:** Slow responses (time-to-first-token grows linearly with context), high API costs, degraded recommendation quality as the model "loses" information in long contexts (the "lost in the middle" problem), or hard failures when context is exceeded.

**Prevention:**
- **Phase 1:** Design the Markdown schema so a "summary record" (title, author, status, rating, genres -- ~50 tokens) can be extracted separately from full details.
- **Phase 2:** Implement a two-tier context strategy:
  1. Always include a compressed index of all books (title + author + status + rating, one line per book).
  2. Only include full details (notes, synopsis) for books directly relevant to the conversation.
- **Phase 3:** If the library exceeds ~200 books, implement simple keyword/filter-based retrieval (not full vector RAG -- overkill for structured data). A SQL-like query over frontmatter fields is more effective than embedding search for "show me unread sci-fi books rated above 3."
- Avoid premature RAG implementation. For structured metadata (not free-text), filtering is more reliable than semantic search.

**Detection:** Monitor token counts per request. Set up a warning when library index exceeds 10K tokens.

**Phase impact:** Phase 1 (schema design), Phase 3 (AI integration). The schema must support summarization from day one.

**Confidence:** HIGH -- token economics are well-documented; the "lost in the middle" problem is confirmed by multiple research papers.

---

### Pitfall 4: AI Librarian Hallucinating Books and Metadata

**What goes wrong:** The AI recommends books that do not exist, attributes wrong authors to real books, or claims the user has read something they have not. Librarians report that ~15% of patron inquiries now stem from AI-hallucinated book titles (Library of Virginia, 2025). The Chicago Sun-Times published an AI reading list where two-thirds of recommended books were fabrications.

**Why it happens:** LLMs predict plausible text, not factual text. Book titles and author combinations are especially prone to confabulation because they are short strings with high entropy. The model may also confuse data from the user's library with its training data.

**Consequences:** User loses trust in the librarian. Worse: user tries to find a recommended book that does not exist, or marks a hallucinated book as "want to read."

**Prevention:**
- **Hard constraint:** The AI librarian should ONLY recommend books that exist in its provided context OR that the user explicitly asks about. System prompt must say: "Only recommend books the user owns or that you can verify exist. If suggesting new books, clearly state you have not verified availability."
- **Structured output:** When recommending from the user's library, return book IDs/titles that can be validated against the actual Markdown files before displaying.
- **Separate "discovery" from "library" modes:** Discovery mode (suggest new books to buy) should be clearly labeled as potentially imprecise. Library mode (what should I read next from my shelf) should only reference verified owned books.
- Use the Google Books API to validate any externally recommended book title before presenting it.

**Detection:** Add a validation step that checks AI-mentioned titles against the library index. Log and flag any title the AI mentions that is not in the library.

**Phase impact:** Phase 3 (AI system prompt design and output validation).

**Confidence:** HIGH -- hallucination in book recommendations is extensively documented.

## Moderate Pitfalls

### Pitfall 5: Google Books API Data Gaps and Rate Limits

**What goes wrong:** Google Books API returns incomplete data: missing cover images, missing ISBNs (sometimes only ISBN-10, not ISBN-13), missing or wrong genre classifications, incomplete author names. Brazilian Portuguese editions are particularly underrepresented -- many local publishers do not register with Google Books.

**Why it happens:** Google Books coverage is uneven. Without an API key, the limit is ~100 requests/day and responses may omit fields. Even with a key (10,000 requests/day free tier), many books simply lack complete metadata.

**Consequences:** Books added with missing covers (ugly UI), wrong metadata that the user must manually correct, or complete failure to find a book that exists physically on the shelf.

**Prevention:**
- Always use an API key (never unauthenticated requests).
- Implement a fallback chain: Google Books -> Open Library -> manual entry form.
- Design the UI to gracefully handle missing data: placeholder covers, "edit metadata" prompts, optional fields.
- Cache API responses to avoid re-fetching and hitting rate limits.
- For Brazilian books: consider adding the CBL (Camara Brasileira do Livro) ISBN database or allowing manual ISBN entry with user-provided metadata.
- Store the API response alongside the Markdown file so you do not re-fetch unnecessarily.

**Detection:** Log API responses and track the percentage of books with missing fields. If >30% of additions lack cover images, the fallback chain needs work.

**Phase impact:** Phase 1-2 (book addition flow). Build the fallback chain from the start.

**Confidence:** MEDIUM -- Google Books rate limits are documented; Brazilian coverage gaps are inferred from general API behavior and the project's locale.

---

### Pitfall 6: Open Library API Inconsistencies

**What goes wrong:** Open Library returns different data depending on which API endpoint you use (Search API vs Works API vs Books API). Author fields may be present in one endpoint and missing in another for the same ISBN. The JSON Search API is deprecated. Response times are inconsistent.

**Why it happens:** Open Library is a community-maintained project with multiple legacy API versions. Data quality varies because it relies on community contributions.

**Consequences:** Fallback to Open Library produces inconsistent or incomplete data. Author names may be formatted differently than Google Books (breaking deduplication).

**Prevention:**
- Use the Books API (not the deprecated JSON Search API) for ISBN lookups.
- Normalize author names and metadata from both sources into a canonical format before writing to Markdown.
- Implement retry logic with exponential backoff for Open Library (it can be slow).
- Do not assume Open Library will always have data that Google Books lacks -- overlap is partial.

**Detection:** Compare metadata completeness between Google Books and Open Library responses for the same ISBN in test cases.

**Phase impact:** Phase 2 (API integration layer).

**Confidence:** MEDIUM -- documented GitHub issues confirm API inconsistencies.

---

### Pitfall 7: Markdown Schema Evolution Without Migration

**What goes wrong:** You start with a simple frontmatter schema in Phase 1. By Phase 3, the AI needs new fields (e.g., `themes`, `reading_periods`, `ai_tags`). Existing Markdown files lack these fields. The app either crashes on missing fields or silently ignores them, producing inconsistent behavior.

**Why it happens:** Markdown frontmatter has no schema enforcement. Unlike database migrations, there is no built-in way to "ALTER TABLE" across hundreds of files.

**Consequences:** Gradual inconsistency across book files. AI receives incomplete data for older books. Filters break on books missing certain fields.

**Prevention:**
- Define the full frontmatter schema in Phase 1, even if fields are optional. Include all fields you anticipate needing (status, rating, genres, themes, notes, dates, ai_tags) as optional from day one.
- Write a simple migration script pattern: a Node.js script that reads all `.md` files, adds missing fields with defaults, and writes them back. Run this whenever the schema changes.
- Use TypeScript types/Zod schemas to validate frontmatter at parse time. Treat missing optional fields gracefully with defaults, never crash.
- Keep a `schema_version` field in frontmatter to track which version each file conforms to.

**Detection:** TypeScript compilation errors or Zod validation failures when parsing old files.

**Phase impact:** Phase 1 (schema design must be forward-looking).

**Confidence:** HIGH -- universal problem with schema-less storage.

---

### Pitfall 8: Frontmatter Parsing Performance at Scale

**What goes wrong:** Every page load or API call that needs the book index must read and parse ALL Markdown files from disk. With 500+ files, this becomes noticeably slow (disk I/O + YAML parsing per file). gray-matter is fast for individual files but the aggregate cost of `readdir` + `readFile` + `parse` for hundreds of files adds up.

**Why it happens:** No index or cache layer between the filesystem and the application. Each request re-reads everything.

**Consequences:** Slow page loads (especially the catalog view), slow AI context assembly, poor perceived performance on mobile.

**Prevention:**
- Build an in-memory index on server startup. Parse all files once, cache the frontmatter in a Map/Object.
- Use `chokidar` file watcher to invalidate/update the cache when files change (covers both manual and system edits).
- For the catalog page, return the cached index directly -- never re-parse all files per request.
- Consider a lightweight SQLite index (via `better-sqlite3`) as a read cache, rebuilt from Markdown files on change. Markdown stays the source of truth; SQLite is the query layer.

**Detection:** Measure time to render the catalog page with 100, 300, 500 files. If >500ms, add caching.

**Phase impact:** Phase 2 (catalog features). Can start simple and add caching when needed, but the architecture should allow for it.

**Confidence:** HIGH -- filesystem I/O scaling is well-understood.

## Minor Pitfalls

### Pitfall 9: YAML Frontmatter Security (gray-matter + Untrusted Content)

**What goes wrong:** CVE-2025-65108 demonstrated that gray-matter can be exploited for remote code execution via JavaScript injection in YAML frontmatter (CVSS 10.0). If the app processes Markdown files that could contain malicious content (e.g., from a shared source), this is a real risk.

**Why it happens:** gray-matter evaluates JavaScript embedded in frontmatter by default in some configurations.

**Consequences:** For a personal single-user app, risk is low since you control all input. But if you ever share Markdown files or import from an untrusted source, RCE is possible.

**Prevention:**
- Use gray-matter with `engines` option that disables JS evaluation.
- Validate frontmatter against a Zod schema -- reject unexpected fields.
- This is low priority for a personal app but worth knowing about.

**Detection:** Audit gray-matter configuration. Run `npm audit` regularly.

**Phase impact:** Phase 1 (dependency setup).

**Confidence:** HIGH -- CVE is documented and confirmed.

---

### Pitfall 10: Mobile Responsiveness with Data-Dense UI

**What goes wrong:** The catalog view (grid of book covers with metadata, filters, sorting) looks great on desktop but becomes cramped or unusable on mobile. Chat interfaces work well on mobile, but switching between chat and catalog is clunky. Filters and sorting controls take up too much screen space on small screens.

**Why it happens:** Desktop-first development with responsive CSS as an afterthought. Book catalog UIs are inherently data-dense.

**Consequences:** The app is frustrating to use on mobile -- which is likely the primary use case (standing in front of a bookshelf, wanting to check if you own a book or what to read next).

**Prevention:**
- Design mobile-first. The bookshelf/phone scenario is the primary use case.
- Use a bottom sheet or slide-over pattern for filters on mobile instead of a sidebar.
- Book cards on mobile: cover image + title only. Tap to expand details.
- Chat interface: full-screen on mobile, side panel on desktop.
- Test on real devices early (not just browser DevTools resize).

**Detection:** Use the app standing next to a bookshelf with your phone. If you cannot quickly check "do I own X?" or "what should I read next?" within 10 seconds, the mobile UX needs work.

**Phase impact:** Phase 2 (UI development). Mobile-first from the start.

**Confidence:** MEDIUM -- general responsive design wisdom applied to this specific domain.

---

### Pitfall 11: Book Deduplication Across Sources

**What goes wrong:** User adds "Cem Anos de Solidao" by title. Google Books returns the Portuguese edition. Later, user adds the same book by ISBN -- gets the original Spanish edition "Cien anos de soledad." Now the library has two entries for the same work.

**Why it happens:** Books have multiple editions, translations, ISBNs, and title variations. There is no universal "book ID" -- ISBN identifies an edition, not a work.

**Consequences:** Duplicate entries, confusing catalog, AI treats them as different books.

**Prevention:**
- Use a fuzzy matching check before creating a new file: compare title + author with existing entries (Levenshtein distance or simple normalization).
- When adding by ISBN, also check if a book with the same title/author already exists and prompt the user.
- Consider using Open Library's "Works" concept (groups editions of the same work) as a secondary identifier.
- Allow manual merge of duplicate entries.

**Detection:** Periodic scan for books with similar titles/authors. Flag potential duplicates.

**Phase impact:** Phase 2 (book addition flow).

**Confidence:** MEDIUM -- common problem in library management systems.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Infrastructure (Phase 1) | Choosing Vercel then discovering filesystem is read-only | Decide hosting strategy FIRST. Self-host for filesystem access. |
| Infrastructure (Phase 1) | Overly simple frontmatter schema that needs constant revision | Design full schema upfront with optional fields. Include schema_version. |
| Catalog Features (Phase 2) | Google Books returns no data for Brazilian editions | Build fallback chain and manual entry from day one. |
| Catalog Features (Phase 2) | No caching layer, catalog page slows with >100 books | Build in-memory index with file watcher invalidation. |
| AI Integration (Phase 3) | Stuffing entire library into every prompt | Two-tier context: compressed index always, full details on demand. |
| AI Integration (Phase 3) | AI recommends non-existent books | Validate AI output against library index. Separate discovery vs library modes. |
| AI Integration (Phase 3) | AI costs spike with large libraries | Monitor token usage, set budget alerts, use smaller models for filtering. |
| Polish (Phase 4) | Mobile UX is an afterthought | Design mobile-first from Phase 2. Test on real phones. |

## Sources

- [Vercel EROFS Discussion](https://github.com/vercel/community/discussions/314) -- confirmed read-only filesystem in serverless
- [Vercel KB: Files in Functions](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions) -- official guidance on file access
- [Chokidar Race Condition Issue #1112](https://github.com/paulmillr/chokidar/issues/1112) -- documented file watching race condition
- [Google Books API Performance Tips](https://developers.google.com/books/docs/v1/performance) -- rate limits and quotas
- [Open Library API Inconsistency Issue #10851](https://github.com/internetarchive/openlibrary/issues/10851) -- author field inconsistencies
- [CVE-2025-65108: gray-matter RCE](https://purple-ops.io/blog/markdown-pdf-rce-cve2025) -- frontmatter injection vulnerability (CVSS 10.0)
- [AI Hallucinated Book Demands](https://www.webpronews.com/librarians-overwhelmed-by-ai-hallucinated-fake-book-demands/) -- librarians contending with fabricated titles
- [LLM Context Window Limitations 2026](https://atlan.com/know/llm-context-window-limitations/) -- practical context limits
- [RAG vs Long Context](https://www.sitepoint.com/long-context-vs-rag-1m-token-windows/) -- when context stuffing fails
- [Node.js Race Conditions](https://nodejsdesignpatterns.com/blog/node-js-race-conditions/) -- filesystem concurrency patterns
