import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { listChats } from '../list'

let tmpDir: string
let warnSpy: jest.SpyInstance

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-chats-list-'))
  process.env.CHATS_DIR = tmpDir
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  delete process.env.CHATS_DIR
  warnSpy.mockRestore()
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})

async function writeChatFile(
  name: string,
  fm: Record<string, unknown>,
  body = '## Você — 15:00\n\nMensagem.',
) {
  const yaml = Object.entries(fm)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        // Inline empty array as `[]` so YAML doesn't parse it as `null`.
        if (v.length === 0) return `${k}: []`
        return `${k}:\n${v.map((x) => `  - ${x}`).join('\n')}`
      }
      return `${k}: ${JSON.stringify(v)}`
    })
    .join('\n')
  const content = `---\n${yaml}\n---\n\n${body}\n`
  await fs.writeFile(path.join(tmpDir, name), content, 'utf-8')
}

describe('listChats', () => {
  it('returns empty array when directory does not exist', async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
    // Point env at a dir that really doesn't exist
    process.env.CHATS_DIR = path.join(tmpDir, 'missing-subdir')
    const result = await listChats()
    expect(result).toEqual([])
  })

  it('returns summaries sorted by updated_at DESC', async () => {
    await writeChatFile('a.md', {
      id: 'a',
      title: 'Primeira',
      started_at: '2026-04-17T10:00:00Z',
      updated_at: '2026-04-17T10:00:00Z',
      book_refs: [],
    })
    await writeChatFile('b.md', {
      id: 'b',
      title: 'Segunda',
      started_at: '2026-04-17T11:00:00Z',
      updated_at: '2026-04-17T12:00:00Z',
      book_refs: [],
    })
    await writeChatFile('c.md', {
      id: 'c',
      title: 'Terceira',
      started_at: '2026-04-17T09:00:00Z',
      updated_at: '2026-04-17T11:30:00Z',
      book_refs: [],
    })

    const result = await listChats()
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('keeps pinned conversations above recent unpinned ones', async () => {
    await writeChatFile('old-pinned.md', {
      id: 'old-pinned',
      title: 'Fixada antiga',
      started_at: '2026-04-17T09:00:00Z',
      updated_at: '2026-04-17T09:00:00Z',
      book_refs: [],
      pinned: true,
    })
    await writeChatFile('new.md', {
      id: 'new',
      title: 'Recente',
      started_at: '2026-04-17T11:00:00Z',
      updated_at: '2026-04-17T12:00:00Z',
      book_refs: [],
    })

    const result = await listChats()
    expect(result.map((r) => r.id)).toEqual(['old-pinned', 'new'])
    expect(result[0].pinned).toBe(true)
  })

  it('skips malformed files with warn and still returns valid ones', async () => {
    await writeChatFile('good.md', {
      id: 'good',
      title: 'OK',
      started_at: '2026-04-17T10:00:00Z',
      updated_at: '2026-04-17T10:00:00Z',
      book_refs: [],
    })
    // Malformed: missing `id`
    await fs.writeFile(
      path.join(tmpDir, 'bad.md'),
      `---
title: sem id
started_at: "2026-04-17T10:00:00Z"
updated_at: "2026-04-17T10:00:00Z"
---

body
`,
      'utf-8',
    )

    const result = await listChats()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('good')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('ignores non-.md files', async () => {
    await writeChatFile('real.md', {
      id: 'real',
      title: 'Real',
      started_at: '2026-04-17T10:00:00Z',
      updated_at: '2026-04-17T10:00:00Z',
      book_refs: [],
    })
    await fs.writeFile(path.join(tmpDir, 'not-a-chat.txt'), 'ignore me', 'utf-8')
    await fs.writeFile(path.join(tmpDir, 'readme'), 'also ignore', 'utf-8')

    const result = await listChats()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('real')
  })
})
