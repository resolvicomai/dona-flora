/**
 * Shared chat/librarian message types.
 *
 * These mirror the AI SDK v6 `UIMessage` shape (parts[] rather than content: string)
 * but avoid a direct dependency on `ai` / `@ai-sdk/*` packages — those land in Plan 03.
 * Defining the contract here lets `store.ts` (Plan 02) and `route.ts` (Plan 03) agree
 * on the same message shape without a circular install dependency. Downstream code
 * can bridge to the AI SDK via `as unknown as UIMessage<never, UIDataTypes, LibrarianTools>`
 * when the SDK lands.
 */

export type LibrarianToolName = 'render_library_book_card' | 'render_external_book_mention'

export interface LibrarianMessageTextPart {
  type: 'text'
  text: string
}

export interface LibrarianMessageToolLibraryBookCardPart {
  type: 'tool-render_library_book_card'
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  output?: { slug: string }
}

export interface LibrarianMessageToolExternalMentionPart {
  type: 'tool-render_external_book_mention'
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  output?: { title: string; author: string; reason: string }
}

export type LibrarianMessagePart =
  | LibrarianMessageTextPart
  | LibrarianMessageToolLibraryBookCardPart
  | LibrarianMessageToolExternalMentionPart

export interface LibrarianMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: LibrarianMessagePart[]
  metadata?: { createdAt?: string }
}
