/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'

import { SignInForm } from '../sign-in-form'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
    },
  },
}))

describe('SignInForm', () => {
  test('renders Spanish action labels when the app locale is es', () => {
    render(
      <AppLanguageProvider locale="es">
        <SignInForm />
      </AppLanguageProvider>,
    )

    expect(screen.getByText('Contraseña')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument()
  })
})
