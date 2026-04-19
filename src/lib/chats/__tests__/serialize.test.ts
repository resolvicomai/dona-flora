import { serializeTranscript, parseTranscript } from '../serialize'
import type { LibrarianMessage } from '../types'

describe('serializeTranscript', () => {
  it('skips system messages', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'sys',
        role: 'system',
        parts: [{ type: 'text', text: 'You are Dona Flora.' }],
        metadata: { createdAt: '2026-04-17T15:35:00Z' },
      },
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'Oi.' }],
        metadata: { createdAt: '2026-04-17T15:35:00Z' },
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).not.toContain('You are Dona Flora')
    expect(out).toContain('## Você')
    expect(out).not.toContain('Dona Flora — ') // heading would start with 'Dona Flora — '
  })

  it('renders a user message with ## Você — HH:MM heading', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'Queria reler Tolkien.' }],
        metadata: { createdAt: '2026-04-17T15:35:00Z' },
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).toContain('## Você — 15:35')
    expect(out).toContain('Queria reler Tolkien.')
  })

  it('renders an assistant message with ## Dona Flora — HH:MM heading', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'a1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Claro.' }],
        metadata: { createdAt: '2026-04-17T15:41:00Z' },
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).toContain('## Dona Flora — 15:41')
    expect(out).toContain('Claro.')
  })

  it('uses --:-- when metadata.createdAt is absent', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'Sem timestamp.' }],
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).toContain('## Você — --:--')
  })

  it('uses --:-- when createdAt is invalid', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'Invalid date.' }],
        metadata: { createdAt: 'not-a-date' },
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).toContain('## Você — --:--')
  })

  it('renders tool-render_library_book_card as [[slug]] inline with text', () => {
    const messages: LibrarianMessage[] = [
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
          { type: 'text', text: 'depois siga para' },
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'o-senhor-dos-aneis-a-sociedade-do-anel' },
          },
        ],
        metadata: { createdAt: '2026-04-17T15:41:00Z' },
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).toContain('[[o-hobbit]]')
    expect(out).toContain('[[o-senhor-dos-aneis-a-sociedade-do-anel]]')
    // Inline order preserved
    expect(out.indexOf('Comece por')).toBeLessThan(out.indexOf('[[o-hobbit]]'))
    expect(out.indexOf('[[o-hobbit]]')).toBeLessThan(out.indexOf('depois siga para'))
  })

  it('renders tool-render_external_book_mention as > external: T — A — R', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Para algo parecido:' },
          {
            type: 'tool-render_external_book_mention',
            state: 'output-available',
            output: {
              title: 'Earthsea',
              author: 'Ursula K. Le Guin',
              reason: 'prosa contemplativa parecida',
            },
          },
        ],
        metadata: { createdAt: '2026-04-17T15:41:00Z' },
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).toContain(
      '> external: Earthsea — Ursula K. Le Guin — prosa contemplativa parecida'
    )
  })

  it('skips tool parts whose state is not output-available', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Streaming' },
          {
            type: 'tool-render_library_book_card',
            state: 'input-streaming',
          },
          {
            type: 'tool-render_external_book_mention',
            state: 'input-available',
          },
          { type: 'text', text: 'still going' },
        ],
        metadata: { createdAt: '2026-04-17T15:41:00Z' },
      },
    ]
    const out = serializeTranscript(messages)
    expect(out).not.toContain('[[')
    expect(out).not.toContain('> external:')
    expect(out).toContain('Streaming')
    expect(out).toContain('still going')
  })
})

describe('parseTranscript', () => {
  it('splits sections on ## headings and recovers role', () => {
    const md = [
      '## Você — 15:35',
      '',
      'Primeira mensagem.',
      '',
      '## Dona Flora — 15:35',
      '',
      'Resposta.',
    ].join('\n')
    const msgs = parseTranscript(md)
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('user')
    expect(msgs[1].role).toBe('assistant')
  })

  it('tokenizes [[slug]] as a library-card part', () => {
    const md = [
      '## Dona Flora — 15:35',
      '',
      'Comece por [[o-hobbit]] e siga.',
    ].join('\n')
    const msgs = parseTranscript(md)
    expect(msgs).toHaveLength(1)
    const parts = msgs[0].parts
    // Expect: text "Comece por", card "o-hobbit", text "e siga."
    expect(parts.length).toBeGreaterThanOrEqual(2)
    const cardPart = parts.find(
      (p) => p.type === 'tool-render_library_book_card'
    )
    expect(cardPart).toBeDefined()
    expect(cardPart).toMatchObject({
      type: 'tool-render_library_book_card',
      state: 'output-available',
      output: { slug: 'o-hobbit' },
    })
  })

  // WR-07: non-kebab wikilink captures (traversal, punctuation, Unicode)
  // do NOT forge a library-card part; they remain in the text flow.
  it('does NOT tokenize non-kebab wikilink captures as library-card parts', () => {
    const md = [
      '## Dona Flora — 15:35',
      '',
      'Um texto suspeito: [[../../etc/passwd]] e outro [[Título Qualquer]].',
    ].join('\n')
    const msgs = parseTranscript(md)
    expect(msgs).toHaveLength(1)
    const cardParts = msgs[0].parts.filter(
      (p) => p.type === 'tool-render_library_book_card',
    )
    expect(cardParts).toHaveLength(0)
  })

  it('tokenizes > external: lines as external-mention parts', () => {
    const md = [
      '## Dona Flora — 15:41',
      '',
      'Para algo parecido:',
      '> external: Earthsea — Ursula K. Le Guin — prosa contemplativa',
    ].join('\n')
    const msgs = parseTranscript(md)
    expect(msgs).toHaveLength(1)
    const externalPart = msgs[0].parts.find(
      (p) => p.type === 'tool-render_external_book_mention'
    )
    expect(externalPart).toBeDefined()
    expect(externalPart).toMatchObject({
      type: 'tool-render_external_book_mention',
      state: 'output-available',
      output: {
        title: 'Earthsea',
        author: 'Ursula K. Le Guin',
        reason: 'prosa contemplativa',
      },
    })
  })

  it('parseTranscript + serializeTranscript round-trips a 4-message conversation', () => {
    const messages: LibrarianMessage[] = [
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'Queria reler Tolkien, por onde começo?' }],
        metadata: { createdAt: '2026-04-17T15:35:00Z' },
      },
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
          { type: 'text', text: 'depois' },
          {
            type: 'tool-render_library_book_card',
            state: 'output-available',
            output: { slug: 'o-senhor-dos-aneis-a-sociedade-do-anel' },
          },
        ],
        metadata: { createdAt: '2026-04-17T15:35:00Z' },
      },
      {
        id: 'u2',
        role: 'user',
        parts: [{ type: 'text', text: 'E algo fora do meu acervo?' }],
        metadata: { createdAt: '2026-04-17T15:38:00Z' },
      },
      {
        id: 'a2',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Algo parecido:' },
          {
            type: 'tool-render_external_book_mention',
            state: 'output-available',
            output: {
              title: 'Earthsea',
              author: 'Ursula K. Le Guin',
              reason: 'prosa contemplativa parecida',
            },
          },
        ],
        metadata: { createdAt: '2026-04-17T15:41:00Z' },
      },
    ]

    const serialized = serializeTranscript(messages)
    const parsed = parseTranscript(serialized)

    // Same number of messages, same role order
    expect(parsed).toHaveLength(4)
    expect(parsed.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ])

    // Message 1: one text part with the exact string
    const m1Text = parsed[0].parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join(' ')
    expect(m1Text).toContain('Queria reler Tolkien')

    // Message 2: two card parts in order, with the right slugs
    const m2Cards = parsed[1].parts.filter(
      (p) => p.type === 'tool-render_library_book_card'
    ) as Array<{
      type: 'tool-render_library_book_card'
      state: string
      output?: { slug: string }
    }>
    expect(m2Cards).toHaveLength(2)
    expect(m2Cards[0].output?.slug).toBe('o-hobbit')
    expect(m2Cards[1].output?.slug).toBe('o-senhor-dos-aneis-a-sociedade-do-anel')

    // Message 4: one external part preserving all three fields
    const m4External = parsed[3].parts.find(
      (p) => p.type === 'tool-render_external_book_mention'
    ) as {
      type: 'tool-render_external_book_mention'
      state: string
      output?: { title: string; author: string; reason: string }
    } | undefined
    expect(m4External).toBeDefined()
    expect(m4External!.output).toEqual({
      title: 'Earthsea',
      author: 'Ursula K. Le Guin',
      reason: 'prosa contemplativa parecida',
    })
  })
})
