import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AIProviderSettings, AIPrimaryProvider } from '@/lib/auth/db'
import { SectionHeader } from '../components/section-header'
import { StatusMessage } from '../components/status-message'
import { AI_PROVIDER_OPTIONS } from '../constants'
import type { SettingsUiCopy } from '../copy'
import { getSelectedProviderModel, setSelectedProviderModel } from '../helpers'
import type { SaveStatus } from '../types'

export function LocalAIPanel({
  availableModels,
  isSaving,
  isTesting,
  onPrimaryProviderSelect,
  onProviderChange,
  onPrimaryApiKeyChange,
  onSave,
  onTest,
  primaryApiKey,
  providerSettings,
  providerStrings,
  setShowManualModel,
  showManualModel,
  strings,
  status,
  testStatus,
}: {
  availableModels: string[]
  isSaving: boolean
  isTesting: boolean
  onPrimaryProviderSelect: (provider: AIPrimaryProvider) => void
  onProviderChange: React.Dispatch<React.SetStateAction<AIProviderSettings>>
  onPrimaryApiKeyChange: (value: string) => void
  onSave: () => Promise<void>
  onTest: () => Promise<void>
  primaryApiKey: string
  providerSettings: AIProviderSettings
  providerStrings: SettingsUiCopy['providerOptions']
  setShowManualModel: React.Dispatch<React.SetStateAction<boolean>>
  showManualModel: boolean
  strings: SettingsUiCopy['localAI']
  status: SaveStatus
  testStatus: SaveStatus
}) {
  const selectedModel = getSelectedProviderModel(providerSettings)
  const modelChoices = Array.from(new Set([selectedModel, ...availableModels].filter(Boolean)))
  const visibleModelChoices = modelChoices.slice(0, 24)
  const needsPrimaryKey = !['ollama', 'openai-compatible'].includes(
    providerSettings.primaryProvider,
  )
  const canUsePrimaryKey = providerSettings.primaryProvider !== 'ollama'
  const isCompatible = providerSettings.primaryProvider === 'openai-compatible'
  const isOllama = providerSettings.primaryProvider === 'ollama'

  return (
    <section className="brand-window p-6 md:p-7">
      <SectionHeader eyebrow={strings.eyebrow} title={strings.title} body={strings.body} />

      {status ? <StatusMessage status={status} /> : null}

      <div className="mt-7 grid gap-3 lg:grid-cols-5">
        {AI_PROVIDER_OPTIONS.map((option) => {
          const optionCopy = providerStrings[option.id]
          const isActive = providerSettings.primaryProvider === option.id
          return (
            <button
              aria-pressed={isActive}
              className={`surface-transition rounded-lg border p-4 text-left ${
                isActive
                  ? 'border-transparent bg-primary text-primary-foreground shadow-mac-sm'
                  : 'border-hairline bg-surface text-foreground hover:bg-surface-elevated'
              }`}
              key={option.id}
              onClick={() => onPrimaryProviderSelect(option.id)}
              type="button"
            >
              <span className={`eyebrow ${isActive ? 'text-primary-foreground/75' : ''}`}>
                {optionCopy.meta}
              </span>
              <span className="mt-3 block text-sm font-semibold">{optionCopy.label}</span>
              <span
                className={`mt-2 block text-xs leading-5 ${
                  isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {optionCopy.body}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
        {isOllama || isCompatible ? (
          <label className="flex flex-col gap-2">
            <span className="eyebrow">{isOllama ? strings.urlOllama : strings.urlCompatible}</span>
            <Input
              onChange={(event) =>
                onProviderChange((current) =>
                  isOllama
                    ? {
                        ...current,
                        ollamaBaseUrl: event.target.value,
                      }
                    : {
                        ...current,
                        compatibleBaseUrl: event.target.value,
                      },
                )
              }
              placeholder={isOllama ? 'http://127.0.0.1:11434/v1' : 'http://127.0.0.1:1234/v1'}
              spellCheck={false}
              value={isOllama ? providerSettings.ollamaBaseUrl : providerSettings.compatibleBaseUrl}
            />
            <span className="text-xs leading-5 text-muted-foreground">
              {isOllama ? strings.ollamaHint : strings.compatibleHint}
            </span>
          </label>
        ) : (
          <label className="flex flex-col gap-2">
            <span className="eyebrow">
              {strings.apiKeyLabel(providerStrings[providerSettings.primaryProvider].label)}
            </span>
            <Input
              autoComplete="off"
              onChange={(event) => onPrimaryApiKeyChange(event.target.value)}
              placeholder={
                providerSettings.primaryApiKeyConfigured
                  ? strings.apiKeyPlaceholderConfigured
                  : strings.apiKeyPlaceholderEmpty
              }
              type="password"
              value={primaryApiKey}
            />
            <span className="text-xs leading-5 text-muted-foreground">
              {strings.apiKeyEncryptionNote}
            </span>
          </label>
        )}

        <Button
          className="h-11 w-full"
          disabled={isTesting}
          onClick={onTest}
          type="button"
          variant="outline"
        >
          {isTesting ? strings.testing : strings.test}
        </Button>
      </div>

      {isCompatible ? (
        <label className="mt-5 flex flex-col gap-2">
          <span className="eyebrow">{strings.compatibleToken}</span>
          <Input
            autoComplete="off"
            onChange={(event) => onPrimaryApiKeyChange(event.target.value)}
            placeholder={
              providerSettings.primaryApiKeyConfigured
                ? strings.tokenPlaceholderConfigured
                : strings.tokenPlaceholderEmpty
            }
            type="password"
            value={primaryApiKey}
          />
        </label>
      ) : null}

      {testStatus ? <StatusMessage status={testStatus} /> : null}

      <div className="brand-inset mt-6 px-4 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-foreground">{strings.modelPicked}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedModel ? selectedModel : strings.modelMissing}
            </p>
            {needsPrimaryKey ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {strings.keyStatus}:{' '}
                <span className="font-medium text-foreground">
                  {providerSettings.primaryApiKeyConfigured
                    ? strings.keyConfigured
                    : strings.keyMissing}
                </span>
              </p>
            ) : null}
          </div>
          <Button
            onClick={() => setShowManualModel((current) => !current)}
            type="button"
            variant="ghost"
          >
            {showManualModel ? strings.hideManual : strings.showManual}
          </Button>
        </div>

        {visibleModelChoices.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleModelChoices.map((modelId) => (
              <button
                className={`surface-transition rounded-full border px-3 py-1.5 text-xs font-medium ${
                  selectedModel === modelId
                    ? 'border-transparent bg-primary text-primary-foreground shadow-mac-sm'
                    : 'border-hairline bg-surface text-muted-foreground hover:border-hairline-strong hover:text-foreground'
                }`}
                key={modelId}
                onClick={() =>
                  onProviderChange((current) => setSelectedProviderModel(current, modelId))
                }
                type="button"
              >
                {modelId}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{strings.testPrompt}</p>
        )}

        {modelChoices.length > visibleModelChoices.length ? (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {strings.modelsTruncated(visibleModelChoices.length)}
          </p>
        ) : null}

        {showManualModel ? (
          <label className="mt-5 flex flex-col gap-2">
            <span className="eyebrow">{strings.manualModel}</span>
            <Input
              onChange={(event) =>
                onProviderChange((current) => setSelectedProviderModel(current, event.target.value))
              }
              spellCheck={false}
              value={selectedModel}
            />
            <span className="text-xs leading-5 text-muted-foreground">{strings.manualHelper}</span>
          </label>
        ) : null}
      </div>

      {canUsePrimaryKey ? (
        <div className="mt-5 rounded-md border border-hairline bg-surface px-4 py-3 text-xs leading-5 text-muted-foreground">
          {strings.noOAuth}
        </div>
      ) : null}

      <Button className="mt-6" disabled={isSaving} onClick={onSave} type="button">
        {isSaving ? strings.saving : strings.save}
      </Button>
    </section>
  )
}
