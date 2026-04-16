import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { width: 48, height: 72 },    // home page list item
  md: { width: 128, height: 192 },  // mobile detail
  lg: { width: 192, height: 288 },  // desktop detail
}

export function BookCover({ src, alt, size = 'md', className }: BookCoverProps) {
  const { width, height } = SIZES[size]

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-zinc-800',
          className
        )}
        style={{ width, height }}
        aria-label="Sem capa disponivel"
      >
        <BookOpen className="h-8 w-8 text-zinc-600" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={`${alt} - capa`}
      width={width}
      height={height}
      className={cn('rounded-lg object-cover', className)}
    />
  )
}
