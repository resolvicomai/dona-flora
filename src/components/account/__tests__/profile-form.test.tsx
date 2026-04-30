/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'
import { ProfileForm } from '../profile-form'

const refresh = jest.fn()
const push = jest.fn()
const refetch = jest.fn().mockResolvedValue(undefined)

jest.mock('next/navigation', () => ({
  usePathname: () => '/profile',
  useRouter: () => ({ refresh, push }),
}))

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          email: 'mauro@example.com',
          name: 'Mauro',
        },
      },
      error: null,
      isPending: false,
      isRefetching: false,
      refetch,
    }),
  },
}))

describe('ProfileForm', () => {
  beforeEach(() => {
    refresh.mockClear()
    push.mockClear()
    refetch.mockClear()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }) as unknown as typeof fetch
  })

  test('updates the visible display name and refetches the auth session after save', async () => {
    const user = userEvent.setup()

    render(
      <AppLanguageProvider locale="pt-BR">
        <ProfileForm
          profile={{
            displayName: 'Mauro',
            email: 'mauro@example.com',
            emailVerified: true,
            id: 'user-1',
            image: null,
            initials: 'MA',
            role: 'user',
          }}
        />
      </AppLanguageProvider>,
    )

    await user.clear(screen.getByDisplayValue('Mauro'))
    await user.type(screen.getByLabelText('Nome de exibicao'), 'Mauro Filho')
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }))

    await waitFor(() => {
      expect(refetch).toHaveBeenCalledTimes(1)
    })
    expect(screen.getAllByText('Mauro Filho')[0]).toBeInTheDocument()
    expect(refresh).toHaveBeenCalled()
  })
})
