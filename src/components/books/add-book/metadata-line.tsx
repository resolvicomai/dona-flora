export function MetadataLine({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') {
    return null
  }

  return (
    <p className="flex items-start justify-between gap-3">
      <span className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-foreground">{value}</span>
    </p>
  )
}
