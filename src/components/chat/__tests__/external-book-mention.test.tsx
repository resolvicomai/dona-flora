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

  test('renders the amber badge', () => {
    render(<ExternalBookMention {...baseProps} />)
    const tag = screen.getByText('Fora do acervo')
    expect(tag).toBeInTheDocument()
    expect(tag.className).toMatch(/rounded-md/)
  })

  test('renders title, author, and reason text', () => {
    render(<ExternalBookMention {...baseProps} />)
    // Title/author appear joined with em-dash in the component
    expect(screen.getByText(/Doutor Pasavento/)).toBeInTheDocument()
    expect(screen.getByText(/Vila-Matas/)).toBeInTheDocument()
    expect(
      screen.getByText(/Similar ao Grande Sertão pela densidade narrativa\./),
    ).toBeInTheDocument()
  })

  test('badge is present and no cover image is rendered', () => {
    const { container } = render(<ExternalBookMention {...baseProps} />)
    expect(screen.getByText('Fora do acervo')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  test("has role='note'", () => {
    render(<ExternalBookMention {...baseProps} />)
    expect(screen.getByRole('note')).toBeInTheDocument()
  })

  test("has aria-label 'Livro fora do acervo: {title} de {author}'", () => {
    render(<ExternalBookMention {...baseProps} />)
    expect(
      screen.getByLabelText('Livro fora do acervo: Doutor Pasavento de Vila-Matas'),
    ).toBeInTheDocument()
  })

  test('has native title attribute equal to reason prop', () => {
    render(<ExternalBookMention {...baseProps} />)
    const note = screen.getByRole('note')
    expect(note).toHaveAttribute('title', baseProps.reason)
  })

  test('is not a button or link (non-interactive note container)', () => {
    const { container } = render(<ExternalBookMention {...baseProps} />)
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    const note = screen.getByRole('note')
    expect(note.tagName).toBe('DIV')
  })

  test('has dashed border + italic styling (UI-SPEC contract)', () => {
    render(<ExternalBookMention {...baseProps} />)
    const note = screen.getByRole('note')
    expect(note.className).toMatch(/border-dashed/)
    expect(note.className).toMatch(/rounded-md/)
  })
})
