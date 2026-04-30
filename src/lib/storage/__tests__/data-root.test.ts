import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { getDataRoot } from '@/lib/storage/data-root'

describe('data root resolution', () => {
  const originalCwd = process.cwd()
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-root-'))
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await fs.rm(tempDir, { force: true, recursive: true })
  })

  it('resolves data under the project root during normal execution', () => {
    process.chdir(tempDir)

    expect(getDataRoot()).toBe(path.join(process.cwd(), 'data'))
  })

  it('escapes the standalone folder when the production server runs from .next/standalone', async () => {
    const standaloneDir = path.join(tempDir, '.next', 'standalone')
    await fs.mkdir(standaloneDir, { recursive: true })
    process.chdir(standaloneDir)

    expect(getDataRoot()).toBe(path.resolve(process.cwd(), '..', '..', 'data'))
  })
})
