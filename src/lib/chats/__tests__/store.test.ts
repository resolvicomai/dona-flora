import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import matter from 'gray-matter'
import { SAFE_MATTER_OPTIONS } from '@/lib/books/library-service'
import { saveChat, loadChat, updateChatMetadata } from '../store'
import type { LibrarianMessage } from '../types'

let tmpDir: string
let warnSpy: jest.SpyInstance

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-chats-'))
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

function mkText(role: 'user' | 'assistant', text: string, createdAt?: string): LibrarianMessage {
  return {
    id: `${role}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    parts: [{ type: 'text', text }],
    ...(createdAt ? { metadata: { createdAt } } : {}),
  }
}

describe('saveChat', () => {
  it('creates file with frontmatter and transcript body', async () => {
    const messages: LibrarianMessage[] = [
      mkText('user', 'Olá Dona Flora, que livro indica?', '2026-04-17T15:35:00Z'),
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Comece por' },
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'o-hobbit' },
          },
          { type: 'text', text: 'depois' },
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'a-sociedade-do-anel' },
          },
        ],
        metadata: { createdAt: '2026-04-17T15:36:00Z' },
      },
    ]

    await saveChat({ chatId: 'my-chat-01', messages })

    const filepath = path.join(tmpDir, 'my-chat-01.md')
    const raw = await fs.readFile(filepath, 'utf-8')
    const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)

    expect(data.id).toBe('my-chat-01')
    expect(typeof data.title).toBe('string')
    expect(data.title.length).toBeGreaterThan(0)
    // Title derived from first user message, truncated to 60 chars
    expect(data.title).toContain('Olá Dona Flora')
    // book_refs preserves first-seen order
    expect(data.book_refs).toEqual(['o-hobbit', 'a-sociedade-do-anel'])
    expect(typeof data.started_at).toBe('string')
    expect(typeof data.updated_at).toBe('string')
    expect(content).toContain('## Você')
    expect(content).toContain('## Dona Flora')
    expect(content).toContain('[[o-hobbit]]')
  })

  it('preserves started_at on subsequent writes', async () => {
    const msgs: LibrarianMessage[] = [mkText('user', 'Primeira.')]
    await saveChat({ chatId: 'chat-42', messages: msgs })

    const raw1 = await fs.readFile(path.join(tmpDir, 'chat-42.md'), 'utf-8')
    const { data: data1 } = matter(raw1, SAFE_MATTER_OPTIONS)
    const firstStarted = data1.started_at
    const firstUpdated = data1.updated_at

    // Wait to guarantee updated_at ticks forward
    await new Promise((r) => setTimeout(r, 20))

    await saveChat({
      chatId: 'chat-42',
      messages: [...msgs, mkText('assistant', 'Segunda.')],
    })
    const raw2 = await fs.readFile(path.join(tmpDir, 'chat-42.md'), 'utf-8')
    const { data: data2 } = matter(raw2, SAFE_MATTER_OPTIONS)

    expect(data2.started_at).toBe(firstStarted)
    expect(data2.updated_at).not.toBe(firstUpdated)
  })

  it('book_refs are deduped preserving first-seen order', async () => {
    const messages: LibrarianMessage[] = [
      mkText('user', 'Oi.'),
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'slug-a' },
          },
          { type: 'text', text: ' texto ' },
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'slug-b' },
          },
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'slug-a' }, // duplicate
          },
        ],
      },
    ]
    await saveChat({ chatId: 'c-dedup', messages })
    const raw = await fs.readFile(path.join(tmpDir, 'c-dedup.md'), 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    expect(data.book_refs).toEqual(['slug-a', 'slug-b'])
  })

  it('derives default title when no user messages exist', async () => {
    const messages: LibrarianMessage[] = [mkText('assistant', 'Sem user.')]
    await saveChat({ chatId: 'no-user', messages })
    const raw = await fs.readFile(path.join(tmpDir, 'no-user.md'), 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    expect(data.title).toBe('Conversa sem título')
  })

  it('truncates long titles to 60 chars with ellipsis', async () => {
    const longText = 'a'.repeat(200)
    await saveChat({
      chatId: 'long',
      messages: [mkText('user', longText)],
    })
    const raw = await fs.readFile(path.join(tmpDir, 'long.md'), 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    expect(data.title.length).toBeLessThanOrEqual(61) // 60 + ellipsis
    expect(data.title.endsWith('…')).toBe(true)
  })

  it('preserves renamed title and pinned state on later saves', async () => {
    const msgs: LibrarianMessage[] = [mkText('user', 'Primeiro título')]
    await saveChat({ chatId: 'custom', messages: msgs })

    const updated = await updateChatMetadata({
      chatId: 'custom',
      title: 'Minha conversa importante',
      pinned: true,
    })
    expect(updated?.title).toBe('Minha conversa importante')
    expect(updated?.title_locked).toBe(true)
    expect(updated?.pinned).toBe(true)

    await saveChat({
      chatId: 'custom',
      messages: [...msgs, mkText('assistant', 'Continuação.')],
    })

    const raw = await fs.readFile(path.join(tmpDir, 'custom.md'), 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    expect(data.title).toBe('Minha conversa importante')
    expect(data.title_locked).toBe(true)
    expect(data.pinned).toBe(true)
  })
})

describe('loadChat', () => {
  it('returns null when file is missing', async () => {
    const result = await loadChat('does-not-exist')
    expect(result).toBeNull()
  })

  it('round-trips a saved conversation', async () => {
    const original: LibrarianMessage[] = [
      mkText('user', 'Queria reler Tolkien, por onde começo?', '2026-04-17T15:35:00Z'),
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'A ordem clássica é' },
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'o-hobbit' },
          },
        ],
        metadata: { createdAt: '2026-04-17T15:36:00Z' },
      },
    ]
    await saveChat({ chatId: 'round-trip', messages: original })
    const loaded = await loadChat('round-trip')

    expect(loaded).not.toBeNull()
    expect(loaded!.map((m) => m.role)).toEqual(['user', 'assistant'])
    // Cards survive
    const assistantCards = loaded![1].parts.filter(
      (p) => p.type === 'tool-render_library_book_card',
    )
    expect(assistantCards).toHaveLength(1)
  })

  it('returns null and warns when frontmatter is malformed', async () => {
    // Invalid: missing required `id` field
    const malformed = `---
title: sem id
started_at: "2026-04-17T15:00:00Z"
updated_at: "2026-04-17T15:00:00Z"
---

## Você — 15:00

Hi.`
    await fs.writeFile(path.join(tmpDir, 'bad.md'), malformed, 'utf-8')
    const result = await loadChat('bad')
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('handles YAML Date coercion for started_at/updated_at', async () => {
    // Unquoted ISO dates — YAML (js-yaml) coerces to Date objects
    const raw = `---
id: yaml-date
title: Teste Date
started_at: 2026-04-17T15:00:00Z
updated_at: 2026-04-17T15:05:00Z
book_refs: []
---

## Você — 15:00

Mensagem.`
    await fs.writeFile(path.join(tmpDir, 'yaml-date.md'), raw, 'utf-8')
    const result = await loadChat('yaml-date')
    expect(result).not.toBeNull()
    expect(result!.length).toBeGreaterThanOrEqual(1)
  })
})
