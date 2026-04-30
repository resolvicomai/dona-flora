import { renderMarkdown } from '../markdown'

describe('renderMarkdown', () => {
  it('renders bold text to <strong>', async () => {
    const html = await renderMarkdown('**bold**')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('renders heading to <h1>', async () => {
    const html = await renderMarkdown('# Heading')
    expect(html).toContain('<h1>Heading</h1>')
  })

  it('returns empty string for empty input', async () => {
    const html = await renderMarkdown('')
    expect(html).toBe('')
  })

  it('returns empty string for whitespace-only input', async () => {
    const html = await renderMarkdown('   \n  ')
    expect(html).toBe('')
  })

  it('sanitizes <script> tags (XSS prevention)', async () => {
    const html = await renderMarkdown("<script>alert('xss')</script>")
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('alert(')
  })

  it('sanitizes event handler attributes (XSS prevention)', async () => {
    const html = await renderMarkdown('<img onerror="alert(\'xss\')" src="x">')
    expect(html).not.toContain('onerror')
  })

  it('renders code blocks with <code> element', async () => {
    const html = await renderMarkdown('```\nconst x = 1\n```')
    expect(html).toContain('<code>')
  })

  it('renders inline code with <code> element', async () => {
    const html = await renderMarkdown('use `const` keyword')
    expect(html).toContain('<code>const</code>')
  })
})
