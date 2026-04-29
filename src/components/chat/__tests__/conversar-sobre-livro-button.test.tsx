/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ConversarSobreLivroButton } from '../conversar-sobre-livro-button'

describe('ConversarSobreLivroButton', () => {
  test('renders a Link to /chat?about={slug}', () => {
    render(<ConversarSobreLivroButton slug="grande-sertao" titulo="Grande Sertão: Veredas" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/chat?about=grande-sertao')
  })

  test('URL-encodes the slug for safety', () => {
    // Phase 2 slugs are kebab-case ASCII already; still, defensive encoding
    // protects against a future change leaking unsafe chars into the URL.
    render(<ConversarSobreLivroButton slug="foo bar" titulo="Qualquer coisa" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/chat?about=foo%20bar')
  })

  test('has aria-label containing the book title', () => {
    render(<ConversarSobreLivroButton slug="grande-sertao" titulo="Grande Sertão: Veredas" />)
    expect(
      screen.getByLabelText('Conversar sobre Grande Sertão: Veredas com a Dona Flora'),
    ).toBeInTheDocument()
  })

  test("renders the Portuguese CTA 'Conversar sobre este livro'", () => {
    render(<ConversarSobreLivroButton slug="grande-sertao" titulo="Grande Sertão: Veredas" />)
    expect(screen.getByText('Conversar sobre este livro')).toBeInTheDocument()
  })

  test('renders the Sparkles icon as an aria-hidden SVG', () => {
    const { container } = render(
      <ConversarSobreLivroButton slug="grande-sertao" titulo="Grande Sertão" />,
    )
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
