/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { BookCard } from '../book-card'
import { BookRow } from '../book-row'
import type { Book } from '@/lib/books/schema'

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    _filename: 'dom-casmurro.md',
    _notes: '',
    added_at: '2026-04-20',
    author: 'Machado de Assis',
    status: 'lido',
    title: 'Dom Casmurro',
    ...overrides,
  }
}

describe('book language visibility in browse surfaces', () => {
  test('BookCard renders the compact language badge when language exists', () => {
    render(<BookCard book={makeBook({ language: 'pt-BR' })} />)

    expect(screen.getByText('PT-BR')).toBeInTheDocument()
  })

  test('BookRow renders the compact language badge when language exists', () => {
    render(<BookRow book={makeBook({ language: 'pt-BR' })} />)

    expect(screen.getByText('PT-BR')).toBeInTheDocument()
  })
})
