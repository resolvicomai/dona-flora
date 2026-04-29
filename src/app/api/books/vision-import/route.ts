import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { generateObject } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AIProviderConfigurationError,
  resolveVisionModelForUser,
} from '@/lib/ai/provider'
import { searchGoogleBooks } from '@/lib/api/google-books'
import { searchOpenLibrary } from '@/lib/api/open-library'
import { dedupeBooks } from '@/lib/api/dedupe'
import { requireVerifiedRequestSession } from '@/lib/auth/server'
import { normalizeAuthors } from '@/lib/books/authors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const execFileAsync = promisify(execFile)
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const VisionCandidateSchema = z.object({
  author: z.union([z.string(), z.array(z.string())]).default([]),
  confidence: z.number().min(0).max(1).optional(),
  publisher: z.string().optional(),
  subtitle: z.string().optional(),
  title: z.string().min(1),
})

class UnsupportedImageError extends Error {
  status = 415
}

function isHeicFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

function isSupportedImage(file: File) {
  return (
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    isHeicFile(file)
  )
}

async function convertHeicToJpeg(buffer: Buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-vision-'))
  const inputPath = path.join(tempDir, 'input.heic')
  const outputPath = path.join(tempDir, 'output.jpg')

  try {
    await fs.writeFile(inputPath, buffer)
    await execFileAsync('sips', [
      '-s',
      'format',
      'jpeg',
      inputPath,
      '--out',
      outputPath,
    ])
    return await fs.readFile(outputPath)
  } catch {
    throw new UnsupportedImageError(
      'Imagem HEIC não suportada neste ambiente. Converta para JPG/PNG e tente de novo.',
    )
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true }).catch(() => {})
  }
}

async function normalizeUploadedImage(file: File) {
  if (!isSupportedImage(file)) {
    throw new UnsupportedImageError('Formato de imagem invalido.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new UnsupportedImageError('Imagem grande demais. Limite: 10MB.')
  }

  if (isHeicFile(file)) {
    return {
      buffer: await convertHeicToJpeg(buffer),
      mediaType: 'image/jpeg',
    }
  }

  return {
    buffer,
    mediaType: file.type,
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Upload invalido.' }, { status: 400 })
  }

  const file = formData.get('image')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Envie uma imagem.' }, { status: 400 })
  }

  try {
    const image = await normalizeUploadedImage(file)
    const { model } = resolveVisionModelForUser(authResult.session.user.id)
    const result = await generateObject({
      maxRetries: 1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Leia esta capa de livro. Retorne apenas dados bibliográficos visíveis ou muito prováveis: título, subtítulo, autor(es), editora e uma confiança de 0 a 1. Não invente ISBN.',
            },
            {
              type: 'image',
              image: image.buffer,
              mediaType: image.mediaType,
            },
          ],
        },
      ],
      model,
      schema: VisionCandidateSchema,
      schemaName: 'BookCoverCandidate',
      timeout: { totalMs: 30000 },
    })

    const candidate = {
      ...result.object,
      author: normalizeAuthors(result.object.author),
    }
    const matchQuery = [candidate.title, ...candidate.author].join(' ').trim()
    const [googleMatches, openLibraryMatches] = await Promise.allSettled([
      searchGoogleBooks(matchQuery, 5),
      searchOpenLibrary(matchQuery, 5),
    ])
    const matches = dedupeBooks([
      ...(googleMatches.status === 'fulfilled' ? googleMatches.value : []),
      ...(openLibraryMatches.status === 'fulfilled'
        ? openLibraryMatches.value
        : []),
    ], 8)

    return NextResponse.json({
      candidate,
      matches,
      ok: true,
    })
  } catch (err) {
    if (err instanceof AIProviderConfigurationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err instanceof UnsupportedImageError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    console.error('[API] POST /api/books/vision-import error:', err)
    return NextResponse.json(
      { error: 'Não foi possível importar pela foto.' },
      { status: 500 },
    )
  }
}
