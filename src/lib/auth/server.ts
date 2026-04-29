import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth, ensureAuthReady, ensureLocalUserReady } from '@/lib/auth/auth'
import { getUserLibrarySettings } from '@/lib/auth/db'
import type { AuthenticatedAppSession, UserProfile, UserRole } from '@/lib/auth/types'
import { authIdentifierToDisplayLogin } from '@/lib/auth/local-identity'
import { createStorageContext } from '@/lib/storage/context'

function normalizeRole(role: unknown): UserRole {
  return role === 'owner' ? 'owner' : 'user'
}

function toAuthenticatedSession(
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
): AuthenticatedAppSession | null {
  if (!session) {
    return null
  }

  return {
    session: {
      expiresAt:
        session.session.expiresAt instanceof Date
          ? session.session.expiresAt
          : new Date(session.session.expiresAt),
      id: String(session.session.id),
      token: session.session.token,
      userId: String(session.session.userId),
    },
    user: {
      email: session.user.email,
      emailVerified: Boolean(session.user.emailVerified),
      id: String(session.user.id),
      image: session.user.image ?? null,
      name: session.user.name,
      role: normalizeRole((session.user as { role?: unknown }).role),
    },
  }
}

async function prepareLocalSession(
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
) {
  const authenticated = toAuthenticatedSession(session)
  if (!authenticated) {
    return null
  }

  const role = await ensureLocalUserReady(authenticated.user.id)
  return {
    ...authenticated,
    user: {
      ...authenticated.user,
      emailVerified: true,
      role,
    },
  }
}

export async function getServerSession() {
  await ensureAuthReady()
  const requestHeaders = await headers()
  return prepareLocalSession(
    await auth.api.getSession({
      headers: requestHeaders,
    }),
  )
}

export async function getRequestSession(request: Request | NextRequest) {
  await ensureAuthReady()
  return prepareLocalSession(
    await auth.api.getSession({
      headers: request.headers,
    }),
  )
}

export async function requireServerSession() {
  const session = await getServerSession()
  if (!session) {
    redirect('/sign-in')
  }

  return session
}

export async function requireVerifiedServerSession() {
  return requireServerSession()
}

export async function requireVerifiedRequestSession(request: Request | NextRequest) {
  const session = await getRequestSession(request)
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }),
    }
  }

  return {
    ok: true as const,
    session,
  }
}

export function getSessionStorageContext(session: AuthenticatedAppSession) {
  const librarySettings = getUserLibrarySettings(session.user.id)
  return createStorageContext(session.user.id, undefined, {
    booksDir: librarySettings.booksDir,
  })
}

export function toUserProfile(session: AuthenticatedAppSession): UserProfile {
  const name = session.user.name?.trim() || session.user.email
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return {
    displayName: name,
    email: authIdentifierToDisplayLogin(session.user.email),
    emailVerified: session.user.emailVerified,
    id: session.user.id,
    image: session.user.image ?? null,
    initials: initials || 'DF',
    role: session.user.role,
  }
}
