---
phase: 03-browse-ui
reviewed: 2026-04-17T11:22:00-03:00
depth: standard
files_reviewed: 29
files_reviewed_list:
  - src/app/api/books/search/route.ts
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/components/add-book-dialog.tsx
  - src/components/book-browser.tsx
  - src/components/book-card.tsx
  - src/components/book-cover.tsx
  - src/components/book-row.tsx
  - src/components/empty-results.tsx
  - src/components/filter-bar.tsx
  - src/components/filter-chip-group.tsx
  - src/components/search-input.tsx
  - src/components/sort-select.tsx
  - src/components/ui/toggle-group.tsx
  - src/components/ui/toggle.tsx
  - src/components/view-toggle.tsx
  - src/lib/api/__tests__/dedupe.test.ts
  - src/lib/api/__tests__/google-books.test.ts
  - src/lib/api/__tests__/open-library.test.ts
  - src/lib/api/__tests__/search-route.test.ts
  - src/lib/api/dedupe.ts
  - src/lib/api/google-books.ts
  - src/lib/api/open-library.ts
  - src/lib/books/__tests__/library-service.test.ts
  - src/lib/books/__tests__/query.test.ts
  - src/lib/books/library-service.ts
  - src/lib/books/query.ts
  - src/lib/books/schema.ts
  - src/lib/books/search-params.ts
  - src/lib/use-local-storage.ts
findings:
  critical: 2
  warning: 4
  info: 5
  total: 11
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-17T11:22:00-03:00
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

This phase delivers the browse UI (filter bar, book grid/list, search, sort, view toggle) plus the book search API with Google Books / Open Library fallback, and the core library service (Markdown file I/O). The overall quality is high: the CVE-2025-65108 gray-matter JavaScript engine mitigation is correctly implemented, input validation is thorough, and the pagination / dedupe logic is sound.

Two critical issues were found: a path-traversal vulnerability in `library-service.ts` (slug input not sanitised before being interpolated into filesystem paths) and the use of `any` types in the Google Books parser that bypass TypeScript's safety guarantees at a network boundary. Four warnings cover logic edge-cases (key instability in the book browser, `fetchMore` race window, `applySearch` edge-case with books missing `_filename`, and stale `fetchMore` closure). Five info items note dead code, missing accent in UI copy, and minor improvement opportunities.

---

## Critical Issues

### CR-01: Path traversal in `getBook`, `updateBook`, and `deleteBook`

**File:** `src/lib/books/library-service.ts:89-157`

**Issue:** `getBook(slug)`, `updateBook(slug, …)`, and `deleteBook(slug)` all construct filesystem paths by joining an untrusted `slug` argument directly into the library directory without any sanitisation. A caller that passes `../../../etc/passwd` or `../../.env.local` as the slug can read or delete arbitrary files on the server. The `slug.endsWith('.md')` branch in `getBook` only affects the extension, not the path segments. Although the library is a single-user personal app today, the route handler for `GET /books/[slug]` (not in scope here but implied by `BookCard`'s `href`) will call `getBook` with a URL-decoded parameter.

**Fix:**
```ts
import path from 'path'

/** Reject any slug that would escape the library directory. */
function assertSafeSlug(slug: string): void {
  // Must not contain path separators or dot-dot sequences
  if (/[/\\]/.test(slug) || slug.includes('..')) {
    throw new Error(`Invalid slug: "${slug}"`)
  }
}

export async function getBook(slug: string): Promise<Book | null> {
  assertSafeSlug(slug)
  const libraryDir = getLibraryDir()
  const filename = slug.endsWith('.md') ? slug : `${slug}.md`
  const filepath = path.join(libraryDir, filename)
  // Additional defence-in-depth: verify resolved path is still inside libraryDir
  if (!filepath.startsWith(libraryDir + path.sep)) {
    throw new Error('Path traversal detected')
  }
  // ... rest unchanged
}
```

Apply the same guard to `updateBook` and `deleteBook`.

---

### CR-02: `any` types at the Google Books network boundary suppress type safety

**File:** `src/lib/api/google-books.ts:43-58`

**Issue:** The callback passed to `.map()` on `data.items` is typed `(item: any)`, and nested accesses (`item.volumeInfo`, `id: any`) all use `any`. If the Google Books API returns an unexpected shape — or if the `fetch` result is swapped in tests — TypeScript cannot catch property access on `undefined`. In particular, `v.industryIdentifiers?.find(...)` will silently return `undefined` without error only because optional chaining is used, but accesses like `v.title ?? ''` would throw if `item` itself were not an object. This is a latent crash risk whenever the API shape diverges.

**Fix:**
```ts
interface GBIdentifier { type: string; identifier: string }
interface GBVolumeInfo {
  title?: string
  authors?: string[]
  description?: string
  categories?: string[]
  imageLinks?: { thumbnail?: string }
  industryIdentifiers?: GBIdentifier[]
  publishedDate?: string
}
interface GBItem { volumeInfo?: GBVolumeInfo }

// Replace `(item: any)` with:
return (data.items ?? []).map((item: GBItem) => {
  const v = item.volumeInfo ?? {}
  // ...
})
```

---

## Warnings

### WR-01: Unstable React key in `BookBrowser` causes full remount on rename

**File:** `src/components/book-browser.tsx:124,130`

**Issue:** Both the grid and list renderers fall back to `book.title` when `book._filename` is undefined:
```tsx
key={book._filename ?? book.title}
```
`_filename` is `z.string().optional()` in the schema, so it can legitimately be absent for a freshly-parsed book. When two books share the same title and both lack `_filename`, their keys collide, causing React to silently reuse the wrong DOM node. More practically, if `_filename` is present for all books from `listBooks()` (it is, since `writeBook` sets it), the fallback is dead code — but if that assumption ever breaks the bug would be invisible.

**Fix:** Make `_filename` required in `BookSchema` (it is always set by `listBooks`) or assert its presence and throw rather than silently falling back to a potentially non-unique `title`:
```ts
// schema.ts
_filename: z.string(), // remove .optional()
```

---

### WR-02: `fetchMore` inside `IntersectionObserver` captures a stale closure

**File:** `src/components/add-book-dialog.tsx:212-224`

**Issue:** The `useEffect` that wires up the `IntersectionObserver` captures `fetchMore` at the time the effect runs. `fetchMore` itself closes over `hasMore`, `loadingMore`, `query`, `nextStart`, and `nextPage`. Because `fetchMore` is defined as a plain `async function` (not wrapped in `useCallback`), it is recreated on every render — but the observer only re-registers when `[results.length, hasMore, loadingMore, query]` changes. If the observer fires between a state update and the effect re-running (e.g., `nextStart` changed but `results.length` did not), the stale `fetchMore` will send the wrong `startIndex`.

**Fix:** Wrap `fetchMore` in `useCallback` with its full dependency set, then include it in the effect's dependency array:
```ts
const fetchMore = useCallback(async () => {
  // ... same body
}, [hasMore, loadingMore, query, nextStart, nextPage])

useEffect(() => {
  if (!sentinelRef.current || !hasMore || loadingMore || results.length === 0) return
  const target = sentinelRef.current
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) fetchMore() },
    { rootMargin: '100px' },
  )
  observer.observe(target)
  return () => observer.disconnect()
}, [results.length, hasMore, loadingMore, query, fetchMore])
```

---

### WR-03: `applySearch` silently includes books with no `_filename` in a filtered set

**File:** `src/lib/books/query.ts:88-98`

**Issue:** In `applySearch`, the allowed-set is built from `_filename` values:
```ts
const allowed = new Set(
  books.map((b) => b._filename).filter((f): f is string => Boolean(f)),
)
```
Then the Fuse results are filtered with:
```ts
.filter((b) => !b._filename || allowed.has(b._filename))
```
The second condition `!b._filename` means any book that has no `_filename` in the Fuse index will always pass the filter, regardless of whether it was in the pre-filtered `books` set. If the schema ever permits books without filenames (e.g., after CR-01 fix keeps `_filename` optional), a search could return books that were deliberately excluded by the status/rating/genre filters.

**Fix:**
```ts
.filter((b) => b._filename != null && allowed.has(b._filename))
```
This is stricter — books without a filename can never pass — which is the safe direction.

---

### WR-04: Search error is swallowed silently on non-OK HTTP responses in `handleQueryChange`

**File:** `src/components/add-book-dialog.tsx:121`

**Issue:**
```ts
if (!res.ok) throw new Error()
```
The thrown `Error` has no message, and the `catch` block also ignores the error object:
```ts
} catch {
  setError('Erro ao buscar. Tente novamente.')
}
```
This means HTTP 429 (rate limit), 503, or any server error is indistinguishable from a network timeout when debugging. The same pattern appears in `fetchMore` (line 147) and `saveBook` (line 173).

**Fix:**
```ts
if (!res.ok) throw new Error(`HTTP ${res.status}`)
// ...
} catch (err) {
  console.warn('[AddBookDialog] search failed:', err)
  setError('Erro ao buscar. Tente novamente.')
}
```

---

## Info

### IN-01: Typo in UI copy — missing cedilla

**File:** `src/components/add-book-dialog.tsx:330`

**Issue:** The manual-add link reads `"Nao encontrei meu livro"`. The correct Portuguese text is `"Não encontrei meu livro"` (with the tilde on the 'a').

**Fix:** Replace the string literal with `"Não encontrei meu livro"`.

---

### IN-02: Commented-out sticky `z-index` note is stale after implementation

**File:** `src/components/filter-bar.tsx:103-104`

**Issue:** The JSDoc comment states `"Header is sticky top-0 z-10 in page.tsx (will need to bump to z-20 when this FilterBar is mounted)"`. The header in `page.tsx` already uses `z-20`, so this parenthetical is stale documentation.

**Fix:** Remove the parenthetical note from the JSDoc or update it to reflect the current state (`z-20` is already in use).

---

### IN-03: `google-books.test.ts` file is truncated — pagination backward-compat test is incomplete

**File:** `src/lib/api/__tests__/google-books.test.ts:148-150`

**Issue:** The file ends mid-test at line 150 (`it('backward compat: (query, maxResults) still works without startIndex arg'`). The test body is missing. This test will either fail to parse or register as a pending test with no assertions, giving a false sense of coverage.

**Fix:** Complete the test body:
```ts
it('backward compat: (query, maxResults) still works without startIndex arg', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ items: [] }),
  } as Response)

  await searchGoogleBooks('tolkien', 10)

  const calledUrl = String(fetchSpy.mock.calls[0][0])
  expect(calledUrl).toMatch(/maxResults=10/)
  expect(calledUrl).toMatch(/startIndex=0/)
})
```

---

### IN-04: `search-route.test.ts` is also truncated

**File:** `src/lib/api/__tests__/search-route.test.ts:150`

**Issue:** The file ends at line 150 mid-way through the `'defaults startIndex=0 and page=1 when omitted'` test. Same issue as IN-03 — incomplete test body means the assertion never runs.

**Fix:** Complete the test (the pattern is identical to adjacent tests in that file).

---

### IN-05: Magic number `20` for page size repeated across multiple files

**File:** `src/app/api/books/search/route.ts:35`, `src/components/add-book-dialog.tsx:126,127,154,156`

**Issue:** The per-page limit of `20` is hardcoded in both the route handler (`const limit = 20`) and the dialog component (`setHasMore(data.length >= 20)`, `setNextStart(20)`). If the limit ever changes in the route, the dialog's `hasMore` heuristic and `nextStart` increment will silently produce wrong pagination.

**Fix:** Export the constant from the route (or a shared config file) and import it in the dialog:
```ts
// src/lib/api/search-config.ts
export const BOOK_SEARCH_PAGE_SIZE = 20
```
Then import and use it in both `route.ts` and `add-book-dialog.tsx`.

---

_Reviewed: 2026-04-17T11:22:00-03:00_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
