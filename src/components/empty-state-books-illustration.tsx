import { cn } from '@/lib/utils'

interface EmptyStateBooksIllustrationProps {
  className?: string
}

export function EmptyStateBooksIllustration({
  className,
}: EmptyStateBooksIllustrationProps) {
  return (
    <svg
      viewBox="0 0 128 96"
      role="img"
      aria-hidden="true"
      className={cn('h-24 w-32', className)}
    >
      <g className="stroke-border" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <rect
          x="20"
          y="44"
          width="24"
          height="34"
          rx="4"
          transform="rotate(-8 20 44)"
          className="fill-muted"
        />
        <rect
          x="53"
          y="28"
          width="26"
          height="50"
          rx="4"
          className="fill-muted"
        />
        <rect
          x="86"
          y="40"
          width="20"
          height="38"
          rx="4"
          transform="rotate(10 86 40)"
          className="fill-muted"
        />
        <path d="M27 49.5h10M59 37h14M91 47h8" className="stroke-muted-foreground/30" />
        <path d="M33 50.5c2 2 4 3 6 3" className="stroke-muted-foreground/20" />
        <path d="M67 39.5c1.5 2 3.5 3 6 3" className="stroke-muted-foreground/20" />
        <path d="M94 48.5c1.5 2 3 2.5 5 3" className="stroke-muted-foreground/20" />
      </g>
    </svg>
  )
}
