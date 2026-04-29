import type { AuthEmailKind } from '@/lib/auth/email-types'

interface LocalAuthLinkResponse {
  enabled: boolean
  url: string | null
}

export async function fetchLocalAuthLink({
  kind,
  login,
}: {
  kind: AuthEmailKind
  login: string
}) {
  if (!login) {
    return null
  }

  const searchParams = new URLSearchParams({
    kind,
    login,
  })

  const response = await fetch(`/api/auth/dev-link?${searchParams.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as LocalAuthLinkResponse
  if (!payload.enabled) {
    return null
  }

  return payload.url
}
