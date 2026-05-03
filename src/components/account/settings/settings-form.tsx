'use client'

import type * as React from 'react'
import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import {
  getAIExternalOpennessOptions,
  getAIFocusOptions,
  getAIResponseStyleOptions,
  getAIToneOptions,
} from '@/lib/ai/settings'
import type { AIProviderSettings, AIPrimaryProvider } from '@/lib/auth/db'
import { SETTINGS_PANELS } from './constants'
import { SETTINGS_UI_COPY } from './copy'
import {
  getInitialSettingsPanel,
  getProviderBaseUrl,
  getSelectedProviderModel,
  setSelectedProviderModel,
} from './helpers'
import { ExternalAIPanel } from './panels/external-ai-panel'
import { LibraryPanel } from './panels/library-panel'
import { LocalAIPanel } from './panels/local-ai-panel'
import { PreferencesPanel } from './panels/preferences-panel'
import type { LibraryBrowseState, SaveStatus, SettingsFormProps, SettingsPanel } from './types'

export function SettingsForm({
  initialAIProviderSettings,
  initialLibrarySettings,
  initialSettings,
}: SettingsFormProps) {
  const router = useRouter()
  const { copy, locale } = useAppLanguage()
  const settingsCopy = SETTINGS_UI_COPY[locale]
  const [activePanel, setActivePanel] = useState<SettingsPanel>(getInitialSettingsPanel)
  const [settings, setSettings] = useState(initialSettings)
  const [libraryBooksDir, setLibraryBooksDir] = useState(initialLibrarySettings.booksDir ?? '')
  const [providerSettings, setProviderSettings] = useState(initialAIProviderSettings)
  const [primaryApiKey, setPrimaryApiKey] = useState('')
  const [fallbackApiKey, setFallbackApiKey] = useState('')
  const [preferencesStatus, setPreferencesStatus] = useState<SaveStatus>(null)
  const [libraryStatus, setLibraryStatus] = useState<SaveStatus>(null)
  const [libraryBrowseStatus, setLibraryBrowseStatus] = useState<SaveStatus>(null)
  const [libraryIndexStatus, setLibraryIndexStatus] = useState<SaveStatus>(null)
  const [providerStatus, setProviderStatus] = useState<SaveStatus>(null)
  const [providerTestStatus, setProviderTestStatus] = useState<SaveStatus>(null)
  const [libraryBrowse, setLibraryBrowse] = useState<LibraryBrowseState>(null)
  const [mdFileCount, setMdFileCount] = useState<number | null>(null)
  const [availableProviderModels, setAvailableProviderModels] = useState<string[]>([])
  const [showManualModel, setShowManualModel] = useState(false)
  const [isBrowsingLibrary, setIsBrowsingLibrary] = useState(false)
  const [isLibraryBrowserOpen, setIsLibraryBrowserOpen] = useState(false)
  const [isReindexingLibrary, setIsReindexingLibrary] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isSavingLibrary, setIsSavingLibrary] = useState(false)
  const [isSavingProvider, setIsSavingProvider] = useState(false)
  const [isTestingProvider, setIsTestingProvider] = useState(false)
  const toneOptions = getAIToneOptions(locale)
  const focusOptions = getAIFocusOptions(locale)
  const externalOpennessOptions = getAIExternalOpennessOptions(locale)
  const responseStyleOptions = getAIResponseStyleOptions(locale)

  function selectPrimaryProvider(provider: AIPrimaryProvider) {
    setProviderSettings((current) => ({
      ...current,
      primaryProvider: provider,
    }))
    setPrimaryApiKey('')
    setAvailableProviderModels([])
    setProviderTestStatus(null)
    setShowManualModel(false)
  }

  async function handlePreferencesSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPreferencesStatus(null)
    setIsSavingPreferences(true)

    let response: Response
    try {
      response = await fetch('/api/settings', {
        body: JSON.stringify(settings),
        headers: { 'content-type': 'application/json' },
        method: 'PUT',
      })
    } catch {
      setIsSavingPreferences(false)
      setPreferencesStatus({ kind: 'error', message: copy.settings.error })
      return
    }

    setIsSavingPreferences(false)

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      setPreferencesStatus({
        kind: 'error',
        message: payload?.error ?? copy.settings.error,
      })
      return
    }

    setPreferencesStatus({ kind: 'success', message: copy.settings.saved })
    startTransition(() => router.refresh())
  }

  async function handleLibrarySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLibraryStatus(null)
    setIsSavingLibrary(true)

    let response: Response
    try {
      response = await fetch('/api/settings/library', {
        body: JSON.stringify({ booksDir: libraryBooksDir }),
        headers: { 'content-type': 'application/json' },
        method: 'PUT',
      })
    } catch {
      setIsSavingLibrary(false)
      setLibraryStatus({ kind: 'error', message: settingsCopy.library.connectError })
      return
    }

    setIsSavingLibrary(false)

    const payload = (await response.json().catch(() => null)) as {
      booksDir?: string
      error?: string
      mdFileCount?: number
    } | null

    if (!response.ok) {
      setLibraryStatus({
        kind: 'error',
        message: payload?.error ?? settingsCopy.library.connectError,
      })
      return
    }

    setLibraryBooksDir(payload?.booksDir ?? libraryBooksDir)
    setMdFileCount(payload?.mdFileCount ?? null)
    setLibraryStatus({
      kind: 'success',
      message: settingsCopy.library.connected(payload?.mdFileCount ?? 0),
    })
    startTransition(() => router.refresh())
  }

  async function browseLibraryDirectory(pathToOpen?: string) {
    setLibraryBrowseStatus(null)
    setIsBrowsingLibrary(true)
    setIsLibraryBrowserOpen(true)

    const params = new URLSearchParams()
    if (pathToOpen) params.set('path', pathToOpen)

    let response: Response
    try {
      response = await fetch(
        `/api/settings/library/browse${params.size > 0 ? `?${params.toString()}` : ''}`,
      )
    } catch {
      setIsBrowsingLibrary(false)
      setLibraryBrowseStatus({ kind: 'error', message: settingsCopy.library.browseError })
      return
    }
    const payload = (await response.json().catch(() => null)) as
      | (NonNullable<LibraryBrowseState> & { error?: string })
      | null

    setIsBrowsingLibrary(false)

    if (!response.ok || !payload) {
      setLibraryBrowseStatus({
        kind: 'error',
        message: payload?.error ?? settingsCopy.library.browseError,
      })
      return
    }

    setLibraryBrowse({
      entries: payload.entries,
      mdFileCount: payload.mdFileCount,
      parent: payload.parent,
      path: payload.path,
      shortcuts: payload.shortcuts,
    })
  }

  async function handleLibraryReindex() {
    setLibraryIndexStatus(null)
    setIsReindexingLibrary(true)

    let response: Response
    try {
      response = await fetch('/api/library/reindex', { method: 'POST' })
    } catch {
      setIsReindexingLibrary(false)
      setLibraryIndexStatus({ kind: 'error', message: settingsCopy.library.indexError })
      return
    }
    const payload = (await response.json().catch(() => null)) as {
      bookCount?: number
      contextChars?: number
      error?: string
    } | null

    setIsReindexingLibrary(false)

    if (!response.ok || !payload) {
      setLibraryIndexStatus({
        kind: 'error',
        message: payload?.error ?? settingsCopy.library.indexError,
      })
      return
    }

    setLibraryIndexStatus({
      kind: 'success',
      message: settingsCopy.library.reindexed(payload.bookCount ?? 0, payload.contextChars ?? 0),
    })
  }

  async function saveProviderSettings() {
    setProviderStatus(null)
    setIsSavingProvider(true)

    let response: Response
    try {
      response = await fetch('/api/settings/ai-provider', {
        body: JSON.stringify({
          anthropicModel: providerSettings.anthropicModel,
          compatibleBaseUrl: providerSettings.compatibleBaseUrl,
          compatibleModel: providerSettings.compatibleModel,
          fallbackApiKey: fallbackApiKey.trim() || undefined,
          fallbackEnabled: providerSettings.fallbackEnabled,
          fallbackModel: providerSettings.fallbackModel,
          fallbackProvider: 'openrouter',
          ollamaBaseUrl: providerSettings.ollamaBaseUrl,
          ollamaModel: providerSettings.ollamaModel,
          openaiModel: providerSettings.openaiModel,
          openrouterModel: providerSettings.openrouterModel,
          primaryApiKey: primaryApiKey.trim() || undefined,
          primaryProvider: providerSettings.primaryProvider,
          visionEnabled: providerSettings.visionEnabled,
          visionModel: providerSettings.visionModel,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'PUT',
      })
    } catch {
      setIsSavingProvider(false)
      setProviderStatus({ kind: 'error', message: settingsCopy.localAI.providerError })
      return
    }

    setIsSavingProvider(false)

    const payload = (await response.json().catch(() => null)) as {
      error?: string
      settings?: AIProviderSettings
    } | null

    if (!response.ok || !payload?.settings) {
      setProviderStatus({
        kind: 'error',
        message: payload?.error ?? settingsCopy.localAI.providerError,
      })
      return
    }

    setProviderSettings(payload.settings)
    setPrimaryApiKey('')
    setFallbackApiKey('')
    setProviderStatus({
      kind: 'success',
      message: settingsCopy.localAI.saved(
        settingsCopy.providerOptions[payload.settings.primaryProvider].label,
      ),
    })
    startTransition(() => router.refresh())
  }

  async function handleProviderTest() {
    setProviderTestStatus(null)
    setAvailableProviderModels([])
    setIsTestingProvider(true)

    let response: Response
    try {
      response = await fetch('/api/settings/ai-provider/test', {
        body: JSON.stringify({
          apiKey: primaryApiKey.trim() || undefined,
          baseUrl: getProviderBaseUrl(providerSettings),
          provider: providerSettings.primaryProvider,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
    } catch {
      setIsTestingProvider(false)
      setProviderTestStatus({ kind: 'error', message: settingsCopy.localAI.providerError })
      return
    }
    const payload = (await response.json().catch(() => null)) as {
      error?: string
      models?: Array<{ id: string }>
      recommendedModel?: string | null
    } | null

    setIsTestingProvider(false)

    if (!response.ok || !payload) {
      setProviderTestStatus({
        kind: 'error',
        message: payload?.error ?? settingsCopy.localAI.providerError,
      })
      return
    }

    const modelIds = (payload.models ?? []).map((model) => model.id)
    setAvailableProviderModels(modelIds)
    if (payload.recommendedModel && !getSelectedProviderModel(providerSettings)) {
      setProviderSettings((current) =>
        setSelectedProviderModel(current, payload.recommendedModel ?? ''),
      )
    }
    setProviderTestStatus({
      kind: 'success',
      message:
        modelIds.length > 0
          ? settingsCopy.localAI.modelsFound(modelIds.length)
          : settingsCopy.localAI.modelsEmpty,
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="brand-window h-fit p-3">
          <div className="px-3 pb-3 pt-2">
            <p className="eyebrow">{settingsCopy.aside.eyebrow}</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal text-foreground">
              {settingsCopy.aside.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {settingsCopy.aside.body}
            </p>
          </div>
          <nav aria-label={settingsCopy.aside.navAria} className="mt-2 grid gap-2">
            {SETTINGS_PANELS.map((panel) => {
              const panelCopy = settingsCopy.panels[panel.id]
              return (
                <button
                  aria-current={activePanel === panel.id ? 'page' : undefined}
                  className={`surface-transition rounded-md border px-3 py-3 text-left ${
                    activePanel === panel.id
                      ? 'border-transparent bg-primary text-primary-foreground shadow-mac-sm'
                      : 'border-hairline bg-surface text-foreground hover:bg-surface-elevated'
                  }`}
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                  type="button"
                >
                  <span className="block font-mono text-[0.68rem]">{panel.eyebrow}</span>
                  <span className="mt-1 block text-sm font-semibold">{panelCopy.title}</span>
                  <span
                    className={`mt-1 block text-xs leading-5 ${
                      activePanel === panel.id
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {panelCopy.body}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          {activePanel === 'preferences' ? (
            <PreferencesPanel
              copy={copy}
              externalOpennessOptions={externalOpennessOptions}
              focusOptions={focusOptions}
              isSaving={isSavingPreferences}
              onSubmit={handlePreferencesSubmit}
              responseStyleOptions={responseStyleOptions}
              setSettings={setSettings}
              settings={settings}
              status={preferencesStatus}
              toneOptions={toneOptions}
            />
          ) : null}

          {activePanel === 'library' ? (
            <LibraryPanel
              browse={libraryBrowse}
              browseStatus={libraryBrowseStatus}
              dir={libraryBooksDir}
              indexStatus={libraryIndexStatus}
              isBrowsing={isBrowsingLibrary}
              isBrowserOpen={isLibraryBrowserOpen}
              isReindexing={isReindexingLibrary}
              isSaving={isSavingLibrary}
              mdFileCount={mdFileCount}
              onBrowse={browseLibraryDirectory}
              onDirChange={setLibraryBooksDir}
              onReindex={handleLibraryReindex}
              onSubmit={handleLibrarySubmit}
              setLibraryStatus={setLibraryStatus}
              strings={settingsCopy.library}
              status={libraryStatus}
            />
          ) : null}

          {activePanel === 'local-ai' ? (
            <LocalAIPanel
              availableModels={availableProviderModels}
              isSaving={isSavingProvider}
              isTesting={isTestingProvider}
              onPrimaryProviderSelect={selectPrimaryProvider}
              onProviderChange={setProviderSettings}
              onPrimaryApiKeyChange={setPrimaryApiKey}
              onSave={saveProviderSettings}
              onTest={handleProviderTest}
              primaryApiKey={primaryApiKey}
              providerSettings={providerSettings}
              setShowManualModel={setShowManualModel}
              showManualModel={showManualModel}
              strings={settingsCopy.localAI}
              providerStrings={settingsCopy.providerOptions}
              status={providerStatus}
              testStatus={providerTestStatus}
            />
          ) : null}

          {activePanel === 'external-ai' ? (
            <ExternalAIPanel
              fallbackApiKey={fallbackApiKey}
              isSaving={isSavingProvider}
              onApiKeyChange={setFallbackApiKey}
              onProviderChange={setProviderSettings}
              onSave={saveProviderSettings}
              providerSettings={providerSettings}
              strings={settingsCopy.external}
              status={providerStatus}
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}
