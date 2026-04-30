/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { PasswordInput } from '../password-input'

describe('PasswordInput', () => {
  test('toggles between hidden and visible password states', async () => {
    const user = userEvent.setup()

    render(<PasswordInput aria-label="Senha" value="segredo" onChange={() => {}} />)

    const input = screen.getByLabelText('Senha')
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })

    expect(input).toHaveAttribute('type', 'password')

    await user.click(toggle)

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument()
  })
})
