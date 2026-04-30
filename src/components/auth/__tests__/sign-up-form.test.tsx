/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'

import { SignUpForm, getFriendlySignUpError } from '../sign-up-form'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignUpEmail = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/sign-up',
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
  },
}))

beforeEach(() => {
  mockPush.mockClear()
  mockRefresh.mockClear()
  mockSignUpEmail.mockResolvedValue({ error: null })
})

describe('SignUpForm', () => {
  test('creates an offline account using a username-backed auth identifier', async () => {
    const user = userEvent.setup()
    render(
      <AppLanguageProvider locale="pt-BR">
        <SignUpForm />
      </AppLanguageProvider>,
    )

    await user.type(screen.getByLabelText('Nome'), 'Mauro')
    await user.type(screen.getByLabelText('Usuário'), ' Mauro_Dev ')
    await user.type(screen.getByLabelText('Senha'), 'super-senha')
    await user.type(screen.getByLabelText('Confirmar senha'), 'super-senha')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        email: 'mauro_dev@local.donaflora.test',
        name: 'Mauro',
        password: 'super-senha',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/settings?panel=library&onboarding=1')
    })
  })

  test('explains duplicate local users without exposing auth internals', () => {
    expect(getFriendlySignUpError('User already exists', 'Não foi possível criar a conta.')).toBe(
      'Esse usuário já existe nesta instalação. Entre com ele ou escolha outro nome.',
    )
  })

  test('explains invalid local usernames without mentioning synthetic email', () => {
    expect(getFriendlySignUpError('[body.email] Invalid email address', 'erro')).toBe(
      'Esse usuário não virou uma credencial local válida. Use letras, números, hífen ou underline.',
    )
  })
})
