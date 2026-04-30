export default function Loading() {
  return (
    <div className="page-frame flex min-h-0 flex-1 items-center justify-center py-10">
      <div className="brand-window w-full max-w-lg p-6">
        <p className="eyebrow">Dona Flora</p>
        <div className="mt-5 space-y-3" aria-hidden="true">
          <div className="h-5 w-44 rounded-md bg-foreground/10 motion-safe:animate-pulse" />
          <div className="h-3 w-full rounded-md bg-foreground/8 motion-safe:animate-pulse" />
          <div className="h-3 w-3/4 rounded-md bg-foreground/8 motion-safe:animate-pulse" />
        </div>
        <p className="mt-5 text-sm text-muted-foreground" role="status">
          Carregando sua biblioteca...
        </p>
      </div>
    </div>
  )
}
