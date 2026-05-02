import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveUserLibrarySettings, requireVerifiedRequestSession } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface DirectoryEntry {
  name: string
  path: string
}

function getObsidianDocumentsCandidate() {
  return path.join(
    /* turbopackIgnore: true */ os.homedir(),
    'Library',
    'Mobile Documents',
    'iCloud~md~obsidian',
    'Documents',
  )
}

function getObsidianNotesCandidate() {
  return path.join(getObsidianDocumentsCandidate(), 'Notas')
}

function getObsidianBooksCandidate() {
  return path.join(getObsidianNotesCandidate(), 'livros')
}

function getICloudDriveCandidate() {
  return path.join(
    /* turbopackIgnore: true */ os.homedir(),
    'Library',
    'Mobile Documents',
    'com~apple~CloudDocs',
  )
}

async function countMarkdownFiles(dir: string) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).length
  } catch {
    return 0
  }
}

async function directoryExists(dir: string) {
  try {
    const stat = await fs.stat(dir)
    return stat.isDirectory()
  } catch {
    return false
  }
}

async function buildShortcuts(currentBooksDir: string | null) {
  const candidates = [
    currentBooksDir,
    os.homedir(),
    getObsidianBooksCandidate(),
    getObsidianNotesCandidate(),
    getObsidianDocumentsCandidate(),
    getICloudDriveCandidate(),
    getObsidianDocumentsCandidate(),
    path.join(/* turbopackIgnore: true */ os.homedir(), 'Documents'),
  ].filter((value): value is string => Boolean(value))

  const unique = Array.from(new Set(candidates))
  const shortcuts: DirectoryEntry[] = []

  for (const candidate of unique) {
    if (await directoryExists(candidate)) {
      shortcuts.push({
        name: getShortcutName(candidate, currentBooksDir),
        path: candidate,
      })
    }
  }

  return shortcuts
}

function getShortcutName(candidate: string, currentBooksDir: string | null) {
  if (candidate === currentBooksDir) return 'Pasta atual'
  if (candidate === getObsidianBooksCandidate()) return 'Livros no Obsidian'
  if (candidate === getObsidianNotesCandidate()) return 'Notas do Obsidian'
  if (candidate === getObsidianDocumentsCandidate()) return 'Obsidian iCloud'
  if (candidate === getICloudDriveCandidate()) return 'iCloud Drive'
  if (candidate === os.homedir()) return 'Home'
  if (candidate === path.join(/* turbopackIgnore: true */ os.homedir(), 'Documents')) {
    return 'Documentos'
  }
  return path.basename(candidate) || candidate
}

export async function GET(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const settings = getEffectiveUserLibrarySettings(authResult.session.user.id)
  const requestedPath = request.nextUrl.searchParams.get('path')
  const targetPath = requestedPath?.trim() || settings.booksDir || os.homedir()

  if (!path.isAbsolute(targetPath)) {
    return NextResponse.json({ error: 'Use um caminho absoluto para navegar.' }, { status: 400 })
  }

  try {
    const stat = await fs.stat(targetPath)
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'O caminho selecionado não é uma pasta.' }, { status: 400 })
    }

    const entries = await fs.readdir(targetPath, { withFileTypes: true })
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .filter((entry) => !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: path.join(/* turbopackIgnore: true */ targetPath, entry.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

    return NextResponse.json({
      entries: directories,
      mdFileCount: await countMarkdownFiles(targetPath),
      parent: path.dirname(targetPath),
      path: targetPath,
      shortcuts: await buildShortcuts(settings.booksDir),
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Não foi possível abrir esta pasta.',
      },
      { status: 400 },
    )
  }
}
