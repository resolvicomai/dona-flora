/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { AppLanguageProvider } from '@/components/app-shell/app-language-provider'
import { SettingsForm } from '../settings-form'

const refresh = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({ refresh }),
}))

describe('SettingsForm', () => {
  beforeEach(() => {
    refresh.mockClear()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }) as unknown as typeof fetch
  })

  test('renders localized AI option labels when the app language is English', async () => {
    const user = userEvent.setup()

    render(
      <AppLanguageProvider locale="en">
        <SettingsForm
          initialSettings={{
            additionalInstructions: '',
            externalOpenness: 'sob-demanda',
            focus: 'equilibrado',
            language: 'en',
            responseStyle: 'conversa',
            tone: 'calorosa',
          }}
        />
      </AppLanguageProvider>,
    )

    expect(screen.getByText('Librarian preferences')).toBeInTheDocument()
    expect(screen.getByText('Warm')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Tone' }))

    expect(await screen.findByText('Analytical')).toBeInTheDocument()
    expect(screen.getByText('Assertive')).toBeInTheDocument()
  })
})
