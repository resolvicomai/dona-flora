import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth, ensureAuthReady } from '@/lib/auth/auth'
import type { AuthenticatedAppSession, UserProfile, UserRole } from '@/lib/auth/types'
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

export async function getServerSession() {
  await ensureAuthReady()
  const requestHeaders = await headers()
  return toAuthenticatedSession(
    await auth.api.getSession({
      headers: requestHeaders,
    }),
  )
}

export async function getRequestSession(request: Request | NextRequest) {
  await ensureAuthReady()
  return toAuthenticatedSession(
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
  const session = await requireServerSession()
  if (!session.user.emailVerified) {
    redirect('/verify-email')
  }

  return session
}

export async function requireVerifiedRequestSession(request: Request | NextRequest) {
  const session = await getRequestSession(request)
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 }),
    }
  }

  if (!session.user.emailVerified) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Email nao verificado.' }, { status: 403 }),
    }
  }

  return {
    ok: true as const,
    session,
  }
}

export function getSessionStorageContext(session: AuthenticatedAppSession) {
  return createStorageContext(session.user.id)
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
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    id: session.user.id,
    image: session.user.image ?? null,
    initials: initials || 'DF',
    role: session.user.role,
  }
}
