/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'
import { AddBookDialog } from '@/components/books/add-book-dialog'

const refresh = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh }),
}))

describe('AddBookDialog ISBN manual fallback', () => {
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
        json: async () => ({ slug: 'maquinas-eticas' }),
      } as Response
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('lets the user manually catalog a valid ISBN that public providers did not find', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    render(
      <AppLanguageProvider locale="pt-BR">
        <AddBookDialog />
      </AppLanguageProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar livro' }))
    await user.type(screen.getByPlaceholderText('Buscar por título ou ISBN…'), '978-85-508-2240-2')

    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    expect(await screen.findByText(/ISBN válido, mas não encontrei/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Cadastrar manualmente com este ISBN/i }))

    expect(screen.getByLabelText('ISBN')).toHaveValue('978-85-508-2240-2')

    await user.type(screen.getByLabelText(/Título do livro/i), 'Máquinas éticas')
    await user.type(screen.getByLabelText(/Autor/i), 'Reid Blackman')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/books',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    const createCall = (global.fetch as jest.Mock).mock.calls.find(
      ([input]) => input === '/api/books',
    )

    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      author: 'Reid Blackman',
      isbn_13: '9788550822402',
      status: 'quero-ler',
      title: 'Máquinas éticas',
    })
  })
})
