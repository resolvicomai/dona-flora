import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSessionStorageContext,
  requireVerifiedRequestSession,
} from '@/lib/auth/server'
import { deleteChat } from '@/lib/chats/store'

/**
 * DELETE /api/chats/[id] — removes data/chats/{id}.md.
 *
 * chatId regex matches Plan 03's POST /api/chat schema so path-traversal and
 * shell-unsafe chars are rejected before touching the filesystem (threat T-04-09).
 * Returns 204 on success, 404 when the file does not exist, 400 on invalid id.
 */

const ChatIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/)

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireVerifiedRequestSession(_request)
  if (!authResult.ok) {
    return authResult.response
  }
  const session = authResult.session

  const { id } = await params
  const parsed = ChatIdSchema.safeParse(id)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chat id' }, { status: 400 })
  }

  try {
    const removed = await deleteChat(
      parsed.data,
      getSessionStorageContext(session),
    )
    if (!removed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[API] DELETE /api/chats/[id] error:', err)
    return NextResponse.json(
      { error: 'Erro ao excluir conversa.' },
      { status: 500 }
    )
  }
}
