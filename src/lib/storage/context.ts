import fs from 'fs/promises'
import path from 'path'
import { getDataRoot, resolveRuntimePath } from '@/lib/storage/data-root'

export interface StorageContext {
  userId: string
  dataRoot: string
  userRoot: string
  booksDir: string
  coversDir: string
  chatsDir: string
  trailsDir: string
}

export interface ClaimLegacyDataForUserInput {
  dataRoot?: string
  skipLegacyBooks?: boolean
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
  return path.join(/* turbopackIgnore: true */ dataRoot, '.legacy-owner-claim.json')
}

function getBackupRoot(dataRoot: string, userId: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return path.join(/* turbopackIgnore: true */ dataRoot, 'backups', `legacy-${userId}-${stamp}`)
}

export function createStorageContext(
  userId: string,
  dataRoot?: string,
  overrides?: { booksDir?: string | null },
): StorageContext {
  const resolvedRoot = getDataRoot(dataRoot)
  const userRoot = path.join(/* turbopackIgnore: true */ resolvedRoot, 'users', userId)
  const booksDir = overrides?.booksDir
    ? resolveRuntimePath(overrides.booksDir)
    : path.join(/* turbopackIgnore: true */ userRoot, 'books')

  return {
    userId,
    dataRoot: resolvedRoot,
    userRoot,
    booksDir,
    coversDir: path.join(/* turbopackIgnore: true */ userRoot, 'covers-cache'),
    chatsDir: path.join(/* turbopackIgnore: true */ userRoot, 'chats'),
    trailsDir: path.join(/* turbopackIgnore: true */ userRoot, 'trails'),
  }
}

export async function ensureStorageContext(context: StorageContext) {
  await Promise.all([
    fs.mkdir(context.booksDir, { recursive: true }),
    fs.mkdir(context.coversDir, { recursive: true }),
    fs.mkdir(context.chatsDir, { recursive: true }),
    fs.mkdir(context.trailsDir, { recursive: true }),
  ])

  return context
}

export async function claimLegacyDataForUser({
  dataRoot,
  skipLegacyBooks = Boolean(process.env.LIBRARY_DIR?.trim()),
  userId,
}: ClaimLegacyDataForUserInput): Promise<ClaimLegacyDataForUserResult> {
  const resolvedRoot = getDataRoot(dataRoot)
  const markerPath = getLegacyMigrationMarkerPath(resolvedRoot)
  const storageContext = await ensureStorageContext(
    createStorageContext(userId, resolvedRoot, {
      booksDir: skipLegacyBooks ? (process.env.LIBRARY_DIR?.trim() ?? null) : null,
    }),
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
    if (dirName === 'books' && skipLegacyBooks) {
      continue
    }

    try {
      const entries = await fs.readdir(path.join(/* turbopackIgnore: true */ resolvedRoot, dirName))
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
    const sourceDir = path.join(/* turbopackIgnore: true */ resolvedRoot, dirName)
    const targetDir =
      dirName === 'books'
        ? storageContext.booksDir
        : dirName === 'chats'
          ? storageContext.chatsDir
          : storageContext.trailsDir

    if (backupRoot) {
      await fs.cp(sourceDir, path.join(/* turbopackIgnore: true */ backupRoot, dirName), {
        errorOnExist: false,
        force: true,
        recursive: true,
      })
    }

    const entries = await fs.readdir(sourceDir)
    for (const entry of entries) {
      try {
        await fs.rename(
          path.join(/* turbopackIgnore: true */ sourceDir, entry),
          path.join(/* turbopackIgnore: true */ targetDir, entry),
        )
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error
        }
      }
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
        skippedLegacyBooks: skipLegacyBooks,
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
