import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { getMigrations } from 'better-auth/db/migration'
import { nextCookies } from 'better-auth/next-js'
import { ensureAppTables, getDatabase } from '@/lib/auth/db'
import { sendAuthEmail } from '@/lib/auth/mailer'
import type { UserRole } from '@/lib/auth/types'
import { claimLegacyDataForUser } from '@/lib/storage/context'

function getAppBaseURL() {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

function getAuthBaseURLConfig() {
  const fallback = getAppBaseURL()
  const allowedHosts = new Set<string>(['localhost:*', '127.0.0.1:*'])

  try {
    allowedHosts.add(new URL(fallback).host)
  } catch {
    // Ignore invalid fallback parsing here; Better Auth validates fallback later.
  }

  return {
    allowedHosts: Array.from(allowedHosts),
    fallback,
    protocol: fallback.startsWith('http://') ? 'http' : 'https',
  } as const
}

function getTrustedOrigins() {
  const trustedOrigins = new Set<string>(['http://localhost:*', 'http://127.0.0.1:*'])

  try {
    trustedOrigins.add(new URL(getAppBaseURL()).origin)
  } catch {
    // Ignore invalid configured origin here; Better Auth validates the rest.
  }

  return Array.from(trustedOrigins)
}

function getAuthSecret() {
  if (process.env.BETTER_AUTH_SECRET) {
    return process.env.BETTER_AUTH_SECRET
  }

  return 'dona-flora-local-dev-secret-2026'
}

const database = getDatabase()

const authOptions: BetterAuthOptions = {
  basePath: '/api/auth',
  baseURL: getAuthBaseURLConfig(),
  database,
  secret: getAuthSecret(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ token, url, user }) => {
      await sendAuthEmail({
        email: user.email,
        kind: 'reset-password',
        token,
        url,
      })
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: false,
    sendVerificationEmail: async ({ token, url, user }) => {
      await sendAuthEmail({
        email: user.email,
        kind: 'verify-email',
        token,
        url,
      })
    },
  },
  plugins: [nextCookies()],
  trustedOrigins: getTrustedOrigins(),
  user: {
    additionalFields: {
      role: {
        defaultValue: 'user',
        input: false,
        required: false,
        type: 'string',
      },
    },
  },
}

export const auth = betterAuth(authOptions)

export async function ensureLocalUserReady(userId: string): Promise<UserRole> {
  ensureAppTables(database)

  const assignOwnerIfNeeded = database.transaction((currentUserId: string) => {
    const existingOwner = database
      .prepare<
        { role: UserRole },
        { id: string }
      >(`SELECT id FROM "user" WHERE role = @role LIMIT 1`)
      .get({ role: 'owner' })

    if (existingOwner) {
      return existingOwner.id === currentUserId ? 'owner' : 'user'
    }

    database
      .prepare<{
        role: UserRole
        userId: string
      }>(`UPDATE "user" SET role = @role WHERE id = @userId`)
      .run({ role: 'owner', userId: currentUserId })

    return 'owner'
  })

  const role = assignOwnerIfNeeded(userId)
  if (role === 'owner') {
    await claimLegacyDataForUser({ userId })
  }

  return role
}

let authReadyPromise: Promise<void> | null = null

export async function ensureAuthReady() {
  if (!authReadyPromise) {
    authReadyPromise = (async () => {
      ensureAppTables(database)
      const { runMigrations } = await getMigrations(authOptions)
      await runMigrations()
    })().catch((error) => {
      authReadyPromise = null
      throw error
    })
  }

  await authReadyPromise
}
