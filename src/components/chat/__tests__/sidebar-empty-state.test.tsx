/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { SidebarEmptyState } from '../sidebar-empty-state'

describe('SidebarEmptyState', () => {
  test("renders pt-BR heading 'Nenhuma conversa ainda.'", () => {
    render(<SidebarEmptyState />)
    expect(screen.getByText('Nenhuma conversa ainda.')).toBeInTheDocument()
  })

  test('renders pt-BR body text', () => {
    render(<SidebarEmptyState />)
    expect(screen.getByText('Suas conversas com a Dona Flora aparecem aqui.')).toBeInTheDocument()
  })

  test("renders MessagesSquare icon (svg with aria-hidden='true')", () => {
    const { container } = render(<SidebarEmptyState />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  test('heading uses text-xl / font-semibold classes', () => {
    render(<SidebarEmptyState />)
    const heading = screen.getByText('Nenhuma conversa ainda.')
    expect(heading.className).toMatch(/text-xl/)
    expect(heading.className).toMatch(/font-semibold/)
  })
})
