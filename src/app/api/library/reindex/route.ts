import { NextRequest, NextResponse } from 'next/server'
import { getSessionStorageContext, requireVerifiedRequestSession } from '@/lib/auth/server'
import { buildLibraryReadinessReport } from '@/lib/library/readiness'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const report = await buildLibraryReadinessReport(getSessionStorageContext(authResult.session))
    return NextResponse.json(report)
  } catch (err) {
    console.error('[API] POST /api/library/reindex error:', err)
    return NextResponse.json({ error: 'Não foi possível reler a biblioteca.' }, { status: 500 })
  }
}
