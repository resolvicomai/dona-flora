import type { StorageContext } from '@/lib/storage/context'
import { listChats } from './list'

const MAX_MEMORY_CHATS = 6
const MAX_EXCERPT_CHARS = 700

function cleanTranscriptExcerpt(content: string) {
  return content
    .replace(/^##\s+Você\s+—.*$/gm, 'Você:')
    .replace(/^##\s+Dona Flora\s+—.*$/gm, 'Dona Flora:')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^>\s*external:/gm, 'fora do acervo:')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

/**
 * Compact cross-chat memory for the system prompt.
 *
 * This does not create a new database or hidden profile. It reuses the
 * user's persisted Markdown conversations: pinned chats first, then recent
 * chats, excluding the current thread.
 */
export async function loadConversationMemoryContext(
  storageContext: StorageContext,
  currentChatId: string,
) {
  const chats = await listChats(storageContext)
  const candidates = chats
    .filter((chat) => chat.id !== currentChatId)
    .slice(0, MAX_MEMORY_CHATS)

  if (candidates.length === 0) return ''

  return candidates
    .map((chat) => {
      const kind = chat.pinned ? 'fixada' : 'recente'
      const excerpt = truncate(cleanTranscriptExcerpt(chat.content), MAX_EXCERPT_CHARS)
      return [
        `### ${chat.title}`,
        `tipo: ${kind}`,
        `updated_at: ${chat.updated_at}`,
        excerpt ? `trecho: ${excerpt}` : null,
      ]
        .filter((line): line is string => Boolean(line))
        .join('\n')
    })
    .join('\n\n')
}
