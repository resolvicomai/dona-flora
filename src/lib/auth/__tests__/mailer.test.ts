import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { findLatestLocalAuthLink, isLocalAuthInboxEnabled } from '@/lib/auth/mailer'

describe('local auth inbox helpers', () => {
  const originalDataDir = process.env.DATA_DIR
  const originalResendKey = process.env.RESEND_API_KEY
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-auth-'))
    process.env.DATA_DIR = tempDir
    delete process.env.RESEND_API_KEY
  })

  afterEach(async () => {
    if (originalDataDir === undefined) {
      delete process.env.DATA_DIR
    } else {
      process.env.DATA_DIR = originalDataDir
    }

    if (originalResendKey === undefined) {
      delete process.env.RESEND_API_KEY
    } else {
      process.env.RESEND_API_KEY = originalResendKey
    }

    await fs.rm(tempDir, { force: true, recursive: true })
  })

  it('returns the newest local verification link for the requested email', async () => {
    const outboxDir = path.join(tempDir, 'dev-emails')
    await fs.mkdir(outboxDir, { recursive: true })

    await fs.writeFile(
      path.join(outboxDir, '2026-04-20T10-00-00-000Z-verify-email-voce@example.com.txt'),
      'url: http://localhost:3000/verify-email?token=older\n',
      'utf-8',
    )

    await fs.writeFile(
      path.join(outboxDir, '2026-04-20T10-05-00-000Z-verify-email-voce@example.com.txt'),
      'url: http://localhost:3000/verify-email?token=newer\n',
      'utf-8',
    )

    const link = await findLatestLocalAuthLink({
      email: 'voce@example.com',
      kind: 'verify-email',
    })

    expect(link?.url).toBe('http://localhost:3000/verify-email?token=newer')
  })

  it('disables the local auth inbox when resend is configured', async () => {
    process.env.RESEND_API_KEY = 'configured'

    expect(isLocalAuthInboxEnabled()).toBe(false)

    const link = await findLatestLocalAuthLink({
      email: 'voce@example.com',
      kind: 'reset-password',
    })

    expect(link).toBeNull()
  })
})
