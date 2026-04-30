export function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
