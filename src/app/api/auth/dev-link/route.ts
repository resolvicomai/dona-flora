import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { AuthEmailKind } from '@/lib/auth/email-types'
import { loginToAuthIdentifier } from '@/lib/auth/local-identity'
import {
  findLatestLocalAuthLink,
  isLocalAuthInboxEnabled,
} from '@/lib/auth/mailer'

const SearchParamsSchema = z.object({
  kind: z.enum(['reset-password', 'verify-email']),
  login: z.string().min(1),
})

export async function GET(request: NextRequest) {
  const parsedSearchParams = SearchParamsSchema.safeParse({
    kind: request.nextUrl.searchParams.get('kind'),
    login: request.nextUrl.searchParams.get('login'),
  })

  if (!parsedSearchParams.success) {
    return NextResponse.json(
      { error: 'Invalid local auth link lookup.' },
      { status: 400 },
    )
  }

  if (!isLocalAuthInboxEnabled()) {
    return NextResponse.json({
      enabled: false,
      url: null,
    })
  }

  const { kind, login } = parsedSearchParams.data as {
    kind: AuthEmailKind
    login: string
  }
  const email = loginToAuthIdentifier(login)

  const link = await findLatestLocalAuthLink({ email, kind })

  return NextResponse.json({
    enabled: true,
    url: link?.url ?? null,
  })
}
