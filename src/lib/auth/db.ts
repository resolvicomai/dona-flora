import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import Database from 'better-sqlite3'
import {
  DEFAULT_AI_SETTINGS,
  normalizeAISettings,
  type AISettingsInput,
  type AISettings,
} from '@/lib/ai/settings'
import { getDataRoot } from '@/lib/storage/data-root'

export type AppDatabase = Database.Database

export interface UserLibrarySettings {
  booksDir: string | null
}

export type AIPrimaryProvider =
  | 'anthropic'
  | 'ollama'
  | 'openai'
  | 'openai-compatible'
  | 'openrouter'

export interface AIProviderSettings {
  anthropicModel: string
  compatibleBaseUrl: string
  compatibleModel: string
  fallbackApiKeyConfigured: boolean
  fallbackEnabled: boolean
  fallbackModel: string
  fallbackProvider: 'openrouter'
  ollamaBaseUrl: string
  ollamaModel: string
  openaiModel: string
  openrouterModel: string
  primaryApiKeyConfigured: boolean
  primaryProvider: AIPrimaryProvider
  visionEnabled: boolean
  visionModel: string
}

export interface AIProviderSettingsInput {
  anthropicModel?: string | null
  compatibleBaseUrl?: string | null
  compatibleModel?: string | null
  fallbackApiKey?: string | null
  fallbackEnabled?: boolean | null
  fallbackModel?: string | null
  fallbackProvider?: 'openrouter' | null
  ollamaBaseUrl?: string | null
  ollamaModel?: string | null
  openaiModel?: string | null
  openrouterModel?: string | null
  primaryApiKey?: string | null
  primaryProvider?: AIPrimaryProvider | null
  visionEnabled?: boolean | null
  visionModel?: string | null
}

interface UserSettingsRow {
  additional_instructions: string
  external_openness: AISettings['externalOpenness']
  focus: AISettings['focus']
  language: string
  response_style: AISettings['responseStyle']
  tone: AISettings['tone']
}

interface UserLibrarySettingsRow {
  books_dir: string
}

interface UserAIProviderSettingsRow {
  anthropic_model: string
  compatible_base_url: string
  compatible_model: string
  fallback_api_key_encrypted: string | null
  fallback_enabled: 0 | 1
  fallback_model: string
  fallback_provider: 'openrouter'
  ollama_base_url: string
  ollama_model: string
  openai_model: string
  openrouter_model: string
  primary_api_key_encrypted: string | null
  primary_api_key_provider: AIPrimaryProvider | null
  primary_provider: AIPrimaryProvider
  vision_enabled?: 0 | 1
  vision_model?: string
}

let singletonDb: AppDatabase | null = null
let singletonPath: string | null = null

export const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434/v1'
export const DEFAULT_OLLAMA_MODEL = 'qwen3.6:27b'
export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6'
export const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-sonnet-4.6'
export const DEFAULT_COMPATIBLE_BASE_URL = 'http://127.0.0.1:1234/v1'
export const DEFAULT_COMPATIBLE_MODEL = 'local-model'
export const DEFAULT_VISION_MODEL = 'anthropic/claude-sonnet-4.6'

const AI_PRIMARY_PROVIDERS: AIPrimaryProvider[] = [
  'anthropic',
  'ollama',
  'openai',
  'openai-compatible',
  'openrouter',
]

function normalizeAIPrimaryProvider(value: string | null | undefined): AIPrimaryProvider {
  return AI_PRIMARY_PROVIDERS.includes(value as AIPrimaryProvider)
    ? (value as AIPrimaryProvider)
    : 'ollama'
}

function getDefaultOllamaBaseUrl() {
  return (
    process.env.DONA_FLORA_OLLAMA_BASE_URL?.trim().replace(/\/+$/, '') || DEFAULT_OLLAMA_BASE_URL
  )
}

function getDefaultOllamaModel() {
  return process.env.DONA_FLORA_OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL
}

function sqlString(value: string) {
  return value.replace(/'/g, "''")
}

function getLocalSecret() {
  return process.env.BETTER_AUTH_SECRET ?? 'dona-flora-local-dev-secret-2026'
}

function getEncryptionKey() {
  return crypto.createHash('sha256').update(getLocalSecret()).digest()
}

function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.')
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const [ivRaw, tagRaw, encryptedRaw] = value.split('.')
  if (!ivRaw || !tagRaw || !encryptedRaw) {
    return null
  }

  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivRaw, 'base64url'),
    )
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64url')),
      decipher.final(),
    ])
    return decrypted.toString('utf-8')
  } catch {
    return null
  }
}

export function getDatabasePath(dataRoot?: string): string {
  return path.join(getDataRoot(dataRoot), 'app.sqlite')
}

export function openDatabase(filePath: string): AppDatabase {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  return new Database(filePath)
}

export function getDatabase(filePath = getDatabasePath()): AppDatabase {
  if (!singletonDb || singletonPath !== filePath) {
    singletonDb?.close()
    singletonDb = openDatabase(filePath)
    singletonPath = filePath
  }

  return singletonDb
}

export function closeDatabase(db: AppDatabase) {
  if (singletonDb === db) {
    singletonDb = null
    singletonPath = null
  }

  db.close()
}

export function ensureAppTables(db: AppDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      tone TEXT NOT NULL DEFAULT 'calorosa',
      focus TEXT NOT NULL DEFAULT 'equilibrado',
      external_openness TEXT NOT NULL DEFAULT 'sob-demanda',
      response_style TEXT NOT NULL DEFAULT 'conversa',
      language TEXT NOT NULL DEFAULT 'pt-BR',
      additional_instructions TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_library_settings (
      user_id TEXT PRIMARY KEY,
      books_dir TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_ai_provider_settings (
      user_id TEXT PRIMARY KEY,
      primary_provider TEXT NOT NULL DEFAULT 'ollama',
      primary_api_key_provider TEXT,
      primary_api_key_encrypted TEXT,
      ollama_base_url TEXT NOT NULL DEFAULT '${DEFAULT_OLLAMA_BASE_URL}',
      ollama_model TEXT NOT NULL DEFAULT '${DEFAULT_OLLAMA_MODEL}',
      openai_model TEXT NOT NULL DEFAULT '${DEFAULT_OPENAI_MODEL}',
      anthropic_model TEXT NOT NULL DEFAULT '${DEFAULT_ANTHROPIC_MODEL}',
      openrouter_model TEXT NOT NULL DEFAULT '${DEFAULT_OPENROUTER_MODEL}',
      compatible_base_url TEXT NOT NULL DEFAULT '${DEFAULT_COMPATIBLE_BASE_URL}',
      compatible_model TEXT NOT NULL DEFAULT '${DEFAULT_COMPATIBLE_MODEL}',
      fallback_enabled INTEGER NOT NULL DEFAULT 0,
      fallback_provider TEXT NOT NULL DEFAULT 'openrouter',
      fallback_model TEXT NOT NULL DEFAULT '${DEFAULT_OPENROUTER_MODEL}',
      fallback_api_key_encrypted TEXT,
      vision_enabled INTEGER NOT NULL DEFAULT 0,
      vision_model TEXT NOT NULL DEFAULT '${DEFAULT_VISION_MODEL}',
      updated_at TEXT NOT NULL
    );
  `)

  ensureColumn(db, 'user_ai_provider_settings', 'vision_enabled', 'INTEGER NOT NULL DEFAULT 0')
  ensureColumn(
    db,
    'user_ai_provider_settings',
    'vision_model',
    `TEXT NOT NULL DEFAULT '${sqlString(DEFAULT_VISION_MODEL)}'`,
  )
  ensureColumn(db, 'user_ai_provider_settings', 'primary_api_key_provider', 'TEXT')
  ensureColumn(db, 'user_ai_provider_settings', 'primary_api_key_encrypted', 'TEXT')
  ensureColumn(
    db,
    'user_ai_provider_settings',
    'openai_model',
    `TEXT NOT NULL DEFAULT '${sqlString(DEFAULT_OPENAI_MODEL)}'`,
  )
  ensureColumn(
    db,
    'user_ai_provider_settings',
    'anthropic_model',
    `TEXT NOT NULL DEFAULT '${sqlString(DEFAULT_ANTHROPIC_MODEL)}'`,
  )
  ensureColumn(
    db,
    'user_ai_provider_settings',
    'openrouter_model',
    `TEXT NOT NULL DEFAULT '${sqlString(DEFAULT_OPENROUTER_MODEL)}'`,
  )
  ensureColumn(
    db,
    'user_ai_provider_settings',
    'compatible_base_url',
    `TEXT NOT NULL DEFAULT '${sqlString(DEFAULT_COMPATIBLE_BASE_URL)}'`,
  )
  ensureColumn(
    db,
    'user_ai_provider_settings',
    'compatible_model',
    `TEXT NOT NULL DEFAULT '${sqlString(DEFAULT_COMPATIBLE_MODEL)}'`,
  )
}

function ensureColumn(db: AppDatabase, table: string, column: string, definition: string) {
  const columns = db
    .prepare<[], { name: string }>(`PRAGMA table_info(${table})`)
    .all()
    .map((row) => row.name)

  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

export function getAppMeta(db: AppDatabase, key: string): string | null {
  ensureAppTables(db)
  const row = db
    .prepare<{ key: string }, { value: string }>('SELECT value FROM app_meta WHERE key = @key')
    .get({ key })

  return row?.value ?? null
}

export function setAppMeta(db: AppDatabase, key: string, value: string) {
  ensureAppTables(db)
  db.prepare(
    `
      INSERT INTO app_meta (key, value)
      VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
  ).run({ key, value })
}

export function hasAnyUserRecord(db: AppDatabase) {
  ensureAppTables(db)
  const userTable = db
    .prepare<
      [],
      { name: string }
    >(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user'`)
    .get()

  if (!userTable) {
    return false
  }

  const row = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM "user"').get()
  return Number(row?.count ?? 0) > 0
}

export function hasAnyUser() {
  return hasAnyUserRecord(getDatabase())
}

export function getUserSettingsRecord(db: AppDatabase, userId: string): AISettings {
  ensureAppTables(db)
  const row = db
    .prepare<{ userId: string }, UserSettingsRow>(
      `
        SELECT
          tone,
          focus,
          external_openness,
          response_style,
          language,
          additional_instructions
        FROM user_settings
        WHERE user_id = @userId
      `,
    )
    .get({ userId })

  if (!row) {
    return DEFAULT_AI_SETTINGS
  }

  return normalizeAISettings({
    tone: row.tone,
    focus: row.focus,
    externalOpenness: row.external_openness,
    responseStyle: row.response_style,
    language: row.language,
    additionalInstructions: row.additional_instructions,
  })
}

export function upsertUserSettingsRecord(
  db: AppDatabase,
  userId: string,
  input: AISettingsInput,
): AISettings {
  ensureAppTables(db)
  const currentSettings = getUserSettingsRecord(db, userId)
  const settings = normalizeAISettings({
    tone: input.tone ?? currentSettings.tone,
    focus: input.focus ?? currentSettings.focus,
    externalOpenness: input.externalOpenness ?? currentSettings.externalOpenness,
    responseStyle: input.responseStyle ?? currentSettings.responseStyle,
    language: input.language ?? currentSettings.language,
    additionalInstructions: input.additionalInstructions ?? currentSettings.additionalInstructions,
  })
  db.prepare(
    `
      INSERT INTO user_settings (
        user_id,
        tone,
        focus,
        external_openness,
        response_style,
        language,
        additional_instructions,
        updated_at
      )
      VALUES (
        @userId,
        @tone,
        @focus,
        @externalOpenness,
        @responseStyle,
        @language,
        @additionalInstructions,
        @updatedAt
      )
      ON CONFLICT(user_id) DO UPDATE SET
        tone = excluded.tone,
        focus = excluded.focus,
        external_openness = excluded.external_openness,
        response_style = excluded.response_style,
        language = excluded.language,
        additional_instructions = excluded.additional_instructions,
        updated_at = excluded.updated_at
    `,
  ).run({
    userId,
    tone: settings.tone,
    focus: settings.focus,
    externalOpenness: settings.externalOpenness,
    responseStyle: settings.responseStyle,
    language: settings.language,
    additionalInstructions: settings.additionalInstructions,
    updatedAt: new Date().toISOString(),
  })

  return settings
}

export function getUserSettings(userId: string) {
  return getUserSettingsRecord(getDatabase(), userId)
}

export function upsertUserSettings(userId: string, input: AISettingsInput) {
  return upsertUserSettingsRecord(getDatabase(), userId, input)
}

export function getUserLibrarySettingsRecord(db: AppDatabase, userId: string): UserLibrarySettings {
  ensureAppTables(db)
  const row = db
    .prepare<{ userId: string }, UserLibrarySettingsRow>(
      `
        SELECT books_dir
        FROM user_library_settings
        WHERE user_id = @userId
      `,
    )
    .get({ userId })

  return { booksDir: row?.books_dir ?? null }
}

export function upsertUserLibrarySettingsRecord(
  db: AppDatabase,
  userId: string,
  booksDir: string,
): UserLibrarySettings {
  ensureAppTables(db)
  db.prepare(
    `
      INSERT INTO user_library_settings (user_id, books_dir, updated_at)
      VALUES (@userId, @booksDir, @updatedAt)
      ON CONFLICT(user_id) DO UPDATE SET
        books_dir = excluded.books_dir,
        updated_at = excluded.updated_at
    `,
  ).run({
    booksDir,
    updatedAt: new Date().toISOString(),
    userId,
  })

  return { booksDir }
}

export function getUserLibrarySettings(userId: string) {
  return getUserLibrarySettingsRecord(getDatabase(), userId)
}

export function upsertUserLibrarySettings(userId: string, booksDir: string) {
  return upsertUserLibrarySettingsRecord(getDatabase(), userId, booksDir)
}

export function getUserAIProviderSettingsRecord(
  db: AppDatabase,
  userId: string,
): AIProviderSettings {
  ensureAppTables(db)
  const row = db
    .prepare<{ userId: string }, UserAIProviderSettingsRow>(
      `
        SELECT
          primary_provider,
          primary_api_key_provider,
          primary_api_key_encrypted,
          ollama_base_url,
          ollama_model,
          openai_model,
          anthropic_model,
          openrouter_model,
          compatible_base_url,
          compatible_model,
          fallback_enabled,
          fallback_provider,
          fallback_model,
          fallback_api_key_encrypted,
          vision_enabled,
          vision_model
        FROM user_ai_provider_settings
        WHERE user_id = @userId
      `,
    )
    .get({ userId })

  const primaryProvider = normalizeAIPrimaryProvider(row?.primary_provider)
  const primaryApiKeyProvider = normalizeAIPrimaryProvider(row?.primary_api_key_provider)
  const primaryApiKeyConfigured = Boolean(
    row?.primary_api_key_encrypted && primaryApiKeyProvider === primaryProvider,
  )

  return {
    anthropicModel: row?.anthropic_model ?? DEFAULT_ANTHROPIC_MODEL,
    compatibleBaseUrl: row?.compatible_base_url ?? DEFAULT_COMPATIBLE_BASE_URL,
    compatibleModel: row?.compatible_model ?? DEFAULT_COMPATIBLE_MODEL,
    fallbackApiKeyConfigured: Boolean(row?.fallback_api_key_encrypted),
    fallbackEnabled: Boolean(row?.fallback_enabled ?? 0),
    fallbackModel: row?.fallback_model ?? DEFAULT_OPENROUTER_MODEL,
    fallbackProvider: 'openrouter',
    ollamaBaseUrl: row?.ollama_base_url ?? getDefaultOllamaBaseUrl(),
    ollamaModel: row?.ollama_model ?? getDefaultOllamaModel(),
    openaiModel: row?.openai_model ?? DEFAULT_OPENAI_MODEL,
    openrouterModel: row?.openrouter_model ?? DEFAULT_OPENROUTER_MODEL,
    primaryApiKeyConfigured,
    primaryProvider,
    visionEnabled: Boolean(row?.vision_enabled ?? 0),
    visionModel: row?.vision_model ?? DEFAULT_VISION_MODEL,
  }
}

export function getUserAIPrimaryProviderSecretRecord(
  db: AppDatabase,
  userId: string,
  provider: AIPrimaryProvider,
) {
  ensureAppTables(db)
  const row = db
    .prepare<
      { userId: string },
      Pick<UserAIProviderSettingsRow, 'primary_api_key_encrypted' | 'primary_api_key_provider'>
    >(
      `
        SELECT primary_api_key_encrypted, primary_api_key_provider
        FROM user_ai_provider_settings
        WHERE user_id = @userId
      `,
    )
    .get({ userId })

  if (normalizeAIPrimaryProvider(row?.primary_api_key_provider) !== provider) {
    return null
  }

  return decryptSecret(row?.primary_api_key_encrypted)
}

export function getUserAIProviderSecretRecord(db: AppDatabase, userId: string) {
  ensureAppTables(db)
  const row = db
    .prepare<{ userId: string }, Pick<UserAIProviderSettingsRow, 'fallback_api_key_encrypted'>>(
      `
        SELECT fallback_api_key_encrypted
        FROM user_ai_provider_settings
        WHERE user_id = @userId
      `,
    )
    .get({ userId })

  return decryptSecret(row?.fallback_api_key_encrypted)
}

export function upsertUserAIProviderSettingsRecord(
  db: AppDatabase,
  userId: string,
  input: AIProviderSettingsInput,
): AIProviderSettings {
  ensureAppTables(db)
  const current = getUserAIProviderSettingsRecord(db, userId)
  const primaryProvider = normalizeAIPrimaryProvider(
    input.primaryProvider ?? current.primaryProvider,
  )
  const openaiModel = input.openaiModel?.trim() || current.openaiModel || DEFAULT_OPENAI_MODEL
  const anthropicModel =
    input.anthropicModel?.trim() || current.anthropicModel || DEFAULT_ANTHROPIC_MODEL
  const openrouterModel =
    input.openrouterModel?.trim() || current.openrouterModel || DEFAULT_OPENROUTER_MODEL
  const compatibleBaseUrl =
    input.compatibleBaseUrl?.trim().replace(/\/+$/, '') ||
    current.compatibleBaseUrl ||
    DEFAULT_COMPATIBLE_BASE_URL
  const compatibleModel =
    input.compatibleModel?.trim() || current.compatibleModel || DEFAULT_COMPATIBLE_MODEL
  const fallbackModel =
    input.fallbackModel?.trim() || current.fallbackModel || DEFAULT_OPENROUTER_MODEL
  const ollamaBaseUrl =
    input.ollamaBaseUrl?.trim().replace(/\/+$/, '') ||
    current.ollamaBaseUrl ||
    getDefaultOllamaBaseUrl()
  const ollamaModel = input.ollamaModel?.trim() || current.ollamaModel || getDefaultOllamaModel()
  const fallbackEnabled =
    typeof input.fallbackEnabled === 'boolean' ? input.fallbackEnabled : current.fallbackEnabled
  const visionEnabled =
    typeof input.visionEnabled === 'boolean' ? input.visionEnabled : current.visionEnabled
  const visionModel = input.visionModel?.trim() || current.visionModel || DEFAULT_VISION_MODEL
  const encryptedKey =
    input.fallbackApiKey && input.fallbackApiKey.trim()
      ? encryptSecret(input.fallbackApiKey.trim())
      : undefined
  const encryptedPrimaryKey =
    input.primaryApiKey && input.primaryApiKey.trim()
      ? encryptSecret(input.primaryApiKey.trim())
      : undefined

  const existingSecrets = db
    .prepare<
      { userId: string },
      Pick<
        UserAIProviderSettingsRow,
        'fallback_api_key_encrypted' | 'primary_api_key_encrypted' | 'primary_api_key_provider'
      >
    >(
      `
        SELECT
          fallback_api_key_encrypted,
          primary_api_key_encrypted,
          primary_api_key_provider
        FROM user_ai_provider_settings
        WHERE user_id = @userId
      `,
    )
    .get({ userId })

  db.prepare(
    `
      INSERT INTO user_ai_provider_settings (
        user_id,
        primary_provider,
        primary_api_key_provider,
        primary_api_key_encrypted,
        ollama_base_url,
        ollama_model,
        openai_model,
        anthropic_model,
        openrouter_model,
        compatible_base_url,
        compatible_model,
        fallback_enabled,
        fallback_provider,
        fallback_model,
        fallback_api_key_encrypted,
        vision_enabled,
        vision_model,
        updated_at
      )
      VALUES (
        @userId,
        @primaryProvider,
        @primaryApiKeyProvider,
        @primaryApiKeyEncrypted,
        @ollamaBaseUrl,
        @ollamaModel,
        @openaiModel,
        @anthropicModel,
        @openrouterModel,
        @compatibleBaseUrl,
        @compatibleModel,
        @fallbackEnabled,
        'openrouter',
        @fallbackModel,
        @fallbackApiKeyEncrypted,
        @visionEnabled,
        @visionModel,
        @updatedAt
      )
      ON CONFLICT(user_id) DO UPDATE SET
        primary_provider = excluded.primary_provider,
        primary_api_key_provider = excluded.primary_api_key_provider,
        primary_api_key_encrypted = excluded.primary_api_key_encrypted,
        ollama_base_url = excluded.ollama_base_url,
        ollama_model = excluded.ollama_model,
        openai_model = excluded.openai_model,
        anthropic_model = excluded.anthropic_model,
        openrouter_model = excluded.openrouter_model,
        compatible_base_url = excluded.compatible_base_url,
        compatible_model = excluded.compatible_model,
        fallback_enabled = excluded.fallback_enabled,
        fallback_provider = 'openrouter',
        fallback_model = excluded.fallback_model,
        fallback_api_key_encrypted = excluded.fallback_api_key_encrypted,
        vision_enabled = excluded.vision_enabled,
        vision_model = excluded.vision_model,
        updated_at = excluded.updated_at
    `,
  ).run({
    anthropicModel,
    compatibleBaseUrl,
    compatibleModel,
    fallbackApiKeyEncrypted: encryptedKey ?? existingSecrets?.fallback_api_key_encrypted ?? null,
    fallbackEnabled: fallbackEnabled ? 1 : 0,
    fallbackModel,
    ollamaBaseUrl,
    ollamaModel,
    openaiModel,
    openrouterModel,
    primaryApiKeyEncrypted:
      encryptedPrimaryKey ?? existingSecrets?.primary_api_key_encrypted ?? null,
    primaryApiKeyProvider: encryptedPrimaryKey
      ? primaryProvider
      : (existingSecrets?.primary_api_key_provider ?? null),
    primaryProvider,
    updatedAt: new Date().toISOString(),
    userId,
    visionEnabled: visionEnabled ? 1 : 0,
    visionModel,
  })

  return getUserAIProviderSettingsRecord(db, userId)
}

export function getUserAIProviderSettings(userId: string) {
  return getUserAIProviderSettingsRecord(getDatabase(), userId)
}

export function getUserAIProviderSecret(userId: string) {
  return getUserAIProviderSecretRecord(getDatabase(), userId)
}

export function getUserAIPrimaryProviderSecret(userId: string, provider: AIPrimaryProvider) {
  return getUserAIPrimaryProviderSecretRecord(getDatabase(), userId, provider)
}

export function upsertUserAIProviderSettings(userId: string, input: AIProviderSettingsInput) {
  return upsertUserAIProviderSettingsRecord(getDatabase(), userId, input)
}

export function updateUserDisplayName(userId: string, displayName: string) {
  const db = getDatabase()
  db.prepare<{ displayName: string; userId: string }>(
    `UPDATE "user" SET name = @displayName WHERE id = @userId`,
  ).run({ displayName, userId })
}
