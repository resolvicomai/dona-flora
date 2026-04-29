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
          initialAIProviderSettings={{
            anthropicModel: 'claude-sonnet-4-6',
            compatibleBaseUrl: 'http://127.0.0.1:1234/v1',
            compatibleModel: 'local-model',
            fallbackApiKeyConfigured: false,
            fallbackEnabled: false,
            fallbackModel: 'anthropic/claude-sonnet-4.6',
            fallbackProvider: 'openrouter',
            ollamaBaseUrl: 'http://127.0.0.1:11434/v1',
            ollamaModel: 'qwen3.6:27b',
            openaiModel: 'gpt-4.1-mini',
            openrouterModel: 'anthropic/claude-sonnet-4.6',
            primaryApiKeyConfigured: false,
            primaryProvider: 'ollama',
            visionEnabled: false,
            visionModel: 'anthropic/claude-sonnet-4.6',
          }}
          initialLibrarySettings={{ booksDir: null }}
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
