import fs from 'fs/promises'
import path from 'path'
import { getDataRoot } from '@/lib/storage/data-root'

export interface StorageContext {
  userId: string
  dataRoot: string
  userRoot: string
  booksDir: string
  chatsDir: string
  trailsDir: string
}

export interface ClaimLegacyDataForUserInput {
  dataRoot?: string
  userId: string
}

export interface ClaimLegacyDataForUserResult {
  migrated: boolean
  backupRoot: string | null
  markerPath: string
  storageContext: StorageContext
}

const LEGACY_DIR_NAMES = ['books', 'chats', 'trails'] as const

function getLegacyMigrationMarkerPath(dataRoot: string) {
  return path.join(dataRoot, '.legacy-owner-claim.json')
}

function getBackupRoot(dataRoot: string, userId: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return path.join(dataRoot, 'backups', `legacy-${userId}-${stamp}`)
}

export function createStorageContext(
  userId: string,
  dataRoot?: string,
): StorageContext {
  const resolvedRoot = getDataRoot(dataRoot)
  const userRoot = path.join(resolvedRoot, 'users', userId)

  return {
    userId,
    dataRoot: resolvedRoot,
    userRoot,
    booksDir: path.join(userRoot, 'books'),
    chatsDir: path.join(userRoot, 'chats'),
    trailsDir: path.join(userRoot, 'trails'),
  }
}

export async function ensureStorageContext(context: StorageContext) {
  await Promise.all([
    fs.mkdir(context.booksDir, { recursive: true }),
    fs.mkdir(context.chatsDir, { recursive: true }),
    fs.mkdir(context.trailsDir, { recursive: true }),
  ])

  return context
}

export async function claimLegacyDataForUser({
  dataRoot,
  userId,
}: ClaimLegacyDataForUserInput): Promise<ClaimLegacyDataForUserResult> {
  const resolvedRoot = getDataRoot(dataRoot)
  const markerPath = getLegacyMigrationMarkerPath(resolvedRoot)
  const storageContext = await ensureStorageContext(
    createStorageContext(userId, resolvedRoot),
  )

  try {
    const existingMarker = JSON.parse(await fs.readFile(markerPath, 'utf-8')) as {
      backupRoot?: string | null
    }

    return {
      migrated: false,
      backupRoot: existingMarker.backupRoot ?? null,
      markerPath,
      storageContext,
    }
  } catch {
    // no marker yet — continue
  }

  const existingLegacyDirs: Array<(typeof LEGACY_DIR_NAMES)[number]> = []

  for (const dirName of LEGACY_DIR_NAMES) {
    try {
      const entries = await fs.readdir(path.join(resolvedRoot, dirName))
      if (entries.length > 0) {
        existingLegacyDirs.push(dirName)
      }
    } catch {
      // directory does not exist — ignore
    }
  }

  let backupRoot: string | null = null

  if (existingLegacyDirs.length > 0) {
    backupRoot = getBackupRoot(resolvedRoot, userId)
    await fs.mkdir(backupRoot, { recursive: true })
  }

  for (const dirName of existingLegacyDirs) {
    const sourceDir = path.join(resolvedRoot, dirName)
    const targetDir =
      dirName === 'books'
        ? storageContext.booksDir
        : dirName === 'chats'
          ? storageContext.chatsDir
          : storageContext.trailsDir

    if (backupRoot) {
      await fs.cp(sourceDir, path.join(backupRoot, dirName), { recursive: true })
    }

    const entries = await fs.readdir(sourceDir)
    for (const entry of entries) {
      await fs.rename(path.join(sourceDir, entry), path.join(targetDir, entry))
    }

    await fs.rm(sourceDir, { recursive: true, force: true })
  }

  await fs.writeFile(
    markerPath,
    JSON.stringify(
      {
        ownerUserId: userId,
        backupRoot,
        migratedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf-8',
  )

  return {
    migrated: existingLegacyDirs.length > 0,
    backupRoot,
    markerPath,
    storageContext,
  }
}
