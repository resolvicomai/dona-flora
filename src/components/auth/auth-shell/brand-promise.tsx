import type { AppLanguageCopy } from '@/components/app-shell/app-language-copy'

export function BrandPromise({ shellCopy }: { shellCopy: AppLanguageCopy['shell'] }) {
  return (
    <>
      <div className="max-w-xl space-y-5">
        <div className="space-y-4">
          <p className="eyebrow">{shellCopy.eyebrow}</p>
          <h1 className="text-[clamp(3rem,5vw,5.1rem)] font-semibold leading-none tracking-normal text-foreground">
            {shellCopy.headline}
          </h1>
          <p className="max-w-lg text-[0.98rem] leading-8 text-muted-foreground">
            {shellCopy.intro}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="brand-inset px-4 py-4">
          <p className="eyebrow">{shellCopy.libraryLabel}</p>
          <p className="mt-2 text-sm text-foreground">{shellCopy.libraryBody}</p>
        </div>
        <div className="brand-inset px-4 py-4">
          <p className="eyebrow">{shellCopy.aiLabel}</p>
          <p className="mt-2 text-sm text-foreground">{shellCopy.aiBody}</p>
        </div>
        <div className="brand-inset px-4 py-4 sm:col-span-2">
          <p className="eyebrow">{shellCopy.accountLabel}</p>
          <p className="mt-2 text-sm text-foreground">{shellCopy.accountBody}</p>
        </div>
      </div>
    </>
  )
}
