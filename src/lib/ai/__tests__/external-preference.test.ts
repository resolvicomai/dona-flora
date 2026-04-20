import {
  buildExternalPreferenceDirective,
  shouldOfferExternalPreference,
} from '@/lib/ai/external-preference'

function externalAssistantTurn(id: string) {
  return {
    id,
    role: 'assistant',
    parts: [
      {
        type: 'tool-render_external_book_mention',
        state: 'output-available',
        output: {
          title: 'Os Detectives Selvagens',
          author: 'Roberto Bolaño',
          reason: 'Expande o horizonte sem abandonar a obsessão literária.',
        },
      },
    ],
  }
}

function assistantTextTurn(id: string) {
  return {
    id,
    role: 'assistant',
    parts: [{ type: 'text', text: 'Vamos olhar primeiro para o seu acervo.' }],
  }
}

describe('shouldOfferExternalPreference', () => {
  it('never offers the toggle on the first assistant turn', () => {
    expect(
      shouldOfferExternalPreference({
        messages: [externalAssistantTurn('a1')],
        preference: null,
      }),
    ).toBe(false)
  })

  it('offers the toggle only after the last two assistant turns mention externals', () => {
    expect(
      shouldOfferExternalPreference({
        messages: [externalAssistantTurn('a1'), externalAssistantTurn('a2')],
        preference: null,
      }),
    ).toBe(true)

    expect(
      shouldOfferExternalPreference({
        messages: [externalAssistantTurn('a1'), assistantTextTurn('a2')],
        preference: null,
      }),
    ).toBe(false)
  })

  it('hides the toggle when the conversation is pinned back to acervo', () => {
    expect(
      shouldOfferExternalPreference({
        messages: [externalAssistantTurn('a1'), externalAssistantTurn('a2')],
        preference: 'acervo',
      }),
    ).toBe(false)
  })

  it('does not persist the signal across conversations', () => {
    expect(
      shouldOfferExternalPreference({
        messages: [externalAssistantTurn('a1'), externalAssistantTurn('a2')],
        preference: 'ambos',
      }),
    ).toBe(true)

    expect(
      shouldOfferExternalPreference({
        messages: [],
        preference: null,
      }),
    ).toBe(false)
  })
})

describe('buildExternalPreferenceDirective', () => {
  it('returns an empty directive when there is no pinned preference', () => {
    expect(buildExternalPreferenceDirective(null)).toBe('')
  })

  it('returns a library-only directive for acervo', () => {
    expect(buildExternalPreferenceDirective('acervo')).toContain(
      'apenas livros do acervo',
    )
  })

  it('returns a dual-path directive for ambos', () => {
    expect(buildExternalPreferenceDirective('ambos')).toContain(
      'acervo ou externos',
    )
  })

  it('returns an external-first directive for externo', () => {
    expect(buildExternalPreferenceDirective('externo')).toContain(
      'priorize sugestões externas',
    )
  })
})
