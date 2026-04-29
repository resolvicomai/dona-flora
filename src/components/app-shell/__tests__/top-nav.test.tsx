/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'

import { TopNav } from '../top-nav'

const refresh = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh }),
}))

jest.mock('@/components/add-book-dialog', () => ({
  AddBookDialog: () => null,
}))

jest.mock('@/components/account/account-menu', () => ({
  AccountMenu: () => null,
}))

jest.mock('../theme-toggle', () => ({
  ThemeToggle: () => null,
}))

describe('TopNav', () => {
  beforeEach(() => {
    refresh.mockClear()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }) as unknown as typeof fetch
  })

  test('renders English navigation labels when the app locale is en', () => {
    render(
      <AppLanguageProvider locale="en">
        <TopNav />
      </AppLanguageProvider>,
    )

    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Trails')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Personal library')).toBeInTheDocument()
  })

  test('renders the compact app-language selector in the top nav', () => {
    render(
      <AppLanguageProvider locale="pt-BR">
        <TopNav />
      </AppLanguageProvider>,
    )

    expect(screen.getByRole('group', { name: 'Idioma do app' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PT' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ES' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '中文' })).toBeInTheDocument()
  })

  test('persists a quick language switch from the top nav without leaving the page', async () => {
    const user = userEvent.setup()

    render(
      <AppLanguageProvider locale="pt-BR">
        <TopNav />
      </AppLanguageProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'EN' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings',
        expect.objectContaining({
          body: JSON.stringify({ language: 'en' }),
          headers: { 'content-type': 'application/json' },
          method: 'PUT',
        }),
      )
    })
    expect(refresh).toHaveBeenCalled()
  })
})
