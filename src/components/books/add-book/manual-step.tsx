import type * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getStatusLabel } from '@/lib/books/status-labels'
import type { AppLanguage } from '@/lib/i18n/app-language'
import type { Step } from './constants'
import type { AddBookCopy } from './copy'

type AddBookManualStepProps = {
  copy: AddBookCopy
  error: string | null
  handleSaveManual: () => void
  isSaving: boolean
  locale: AppLanguage
  manualAuthor: string
  manualStatus: string
  manualTitle: string
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setManualAuthor: React.Dispatch<React.SetStateAction<string>>
  setManualStatus: React.Dispatch<React.SetStateAction<string>>
  setManualTitle: React.Dispatch<React.SetStateAction<string>>
  setStep: React.Dispatch<React.SetStateAction<Step>>
  statusOptions: Array<{ label: string; value: string }>
  visible: boolean
}

export function AddBookManualStep({
  copy,
  error,
  handleSaveManual,
  isSaving,
  locale,
  manualAuthor,
  manualStatus,
  manualTitle,
  setError,
  setManualAuthor,
  setManualStatus,
  setManualTitle,
  setStep,
  statusOptions,
  visible,
}: AddBookManualStepProps) {
  if (!visible) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manual-title" className="eyebrow">
          {copy.titleLabel} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="manual-title"
          autoFocus
          placeholder={copy.titlePlaceholder}
          value={manualTitle}
          onChange={(e) => setManualTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manual-author" className="eyebrow">
          {copy.authorLabel} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="manual-author"
          placeholder={copy.authorPlaceholder}
          value={manualAuthor}
          onChange={(e) => setManualAuthor(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="eyebrow">{copy.statusLabel}</Label>
        <Select
          value={manualStatus}
          onValueChange={(v) => {
            if (v) setManualStatus(v)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{(v) => getStatusLabel(v, locale)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setStep('search')
            setError(null)
          }}
        >
          {copy.back}
        </Button>
        <Button
          onClick={handleSaveManual}
          disabled={isSaving || !manualTitle.trim() || !manualAuthor.trim()}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy.adding}
            </>
          ) : (
            copy.add
          )}
        </Button>
      </div>
    </div>
  )
}
