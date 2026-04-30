import type { AISettings } from '@/lib/ai/settings'
import type { AIProviderSettings, UserLibrarySettings } from '@/lib/auth/db'

export type SaveStatus = {
  kind: 'success' | 'error'
  message: string
} | null

export type SettingsPanel = 'preferences' | 'library' | 'local-ai' | 'external-ai'

export type DirectoryEntry = {
  name: string
  path: string
}

export type LibraryBrowseState = {
  entries: DirectoryEntry[]
  mdFileCount: number
  parent: string
  path: string
  shortcuts: DirectoryEntry[]
} | null

export interface SettingsFormProps {
  initialAIProviderSettings: AIProviderSettings
  initialLibrarySettings: UserLibrarySettings
  initialSettings: AISettings
}
