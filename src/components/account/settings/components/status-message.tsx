import type { SaveStatus } from '../types'

export function StatusMessage({ status }: { status: Exclude<SaveStatus, null> }) {
  const className =
    status.kind === 'success'
      ? 'brand-inset mt-5 px-4 py-3 text-sm text-foreground'
      : 'mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'

  return <div className={className}>{status.message}</div>
}
