import type * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { AppLanguageCopy } from '@/components/app-shell/app-language-copy'
import {
  getAIExternalOpennessOptions,
  getAIFocusOptions,
  getAIOptionLabel,
  getAIResponseStyleOptions,
  getAIToneOptions,
  type AISettings,
} from '@/lib/ai/settings'
import { SectionHeader } from '../components/section-header'
import { StatusMessage } from '../components/status-message'
import type { SaveStatus } from '../types'

export function PreferencesPanel({
  copy,
  externalOpennessOptions,
  focusOptions,
  isSaving,
  onSubmit,
  responseStyleOptions,
  setSettings,
  settings,
  status,
  toneOptions,
}: {
  copy: AppLanguageCopy
  externalOpennessOptions: ReturnType<typeof getAIExternalOpennessOptions>
  focusOptions: ReturnType<typeof getAIFocusOptions>
  isSaving: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  responseStyleOptions: ReturnType<typeof getAIResponseStyleOptions>
  setSettings: React.Dispatch<React.SetStateAction<AISettings>>
  settings: AISettings
  status: SaveStatus
  toneOptions: ReturnType<typeof getAIToneOptions>
}) {
  return (
    <form className="brand-window p-6 md:p-7" onSubmit={onSubmit}>
      <SectionHeader
        eyebrow={copy.settings.subtitle}
        title={copy.settings.title}
        body={copy.settings.description}
      />

      {status ? <StatusMessage status={status} /> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="eyebrow">{copy.settings.toneLabel}</span>
          <Select
            value={settings.tone}
            onValueChange={(value) =>
              value &&
              setSettings((current) => ({
                ...current,
                tone: value as AISettings['tone'],
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  getAIOptionLabel(toneOptions, settings.tone, copy.settings.placeholders.tone)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">{copy.settings.focusLabel}</span>
          <Select
            value={settings.focus}
            onValueChange={(value) =>
              value &&
              setSettings((current) => ({
                ...current,
                focus: value as AISettings['focus'],
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  getAIOptionLabel(focusOptions, settings.focus, copy.settings.placeholders.focus)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {focusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">{copy.settings.externalOpennessLabel}</span>
          <Select
            value={settings.externalOpenness}
            onValueChange={(value) =>
              value &&
              setSettings((current) => ({
                ...current,
                externalOpenness: value as AISettings['externalOpenness'],
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  getAIOptionLabel(
                    externalOpennessOptions,
                    settings.externalOpenness,
                    copy.settings.placeholders.externalOpenness,
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {externalOpennessOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="eyebrow">{copy.settings.responseStyleLabel}</span>
          <Select
            value={settings.responseStyle}
            onValueChange={(value) =>
              value &&
              setSettings((current) => ({
                ...current,
                responseStyle: value as AISettings['responseStyle'],
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  getAIOptionLabel(
                    responseStyleOptions,
                    settings.responseStyle,
                    copy.settings.placeholders.responseStyle,
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {responseStyleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-2 md:max-w-xs">
          <span className="eyebrow">{copy.settings.appLanguageLabel}</span>
          <Select
            value={settings.language}
            onValueChange={(value) =>
              value &&
              setSettings((current) => ({
                ...current,
                language: value,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  getAIOptionLabel(
                    copy.settings.languageOptions,
                    settings.language,
                    copy.settings.placeholders.language,
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {copy.settings.languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <label className="mt-6 flex flex-col gap-2">
        <span className="eyebrow">{copy.settings.additionalInstructionsLabel}</span>
        <Textarea
          maxLength={500}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              additionalInstructions: event.target.value,
            }))
          }
          placeholder={copy.settings.additionalInstructionsPlaceholder}
          value={settings.additionalInstructions}
        />
      </label>

      <Button className="mt-6" disabled={isSaving} type="submit">
        {isSaving ? copy.settings.saving : copy.settings.save}
      </Button>
    </form>
  )
}
