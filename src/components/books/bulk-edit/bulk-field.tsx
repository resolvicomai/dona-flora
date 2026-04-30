import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BulkField({
  checked,
  children,
  description,
  label,
  onCheckedChange,
}: {
  checked: boolean
  children: ReactNode
  description: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <section className="brand-inset space-y-3 px-4 py-3">
      <label className="flex items-start gap-3">
        <input
          checked={checked}
          className="mt-1 h-4 w-4 accent-[var(--primary)]"
          onChange={(event) => onCheckedChange(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block font-medium text-foreground">{label}</span>
          <span className="block text-sm leading-6 text-muted-foreground">{description}</span>
        </span>
      </label>
      {checked ? children : null}
    </section>
  )
}

export function NumberBulkField({
  checked,
  description,
  emptyRemoves,
  label,
  max,
  min,
  onCheckedChange,
  onValueChange,
  placeholder,
  value,
}: {
  checked: boolean
  description: string
  emptyRemoves: string
  label: string
  max?: number
  min: number
  onCheckedChange: (checked: boolean) => void
  onValueChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <BulkField
      checked={checked}
      description={`${description}. ${emptyRemoves}`}
      label={label}
      onCheckedChange={onCheckedChange}
    >
      <Label className="sr-only">{label}</Label>
      <Input
        max={max}
        min={min}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        type="number"
        value={value}
      />
    </BulkField>
  )
}
