/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'card'
  className?: string
}

const SIZES = {
  sm: { width: 56, height: 84 },
  md: { width: 128, height: 192 },
  lg: { width: 192, height: 288 },
  card: { width: 168, height: 252 },
}

const INITIAL_SIZE: Record<'sm' | 'md' | 'lg' | 'card', string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  card: 'text-4xl',
}

/**
 * @param alt - Book title. Used both as accessible text (<img alt>) and as the
 * visible first-initial character in the fallback placeholder.
 */
export function BookCover({ src, alt, size = 'md', className }: BookCoverProps) {
  const { width, height } = SIZES[size]

  if (!src) {
    const trimmed = alt.trim()
    const initial = trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?'
    return (
      <div
        className={cn(
          'brand-panel flex items-center justify-center',
          className,
        )}
        style={{ width, height }}
        aria-label={`Capa de ${alt || 'livro'} não disponível`}
        role="img"
      >
        <span className={cn('font-medium text-foreground', INITIAL_SIZE[size])}>
          {initial}
        </span>
      </div>
    )
  }

  if (src.startsWith('/api/')) {
    return (
      // Same-origin authenticated cover routes must be requested by the
      // browser so cookies travel with the request; next/image optimizes
      // server-side and would not reliably carry the user's session.
      <img
        src={src}
        alt={`${alt} - capa`}
        width={width}
        height={height}
        className={cn('rounded-md border border-hairline-strong object-cover shadow-mac-sm', className)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={`${alt} - capa`}
      width={width}
      height={height}
      className={cn('rounded-md border border-hairline-strong object-cover shadow-mac-sm', className)}
    />
  )
}
