/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ExternalBookMention } from '../external-book-mention'

describe('ExternalBookMention', () => {
  const baseProps = {
    title: 'Doutor Pasavento',
    author: 'Vila-Matas',
    reason: 'Similar ao Grande Sertão pela densidade narrativa.',
  }

  test("renders 'externo' tag (uppercase)", () => {
    render(<ExternalBookMention {...baseProps} />)
    const tag = screen.getByText('externo')
    expect(tag).toBeInTheDocument()
    expect(tag.className).toMatch(/uppercase/)
  })

  test('renders title and author text', () => {
    render(<ExternalBookMention {...baseProps} />)
    // Title/author appear joined with em-dash in the component
    expect(screen.getByText(/Doutor Pasavento/)).toBeInTheDocument()
    expect(screen.getByText(/Vila-Matas/)).toBeInTheDocument()
  })

  test('ArrowUpRight icon is present and aria-hidden', () => {
    const { container } = render(<ExternalBookMention {...baseProps} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  test("has role='note'", () => {
    render(<ExternalBookMention {...baseProps} />)
    expect(screen.getByRole('note')).toBeInTheDocument()
  })

  test("has aria-label 'Sugestão externa: {title} de {author}'", () => {
    render(<ExternalBookMention {...baseProps} />)
    expect(
      screen.getByLabelText('Sugestão externa: Doutor Pasavento de Vila-Matas'),
    ).toBeInTheDocument()
  })

  test('has native title attribute equal to reason prop', () => {
    render(<ExternalBookMention {...baseProps} />)
    const note = screen.getByRole('note')
    expect(note).toHaveAttribute('title', baseProps.reason)
  })

  test('is not a button or link (non-interactive span)', () => {
    const { container } = render(<ExternalBookMention {...baseProps} />)
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    // The wrapper is a <span>
    const note = screen.getByRole('note')
    expect(note.tagName).toBe('SPAN')
  })

  test('has dashed border + italic styling (UI-SPEC contract)', () => {
    render(<ExternalBookMention {...baseProps} />)
    const note = screen.getByRole('note')
    expect(note.className).toMatch(/border-dashed/)
    expect(note.className).toMatch(/italic/)
  })
})
