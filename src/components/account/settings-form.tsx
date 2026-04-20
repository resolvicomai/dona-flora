'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import {
  AI_EXTERNAL_OPENNESS_OPTIONS,
  AI_FOCUS_OPTIONS,
  AI_RESPONSE_STYLE_OPTIONS,
  AI_TONE_OPTIONS,
  getAIOptionLabel,
  type AISettings,
} from '@/lib/ai/settings'

export function SettingsForm({ initialSettings }: { initialSettings: AISettings }) {
  const router = useRouter()
  const { copy } = useAppLanguage()
  const [settings, setSettings] = useState(initialSettings)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSaving(true)

    const response = await fetch('/api/settings', {
      body: JSON.stringify(settings),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })

    setIsSaving(false)

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setError(payload?.error ?? copy.settings.error)
      return
    }

    setMessage(copy.settings.saved)
    startTransition(() => router.refresh())
  }

  return (
    <form className="page-frame flex flex-1 flex-col gap-6 pt-7 md:pt-9" onSubmit={handleSubmit}>
      <section className="panel-solid rounded-[2rem] p-6 md:p-7">
        <div className="max-w-3xl space-y-3">
          <p className="eyebrow">{copy.settings.subtitle}</p>
          <h1 className="text-[clamp(2.1rem,4vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.08em] text-foreground">
            {copy.settings.title}
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            {copy.settings.description}
          </p>
        </div>

        {message ? (
          <div className="mt-5 rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="eyebrow">{copy.settings.toneLabel}</span>
            <Select
              value={settings.tone}
              onValueChange={(value) =>
                value &&
                setSettings((current) => ({ ...current, tone: value as AISettings['tone'] }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() =>
                    getAIOptionLabel(
                      AI_TONE_OPTIONS,
                      settings.tone,
                      copy.settings.placeholders.tone,
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AI_TONE_OPTIONS.map((option) => (
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
                setSettings((current) => ({ ...current, focus: value as AISettings['focus'] }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() =>
                    getAIOptionLabel(
                      AI_FOCUS_OPTIONS,
                      settings.focus,
                      copy.settings.placeholders.focus,
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AI_FOCUS_OPTIONS.map((option) => (
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
                      AI_EXTERNAL_OPENNESS_OPTIONS,
                      settings.externalOpenness,
                      copy.settings.placeholders.externalOpenness,
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AI_EXTERNAL_OPENNESS_OPTIONS.map((option) => (
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
                      AI_RESPONSE_STYLE_OPTIONS,
                      settings.responseStyle,
                      copy.settings.placeholders.responseStyle,
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AI_RESPONSE_STYLE_OPTIONS.map((option) => (
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
      </section>
    </form>
  )
}
