/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { PageReturnLink } from '../page-return-link'

describe('PageReturnLink', () => {
  test('points back to the library by default', () => {
    render(<PageReturnLink />)

    const link = screen.getByRole('link', { name: 'Voltar para Biblioteca' })
    expect(link).toHaveAttribute('href', '/')
  })

  test('accepts a custom destination and label', () => {
    render(<PageReturnLink href="/chat" label="Voltar para Chat" />)

    const link = screen.getByRole('link', { name: 'Voltar para Chat' })
    expect(link).toHaveAttribute('href', '/chat')
  })
})
