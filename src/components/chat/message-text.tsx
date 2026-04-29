'use client'

import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

interface MessageTextProps {
  text: string
}

/**
 * Client-side Markdown renderer for assistant message parts. Streaming-safe —
 * react-markdown re-parses on every prop change, tolerating partial Markdown
 * (e.g. `**bold unfinished`) without crashing.
 *
 * Security: `rehype-sanitize` strips raw HTML from the AST (T-04-17 mitigation).
 * We deliberately do NOT include rehype-raw; any HTML embedded in the stream
 * gets dropped before it reaches the DOM.
 *
 * Typography: wrapped in the chat markdown class so assistant responses stay
 * compact and readable inside a conversation bubble. h1 and h2 are downgraded
 * to h3 (assistant responses must not own h1/h2 on the page).
 */
export function MessageText({ text }: MessageTextProps) {
  return (
    <div className="chat-markdown max-w-none break-words">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          // UI-SPEC §Typography: limit response headings to h3-h5
          h1: ({ children }) => <h3>{children}</h3>,
          h2: ({ children }) => <h3>{children}</h3>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
