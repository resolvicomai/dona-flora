import { SYSTEM_PROMPT_STATIC_HEADER, buildSystemPrompt } from '@/lib/ai/system-prompt'
import { librarianTools } from '@/lib/ai/tools'

describe('SYSTEM_PROMPT_STATIC_HEADER', () => {
  it("contains persona name 'Dona Flora'", () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('Dona Flora')
  })

  it("contains 'REGRAS INVIOLÁVEIS'", () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('REGRAS INVIOLÁVEIS')
  })

  it('mentions both tool names (render_library_book_card and render_external_book_mention)', () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('render_library_book_card')
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('render_external_book_mention')
  })

  it('does not teach the model to write pseudo tool calls as prose', () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).not.toContain('[chama ')
  })

  it('forbids the affected old-fashioned librarian tone', () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('robô antigo')
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('meu caro')
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('amigos do acervo')
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('não abra com cumprimentos longos')
  })

  it('tells the model to complete explicitly requested list counts', () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('top 10')
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('entregue exatamente essa quantidade')
  })

  it("forbids invention ('NUNCA invente')", () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('NUNCA invente')
  })

  it("forbids pretend-action ('nunca diga')", () => {
    expect(SYSTEM_PROMPT_STATIC_HEADER).toContain('nunca diga')
  })
})

describe('buildSystemPrompt', () => {
  it('wraps libraryContext in <LIBRARY></LIBRARY>', () => {
    const out = buildSystemPrompt('EXAMPLE-LIB-CONTEXT')
    expect(out).toContain('<LIBRARY>\nEXAMPLE-LIB-CONTEXT\n</LIBRARY>')
  })

  it('produces well-formed output even when libraryContext is empty', () => {
    const out = buildSystemPrompt('')
    expect(out).toContain('<LIBRARY>\n\n</LIBRARY>')
    expect(out).toContain('Dona Flora')
    expect(out).toContain('REGRAS INVIOLÁVEIS')
  })

  it('starts with the static header verbatim', () => {
    const out = buildSystemPrompt('X')
    expect(out.startsWith(SYSTEM_PROMPT_STATIC_HEADER)).toBe(true)
  })

  it('adds optional cross-chat conversation memory before library context', () => {
    const out = buildSystemPrompt('LIVROS', {
      conversationMemory: 'Conversa fixada sobre Tolkien',
    })

    expect(out).toContain(
      '<CONVERSATION_MEMORY>\nConversa fixada sobre Tolkien\n</CONVERSATION_MEMORY>',
    )
    expect(out.indexOf('<CONVERSATION_MEMORY>')).toBeLessThan(out.lastIndexOf('<LIBRARY>'))
  })
})

describe('librarianTools structural shape', () => {
  it('exposes exactly the two expected tool keys', () => {
    const keys = Object.keys(librarianTools).sort()
    expect(keys).toEqual(['render_external_book_mention', 'render_library_book_card'].sort())
  })
})
