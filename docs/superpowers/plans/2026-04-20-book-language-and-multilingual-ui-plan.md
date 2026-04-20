# Book Language And Multilingual UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist book language from external metadata, show it across search and library surfaces, and make the app UI plus Dona Flora responses follow the user's selected app language (`pt-BR`, `en`, `es`, `zh-CN`).

**Architecture:** Keep language concerns split into two clean tracks that meet only where necessary. Track one adds durable `language` metadata to books and a single formatter for compact badges. Track two adds a settings-driven app-locale layer with dictionaries and a lightweight provider so core UI and Dona Flora can both resolve the same chosen language without route-level locale prefixes.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Better Auth, better-sqlite3, Jest, Testing Library

---

## File Structure

### New Files

- `src/lib/books/language.ts`
  Centralizes raw-code normalization and compact display labels for book metadata language.

- `src/lib/books/__tests__/language.test.ts`
  Unit coverage for known and unknown upstream language codes.

- `src/components/book-language-badge.tsx`
  Reusable small badge component for search results, browse cards, list rows, and detail metadata.

- `src/components/__tests__/book-language-visibility.test.tsx`
  Component coverage for badge rendering in browse surfaces.

- `src/lib/i18n/app-language.ts`
  Defines supported app locales, locale normalization, and HTML `lang` helpers.

- `src/lib/i18n/dictionary.ts`
  Holds app dictionaries for `pt-BR`, `en`, `es`, and `zh-CN`.

- `src/lib/i18n/__tests__/dictionary.test.ts`
  Covers locale fallback and required dictionary keys.

- `src/components/app-shell/app-language-provider.tsx`
  Client context/provider exposing current locale and dictionary.

### Modified Files

- `src/lib/api/google-books.ts`
  Add `language` to `BookSearchResult` normalization from Google Books.

- `src/lib/api/open-library.ts`
  Add `language` to Open Library normalization when available.

- `src/app/api/books/search/route.ts`
  Preserve the richer search result contract.

- `src/lib/books/schema.ts`
  Accept optional `language` on persisted books.

- `src/lib/books/library-service.ts`
  Persist and read optional book `language`.

- `src/app/api/books/route.ts`
  Accept `language?: string` in create-book validation.

- `src/components/add-book-dialog.tsx`
  Show language tags in search results and include language in create-book payload.

- `src/components/book-card.tsx`
  Render language badge in metadata cluster.

- `src/components/book-row.tsx`
  Render language badge in metadata cluster.

- `src/app/books/[slug]/page.tsx`
  Show language in primary metadata section.

- `src/lib/ai/settings.ts`
  Restrict app language to supported locales and update labels/options.

- `src/lib/auth/db.ts`
  Continue persisting user app language, now validated against supported locales.

- `src/components/account/settings-form.tsx`
  Clarify copy to mean app language and use translated option labels.

- `src/app/layout.tsx`
  Resolve current app language on the server, set `<html lang>`, and mount provider.

- `src/components/app-shell/top-nav.tsx`
  Use translated navigation strings.

- `src/components/auth/auth-shell.tsx`
  Accept translated labels or use dictionary values.

- `src/components/auth/sign-in-form.tsx`
- `src/components/auth/sign-up-form.tsx`
- `src/components/auth/forgot-password-form.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/components/auth/verify-email-panel.tsx`
  Use app dictionary instead of hardcoded PT-BR copy.

- `src/lib/ai/system-prompt.ts`
  Make the preferred app language an explicit response-language rule.

- `src/lib/ai/__tests__/settings.test.ts`
  Extend locale validation and prompt directive coverage.

- `src/lib/api/__tests__/google-books.test.ts`
- `src/lib/api/__tests__/open-library.test.ts`
- `src/lib/api/__tests__/search-route.test.ts`
  Extend API coverage for language metadata.

---

### Task 1: Add Book Language Model And Formatter

**Files:**
- Create: `src/lib/books/language.ts`
- Create: `src/lib/books/__tests__/language.test.ts`
- Modify: `src/lib/books/schema.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import {
  formatBookLanguageLabel,
  normalizeBookLanguage,
} from '../language'
import { BookSchema } from '../schema'

describe('book language formatting', () => {
  test('maps Portuguese variants to PT-BR label', () => {
    expect(formatBookLanguageLabel('pt-BR')).toBe('PT-BR')
    expect(formatBookLanguageLabel('pt-PT')).toBe('PT')
  })

  test('maps English, Spanish, and Mandarin families to compact labels', () => {
    expect(formatBookLanguageLabel('en-US')).toBe('EN')
    expect(formatBookLanguageLabel('es-MX')).toBe('ES')
    expect(formatBookLanguageLabel('zh-Hans')).toBe('ZH-CN')
  })

  test('keeps unknown upstream codes visible instead of hiding them', () => {
    expect(formatBookLanguageLabel('fr-CA')).toBe('FR-CA')
  })

  test('book schema accepts optional language metadata', () => {
    const parsed = BookSchema.parse({
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      status: 'lido',
      added_at: '2026-04-20',
      language: 'pt-BR',
    })

    expect(parsed.language).toBe('pt-BR')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/lib/books/__tests__/language.test.ts
```

Expected: FAIL because `src/lib/books/language.ts` does not exist and `BookSchema` has no `language`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/books/language.ts
export function normalizeBookLanguage(input?: string | null) {
  const value = input?.trim()
  return value ? value : undefined
}

export function formatBookLanguageLabel(input?: string | null) {
  const value = normalizeBookLanguage(input)
  if (!value) return null

  const lower = value.toLowerCase()
  if (lower === 'pt-br') return 'PT-BR'
  if (lower.startsWith('pt-pt')) return 'PT'
  if (lower === 'en' || lower.startsWith('en-')) return 'EN'
  if (lower === 'es' || lower.startsWith('es-')) return 'ES'
  if (lower === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans')) {
    return 'ZH-CN'
  }

  return value.toUpperCase()
}
```

```ts
// src/lib/books/schema.ts
export const BookSchema = z.object({
  title: z.string(),
  author: z.string(),
  isbn: z.string().optional(),
  synopsis: z.string().optional(),
  cover: z.string().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().optional(),
  language: z.string().min(2).max(32).optional(),
  status: BookStatusEnum,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  added_at: z.string(),
  _notes: z.string().default(''),
  _filename: z.string().optional(),
})
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/lib/books/__tests__/language.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/books/language.ts src/lib/books/__tests__/language.test.ts src/lib/books/schema.ts
git commit -m "feat: add book language metadata model"
```

---

### Task 2: Bring Language Through Search And Persistence

**Files:**
- Modify: `src/lib/api/google-books.ts`
- Modify: `src/lib/api/open-library.ts`
- Modify: `src/app/api/books/search/route.ts`
- Modify: `src/app/api/books/route.ts`
- Modify: `src/lib/books/library-service.ts`
- Modify: `src/lib/api/__tests__/google-books.test.ts`
- Modify: `src/lib/api/__tests__/open-library.test.ts`
- Modify: `src/lib/api/__tests__/search-route.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/api/__tests__/google-books.test.ts
it('parses language from Google Books volumeInfo', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      items: [
        {
          volumeInfo: {
            title: 'Dom Casmurro',
            authors: ['Machado de Assis'],
            language: 'pt-BR',
          },
        },
      ],
    }),
  })) as jest.Mock

  const results = await searchGoogleBooks('dom casmurro')
  expect(results[0].language).toBe('pt-BR')
})
```

```ts
// src/lib/api/__tests__/open-library.test.ts
it('parses language from Open Library docs when present', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      docs: [
        {
          title: 'The Hobbit',
          author_name: ['J.R.R. Tolkien'],
          language: ['eng'],
        },
      ],
    }),
  })) as jest.Mock

  const results = await searchOpenLibrary('hobbit')
  expect(results[0].language).toBe('eng')
})
```

```ts
// src/lib/api/__tests__/search-route.test.ts
it('returns language in normalized search results', async () => {
  mockedSearchGoogleBooks.mockResolvedValue([
    { title: 'Dom Casmurro', authors: ['Machado'], language: 'pt-BR' },
  ])

  const res = await POST(makeRequest({ query: 'dom casmurro' }))
  await expect(res.json()).resolves.toEqual([
    expect.objectContaining({ language: 'pt-BR' }),
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/lib/api/__tests__/google-books.test.ts src/lib/api/__tests__/open-library.test.ts src/lib/api/__tests__/search-route.test.ts
```

Expected: FAIL because `language` is not returned yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/api/google-books.ts
interface GoogleBooksVolumeInfo {
  authors?: string[]
  categories?: string[]
  description?: string
  imageLinks?: { thumbnail?: string }
  industryIdentifiers?: GoogleBooksIndustryIdentifier[]
  language?: string
  publishedDate?: string
  title?: string
}

export interface BookSearchResult {
  title: string
  authors: string[]
  isbn?: string
  synopsis?: string
  cover?: string
  genre?: string
  year?: number
  language?: string
}

return {
  title: v.title ?? '',
  authors: v.authors ?? [],
  isbn: isbn?.identifier,
  synopsis: v.description,
  cover: v.imageLinks?.thumbnail?.replace('http://', 'https://'),
  genre: v.categories?.[0],
  year: v.publishedDate ? parseInt(v.publishedDate.slice(0, 4), 10) || undefined : undefined,
  language: v.language,
} satisfies BookSearchResult
```

```ts
// src/lib/api/open-library.ts
fields: 'title,author_name,first_publish_year,cover_i,isbn,language',

({
  title: doc.title ?? '',
  authors: doc.author_name ?? [],
  isbn: doc.isbn?.[0],
  cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
  year: doc.first_publish_year,
  language: doc.language?.[0],
}) satisfies BookSearchResult
```

```ts
// src/app/api/books/route.ts
const CreateBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  synopsis: z.string().optional(),
  cover: z.string().url().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().optional(),
  language: z.string().min(2).max(32).optional(),
  status: BookStatusEnum,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
})
```

```ts
// src/lib/books/library-service.ts
export interface WriteBookInput {
  title: string
  author: string
  isbn?: string
  synopsis?: string
  cover?: string
  genre?: string
  year?: number
  language?: string
  status: BookStatus
  rating?: number
  notes?: string
}

const frontmatter: Record<string, unknown> = {
  ...rest,
  added_at: new Date().toISOString().split('T')[0],
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/lib/api/__tests__/google-books.test.ts src/lib/api/__tests__/open-library.test.ts src/lib/api/__tests__/search-route.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/google-books.ts src/lib/api/open-library.ts src/app/api/books/search/route.ts src/app/api/books/route.ts src/lib/books/library-service.ts src/lib/api/__tests__/google-books.test.ts src/lib/api/__tests__/open-library.test.ts src/lib/api/__tests__/search-route.test.ts
git commit -m "feat: persist language through book search pipeline"
```

---

### Task 3: Show Language Tags In Search, Browse, And Detail

**Files:**
- Create: `src/components/book-language-badge.tsx`
- Create: `src/components/__tests__/book-language-visibility.test.tsx`
- Modify: `src/components/add-book-dialog.tsx`
- Modify: `src/components/book-card.tsx`
- Modify: `src/components/book-row.tsx`
- Modify: `src/app/books/[slug]/page.tsx`

- [ ] **Step 1: Write the failing component tests**

```tsx
import { render, screen } from '@testing-library/react'
import { BookCard } from '../book-card'
import { BookRow } from '../book-row'

const baseBook = {
  _filename: 'dom-casmurro.md',
  title: 'Dom Casmurro',
  author: 'Machado de Assis',
  status: 'lido',
  added_at: '2026-04-20',
  language: 'pt-BR',
}

test('BookCard renders compact language badge when language exists', () => {
  render(<BookCard book={baseBook as never} />)
  expect(screen.getByText('PT-BR')).toBeInTheDocument()
})

test('BookRow renders compact language badge when language exists', () => {
  render(<BookRow book={baseBook as never} />)
  expect(screen.getByText('PT-BR')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/components/__tests__/book-language-visibility.test.tsx
```

Expected: FAIL because no language badge exists.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/book-language-badge.tsx
import { formatBookLanguageLabel } from '@/lib/books/language'

export function BookLanguageBadge({ language }: { language?: string | null }) {
  const label = formatBookLanguageLabel(language)
  if (!label) return null

  return (
    <span className="inline-flex items-center rounded-full border border-hairline bg-surface px-2.5 py-1 text-[0.68rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
      {label}
    </span>
  )
}
```

```tsx
// src/components/book-card.tsx
<div className="flex flex-wrap items-center gap-2">
  <StatusBadge status={book.status} className="self-start" />
  {book.rating ? <RatingStars value={book.rating} /> : null}
  <BookLanguageBadge language={book.language} />
</div>
```

```tsx
// src/components/book-row.tsx
<div className="flex flex-wrap items-center gap-2">
  <StatusBadge status={book.status} />
  {book.rating ? <RatingStars value={book.rating} /> : null}
  <BookLanguageBadge language={book.language} />
</div>
```

```tsx
// src/components/add-book-dialog.tsx
<div className="flex flex-wrap items-center gap-2">
  {book.year ? <span className="text-xs text-muted-foreground">{book.year}</span> : null}
  <BookLanguageBadge language={book.language} />
</div>

saveBook({
  title: selected.title,
  author: selected.authors.join(', '),
  isbn: selected.isbn,
  synopsis: selected.synopsis,
  cover: selected.cover,
  genre: selected.genre,
  year: selected.year,
  language: selected.language,
  status: previewStatus,
})
```

```tsx
// src/app/books/[slug]/page.tsx
{book.language && (
  <div className="rounded-[1.4rem] border border-hairline bg-surface px-4 py-3">
    <p className="eyebrow">Idioma</p>
    <div className="mt-2">
      <BookLanguageBadge language={book.language} />
    </div>
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/components/__tests__/book-language-visibility.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/book-language-badge.tsx src/components/__tests__/book-language-visibility.test.tsx src/components/add-book-dialog.tsx src/components/book-card.tsx src/components/book-row.tsx src/app/books/[slug]/page.tsx
git commit -m "feat: show book language across library surfaces"
```

---

### Task 4: Add Supported App Locales And Restrict Settings

**Files:**
- Create: `src/lib/i18n/app-language.ts`
- Create: `src/lib/i18n/__tests__/dictionary.test.ts`
- Create: `src/lib/i18n/dictionary.ts`
- Modify: `src/lib/ai/settings.ts`
- Modify: `src/lib/ai/__tests__/settings.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { getDictionary } from '../dictionary'
import { normalizeAppLanguage } from '../app-language'
import { AISettingsSchema } from '@/lib/ai/settings'

test('normalizes unsupported app locales back to pt-BR', () => {
  expect(normalizeAppLanguage('fr-FR')).toBe('pt-BR')
})

test('returns English dictionary when app language is en', () => {
  const dictionary = getDictionary('en')
  expect(dictionary.nav.library).toBe('Library')
})

test('AI settings schema rejects unsupported UI locale', () => {
  expect(() =>
    AISettingsSchema.parse({
      tone: 'calorosa',
      focus: 'equilibrado',
      externalOpenness: 'sob-demanda',
      responseStyle: 'conversa',
      language: 'fr-FR',
      additionalInstructions: '',
    }),
  ).toThrow()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/lib/i18n/__tests__/dictionary.test.ts src/lib/ai/__tests__/settings.test.ts
```

Expected: FAIL because locale helpers and dictionaries do not exist and AI settings still accept any string.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/i18n/app-language.ts
import { z } from 'zod'

export const SUPPORTED_APP_LANGUAGES = ['pt-BR', 'en', 'es', 'zh-CN'] as const
export const AppLanguageSchema = z.enum(SUPPORTED_APP_LANGUAGES)
export type AppLanguage = z.infer<typeof AppLanguageSchema>
export const DEFAULT_APP_LANGUAGE: AppLanguage = 'pt-BR'

export function normalizeAppLanguage(input?: string | null): AppLanguage {
  const parsed = AppLanguageSchema.safeParse(input)
  return parsed.success ? parsed.data : DEFAULT_APP_LANGUAGE
}

export function resolveHtmlLang(input?: string | null) {
  return normalizeAppLanguage(input)
}
```

```ts
// src/lib/i18n/dictionary.ts
import { DEFAULT_APP_LANGUAGE, normalizeAppLanguage, type AppLanguage } from './app-language'

export const dictionaries = {
  'pt-BR': { nav: { library: 'Biblioteca', chat: 'Chat' } },
  en: { nav: { library: 'Library', chat: 'Chat' } },
  es: { nav: { library: 'Biblioteca', chat: 'Chat' } },
  'zh-CN': { nav: { library: '书库', chat: '聊天' } },
} as const

export function getDictionary(input?: string | null) {
  const locale = normalizeAppLanguage(input)
  return dictionaries[locale] ?? dictionaries[DEFAULT_APP_LANGUAGE]
}
```

```ts
// src/lib/ai/settings.ts
import { AppLanguageSchema } from '@/lib/i18n/app-language'

export const AISettingsSchema = z.object({
  tone: z.enum(['calorosa', 'analitica', 'assertiva']),
  focus: z.enum(['equilibrado', 'memoria', 'descoberta']),
  externalOpenness: z.enum(['sob-demanda', 'aberta', 'somente-acervo']),
  responseStyle: z.enum(['conversa', 'concisa', 'profunda']),
  language: AppLanguageSchema,
  additionalInstructions: z.string().max(500),
})

export const AI_LANGUAGE_OPTIONS = [
  { label: 'Português (Brasil)', value: 'pt-BR' },
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: '中文（简体）', value: 'zh-CN' },
] as const
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/lib/i18n/__tests__/dictionary.test.ts src/lib/ai/__tests__/settings.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/app-language.ts src/lib/i18n/dictionary.ts src/lib/i18n/__tests__/dictionary.test.ts src/lib/ai/settings.ts src/lib/ai/__tests__/settings.test.ts
git commit -m "feat: add supported app locale primitives"
```

---

### Task 5: Mount App-Language Provider And Translate Core UI

**Files:**
- Create: `src/components/app-shell/__tests__/top-nav.test.tsx`
- Create: `src/components/auth/__tests__/sign-in-form.test.tsx`
- Create: `src/components/app-shell/app-language-provider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/app-shell/top-nav.tsx`
- Modify: `src/components/account/settings-form.tsx`
- Modify: `src/components/auth/auth-shell.tsx`
- Modify: `src/components/auth/sign-in-form.tsx`
- Modify: `src/components/auth/sign-up-form.tsx`
- Modify: `src/components/auth/forgot-password-form.tsx`
- Modify: `src/components/auth/reset-password-form.tsx`
- Modify: `src/components/auth/verify-email-panel.tsx`
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react'
import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'
import { SignInForm } from '../sign-in-form'
import { TopNav } from '@/components/app-shell/top-nav'

test('top nav renders English labels when locale is en', () => {
  render(
    <AppLanguageProvider locale="en">
      <TopNav />
    </AppLanguageProvider>,
  )

  expect(screen.getByText('Library')).toBeInTheDocument()
})

test('sign-in form renders Spanish action labels when locale is es', () => {
  render(
    <AppLanguageProvider locale="es">
      <SignInForm />
    </AppLanguageProvider>,
  )

  expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/components/auth/__tests__/sign-in-form.test.tsx src/components/app-shell/__tests__/top-nav.test.tsx
```

Expected: FAIL because there is no provider and components still render hardcoded PT-BR copy.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/app-shell/app-language-provider.tsx
'use client'

import { createContext, useContext } from 'react'
import { getDictionary } from '@/lib/i18n/dictionary'
import type { AppLanguage } from '@/lib/i18n/app-language'

const AppLanguageContext = createContext({
  locale: 'pt-BR' as AppLanguage,
  dictionary: getDictionary('pt-BR'),
})

export function AppLanguageProvider({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: AppLanguage
}) {
  return (
    <AppLanguageContext.Provider value={{ locale, dictionary: getDictionary(locale) }}>
      {children}
    </AppLanguageContext.Provider>
  )
}

export function useAppLanguage() {
  return useContext(AppLanguageContext)
}
```

```tsx
// src/app/layout.tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  const locale = session?.user?.id ? normalizeAppLanguage(getUserSettings(session.user.id).language) : 'pt-BR'

  return (
    <html lang={resolveHtmlLang(locale)} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppLanguageProvider locale={locale}>
            <NuqsAdapter>
              <AppShell>{children}</AppShell>
            </NuqsAdapter>
          </AppLanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

```tsx
// src/components/app-shell/top-nav.tsx
const { dictionary } = useAppLanguage()
...
<span>{dictionary.nav.library}</span>
<span>{dictionary.nav.chat}</span>
```

```tsx
// src/components/account/settings-form.tsx
const { dictionary } = useAppLanguage()
...
<span className="eyebrow">{dictionary.settings.languageLabel}</span>
<p className="text-sm leading-7 text-muted-foreground">
  {dictionary.settings.description}
</p>
```

```tsx
// src/components/auth/sign-in-form.tsx
const { dictionary } = useAppLanguage()
...
<span className="eyebrow">{dictionary.auth.emailLabel}</span>
<span className="eyebrow">{dictionary.auth.passwordLabel}</span>
<Button disabled={isPending} type="submit">
  {isPending ? dictionary.auth.signingIn : dictionary.auth.signIn}
</Button>
<Link href="/forgot-password">{dictionary.auth.forgotPassword}</Link>
<Link href="/sign-up">{dictionary.auth.createAccount}</Link>
```

```tsx
// src/components/auth/sign-up-form.tsx
const { dictionary } = useAppLanguage()
...
<span className="eyebrow">{dictionary.auth.nameLabel}</span>
<span className="eyebrow">{dictionary.auth.emailLabel}</span>
<span className="eyebrow">{dictionary.auth.passwordLabel}</span>
<span className="eyebrow">{dictionary.auth.confirmPasswordLabel}</span>
<Button disabled={isPending} type="submit">
  {isPending ? dictionary.auth.creatingAccount : dictionary.auth.createAccount}
</Button>
```

```tsx
// src/components/auth/forgot-password-form.tsx, reset-password-form.tsx, verify-email-panel.tsx
const { dictionary } = useAppLanguage()
...
setError(payload?.error ?? dictionary.auth.genericError)
setMessage(dictionary.auth.resetSent)
setInfo(dictionary.auth.verificationResent)
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/components/auth/__tests__/sign-in-form.test.tsx src/components/app-shell/__tests__/top-nav.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/app-shell/__tests__/top-nav.test.tsx src/components/auth/__tests__/sign-in-form.test.tsx src/components/app-shell/app-language-provider.tsx src/app/layout.tsx src/components/app-shell/top-nav.tsx src/components/account/settings-form.tsx src/components/auth/auth-shell.tsx src/components/auth/sign-in-form.tsx src/components/auth/sign-up-form.tsx src/components/auth/forgot-password-form.tsx src/components/auth/reset-password-form.tsx src/components/auth/verify-email-panel.tsx src/app/settings/page.tsx
git commit -m "feat: translate core ui from app language setting"
```

---

### Task 6: Make Dona Flora Follow App Language And Run Full Verification

**Files:**
- Modify: `src/lib/ai/system-prompt.ts`
- Modify: `src/lib/ai/settings.ts`
- Modify: `src/app/api/chat/__tests__/route.test.ts`
- Modify: `src/lib/ai/__tests__/settings.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/ai/__tests__/settings.test.ts
it('builds a response-language directive from supported app locale', () => {
  expect(
    buildAISettingsDirective({
      tone: 'calorosa',
      focus: 'equilibrado',
      externalOpenness: 'sob-demanda',
      responseStyle: 'conversa',
      language: 'zh-CN',
      additionalInstructions: '',
    }),
  ).toContain('Idioma de resposta obrigatório: zh-CN')
})
```

```ts
// src/app/api/chat/__tests__/route.test.ts
it('injects the user app language into the final system prompt', async () => {
  await POST(makeRequest({ chatId: 'abc-123', messages: validMessages() }))
  const args = capturedStreamTextArgs.value
  const system = args?.system as { content: string }
  expect(system.content).toContain('Idioma de resposta obrigatório')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/lib/ai/__tests__/settings.test.ts src/app/api/chat/__tests__/route.test.ts
```

Expected: FAIL because the prompt still only describes preferred language loosely.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/ai/settings.ts
const responseLanguageLabels = {
  'pt-BR': 'pt-BR',
  en: 'en',
  es: 'es',
  'zh-CN': 'zh-CN',
} as const

export function buildAISettingsDirective(input?: Partial<AISettings> | null): string {
  const settings = normalizeAISettings(input)

  const lines = [
    `Tom preferido: ${toneLabels[settings.tone]}`,
    `Foco preferido: ${focusLabels[settings.focus]}`,
    `Livros externos: ${externalLabels[settings.externalOpenness]}`,
    `Estilo de resposta: ${responseLabels[settings.responseStyle]}`,
    `Idioma da interface: ${settings.language}`,
    `Idioma de resposta obrigatório: ${responseLanguageLabels[settings.language]}`,
  ]

  if (settings.additionalInstructions) {
    lines.push(`Instruções adicionais: ${settings.additionalInstructions}`)
  }

  return lines.join('\n')
}
```

```ts
// src/lib/ai/system-prompt.ts
- Você deve responder no idioma definido em <USER_PREFERENCES>. Se o usuário misturar idiomas, mantenha a resposta principal no idioma configurado, a menos que ele peça explicitamente para mudar.
```

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
npx eslint src scripts
npm test -- --runInBand
npm run build
PORT=4011 npm run start:local
```

Expected:

- eslint with no errors
- all Jest suites pass
- build passes
- standalone boots on `http://localhost:4011`

Smoke manually or with curl:

```bash
curl -I http://localhost:4011/sign-in
curl -I http://localhost:4011/profile
curl -s http://localhost:4011/api/auth/get-session
```

Expected:

- `/sign-in` -> `200`
- `/profile` guest -> `307` to `/sign-in`
- session endpoint -> `null` before auth

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/system-prompt.ts src/lib/ai/settings.ts src/lib/ai/__tests__/settings.test.ts src/app/api/chat/__tests__/route.test.ts
git commit -m "feat: align dona flora responses with app language"
```

---

## Spec Coverage Check

- Book language persisted from search APIs: covered by Tasks 1 and 2.
- Language tag in search, browse, and detail: covered by Task 3.
- App supports `pt-BR`, `en`, `es`, `zh-CN`: covered by Tasks 4 and 5.
- App language drives UI and Dona Flora language: covered by Tasks 5 and 6.
- No manual book-language editing: preserved by Tasks 2 and 3 because no edit-form work is introduced.
- No locale-prefixed routes: preserved because Task 5 uses layout/provider, not route rewrites.

## Placeholder Scan

- No `TBD`, `TODO`, or “implement later” markers remain.
- Every task contains concrete files, commands, and code snippets.
- No task relies on “same as previous task” shorthand.

## Type Consistency Check

- Book metadata language is always `language?: string`.
- App UI locale is always one of `pt-BR | en | es | zh-CN`.
- Search result contract and create-book payload both use the same `language?: string` field.
