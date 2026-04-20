import fs from 'fs/promises'
import path from 'path'
import { Resend } from 'resend'
import type { AuthEmailKind } from '@/lib/auth/email-types'
import { getDataRoot as resolveDataRoot } from '@/lib/storage/data-root'

interface AuthEmailPayload {
  email: string
  kind: AuthEmailKind
  token: string
  url: string
}

function getDataRoot() {
  return resolveDataRoot()
}

function getDevOutboxDir() {
  return path.join(getDataRoot(), 'dev-emails')
}

function getFromAddress() {
  return process.env.AUTH_EMAIL_FROM ?? 'Dona Flora <onboarding@resend.dev>'
}

function getSafeEmail(email: string) {
  return email.replace(/[^a-z0-9@._-]/gi, '-').toLowerCase()
}

function buildSubject(kind: AuthEmailKind) {
  return kind === 'verify-email'
    ? 'Confirme seu email na Dona Flora'
    : 'Redefina sua senha na Dona Flora'
}

function buildTextBody({ kind, url }: AuthEmailPayload) {
  if (kind === 'verify-email') {
    return `Confirme seu email acessando este link:\n\n${url}\n`
  }

  return `Redefina sua senha acessando este link:\n\n${url}\n`
}

function buildHtmlBody({ kind, url }: AuthEmailPayload) {
  const intro =
    kind === 'verify-email'
      ? 'Confirme seu email para liberar sua biblioteca.'
      : 'Use o link abaixo para redefinir sua senha.'

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="font-size: 20px; margin-bottom: 12px;">Dona Flora</h1>
      <p style="margin-bottom: 16px;">${intro}</p>
      <p style="margin-bottom: 16px;">
        <a href="${url}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; text-decoration: none; background: #111827; color: #ffffff;">
          Abrir link seguro
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">Se o botão não abrir, copie e cole este URL no navegador:</p>
      <p style="color: #6b7280; font-size: 14px; word-break: break-all;">${url}</p>
    </div>
  `
}

async function writeDevEmail(payload: AuthEmailPayload) {
  const outboxDir = getDevOutboxDir()
  await fs.mkdir(outboxDir, { recursive: true })

  const safeEmail = getSafeEmail(payload.email)
  const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${payload.kind}-${safeEmail}.txt`

  await fs.writeFile(
    path.join(outboxDir, filename),
    [
      `to: ${payload.email}`,
      `subject: ${buildSubject(payload.kind)}`,
      `token: ${payload.token}`,
      `url: ${payload.url}`,
      '',
      buildTextBody(payload),
    ].join('\n'),
    'utf-8',
  )

  console.info(`[AuthMailer] Dev email written to ${path.join(outboxDir, filename)}`)
  console.info(`[AuthMailer] ${payload.kind} URL for ${payload.email}: ${payload.url}`)
}

async function sendWithResend(payload: AuthEmailPayload) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: getFromAddress(),
    html: buildHtmlBody(payload),
    subject: buildSubject(payload.kind),
    text: buildTextBody(payload),
    to: payload.email,
  })
}

export async function sendAuthEmail(payload: AuthEmailPayload) {
  if (process.env.RESEND_API_KEY) {
    await sendWithResend(payload)
    return
  }

  await writeDevEmail(payload)
}

export function isLocalAuthInboxEnabled() {
  return !process.env.RESEND_API_KEY
}

export async function findLatestLocalAuthLink({
  email,
  kind,
}: {
  email: string
  kind: AuthEmailKind
}) {
  if (!isLocalAuthInboxEnabled()) {
    return null
  }

  let filenames: string[]
  try {
    filenames = await fs.readdir(getDevOutboxDir())
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }

  const safeEmail = getSafeEmail(email)
  const matchedFiles = filenames
    .filter((filename) => filename.includes(`${kind}-${safeEmail}`))
    .sort()
    .reverse()

  for (const filename of matchedFiles) {
    const filePath = path.join(getDevOutboxDir(), filename)
    const content = await fs.readFile(filePath, 'utf-8')
    const urlLine = content
      .split('\n')
      .find((line) => line.toLowerCase().startsWith('url: '))

    if (!urlLine) {
      continue
    }

    return {
      filename,
      url: urlLine.slice(5).trim(),
    }
  }

  return null
}
