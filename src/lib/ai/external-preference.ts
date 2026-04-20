import { z } from 'zod'

export const ExternalPreferenceSchema = z.enum([
  'acervo',
  'ambos',
  'externo',
])

export type ExternalPreference = z.infer<typeof ExternalPreferenceSchema>

interface ExternalPreferenceMessagePart {
  output?: unknown
  state?: unknown
  type?: unknown
}

interface ExternalPreferenceMessage {
  parts?: ExternalPreferenceMessagePart[]
  role?: unknown
}

function isResolvedExternalMentionPart(part: ExternalPreferenceMessagePart) {
  if (part.type !== 'tool-render_external_book_mention') {
    return false
  }

  if (part.state === undefined) {
    return true
  }

  return part.state === 'output-available'
}

export function shouldOfferExternalPreference({
  messages,
  preference,
}: {
  messages: readonly ExternalPreferenceMessage[]
  preference?: ExternalPreference | null
}) {
  if (preference === 'acervo') {
    return false
  }

  const assistantTurns = messages.filter((message) => message.role === 'assistant')

  if (assistantTurns.length < 2) {
    return false
  }

  return assistantTurns
    .slice(-2)
    .every((message) => (message.parts ?? []).some(isResolvedExternalMentionPart))
}

export function buildExternalPreferenceDirective(
  preference?: ExternalPreference | null,
) {
  if (!preference) {
    return ''
  }

  switch (preference) {
    case 'acervo':
      return 'Preferência atual da conversa: recomende apenas livros do acervo. Se o acervo não cobrir bem o pedido, diga isso com honestidade e não complete com sugestões externas.'
    case 'ambos':
      return 'Preferência atual da conversa: você pode recomendar livros do acervo ou externos. Continue priorizando o acervo quando ele atender bem, e deixe explícito quando algo estiver fora da biblioteca.'
    case 'externo':
      return 'Preferência atual da conversa: priorize sugestões externas quando fizer recomendações. Você ainda pode citar o acervo para comparação, mas deixe nítido o que é externo e o que já está na biblioteca.'
  }
}
