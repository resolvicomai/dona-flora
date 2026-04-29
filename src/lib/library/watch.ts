import { EventEmitter } from 'events'
import type { FSWatcher } from 'chokidar'

interface WatchEntry {
  emitter: EventEmitter
  refCount: number
  watcher: FSWatcher
}

const watchEntries = new Map<string, WatchEntry>()

function watchKey(userId: string, booksDir: string) {
  return `${userId}:${booksDir}`
}

export function isLibraryWatchEnabled() {
  return process.env.DONA_FLORA_LIBRARY_WATCH === '1' || process.env.LIBRARY_WATCH === '1'
}

export async function subscribeToLibraryChanges(input: {
  booksDir: string
  onChange: () => void
  userId: string
}) {
  const key = watchKey(input.userId, input.booksDir)
  let entry = watchEntries.get(key)

  if (!entry) {
    const { watch } = await import('chokidar')
    const emitter = new EventEmitter()
    const watcher = watch(input.booksDir, {
      awaitWriteFinish: {
        pollInterval: 100,
        stabilityThreshold: 500,
      },
      depth: 1,
      ignoreInitial: true,
      ignored: (filePath, stats) => Boolean(stats?.isFile()) && !filePath.endsWith('.md'),
    })
    let timeout: ReturnType<typeof setTimeout> | null = null
    const emitChange = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => emitter.emit('change'), 150)
    }

    watcher.on('add', emitChange)
    watcher.on('change', emitChange)
    watcher.on('unlink', emitChange)

    entry = {
      emitter,
      refCount: 0,
      watcher,
    }
    watchEntries.set(key, entry)
  }

  entry.refCount += 1
  entry.emitter.on('change', input.onChange)

  return async () => {
    const current = watchEntries.get(key)
    if (!current) return

    current.emitter.off('change', input.onChange)
    current.refCount -= 1
    if (current.refCount <= 0) {
      watchEntries.delete(key)
      await current.watcher.close()
    }
  }
}
