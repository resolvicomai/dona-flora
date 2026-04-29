/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { THEME_STORAGE_KEY } from '@/lib/theme'

import { AppLanguageProvider } from '../app-language-provider'
import { ThemeProvider, useTheme } from '../theme-provider'
import { ThemeToggle } from '../theme-toggle'

let prefersDark = false
const mediaListeners = new Set<(event: MediaQueryListEvent) => void>()

function emitSystemThemeChange(nextValue: boolean) {
  prefersDark = nextValue

  for (const listener of mediaListeners) {
    listener({
      matches: nextValue,
      media: '(prefers-color-scheme: dark)',
    } as MediaQueryListEvent)
  }
}

function ThemeSnapshot() {
  const { resolvedTheme, theme } = useTheme()

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
    </div>
  )
}

function ThemeHarness() {
  return (
    <AppLanguageProvider locale="pt-BR">
      <ThemeProvider>
        <ThemeToggle />
        <ThemeSnapshot />
      </ThemeProvider>
    </AppLanguageProvider>
  )
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaListeners.add(listener)
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        mediaListeners.add(listener)
      },
      dispatchEvent: jest.fn(),
      matches: prefersDark,
      media: query,
      onchange: null,
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaListeners.delete(listener)
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        mediaListeners.delete(listener)
      },
    })),
  })
})

beforeEach(() => {
  prefersDark = false
  mediaListeners.clear()
  window.localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-theme-preference')
  document.documentElement.style.colorScheme = ''
})

describe('ThemeToggle', () => {
  test('cycles light, dark, and system selections with persisted preference', async () => {
    const user = userEvent.setup()

    render(<ThemeHarness />)

    const trigger = screen.getByRole('button', { name: 'Alterar tema' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /Claro/ }))

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(trigger).toHaveAttribute('title', 'Tema: Claro')

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /Escuro/ }))

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(trigger).toHaveAttribute('title', 'Tema: Escuro')

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /Automático/ }))

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    })

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    expect(document.documentElement).toHaveAttribute('data-theme-preference', 'system')
    expect(trigger).toHaveAttribute('title', 'Tema: Automático')
  })

  test('reflects the resolved theme when the system preference changes in automatic mode', async () => {
    const user = userEvent.setup()

    render(<ThemeHarness />)

    const trigger = screen.getByRole('button', { name: 'Alterar tema' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /Automático/ }))

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    })

    act(() => {
      emitSystemThemeChange(true)
    })

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })

    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')

    act(() => {
      emitSystemThemeChange(false)
    })

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    })

    expect(document.documentElement).not.toHaveClass('dark')
  })
})
