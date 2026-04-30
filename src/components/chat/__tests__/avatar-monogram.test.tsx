/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { AvatarMonogram } from '../avatar-monogram'

describe('AvatarMonogram', () => {
  test("renders 'DF' text", () => {
    render(<AvatarMonogram />)
    expect(screen.getByText('DF')).toBeInTheDocument()
  })

  test("has aria-label 'Dona Flora'", () => {
    render(<AvatarMonogram />)
    expect(screen.getByLabelText('Dona Flora')).toBeInTheDocument()
  })

  test("'DF' text has aria-hidden=true (prevents screen reader from spelling it out)", () => {
    render(<AvatarMonogram />)
    const text = screen.getByText('DF')
    expect(text).toHaveAttribute('aria-hidden', 'true')
  })

  test('accepts className and merges with base classes', () => {
    render(<AvatarMonogram className="ring-2" />)
    const el = screen.getByLabelText('Dona Flora')
    // Base classes must still be present
    expect(el.className).toMatch(/rounded-md/)
    expect(el.className).toMatch(/crt-screen/)
    // Merged custom class must also be present
    expect(el.className).toMatch(/ring-2/)
  })
})
