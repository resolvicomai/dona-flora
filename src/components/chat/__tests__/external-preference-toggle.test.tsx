/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { ExternalPreferenceToggle } from '../external-preference-toggle'

function Harness() {
  const [value, setValue] = useState<null | 'acervo' | 'ambos' | 'externo'>(null)

  return <ExternalPreferenceToggle value={value} onChange={setValue} />
}

describe('ExternalPreferenceToggle', () => {
  test('renders a radiogroup with the three expected options', () => {
    render(<Harness />)

    expect(
      screen.getByRole('radiogroup', {
        name: 'Preferência de recomendação',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('radio', {
        name: 'Recomendar apenas do meu acervo',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', {
        name: 'Recomendar do acervo ou externos',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', {
        name: 'Recomendar apenas externos',
      }),
    ).toBeInTheDocument()
  })

  test('starts with no active option and updates locally when the user picks one', async () => {
    const user = userEvent.setup()

    render(<Harness />)

    const acervo = screen.getByRole('radio', {
      name: 'Recomendar apenas do meu acervo',
    })
    const ambos = screen.getByRole('radio', {
      name: 'Recomendar do acervo ou externos',
    })
    const externo = screen.getByRole('radio', {
      name: 'Recomendar apenas externos',
    })

    expect(acervo).toHaveAttribute('aria-checked', 'false')
    expect(ambos).toHaveAttribute('aria-checked', 'false')
    expect(externo).toHaveAttribute('aria-checked', 'false')

    await user.click(externo)

    expect(externo).toHaveAttribute('aria-checked', 'true')
    expect(acervo).toHaveAttribute('aria-checked', 'false')

    await user.click(acervo)

    expect(acervo).toHaveAttribute('aria-checked', 'true')
    expect(externo).toHaveAttribute('aria-checked', 'false')
  })
})
