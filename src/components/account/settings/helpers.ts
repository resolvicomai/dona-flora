import type { AIProviderSettings } from '@/lib/auth/db'
import { SETTINGS_PANELS } from './constants'
import type { SettingsPanel } from './types'

export function getSelectedProviderModel(settings: AIProviderSettings) {
  if (settings.primaryProvider === 'anthropic') return settings.anthropicModel
  if (settings.primaryProvider === 'openai') return settings.openaiModel
  if (settings.primaryProvider === 'openai-compatible') {
    return settings.compatibleModel
  }
  if (settings.primaryProvider === 'openrouter') return settings.openrouterModel
  return settings.ollamaModel
}

export function getProviderBaseUrl(settings: AIProviderSettings) {
  return settings.primaryProvider === 'openai-compatible'
    ? settings.compatibleBaseUrl
    : settings.ollamaBaseUrl
}

export function setSelectedProviderModel(
  current: AIProviderSettings,
  modelId: string,
): AIProviderSettings {
  if (current.primaryProvider === 'anthropic') {
    return { ...current, anthropicModel: modelId }
  }
  if (current.primaryProvider === 'openai') {
    return { ...current, openaiModel: modelId }
  }
  if (current.primaryProvider === 'openai-compatible') {
    return { ...current, compatibleModel: modelId }
  }
  if (current.primaryProvider === 'openrouter') {
    return { ...current, openrouterModel: modelId }
  }
  return { ...current, ollamaModel: modelId }
}

export function getInitialSettingsPanel(): SettingsPanel {
  if (typeof window === 'undefined') {
    return 'preferences'
  }

  const panel = new URLSearchParams(window.location.search).get('panel')
  return SETTINGS_PANELS.some((item) => item.id === panel)
    ? (panel as SettingsPanel)
    : 'preferences'
}
