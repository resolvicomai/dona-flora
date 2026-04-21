import { renderMarkdown } from '@/lib/markdown'

interface MarkdownContentProps {
  content: string
}

export async function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content.trim()) {
    return (
      <p className="text-sm italic text-muted-foreground">
        Nenhuma nota ainda. Clique em &apos;Editar notas&apos; para comecar.
      </p>
    )
  }
  const html = await renderMarkdown(content)
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
