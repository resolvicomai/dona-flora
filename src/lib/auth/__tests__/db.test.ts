import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  closeDatabase,
  ensureAppTables,
  getUserSettingsRecord,
  openDatabase,
  upsertUserSettingsRecord,
} from '@/lib/auth/db'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dona-flora-auth-db-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
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
      expect(settings.additionalInstructions).toBe(
        'Sempre use o acervo como ponto de partida.',
      )
    } finally {
      closeDatabase(db)
    }
  })
})
