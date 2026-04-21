import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import {
  DEFAULT_AI_SETTINGS,
  normalizeAISettings,
  type AISettingsInput,
  type AISettings,
} from '@/lib/ai/settings'
import { getDataRoot } from '@/lib/storage/data-root'

export type AppDatabase = Database.Database

interface UserSettingsRow {
  additional_instructions: string
  external_openness: AISettings['externalOpenness']
  focus: AISettings['focus']
  language: string
  response_style: AISettings['responseStyle']
  tone: AISettings['tone']
}

let singletonDb: AppDatabase | null = null
let singletonPath: string | null = null

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
  `)
}

export function getAppMeta(db: AppDatabase, key: string): string | null {
  ensureAppTables(db)
  const row = db
    .prepare<{ key: string }, { value: string }>(
      'SELECT value FROM app_meta WHERE key = @key',
    )
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

export function getUserSettingsRecord(
  db: AppDatabase,
  userId: string,
): AISettings {
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
    externalOpenness:
      input.externalOpenness ?? currentSettings.externalOpenness,
    responseStyle: input.responseStyle ?? currentSettings.responseStyle,
    language: input.language ?? currentSettings.language,
    additionalInstructions:
      input.additionalInstructions ?? currentSettings.additionalInstructions,
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

export function updateUserDisplayName(userId: string, displayName: string) {
  const db = getDatabase()
  db.prepare<{ displayName: string; userId: string }>(
    `UPDATE "user" SET name = @displayName WHERE id = @userId`,
  ).run({ displayName, userId })
}
