import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'

import { listBooks } from '@/lib/books/library-service'
import { listChats } from '@/lib/chats/list'
import { listTrails } from '@/lib/trails/store'
import { getUserAIProviderSettings, getUserLibrarySettings } from '@/lib/auth/db'
import { getSessionStorageContext, requireVerifiedServerSession } from '@/lib/auth/server'
import { BookBrowser } from '@/components/books/book-browser'

export const dynamic = 'force-dynamic'

function getConfiguredAIModelLabel(settings: ReturnType<typeof getUserAIProviderSettings>) {
  if (settings.primaryProvider === 'anthropic') return settings.anthropicModel
  if (settings.primaryProvider === 'openai') return settings.openaiModel
  if (settings.primaryProvider === 'openai-compatible') {
    return settings.compatibleModel
  }
  if (settings.primaryProvider === 'openrouter') return settings.openrouterModel
  return settings.ollamaModel
}

export default async function HomePage() {
  noStore()
  const session = await requireVerifiedServerSession()
  const storageContext = getSessionStorageContext(session)
  const [books, chats, trails] = await Promise.all([
    listBooks(storageContext),
    listChats(storageContext),
    listTrails(storageContext),
  ])
  const librarySettings = getUserLibrarySettings(session.user.id)
  const aiProviderSettings = getUserAIProviderSettings(session.user.id)

  return (
    <Suspense fallback={null}>
      <BookBrowser
        initialBooks={books}
        onboarding={{
          aiModel: getConfiguredAIModelLabel(aiProviderSettings),
          bookCount: books.length,
          chatCount: chats.length,
          libraryConfigured: Boolean(librarySettings.booksDir),
          trailCount: trails.length,
        }}
      />
    </Suspense>
  )
}
