import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import {
  claimLegacyDataForUser,
  createStorageContext,
  ensureStorageContext,
} from '@/lib/storage/context'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-storage-'))
})

afterEach(async () => {
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})

describe('createStorageContext', () => {
  it('builds canonical per-user directories under data/users/{userId}', () => {
    const ctx = createStorageContext('user-123', tmpDir)

    expect(ctx.dataRoot).toBe(tmpDir)
    expect(ctx.userRoot).toBe(path.join(tmpDir, 'users', 'user-123'))
    expect(ctx.booksDir).toBe(path.join(tmpDir, 'users', 'user-123', 'books'))
    expect(ctx.chatsDir).toBe(path.join(tmpDir, 'users', 'user-123', 'chats'))
    expect(ctx.trailsDir).toBe(path.join(tmpDir, 'users', 'user-123', 'trails'))
  })

  it('uses an external books directory override without moving chats or trails', () => {
    const externalBooksDir = path.join(tmpDir, 'obsidian', 'livros')
    const ctx = createStorageContext('user-123', tmpDir, {
      booksDir: externalBooksDir,
    })

    expect(ctx.booksDir).toBe(externalBooksDir)
    expect(ctx.chatsDir).toBe(path.join(tmpDir, 'users', 'user-123', 'chats'))
    expect(ctx.trailsDir).toBe(path.join(tmpDir, 'users', 'user-123', 'trails'))
  })
})

describe('ensureStorageContext', () => {
  it('creates the books, chats and trails directories', async () => {
    const ctx = createStorageContext('user-123', tmpDir)

    await ensureStorageContext(ctx)

    const booksStat = await fs.stat(ctx.booksDir)
    const chatsStat = await fs.stat(ctx.chatsDir)
    const trailsStat = await fs.stat(ctx.trailsDir)

    expect(booksStat.isDirectory()).toBe(true)
    expect(chatsStat.isDirectory()).toBe(true)
    expect(trailsStat.isDirectory()).toBe(true)
  })
})

describe('claimLegacyDataForUser', () => {
  it('moves legacy books/chats/trails into the owner namespace and writes a backup marker', async () => {
    await fs.mkdir(path.join(tmpDir, 'books'), { recursive: true })
    await fs.mkdir(path.join(tmpDir, 'chats'), { recursive: true })
    await fs.mkdir(path.join(tmpDir, 'trails'), { recursive: true })
    await fs.writeFile(path.join(tmpDir, 'books', 'book-a.md'), 'book-a')
    await fs.writeFile(path.join(tmpDir, 'chats', 'chat-a.md'), 'chat-a')
    await fs.writeFile(path.join(tmpDir, 'trails', 'trail-a.md'), 'trail-a')

    const result = await claimLegacyDataForUser({
      userId: 'owner-1',
      dataRoot: tmpDir,
    })

    expect(result.migrated).toBe(true)
    expect(result.backupRoot).toBeTruthy()

    const ownerCtx = createStorageContext('owner-1', tmpDir)
    await expect(fs.readFile(path.join(ownerCtx.booksDir, 'book-a.md'), 'utf-8')).resolves.toBe('book-a')
    await expect(fs.readFile(path.join(ownerCtx.chatsDir, 'chat-a.md'), 'utf-8')).resolves.toBe('chat-a')
    await expect(fs.readFile(path.join(ownerCtx.trailsDir, 'trail-a.md'), 'utf-8')).resolves.toBe('trail-a')

    await expect(fs.readFile(path.join(result.backupRoot!, 'books', 'book-a.md'), 'utf-8')).resolves.toBe('book-a')
    await expect(fs.readFile(path.join(result.backupRoot!, 'chats', 'chat-a.md'), 'utf-8')).resolves.toBe('chat-a')
    await expect(fs.readFile(path.join(result.backupRoot!, 'trails', 'trail-a.md'), 'utf-8')).resolves.toBe('trail-a')

    const marker = JSON.parse(await fs.readFile(result.markerPath, 'utf-8')) as {
      ownerUserId: string
      migratedAt: string
    }

    expect(marker.ownerUserId).toBe('owner-1')
    expect(marker.migratedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('is idempotent once the legacy claim marker exists', async () => {
    await fs.mkdir(path.join(tmpDir, 'books'), { recursive: true })
    await fs.writeFile(path.join(tmpDir, 'books', 'book-a.md'), 'book-a')

    const first = await claimLegacyDataForUser({
      userId: 'owner-1',
      dataRoot: tmpDir,
    })
    const second = await claimLegacyDataForUser({
      userId: 'owner-1',
      dataRoot: tmpDir,
    })

    expect(first.migrated).toBe(true)
    expect(second.migrated).toBe(false)
    expect(second.markerPath).toBe(first.markerPath)
  })
})
