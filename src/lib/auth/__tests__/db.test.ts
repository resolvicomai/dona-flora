import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_COMPATIBLE_BASE_URL,
  DEFAULT_COMPATIBLE_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_VISION_MODEL,
  closeDatabase,
  ensureAppTables,
  getUserAIPrimaryProviderSecretRecord,
  getUserAIProviderSecretRecord,
  getUserAIProviderSettingsRecord,
  getUserLibrarySettingsRecord,
  getUserSettingsRecord,
  hasAnyUserRecord,
  openDatabase,
  upsertUserAIProviderSettingsRecord,
  upsertUserLibrarySettingsRecord,
  upsertUserSettingsRecord,
} from '@/lib/auth/db'

let tmpDir: string
const originalOpenRouterApiKey = process.env.OPENROUTER_API_KEY

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dona-flora-auth-db-'))
  delete process.env.OPENROUTER_API_KEY
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  if (originalOpenRouterApiKey === undefined) {
    delete process.env.OPENROUTER_API_KEY
  } else {
    process.env.OPENROUTER_API_KEY = originalOpenRouterApiKey
  }
})

describe('local user bootstrap', () => {
  it('treats a fresh database as first access before Better Auth creates users', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)

      expect(hasAnyUserRecord(db)).toBe(false)
    } finally {
      closeDatabase(db)
    }
  })

  it('detects when at least one local user exists', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)
      db.exec('CREATE TABLE "user" (id TEXT PRIMARY KEY)')
      db.prepare('INSERT INTO "user" (id) VALUES (?)').run('user-1')

      expect(hasAnyUserRecord(db)).toBe(true)
    } finally {
      closeDatabase(db)
    }
  })
})

describe('user settings persistence', () => {
  it('returns defaults when the user has no persisted settings yet', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)
      const settings = getUserSettingsRecord(db, 'user-1')

      expect(settings.tone).toBe('calorosa')
      expect(settings.focus).toBe('equilibrado')
      expect(settings.externalOpenness).toBe('sob-demanda')
      expect(settings.responseStyle).toBe('conversa')
      expect(settings.language).toBe('pt-BR')
      expect(settings.additionalInstructions).toBe('')
    } finally {
      closeDatabase(db)
    }
  })

  it('upserts user settings by user id', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)

      upsertUserSettingsRecord(db, 'user-1', {
        tone: 'analitica',
        focus: 'descoberta',
        externalOpenness: 'aberta',
        responseStyle: 'profunda',
        language: 'en-US',
        additionalInstructions: 'Use exemplos concretos.',
      })

      const settings = getUserSettingsRecord(db, 'user-1')

      expect(settings.tone).toBe('analitica')
      expect(settings.focus).toBe('descoberta')
      expect(settings.externalOpenness).toBe('aberta')
      expect(settings.responseStyle).toBe('profunda')
      expect(settings.language).toBe('en')
      expect(settings.additionalInstructions).toBe('Use exemplos concretos.')
    } finally {
      closeDatabase(db)
    }
  })

  it('preserves existing settings when a quick update changes only the app language', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)

      upsertUserSettingsRecord(db, 'user-1', {
        tone: 'assertiva',
        focus: 'memoria',
        externalOpenness: 'somente-acervo',
        responseStyle: 'concisa',
        language: 'pt-BR',
        additionalInstructions: 'Sempre use o acervo como ponto de partida.',
      })

      upsertUserSettingsRecord(db, 'user-1', {
        language: 'en',
      })

      const settings = getUserSettingsRecord(db, 'user-1')

      expect(settings.tone).toBe('assertiva')
      expect(settings.focus).toBe('memoria')
      expect(settings.externalOpenness).toBe('somente-acervo')
      expect(settings.responseStyle).toBe('concisa')
      expect(settings.language).toBe('en')
      expect(settings.additionalInstructions).toBe('Sempre use o acervo como ponto de partida.')
    } finally {
      closeDatabase(db)
    }
  })
})

describe('local-first settings persistence', () => {
  it('stores the per-user external books directory', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)
      expect(getUserLibrarySettingsRecord(db, 'user-1')).toEqual({
        booksDir: null,
      })

      const settings = upsertUserLibrarySettingsRecord(
        db,
        'user-1',
        '/Users/example/Obsidian/livros',
      )

      expect(settings.booksDir).toBe('/Users/example/Obsidian/livros')
      expect(getUserLibrarySettingsRecord(db, 'user-1').booksDir).toBe(
        '/Users/example/Obsidian/livros',
      )
    } finally {
      closeDatabase(db)
    }
  })

  it('returns Ollama-first AI provider defaults when not configured', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)

      const settings = getUserAIProviderSettingsRecord(db, 'user-1')

      expect(settings.primaryProvider).toBe('ollama')
      expect(settings.primaryApiKeyConfigured).toBe(false)
      expect(settings.ollamaBaseUrl).toBe(DEFAULT_OLLAMA_BASE_URL)
      expect(settings.ollamaModel).toBe(DEFAULT_OLLAMA_MODEL)
      expect(settings.openaiModel).toBe(DEFAULT_OPENAI_MODEL)
      expect(settings.anthropicModel).toBe(DEFAULT_ANTHROPIC_MODEL)
      expect(settings.openrouterModel).toBe(DEFAULT_OPENROUTER_MODEL)
      expect(settings.compatibleBaseUrl).toBe(DEFAULT_COMPATIBLE_BASE_URL)
      expect(settings.compatibleModel).toBe(DEFAULT_COMPATIBLE_MODEL)
      expect(settings.fallbackEnabled).toBe(false)
      expect(settings.fallbackProvider).toBe('openrouter')
      expect(settings.fallbackModel).toBe(DEFAULT_OPENROUTER_MODEL)
      expect(settings.fallbackApiKeyConfigured).toBe(false)
      expect(settings.visionEnabled).toBe(false)
      expect(settings.visionModel).toBe(DEFAULT_VISION_MODEL)
    } finally {
      closeDatabase(db)
    }
  })

  it('encrypts optional fallback API keys and never stores the raw value', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)

      const settings = upsertUserAIProviderSettingsRecord(db, 'user-1', {
        fallbackApiKey: 'sk-openrouter-test',
        fallbackEnabled: true,
        fallbackModel: 'openai/gpt-4.1-mini',
        ollamaBaseUrl: 'http://127.0.0.1:11434/v1',
        ollamaModel: 'qwen3.6:27b',
        primaryProvider: 'ollama',
      })
      const row = db
        .prepare<{ userId: string }, { encrypted: string | null }>(
          `
            SELECT fallback_api_key_encrypted AS encrypted
            FROM user_ai_provider_settings
            WHERE user_id = @userId
          `,
        )
        .get({ userId: 'user-1' })

      expect(settings.fallbackApiKeyConfigured).toBe(true)
      expect(row?.encrypted).toBeTruthy()
      expect(row?.encrypted).not.toContain('sk-openrouter-test')
      expect(getUserAIProviderSecretRecord(db, 'user-1')).toBe('sk-openrouter-test')
    } finally {
      closeDatabase(db)
    }
  })

  it('encrypts the chosen primary provider key without exposing it in settings', () => {
    const db = openDatabase(path.join(tmpDir, 'app.sqlite'))
    try {
      ensureAppTables(db)

      const settings = upsertUserAIProviderSettingsRecord(db, 'user-1', {
        openaiModel: 'gpt-4.1-mini',
        primaryApiKey: 'sk-openai-test',
        primaryProvider: 'openai',
      })
      const row = db
        .prepare<{ userId: string }, { encrypted: string | null; provider: string | null }>(
          `
            SELECT
              primary_api_key_encrypted AS encrypted,
              primary_api_key_provider AS provider
            FROM user_ai_provider_settings
            WHERE user_id = @userId
          `,
        )
        .get({ userId: 'user-1' })

      expect(settings.primaryProvider).toBe('openai')
      expect(settings.primaryApiKeyConfigured).toBe(true)
      expect(row?.provider).toBe('openai')
      expect(row?.encrypted).toBeTruthy()
      expect(row?.encrypted).not.toContain('sk-openai-test')
      expect(getUserAIPrimaryProviderSecretRecord(db, 'user-1', 'openai')).toBe('sk-openai-test')
      expect(getUserAIPrimaryProviderSecretRecord(db, 'user-1', 'anthropic')).toBeNull()
    } finally {
      closeDatabase(db)
    }
  })
})
