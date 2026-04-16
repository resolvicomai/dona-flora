# Architecture Patterns

**Domain:** Personal book library with Markdown data layer and AI librarian
**Researched:** 2026-04-15

## Critical Constraint: Deployment Model

Vercel's serverless functions have a **read-only filesystem at runtime**. Since this project's core requirement is Markdown files on disk as source of truth, the app **must run as a long-lived Node.js process** -- either on the developer's machine, a VPS, or via Docker. Vercel serverless deployment is architecturally incompatible with this project's data model.

**Decision:** Self-host via `next start` (or Docker with `output: 'standalone'`). Use `node:fs/promises` for all file operations. This is simple, correct, and matches the "editable in Obsidian/VS Code" requirement.

**Confidence:** HIGH -- Verified via Vercel docs that serverless functions cannot write to the filesystem.

---

## Recommended Architecture

```
+--------------------------------------------------+
|                   Next.js App                     |
|                                                   |
|  +-------------+  +-------------+  +----------+  |
|  | Pages/UI    |  | API Routes  |  | Server   |  |
|  | (React)     |  | /api/books  |  | Actions  |  |
|  | Client      |  | /api/chat   |  | (mutate) |  |
|  +------+------+  +------+------+  +----+-----+  |
|         |                |               |        |
|  +------+----------------+---------------+-----+  |
|  |              Library Service                 |  |
|  |  (reads/writes MD, builds indexes, caches)  |  |
|  +---------------------+----------------------+   |
|                        |                          |
+------------------------|--------------------------+
                         |
          +--------------+--------------+
          |                             |
   +------+------+            +--------+--------+
   | File System |            | External APIs   |
   | ./library/  |            | Google Books    |
   | *.md files  |            | Open Library    |
   +-------------+            +-----------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **UI Layer** (React client components) | Render catalog, chat interface, filters, book detail | API Routes, Server Actions |
| **API Route: `/api/chat`** | Handle AI chat streaming via AI SDK | Library Service, AI Provider (Claude/OpenAI) |
| **API Route: `/api/books`** | REST-style CRUD for books, search external APIs | Library Service, Google Books API, Open Library API |
| **Server Actions** | Mutations: add book, update status, add notes | Library Service |
| **Library Service** | Core business logic: read/write/index Markdown files | File System (`node:fs/promises`), `gray-matter` |
| **File System** | Persistent Markdown storage (`./library/*.md`) | Disk |

---

## Markdown File Schema Per Book

Each book is a single `.md` file in a `library/` directory at the project root.

### File Naming Convention

Use a slugified version of the title: `the-great-gatsby.md`, `sapiens.md`. If collision, append ISBN: `sapiens-9780062316097.md`.

### Frontmatter Schema (YAML)

```yaml
---
title: "Sapiens: A Brief History of Humankind"
author: "Yuval Noah Harari"
authors:
  - "Yuval Noah Harari"
isbn10: "0062316095"
isbn13: "9780062316097"
publisher: "Harper"
publishedDate: "2015-02-10"
pageCount: 443
categories:
  - "History"
  - "Anthropology"
language: "en"
coverImage: "https://books.google.com/books/content?id=1EiJAwAAQBAJ&printsec=frontcover&img=1&zoom=1"
description: "From a renowned historian comes a groundbreaking narrative..."

# User-defined fields
status: "lido"          # quero-ler | lendo | lido | quero-reler | abandonado
rating: 4               # 1-5, null if not rated
dateAdded: "2026-04-15"
dateStarted: "2026-03-01"
dateFinished: "2026-03-20"
tags:
  - "favorito"
  - "nao-ficcao"

# System metadata
source: "google-books"   # google-books | open-library | manual
googleBooksId: "1EiJAwAAQBAJ"
openLibraryKey: "/works/OL17930368W"
lastUpdated: "2026-04-15"
---
```

### Body Content (Markdown below frontmatter)

```markdown
## Notas Pessoais

Livro transformador sobre a historia da humanidade. A parte sobre a
revolucao cognitiva e particularmente fascinante.

## Trechos Favoritos

> "We did not domesticate wheat. It domesticated us."

## Por que quero reler

Reler a parte 3 sobre a unificacao da humanidade, que nao lembrei bem.
```

### Schema Design Rationale

| Field | Why |
|-------|-----|
| `status` enum | Core feature: filter by reading status. Portuguese values match the UI language. |
| `rating` (1-5) | Simple, matches project requirements. `null` when unrated. |
| `authors` array + `author` string | Array for multi-author books; `author` is the primary display name. |
| `isbn13` as primary ID | Most reliable book identifier. `isbn10` as fallback for older books. |
| `coverImage` URL | Stored as URL, not downloaded. Google Books provides stable image URLs. |
| `categories` from API | Auto-populated from Google Books/Open Library. User can edit. |
| `tags` user-defined | Separate from categories. User's own taxonomy (favorito, etc.). |
| Body as free-text Markdown | Notes, quotes, reflections. Fully editable in Obsidian. AI reads this for deep context. |
| `source` field | Track where metadata came from for potential re-fetching. |

### gray-matter Usage

**Confidence:** HIGH -- verified via Context7 docs.

```typescript
import matter from 'gray-matter';
import { promises as fs } from 'node:fs';

// READ a book
async function readBook(filePath: string): Promise<Book> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { ...data, notes: content } as Book;
}

// WRITE a book
async function writeBook(filePath: string, book: Book): Promise<void> {
  const { notes, ...frontmatter } = book;
  const output = matter.stringify(notes || '', frontmatter);
  await fs.writeFile(filePath, output, 'utf-8');
}
```

---

## How Next.js Reads/Writes Markdown Files

### Server Components (Read)

Server Components can use `node:fs` directly. For the catalog page, read all `.md` files at request time:

```typescript
// app/library/page.tsx (Server Component)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const LIBRARY_DIR = path.join(process.cwd(), 'library');

export default async function LibraryPage() {
  const files = await fs.readdir(LIBRARY_DIR);
  const books = await Promise.all(
    files
      .filter(f => f.endsWith('.md'))
      .map(async (filename) => {
        const raw = await fs.readFile(path.join(LIBRARY_DIR, filename), 'utf-8');
        const { data } = matter(raw);
        return { slug: filename.replace('.md', ''), ...data };
      })
  );
  // Render catalog...
}
```

### Server Actions (Write)

Use Server Actions for mutations. These run server-side and can use `node:fs`:

```typescript
// app/actions/books.ts
'use server';

import { revalidatePath } from 'next/cache';
import matter from 'gray-matter';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const LIBRARY_DIR = path.join(process.cwd(), 'library');

export async function updateBookStatus(slug: string, status: string) {
  const filePath = path.join(LIBRARY_DIR, `${slug}.md`);
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(raw);

  data.status = status;
  data.lastUpdated = new Date().toISOString().split('T')[0];

  await fs.writeFile(filePath, matter.stringify(content, data), 'utf-8');
  revalidatePath('/library');
}
```

### API Routes (External API Integration + AI Chat)

Use Route Handlers for Google Books API calls and AI chat streaming:

```typescript
// app/api/books/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query!)}`
  );
  const data = await res.json();
  return NextResponse.json(data.items || []);
}
```

### In-Memory Index for Performance

For a personal library (likely under 1,000 books), maintain an in-memory index that gets rebuilt on startup and updated on writes. No database needed.

```typescript
// lib/library-index.ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

interface BookIndex {
  slug: string;
  title: string;
  author: string;
  status: string;
  rating: number | null;
  categories: string[];
  tags: string[];
}

let cachedIndex: BookIndex[] | null = null;
let lastBuildTime = 0;

const LIBRARY_DIR = path.join(process.cwd(), 'library');

export async function getLibraryIndex(): Promise<BookIndex[]> {
  // Rebuild if stale (simple file-watch or time-based)
  if (!cachedIndex || Date.now() - lastBuildTime > 5000) {
    const files = await fs.readdir(LIBRARY_DIR);
    cachedIndex = await Promise.all(
      files.filter(f => f.endsWith('.md')).map(async (f) => {
        const raw = await fs.readFile(path.join(LIBRARY_DIR, f), 'utf-8');
        const { data } = matter(raw);
        return {
          slug: f.replace('.md', ''),
          title: data.title,
          author: data.author,
          status: data.status,
          rating: data.rating ?? null,
          categories: data.categories ?? [],
          tags: data.tags ?? [],
        };
      })
    );
    lastBuildTime = Date.now();
  }
  return cachedIndex;
}

export function invalidateIndex() {
  cachedIndex = null;
}
```

---

## AI Context Strategy

### Recommendation: Full Context Injection (NOT RAG)

**Confidence:** HIGH

**Rationale:** For a personal library of realistic scale (100-1,000 books), the total metadata fits comfortably in a single LLM context window.

**Math:**
- Each book's frontmatter + personal notes: ~300-800 tokens
- 500 books at ~500 tokens average = **250,000 tokens**
- Claude Sonnet 4 / Opus 4: 200K standard context, 1M extended
- GPT-4o: 128K context
- Even at 500 books, the full library fits in one prompt

**Why NOT RAG:**
1. RAG adds significant complexity (vector database, embeddings, chunking, retrieval pipeline)
2. RAG loses holistic understanding -- the AI cannot "see" the whole library at once to find patterns
3. The librarian's value is in understanding relationships across the entire collection
4. For <1,000 books of metadata, full context injection is simpler, cheaper, and produces better recommendations

**When to reconsider RAG:** If the user starts storing full book summaries (5,000+ tokens per book) and the library exceeds ~200 books with such summaries. Even then, a hybrid approach (full metadata + RAG for notes) would be better than pure RAG.

### Implementation: Context Building

Build a structured text summary of the entire library and inject it as the system prompt:

```typescript
// lib/ai-context.ts
import { getLibraryIndex } from './library-index';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const LIBRARY_DIR = path.join(process.cwd(), 'library');

export async function buildLibraryContext(): Promise<string> {
  const files = await fs.readdir(LIBRARY_DIR);

  const bookSummaries = await Promise.all(
    files.filter(f => f.endsWith('.md')).map(async (f) => {
      const raw = await fs.readFile(path.join(LIBRARY_DIR, f), 'utf-8');
      const { data, content } = matter(raw);

      let summary = `## ${data.title} (${data.author})`;
      summary += `\nStatus: ${data.status}`;
      if (data.rating) summary += ` | Nota: ${data.rating}/5`;
      if (data.categories?.length) summary += `\nCategorias: ${data.categories.join(', ')}`;
      if (data.tags?.length) summary += `\nTags: ${data.tags.join(', ')}`;
      if (content.trim()) summary += `\nNotas pessoais: ${content.trim()}`;

      return summary;
    })
  );

  return `Voce e o bibliotecario pessoal do Mauro. Aqui esta a biblioteca completa:\n\n${bookSummaries.join('\n\n---\n\n')}`;
}
```

### AI Chat API Route

```typescript
// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildLibraryContext } from '@/lib/ai-context';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const libraryContext = await buildLibraryContext();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: `${libraryContext}

Voce e um bibliotecario pessoal experiente e acolhedor. Voce conhece profundamente
todos os livros da biblioteca acima -- seus status, notas, avaliacoes e categorias.

Seu papel:
- Recomendar proximos livros baseado no historico e preferencias
- Montar trilhas de leitura para objetivos especificos
- Discutir livros que o usuario ja leu
- Sugerir releituras quando faz sentido
- Ser conversacional, nao uma lista de recomendacoes

Responda sempre em portugues brasileiro.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

### Context Caching Strategy

Rebuild the library context only when files change, not on every chat message:

```typescript
let cachedContext: string | null = null;

export async function getLibraryContext(): Promise<string> {
  if (!cachedContext) {
    cachedContext = await buildLibraryContext();
  }
  return cachedContext;
}

// Call when any book is added/modified
export function invalidateLibraryContext() {
  cachedContext = null;
}
```

For future optimization, Claude and OpenAI both support **prompt caching** -- when the system prompt is identical across requests, the provider caches the KV pairs and subsequent requests are faster and cheaper. This naturally benefits the "full library in system prompt" approach since the library changes infrequently relative to chat messages.

---

## Data Flow: Add a Book

```
User types ISBN/title in search bar
        |
        v
Client calls GET /api/books/search?q=sapiens
        |
        v
API Route fetches Google Books API (fallback: Open Library)
        |
        v
Returns book metadata candidates to client
        |
        v
User selects correct book, clicks "Add"
        |
        v
Client calls Server Action: addBook(bookData)
        |
        v
Server Action:
  1. Generates slug from title
  2. Merges API data with defaults (status: "quero-ler")
  3. Writes new .md file via gray-matter stringify
  4. Invalidates in-memory index
  5. Invalidates AI library context cache
  6. revalidatePath('/library')
        |
        v
UI refreshes, book appears in catalog
Next chat message will include the new book in context
```

## Data Flow: AI Chat

```
User sends message in chat UI
        |
        v
useChat hook sends POST to /api/chat
        |
        v
API Route:
  1. Gets cached library context (full library as text)
  2. Prepends as system prompt
  3. Calls streamText() with AI SDK
  4. Streams response back
        |
        v
useChat renders streaming response in chat UI
```

---

## Patterns to Follow

### Pattern 1: Library Service as Single Abstraction

**What:** All file system operations go through a single `LibraryService` module. No component or route reads/writes `.md` files directly.

**Why:** Single place to handle caching, validation, slug generation, index invalidation. Prevents scattered `fs` calls.

```typescript
// lib/library-service.ts
export const LibraryService = {
  async getAllBooks(): Promise<BookSummary[]> { ... },
  async getBook(slug: string): Promise<Book> { ... },
  async addBook(data: ExternalBookData): Promise<string> { ... },
  async updateBook(slug: string, updates: Partial<Book>): Promise<void> { ... },
  async deleteBook(slug: string): Promise<void> { ... },
  async getLibraryContextForAI(): Promise<string> { ... },
};
```

### Pattern 2: Separate API Data from User Data

**What:** Keep a clear boundary between data fetched from Google Books/Open Library (immutable after import) and user-added data (status, rating, notes, tags).

**Why:** Prevents accidental overwrites. User edits in Obsidian should not be lost if metadata is re-fetched.

### Pattern 3: Optimistic UI Updates

**What:** Update the UI immediately when the user changes status or rating, then write to disk in the background.

**Why:** The UI should feel instant. Disk writes for a single file are <10ms but network roundtrips add latency.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using a Database Alongside Markdown

**What:** Adding SQLite/Postgres to "index" the Markdown files.
**Why bad:** Dual source of truth. They will drift. Adds sync complexity for no benefit at this scale.
**Instead:** Use in-memory index rebuilt from files. For <1,000 books, reading all files takes <100ms.

### Anti-Pattern 2: RAG for a Small Personal Library

**What:** Setting up vector embeddings, a vector database (Pinecone, ChromaDB), and a retrieval pipeline.
**Why bad:** Massive complexity for a dataset that fits entirely in context. RAG fragments the AI's understanding of the collection.
**Instead:** Full context injection. Reconsider only if library exceeds ~1,000 books with extensive notes.

### Anti-Pattern 3: Deploying to Vercel Serverless

**What:** Deploying to Vercel's default serverless/edge infrastructure.
**Why bad:** Read-only filesystem. Cannot write Markdown files. Would require a complete architectural pivot (Vercel Blob, database, etc.) that contradicts the project's core value proposition.
**Instead:** Self-host with `next start` or Docker. Can still use Vercel for other projects.

### Anti-Pattern 4: Storing Cover Images Locally

**What:** Downloading and storing book cover images in the repository.
**Why bad:** Bloats the repo. Google Books provides stable image URLs.
**Instead:** Store only the URL in frontmatter. Consider a fallback placeholder for missing covers.

---

## Scalability Considerations

| Concern | At 100 books | At 500 books | At 1,000+ books |
|---------|-------------|-------------|-----------------|
| File read (all books) | <20ms | <80ms | <200ms |
| In-memory index | Trivial | Trivial | Fine, rebuild in background |
| AI context size | ~50K tokens | ~250K tokens | May exceed 128K (GPT-4o). Fine for Claude 200K. |
| Startup time | Instant | <1s | 1-2s |
| Obsidian compatibility | Perfect | Perfect | Perfect |

**At 1,000+ books:** Consider using `chokidar` or `node:fs.watch` to watch the `library/` directory and incrementally update the index instead of full rebuilds.

---

## Directory Structure

```
dona-flora/
  library/               # Markdown files (source of truth)
    sapiens.md
    the-great-gatsby.md
    ...
  app/
    page.tsx             # Home / catalog
    library/
      page.tsx           # Full catalog with filters
      [slug]/
        page.tsx         # Book detail page
    chat/
      page.tsx           # AI librarian chat
    api/
      chat/
        route.ts         # AI streaming endpoint
      books/
        search/
          route.ts       # External API search (Google Books)
    actions/
      books.ts           # Server Actions for mutations
  lib/
    library-service.ts   # Core service: read/write/index
    ai-context.ts        # Build library context for AI
    book-apis.ts         # Google Books + Open Library clients
    types.ts             # TypeScript types for Book, etc.
  components/
    catalog/             # Book grid, filters, search
    chat/                # Chat UI components
    book/                # Book card, detail, edit forms
    ui/                  # Shared UI primitives
```

---

## Build Order Implications

Based on this architecture, the recommended build sequence:

1. **Foundation:** Set up Next.js project, define TypeScript types, create `library/` directory, implement `gray-matter` read/write utilities in `LibraryService`
2. **Catalog Core:** Book detail page reading from Markdown, basic catalog listing, in-memory index
3. **Book Addition:** Google Books API integration, Server Actions to write new `.md` files, search-and-add flow
4. **Catalog Features:** Filtering by status/rating/category, status updates, rating
5. **AI Librarian:** Full context builder, AI SDK chat route, chat UI with `useChat`
6. **Polish:** Mobile responsiveness, Obsidian compatibility testing, edge cases

**Rationale:** The file system layer must come first because everything depends on it. The catalog must exist before the AI can have context to work with. The AI librarian is the differentiator but requires a populated library to be useful.

---

## Sources

- [Context7: gray-matter docs](https://context7.com/jonschlinkert/gray-matter/llms.txt) -- Frontmatter parsing/stringify (HIGH confidence)
- [Context7: Vercel AI SDK docs](https://context7.com/vercel/ai/llms.txt) -- useChat, streamText, system prompts (HIGH confidence)
- [Vercel: EROFS read-only filesystem discussion](https://github.com/vercel/community/discussions/314) -- Vercel serverless cannot write files (HIGH confidence)
- [Claude Context Windows docs](https://platform.claude.com/docs/en/build-with-claude/context-windows) -- 200K standard, 1M extended (HIGH confidence)
- [Google Books API documentation](https://developers.google.com/books/docs/v1/using) -- ISBN and title search (HIGH confidence)
- [AI SDK RAG guide](https://ai-sdk.dev/cookbook/guides/rag-chatbot) -- RAG patterns for reference (HIGH confidence)
- [Next.js file reading with process.cwd](https://github.com/vercel/next.js/blob/canary/docs/02-pages/04-api-reference/03-functions/get-static-props.mdx) -- fs usage in Next.js (HIGH confidence)
