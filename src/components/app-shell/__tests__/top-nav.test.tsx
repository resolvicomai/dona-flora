/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'

import { TopNav } from '../top-nav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
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
  test('renders English navigation labels when the app locale is en', () => {
    render(
      <AppLanguageProvider locale="en">
        <TopNav />
      </AppLanguageProvider>,
    )

    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Personal library')).toBeInTheDocument()
  })
})
