export type TagMode = 'replace' | 'add' | 'remove'

export interface BulkEditBooksDialogProps {
  selectedSlugs: string[]
  onComplete: () => void
}

export type SaveStatus = {
  kind: 'error' | 'success'
  message: string
} | null
