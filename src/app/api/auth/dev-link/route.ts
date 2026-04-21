import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { AuthEmailKind } from '@/lib/auth/email-types'
import {
  findLatestLocalAuthLink,
  isLocalAuthInboxEnabled,
} from '@/lib/auth/mailer'

const SearchParamsSchema = z.object({
  email: z.string().email(),
  kind: z.enum(['reset-password', 'verify-email']),
})

export async function GET(request: NextRequest) {
  const parsedSearchParams = SearchParamsSchema.safeParse({
    email: request.nextUrl.searchParams.get('email'),
    kind: request.nextUrl.searchParams.get('kind'),
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

  const { email, kind } = parsedSearchParams.data as {
    email: string
    kind: AuthEmailKind
  }

  const link = await findLatestLocalAuthLink({ email, kind })

  return NextResponse.json({
    enabled: true,
    url: link?.url ?? null,
  })
}
