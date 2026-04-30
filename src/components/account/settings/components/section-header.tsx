export function SectionHeader({
  body,
  eyebrow,
  title,
}: {
  body: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-none tracking-normal text-foreground">
        {title}
      </h2>
      <p className="text-sm leading-7 text-muted-foreground">{body}</p>
    </div>
  )
}
