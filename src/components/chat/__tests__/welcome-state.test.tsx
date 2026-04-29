/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { WelcomeState } from '../welcome-state'

describe('WelcomeState', () => {
  test('renders the persona heading', () => {
    render(<WelcomeState bookCount={5} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Oi! Sou a Dona Flora, sua bibliotecária.',
    )
  })

  test('bookCount >= 2: body says "Você tem N livros aqui" with correct count', () => {
    render(<WelcomeState bookCount={47} />)
    expect(screen.getByText(/Você tem 47 livros aqui/)).toBeInTheDocument()
    // Ensure the singular branch is NOT rendered
    expect(screen.queryByText(/Você tem 1 livro aqui/)).toBeNull()
  })

  test('bookCount === 1: body says "Você tem 1 livro aqui" (no trailing s)', () => {
    render(<WelcomeState bookCount={1} />)
    expect(screen.getByText(/Você tem 1 livro aqui/)).toBeInTheDocument()
    // Ensure the plural branch is NOT rendered
    expect(screen.queryByText(/Você tem 1 livros aqui/)).toBeNull()
  })

  test('bookCount === 0: body says "Sua biblioteca ainda está vazia" + CTA "Ir para a biblioteca"', () => {
    render(<WelcomeState bookCount={0} />)
    expect(screen.getByText(/Sua biblioteca ainda está vazia/)).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /Ir para a biblioteca/ })
    expect(cta).toHaveAttribute('href', '/')
  })

  test('BookHeart icon has aria-hidden="true"', () => {
    const { container } = render(<WelcomeState bookCount={5} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
