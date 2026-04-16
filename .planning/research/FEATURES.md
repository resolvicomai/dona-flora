# Feature Landscape

**Domain:** Personal book library with AI librarian
**Researched:** 2026-04-15
**Reference apps:** Goodreads, StoryGraph, LibraryThing, Literal.club, BookWyrm, CLZ Books, Handy Library, Libib

## Table Stakes

Features users expect from any book cataloguing system. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Add book by title search | Core entry point -- users type a title, system finds it | Medium | Query Google Books API, display candidates, user picks one |
| Add book by ISBN | Fast, precise identification for physical books | Low | Single API call to Google Books / Open Library |
| Auto-populated metadata | Nobody wants to type author/publisher/page count manually | Low | Pull title, author(s), cover image, synopsis, page count, publisher, year, genres from API |
| Cover image display | Visual recognition is how people identify books on shelves | Low | Store URL from API response, cache locally |
| Reading status workflow | The fundamental organizing principle of every book app | Low | States: **want-to-read**, **reading**, **read**, **want-to-reread**, **abandoned** (PROJECT.md validated these) |
| Star rating (1-5) | Universal expectation for read books | Low | Half-star granularity (0.5 increments) is a StoryGraph feature users love -- worth including |
| Personal notes per book | Users want to record thoughts, quotes, reactions | Low | Free-text field, stored in the Markdown file |
| Browse/list all books | See your library at a glance | Medium | Grid (covers) and list views; sort by title, author, date added, rating |
| Filter by status | "Show me what I'm reading" is the #1 filter | Low | Filter bar or tabs for each status |
| Filter by author/genre | Basic organization people expect | Low | Faceted filtering on metadata fields |
| Search within library | Find a specific book quickly | Low | Full-text search across title, author, notes |
| Responsive web UI | Must work on phone (checking library while at bookstore) | Medium | Mobile-first design; the bookstore use case is critical |
| Markdown as source of truth | Core architecture promise -- files must be human-readable and editable outside the app | Medium | Well-structured frontmatter (YAML) + body for notes; survives manual editing in Obsidian/VS Code |

## Differentiators

Features that make Dona Flora special. The AI librarian is THE differentiator.

### AI Librarian (Core Differentiator)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Conversational chat interface | Natural dialogue, not a search box -- "talk to your librarian" | Medium | Standard chat UI with message history |
| Full library context awareness | AI knows every book, status, rating, and note in your collection | High | Must inject library data into LLM context; Markdown files are the source |
| Contextual next-book recommendation | "What should I read next?" based on YOUR history, not popularity charts | High | AI reasons over your ratings, notes, mood, and what you've abandoned to give personal recs |
| Reading trail/path builder | "I want to understand stoicism" -> AI builds a 5-book sequence from your owned + suggested books | High | Combines owned books with external knowledge; marks which you own vs need to acquire |
| Mood-based suggestions | "I want something light after that heavy read" -- AI understands reading rhythm | Medium | StoryGraph popularized mood-based recs; AI can do this conversationally and better |
| "Why this book?" explanations | AI explains its reasoning, connecting to your past reads and stated preferences | Low | Natural LLM capability; just prompt engineering |
| Memory across conversations | Librarian remembers past conversations and evolving preferences | High | Persist conversation history or extracted preferences |
| Book discussion partner | "What did you think about the ending of X?" -- AI engages in literary discussion | Medium | LLM strength; enriched by knowing your notes/rating on the book |

### Catalogue Enhancements

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Quick-add flow (minimal friction) | Add a book in under 10 seconds from search to shelved | Medium | Search -> tap result -> auto-set "want-to-read" -> done. One happy path. |
| Reading statistics & visualizations | Charts: books read per month/year, genre distribution, rating distribution, pages read | Medium | StoryGraph's #1 loved feature; data already exists in Markdown files |
| "Owned" flag | Track physical ownership separately from reading status (you can want to read a book you don't own yet) | Low | Simple boolean in frontmatter; important for physical library tracking |
| Location/shelf tracking | "This book is on the bedroom shelf, second row" | Low | Optional text field; useful for large physical collections |
| Date tracking | When added, when started reading, when finished | Low | Timestamps in frontmatter; enables stats |
| Tags/custom categorization | User-defined tags beyond genre (e.g., "vacation reads", "dad recommended") | Low | Array field in frontmatter |
| Multiple editions awareness | Same book, different ISBN -- don't duplicate | Medium | Normalize by work ID (Open Library has this); surface as "you already have this" |

## Anti-Features

Things to explicitly NOT build. Each one is a scope creep trap that pulls away from the core value (the AI librarian).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Social features (friends, followers, feeds) | Single user app. Social is Goodreads' territory and a massive engineering sink. PROJECT.md explicitly scopes this out. | The AI librarian IS the social interaction -- it's who you discuss books with |
| Reading challenges / gamification | Yearly reading goals and badges encourage quantity over quality and add UI complexity | AI librarian can naturally track and discuss reading pace without gamification mechanics |
| E-book / audiobook integration | PROJECT.md scopes this out; physical books only. Format-specific features (progress %, listening time) are irrelevant | Keep the "format" field in metadata for future optionality, but don't build features around it |
| Barcode scanner (camera-based) | Requires native mobile capabilities or complex web APIs (MediaDevices); high effort for a responsive web app | ISBN manual entry is fast enough; add barcode scanning only if a future native app happens |
| Book lending tracker | "Lent to Maria on March 3" -- niche feature, adds status complexity | A simple note in the book's Markdown file handles this |
| Goodreads/StoryGraph import | PROJECT.md says "starts from zero"; import adds parser complexity for CSV formats that change | Can be a future enhancement if needed; manual entry + AI makes onboarding pleasant |
| Review publishing / public profiles | No audience, no need. Personal system. | Notes are private by design |
| Price tracking / purchase links | Turns the tool into a marketplace funnel; Amazon owns Goodreads for this reason | Out of scope entirely |
| Content warnings system | Valuable for community apps (StoryGraph does this well), but a single-user system where you know your own books doesn't need it | AI librarian can discuss content if asked |
| Complex recommendation algorithm | Collaborative filtering, ML pipelines, etc. | The LLM IS the recommendation engine; no need to build a separate one |
| Bulk operations / batch editing | Premature optimization; single user adding books one at a time | Simple is better; add if pain point emerges |
| Dark mode / theme system | Bikeshedding. Ship with one good theme. | Respect system preference via CSS `prefers-color-scheme` and call it done |

## Feature Dependencies

```
Markdown file structure  -->  All catalogue features (YAML frontmatter defines the data model)
       |
       v
Book metadata from APIs  -->  Auto-populated fields, cover images
       |
       v
Reading status workflow  -->  Filters, browse, statistics
       |
       v
Star ratings + notes     -->  AI context quality (richer data = better recommendations)
       |
       v
AI librarian chat        -->  Recommendations, trails, discussion (needs all above)
       |
       v
Reading statistics       -->  Needs date tracking + status history
```

Key dependency: The AI librarian's quality is directly proportional to the richness of the catalogue data. Every rating, note, and status change makes the librarian smarter. This means the catalogue must be pleasant to use FIRST -- if adding books and recording thoughts is friction-heavy, the AI has nothing to work with.

## Reading Status Workflow (Detailed)

The status model from PROJECT.md, with transitions:

```
                    +---> reading --+--> read (+ rating + notes)
                    |               |
want-to-read ------+               +--> abandoned
                    |               |
                    +---------------+--> want-to-reread (after "read")
```

**States:**
- **want-to-read**: Book is on the radar. May or may not be owned.
- **reading**: Currently in progress. Optionally track start date.
- **read**: Finished. Prompt for rating + notes. Track finish date.
- **abandoned**: Started but won't finish. Important signal for AI (what didn't work).
- **want-to-reread**: Previously read, want to revisit. Strong positive signal for AI.

**Design decisions:**
- A book can only be in ONE status at a time (simple, no state confusion)
- Status changes are logged with dates (enables reading history and stats)
- "Abandoned" is a first-class status, not hidden (StoryGraph proved users want this; it's valuable AI signal)
- Re-reading creates a new "reading" entry in history while the book returns to "reading" status

## MVP Recommendation

**Phase 1 -- Catalogue (must ship first, AI needs data):**
1. Markdown file structure with YAML frontmatter
2. Add book by title search (Google Books API)
3. Auto-populated metadata + cover image
4. Reading status workflow (all 5 states)
5. Star rating (half-star granularity)
6. Personal notes
7. Browse, filter, search
8. Responsive web UI

**Phase 2 -- AI Librarian (the differentiator):**
1. Chat interface
2. Library context injection (read all Markdown files)
3. Next-book recommendation via conversation
4. Reading trail builder
5. Mood-based suggestions

**Defer to later:**
- Reading statistics/visualizations: Valuable but not core. Ship after catalogue + AI are solid.
- Location/shelf tracking: Nice-to-have for large collections.
- Tags/custom categorization: Can use notes field initially.
- Multiple editions awareness: Edge case; handle when it causes real pain.
- Conversation memory persistence: Start with per-session context; add persistence when conversation quality plateaus.

## Sources

- [StoryGraph vs Goodreads comparison (Word Wilderness)](https://wordwilderness.com/has-the-storygraph-surpassed-goodreads-in-2025/)
- [Best Book Catalogue Apps (Tidymalism)](https://tidymalism.com/best-book-catalogue-apps/)
- [21 Best Book Tracking Apps (ISBNDB)](https://isbndb.com/blog/book-tracking-apps-and-websites/)
- [Goodreads Alternatives 2026 (Spine)](https://www.getspine.app/blog/best-goodreads-alternatives-2026)
- [Goodreads Alternatives 2026 (MyReadShelf)](https://myreadshelf.com/blog/10-goodreads-alternatives-2026)
- [CLZ Books ISBN Scanner](https://clz.com/books/isbn-scanner)
- [Plumerie Library barcode scanner](https://www.plumerielibrary.com/blog/book-barcode-scanner)
- [AI Book Recommendation Generators (Skywork)](https://skywork.ai/skypage/en/ai-book-recommendation-generators/2031650293778161665)
- [Book Tracker comparison (Book Riot)](https://bookriot.com/best-book-tracking-app/)
- [StoryGraph vs Goodreads (The Boar)](https://theboar.org/2025/03/the-storygraph-vs-goodreads-why-you-should-make-the-switch/)
