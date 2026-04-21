/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'

import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'
import { ThemeProvider } from '@/components/app-shell/theme-provider'
import { APP_LANGUAGE_STORAGE_KEY } from '@/lib/i18n/app-language'

import { AuthShell } from '../auth-shell'

let prefersDark = false

jest.mock('next/navigation', () => ({
  usePathname: () => '/sign-in',
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      addEventListener: jest.fn(),
      addListener: jest.fn(),
      dispatchEvent: jest.fn(),
      matches: prefersDark,
      media: query,
      onchange: null,
      removeEventListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  })
})

describe('AuthShell accessibility controls', () => {
  beforeEach(() => {
    prefersDark = false
    window.localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-preference')
    document.documentElement.style.colorScheme = ''
  })

  function renderAuthShell() {
    return render(
      <AppLanguageProvider locale="pt-BR">
        <ThemeProvider>
          <AuthShell
            description="Entre para acessar seu acervo."
            eyebrow="Entrar"
            title="Sua biblioteca espera por voce."
          >
            <div>Form</div>
          </AuthShell>
        </ThemeProvider>
      </AppLanguageProvider>,
    )
  }

  test('renders theme and app-language controls on public auth screens', () => {
    renderAuthShell()

    expect(screen.getByRole('button', { name: 'Alterar tema' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Idioma do app' })).toBeInTheDocument()
  })

  test('separates institutional copy from the form card copy', () => {
    renderAuthShell()

    expect(screen.getByText('Seu espaço de leitura, memória e conversa.')).toBeInTheDocument()
    expect(screen.getByText('Sua biblioteca espera por voce.')).toBeInTheDocument()
    expect(screen.getByText('Tom, foco e idioma salvos')).toBeInTheDocument()
    expect(screen.getAllByText('Entrar')).toHaveLength(1)
  })

  test('switches language locally on auth screens and persists the preference', async () => {
    const user = userEvent.setup()
    renderAuthShell()

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('group', { name: 'App language' })).toBeInTheDocument()
    expect(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
