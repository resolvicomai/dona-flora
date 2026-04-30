import { Check, Cpu, FolderOpen, UserRound } from 'lucide-react'
import type { SignUpStory } from './copy'

export function SignUpCardContext({ story }: { story: SignUpStory }) {
  const icons = [UserRound, FolderOpen, Cpu]

  return (
    <div className="mt-6 space-y-5">
      <div className="lg:hidden">
        <p className="text-sm leading-7 text-muted-foreground">
          {story.mobileSummary}{' '}
          <a
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={story.context[0]?.href}
            rel="noreferrer"
            target="_blank"
          >
            {story.mobileReferenceLabel}
          </a>
        </p>
      </div>

      <div className="rounded-md border border-hairline bg-surface/60 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{story.pathEyebrow}</p>
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            1/3
          </span>
        </div>
        <ol className="mt-4 grid gap-3">
          {story.steps.map((step, index) => {
            const Icon = icons[index] ?? Check
            const isCurrent = index === 0
            return (
              <li
                className={
                  isCurrent
                    ? 'grid grid-cols-[auto_1fr] gap-3 text-sm text-foreground'
                    : 'grid grid-cols-[auto_1fr] gap-3 text-sm text-muted-foreground'
                }
                key={step.title}
              >
                <span
                  className={
                    isCurrent
                      ? 'flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground'
                      : 'flex h-8 w-8 items-center justify-center rounded-md border border-hairline'
                  }
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>
                  <strong className="block font-semibold text-foreground">{step.title}</strong>
                  <span className="leading-6">{step.body}</span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
