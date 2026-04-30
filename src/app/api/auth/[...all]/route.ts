import { toNextJsHandler } from 'better-auth/next-js'
import { auth, ensureAuthReady } from '@/lib/auth/auth'

const handler = toNextJsHandler(auth)

async function withReadyState(request: Request, action: (request: Request) => Promise<Response>) {
  await ensureAuthReady()
  return action(request)
}

export async function GET(request: Request) {
  return withReadyState(request, handler.GET)
}

export async function POST(request: Request) {
  return withReadyState(request, handler.POST)
}

export async function PATCH(request: Request) {
  return withReadyState(request, handler.PATCH)
}

export async function PUT(request: Request) {
  return withReadyState(request, handler.PUT)
}

export async function DELETE(request: Request) {
  return withReadyState(request, handler.DELETE)
}
