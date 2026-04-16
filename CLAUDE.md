<!-- GSD:project-start source:PROJECT.md -->
## Project

**Dona Flora — Biblioteca Pessoal com IA**

Um sistema de catalogação de livros físicos pessoal onde os dados vivem em arquivos Markdown (legíveis e editáveis por qualquer editor como Obsidian ou VS Code), com uma interface web responsiva para catalogar, organizar e conversar com um bibliotecário pessoal alimentado por IA.

O diferencial não é o catálogo — é o **bibliotecário**: uma IA conversacional que conhece profundamente tudo que você leu, avaliou, quer ler e quer reler, e dialoga com você pra descobrir o que faz sentido ler a seguir.

**Core Value:** **O bibliotecário pessoal que você nunca teve** — uma IA que realmente conhece sua biblioteca e conversa com você sobre ela de forma contextualizada, não genérica.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.2.x | Full-stack framework | App Router with React Server Components for server-side Markdown reading; API routes for chat and book APIs; built-in image optimization for book covers; 400% faster dev startup in 16.2. Deploying on Vercel makes it zero-config. |
| React | 19.x | UI library | Ships with Next.js 16; Server Components let us read .md files on the server without exposing the filesystem to the client. |
| TypeScript | 5.7+ | Type safety | Non-negotiable for a project mixing AI SDK types, Zod schemas, and Markdown frontmatter shapes. |
### AI Layer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ai (Vercel AI SDK) | 6.0.x | AI framework | ToolLoopAgent abstraction for the librarian agent; `useChat` hook for streaming chat UI; `streamText` for server-side generation. v6 is stable with agent-first architecture. |
| @ai-sdk/react | latest | Client hooks | Provides `useChat` and `sendMessage` for the chat interface. Ships alongside `ai` v6. |
| @ai-sdk/anthropic | 3.x | LLM provider | Claude Sonnet 4.6 is the best model for a conversational librarian -- excellent at nuanced recommendations, long context for ingesting entire libraries, and natural Portuguese conversation. Use Anthropic directly (not AI Gateway) to keep it simple and avoid Vercel billing complexity for a personal project. |
- Claude excels at nuanced literary discussion and recommendations
- 200K context window fits hundreds of book Markdown files simultaneously
- Superior Portuguese language quality compared to GPT-4o
- Personal project = direct API key is simpler than AI Gateway routing
### Markdown Data Layer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| gray-matter | 4.0.3 | Frontmatter parsing | Battle-tested (30M+ repos), parses YAML frontmatter to JS objects. Used by Astro, Gatsby, VitePress. Returns `{ data, content }` cleanly. |
| remark + remark-html | latest | Markdown rendering | For rendering book notes/content in the UI. remark is the unified ecosystem standard. |
| Zod | 4.x | Schema validation | Validates frontmatter shape after gray-matter parses it. Ensures every book .md has required fields (title, author, status, etc.). Also used for AI SDK tool input schemas. |
| Node.js fs/promises | built-in | File I/O | Read/write .md files from Next.js Server Components and API routes. No ORM, no database -- the filesystem IS the database. |
## Minhas Notas
- On server: `fs.readdir('library/')` + `gray-matter()` each file
- Parse frontmatter into typed objects with Zod validation
- For the AI: concatenate all book data into a context string for the system prompt
- For the UI: Server Components read files directly, no API needed
- API route receives new book data
- Constructs frontmatter YAML + content body
- Writes `.md` file via `fs.writeFile()`
- gray-matter's `stringify()` function builds the file from data + content
### Book Data APIs
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Google Books API v1 | REST | Primary book data source | Best coverage for Brazilian Portuguese books; returns title, authors, description, categories, cover images, ISBN. Free tier: ~1,000 req/day (more than enough for personal use). No SDK needed -- simple fetch calls. |
| Open Library API | REST | Fallback book data source | Free, no API key required. Good cover image API (`covers.openlibrary.org/b/isbn/{isbn}-L.jpg`). Weaker on Brazilian books but fills gaps. |
### UI & Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.2.x | Utility-first CSS | v4 is CSS-first config (no `tailwind.config.js`), 5x faster builds, zero-config with Next.js 16. Perfect for responsive mobile-first design. |
| shadcn/ui | latest (CLI v4) | Component library | Not a dependency -- copies components into your project. Provides Dialog, Command, Input, Card, Badge, ScrollArea etc. Built on Radix UI (unified package since Feb 2026). Chat UI components can be composed from primitives. |
| radix-ui | latest | Headless UI primitives | Single `radix-ui` package (unified since Feb 2026). Accessible by default. Powers shadcn/ui under the hood. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 4.x | Validation | Everywhere: frontmatter schemas, API input validation, AI tool input schemas. Single validation library for the whole app. |
| date-fns | 4.x | Date formatting | Display "added on", "finished reading" dates. Lightweight, tree-shakeable. |
| lucide-react | latest | Icons | shadcn/ui's icon library. Stars for ratings, book icons, search, filter icons. |
| next/image | built-in | Image optimization | Book cover images. Automatic resizing, lazy loading, WebP conversion. |
### Dev Dependencies
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| eslint | 9.x | Linting | Next.js 16 ships with eslint-config-next. |
| prettier | 3.x | Formatting | Consistency. |
| prettier-plugin-tailwindcss | latest | Tailwind class sorting | Auto-sorts Tailwind classes. |
## What NOT to Use
| Technology | Why Not |
|------------|---------|
| Prisma / Drizzle / any ORM | No database. Markdown files ARE the data layer. Adding a DB defeats the core value proposition (human-readable, Obsidian-editable files). |
| SQLite / LibSQL | Same reason. If you need indexing later, build an in-memory index on startup from .md files. |
| MDX | Overkill. Books are data files with notes, not interactive documents. Plain Markdown + YAML frontmatter is simpler and Obsidian-compatible. |
| tRPC | Single developer, single app. API routes with Zod validation are sufficient. tRPC adds ceremony for no benefit here. |
| NextAuth / Auth.js | Single user, personal app. No authentication needed. If desired later, a simple env-based password check suffices. |
| AI Gateway (@ai-sdk/vercel) | Adds routing/billing complexity for a single-provider personal app. Direct Anthropic provider is simpler. |
| Contentlayer / Velite | These are for static site generation from Markdown. Dona Flora needs runtime read/write of Markdown files, not build-time processing. |
| chokidar (file watching) | Not needed initially. Next.js dev server handles HMR. If live-reload of manually edited .md files becomes desired, add it then. |
| Langchain | Vercel AI SDK v6 with ToolLoopAgent handles everything needed. Langchain is heavier and less integrated with Next.js. |
| TanStack AI | Newer, less mature than Vercel AI SDK. The AI SDK has better Next.js integration and the ToolLoopAgent pattern is exactly what we need. |
## Architecture Decision: Why No Database
- Files are readable/editable in Obsidian, VS Code, any text editor
- No migration scripts, no schema evolution headaches
- Git-friendly (track reading history over time)
- Zero infrastructure (no database server, no connection strings)
- Portable (copy the folder, you have your library)
- No complex queries (solved with in-memory filtering on read)
- No full-text search index (solved with simple string matching or building a search index on startup)
- File I/O on every request (acceptable for a personal library of ~1,000 books max)
- No concurrent writes (single user, not a problem)
## Installation
# Initialize Next.js project
# Core AI
# Markdown data layer
# UI (shadcn/ui is added via CLI, not npm)
# Supporting
# Dev
## Environment Variables
# .env.local
## File Structure Preview
## Sources
- [Next.js 16.2 Release](https://nextjs.org/blog) - HIGH confidence
- [Vercel AI SDK v6](https://vercel.com/blog/ai-sdk-6) - HIGH confidence (verified via Context7)
- [AI SDK Docs - ToolLoopAgent](https://ai-sdk.dev/docs/introduction) - HIGH confidence (verified via Context7)
- [gray-matter npm](https://www.npmjs.com/package/gray-matter) - HIGH confidence (verified via Context7)
- [Google Books API](https://developers.google.com/books/docs/v1/using) - MEDIUM confidence
- [Open Library API](https://openlibrary.org/developers/api) - MEDIUM confidence
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) - HIGH confidence
- [shadcn/ui CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) - HIGH confidence
- [Zod v4](https://zod.dev/v4) - HIGH confidence
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
