/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'
import { AccountMenu } from '../account-menu'

const push = jest.fn()
const refresh = jest.fn()
const signOut = jest.fn()

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, onClick, ...props }: MockLinkProps) => (
    <a
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault()
        onClick?.(event)
      }}
      {...props}
    />
  ),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push,
    refresh,
  }),
}))

jest.mock('@/lib/auth/client', () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOut(...args),
    useSession: () => ({
      data: {
        user: {
          email: 'mauro@local.donaflora.test',
          name: 'Mauro',
        },
      },
      isPending: false,
    }),
  },
}))

function renderAccountMenu() {
  return render(
    <AppLanguageProvider locale="pt-BR">
      <AccountMenu />
    </AppLanguageProvider>,
  )
}

beforeEach(() => {
  push.mockClear()
  refresh.mockClear()
  signOut.mockReset()
})

describe('AccountMenu', () => {
  test('fecha o menu ao navegar para Perfil', async () => {
    const user = userEvent.setup()

    renderAccountMenu()

    await user.click(screen.getByRole('button', { name: 'Abrir menu da conta' }))
    expect(screen.getByRole('link', { name: /Perfil/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Perfil/ }))

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Perfil/ })).not.toBeInTheDocument()
    })
  })

  test('fecha o menu ao navegar para Ajustes da Dona Flora', async () => {
    const user = userEvent.setup()

    renderAccountMenu()

    await user.click(screen.getByRole('button', { name: 'Abrir menu da conta' }))
    expect(screen.getByRole('link', { name: /Ajustes da Dona Flora/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Ajustes da Dona Flora/ }))

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Ajustes da Dona Flora/ })).not.toBeInTheDocument()
    })
  })

  test('fecha o menu antes de sair', async () => {
    const user = userEvent.setup()
    signOut.mockResolvedValue(undefined)

    renderAccountMenu()

    await user.click(screen.getByRole('button', { name: 'Abrir menu da conta' }))
    expect(screen.getByRole('button', { name: /Sair/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Sair/ }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Sair/ })).not.toBeInTheDocument()
    })
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/sign-in')
  })
})
