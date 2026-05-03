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
    _filename: 'cartas-diabo.md',
    _notes: '',
    added_at: '2026-04-20',
    author: ['C. S. Lewis'],
    status: 'lido',
    title: 'Cartas de um diabo a seu aprendiz',
    ...overrides,
  }
}

describe('book rating visibility in browse surfaces', () => {
  test('BookCard renders the current rating summary when a rating exists', () => {
    render(<BookCard book={makeBook({ rating: 4 })} />)

    expect(screen.getByLabelText('Nota: 4 de 5')).toBeInTheDocument()
  })

  test('BookRow renders the current rating summary when a rating exists', () => {
    render(<BookRow book={makeBook({ rating: 5 })} />)

    expect(screen.getByLabelText('Nota: 5 de 5')).toBeInTheDocument()
  })
})
