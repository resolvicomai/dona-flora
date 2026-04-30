import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AIProviderSettings } from '@/lib/auth/db'
import { SectionHeader } from '../components/section-header'
import { StatusMessage } from '../components/status-message'
import { ToggleSetting } from '../components/toggle-setting'
import type { SettingsUiCopy } from '../copy'
import type { SaveStatus } from '../types'

export function ExternalAIPanel({
  fallbackApiKey,
  isSaving,
  onApiKeyChange,
  onProviderChange,
  onSave,
  providerSettings,
  strings,
  status,
}: {
  fallbackApiKey: string
  isSaving: boolean
  onApiKeyChange: (value: string) => void
  onProviderChange: React.Dispatch<React.SetStateAction<AIProviderSettings>>
  onSave: () => Promise<void>
  providerSettings: AIProviderSettings
  strings: SettingsUiCopy['external']
  status: SaveStatus
}) {
  return (
    <section className="brand-window p-6 md:p-7">
      <SectionHeader eyebrow={strings.eyebrow} title={strings.title} body={strings.body} />

      {status ? <StatusMessage status={status} /> : null}

      <div className="mt-7 space-y-5">
        <ToggleSetting
          checked={providerSettings.fallbackEnabled}
          description={strings.fallbackDescription}
          label={strings.fallbackLabel}
          onChange={(checked) =>
            onProviderChange((current) => ({
              ...current,
              fallbackEnabled: checked,
            }))
          }
        />

        {providerSettings.fallbackEnabled ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="eyebrow">{strings.fallbackModel}</span>
              <Input
                onChange={(event) =>
                  onProviderChange((current) => ({
                    ...current,
                    fallbackModel: event.target.value,
                  }))
                }
                spellCheck={false}
                value={providerSettings.fallbackModel}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="eyebrow">{strings.apiKeyLabel}</span>
              <Input
                autoComplete="off"
                onChange={(event) => onApiKeyChange(event.target.value)}
                placeholder={
                  providerSettings.fallbackApiKeyConfigured
                    ? strings.apiKeyPlaceholderConfigured
                    : strings.apiKeyPlaceholderEmpty
                }
                type="password"
                value={fallbackApiKey}
              />
            </label>
          </div>
        ) : null}

        <div className="brand-inset px-4 py-3 text-sm text-muted-foreground">
          {strings.apiKeyStatus}:{' '}
          <span className="font-medium text-foreground">
            {providerSettings.fallbackApiKeyConfigured ? strings.enabled : strings.disabled}
          </span>
        </div>

        <ToggleSetting
          checked={providerSettings.visionEnabled}
          description={strings.visionDescription}
          label={strings.visionLabel}
          onChange={(checked) =>
            onProviderChange((current) => ({
              ...current,
              visionEnabled: checked,
            }))
          }
        />

        {providerSettings.visionEnabled ? (
          <label className="flex flex-col gap-2">
            <span className="eyebrow">{strings.visionModel}</span>
            <Input
              onChange={(event) =>
                onProviderChange((current) => ({
                  ...current,
                  visionModel: event.target.value,
                }))
              }
              spellCheck={false}
              value={providerSettings.visionModel}
            />
          </label>
        ) : null}
      </div>

      <Button className="mt-6" disabled={isSaving} onClick={onSave} type="button">
        {isSaving ? strings.saving : strings.save}
      </Button>
    </section>
  )
}
