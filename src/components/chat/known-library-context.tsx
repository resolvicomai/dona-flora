'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { BookStatus } from '@/lib/books/schema'

/**
 * Metadata subset about a library book that the chat surface needs to render
 * inline cards, resolve hallucinated slugs, or pre-fill deep-link seeds.
 *
 * Populated once by the server-rendered ChatShell (Plan 05) from listBooks()
 * and injected into the client tree via KnownLibraryProvider. Descendants
 * (LibraryBookCardInline, MessageBubble) read it via the useBookMeta hook
 * to avoid prop-drilling and to keep the D-14 anti-hallucination guardrail
 * co-located with the component that renders the fallback.
 */
export interface ChatBookMeta {
  slug: string
  title: string
  author: string
  cover?: string
  status: BookStatus
}

interface KnownLibraryContextValue {
  map: Map<string, ChatBookMeta>
}

const KnownLibraryContext = createContext<KnownLibraryContextValue | null>(null)

/**
 * Provides a slug→ChatBookMeta lookup to the entire chat subtree. Pass the full
 * list of books once from the server; the provider builds an internal Map so
 * descendant lookups are O(1).
 */
export function KnownLibraryProvider({
  books,
  children,
}: {
  books: ChatBookMeta[]
  children: ReactNode
}) {
  const value = useMemo<KnownLibraryContextValue>(() => {
    const map = new Map<string, ChatBookMeta>()
    for (const b of books) map.set(b.slug, b)
    return { map }
  }, [books])
  return (
    <KnownLibraryContext.Provider value={value}>
      {children}
    </KnownLibraryContext.Provider>
  )
}

/**
 * Returns metadata for the given slug, or null if the slug is not in the
 * library. Returning null (rather than throwing) is the D-14 guardrail contract:
 * LibraryBookCardInline renders a neutral fallback span instead of a broken link.
 *
 * Also returns null when called without a provider (graceful degradation for
 * tests or misconfigured trees).
 */
export function useBookMeta(slug: string): ChatBookMeta | null {
  const ctx = useContext(KnownLibraryContext)
  if (!ctx) return null
  return ctx.map.get(slug) ?? null
}

/**
 * Returns the set of all slugs currently registered in the provider. Useful
 * for MessageBubble to decide between rendering a card and rendering the
 * hallucination fallback without mounting and unmounting the card component.
 */
export function useKnownSlugs(): Set<string> {
  const ctx = useContext(KnownLibraryContext)
  return useMemo(() => new Set(ctx ? ctx.map.keys() : []), [ctx])
}
