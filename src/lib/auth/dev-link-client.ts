import type { AuthEmailKind } from '@/lib/auth/email-types'

interface LocalAuthLinkResponse {
  enabled: boolean
  url: string | null
}

export async function fetchLocalAuthLink({ kind, login }: { kind: AuthEmailKind; login: string }) {
  if (!login) {
    return null
  }

  const searchParams = new URLSearchParams({
    kind,
    login,
  })

  let response: Response
  try {
    response = await fetch(`/api/auth/dev-link?${searchParams.toString()}`, {
      cache: 'no-store',
    })
  } catch {
    // Best-effort dev-mode helper; never blow up the auth flow because the
    // dev-link endpoint was unreachable. Callers already treat null as
    // "no local link available."
    return null
  }

  if (!response.ok) {
    return null
  }

  const payload = (await response.json().catch(() => null)) as LocalAuthLinkResponse | null
  if (!payload || !payload.enabled) {
    return null
  }

  return payload.url
}
