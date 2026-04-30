export function ToggleSetting({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean
  description: string
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="brand-inset flex items-start gap-3 px-4 py-3 text-sm text-muted-foreground">
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-[var(--primary)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>
        <span className="block font-medium text-foreground">{label}</span>
        {description}
      </span>
    </label>
  )
}
