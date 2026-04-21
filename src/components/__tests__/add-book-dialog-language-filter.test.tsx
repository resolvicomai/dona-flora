/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AddBookDialog } from '@/components/add-book-dialog'
import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'

const refresh = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh }),
}))

describe('AddBookDialog language filter', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    refresh.mockClear()
    global.fetch = jest.fn().mockImplementation(async (input) => {
      if (input === '/api/books/search') {
        return {
          ok: true,
          json: async () => [],
        } as Response
      }

      return {
        ok: true,
        json: async () => ({ ok: true }),
      } as Response
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('threads the selected book language into search requests', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    render(
      <AppLanguageProvider locale="pt-BR">
        <AddBookDialog />
      </AppLanguageProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar livro' }))
    await user.click(screen.getByRole('button', { name: 'EN' }))
    await user.type(screen.getByPlaceholderText('Buscar por título ou ISBN…'), 'tolkien')

    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const searchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([input]) => input === '/api/books/search',
    )

    expect(searchCall).toBeDefined()
    expect(searchCall?.[1]).toMatchObject({
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    expect(JSON.parse(String(searchCall?.[1]?.body))).toEqual({
      language: 'en',
      query: 'tolkien',
    })
  })
})
