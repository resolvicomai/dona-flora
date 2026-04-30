import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import type { AppLanguage } from '@/lib/i18n/app-language'
import { signUpStoryCopy } from './copy'

export function SignUpOnboardingStory({ locale }: { locale: AppLanguage }) {
  const story = signUpStoryCopy[locale]

  return (
    <div className="flex min-h-[42rem] flex-col justify-between gap-10">
      <div className="max-w-2xl space-y-5">
        <p className="eyebrow">{story.eyebrow}</p>
        <h1 className="max-w-2xl text-[clamp(3.3rem,5.2vw,5rem)] font-semibold leading-[0.96] tracking-normal text-foreground">
          {story.title}
        </h1>
        <p className="max-w-xl text-[1rem] leading-8 text-muted-foreground">{story.description}</p>
      </div>

      <div className="grid gap-0 border-y border-hairline">
        {story.context.map((item) => {
          return (
            <article
              className="grid gap-4 border-b border-hairline py-6 last:border-b-0 md:grid-cols-[8rem_1fr]"
              key={item.title}
            >
              <p className="eyebrow pt-1">{item.kicker}</p>
              <div>
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                  {item.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{item.body}</p>
                <a
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  href={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.linkLabel}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          )
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <div>
          <p className="eyebrow">{story.featuresEyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
            {story.featuresTitle}
          </h2>
        </div>
        <ul className="grid gap-3">
          {story.features.map((feature) => (
            <li className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6" key={feature.title}>
              <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              <span>
                <strong className="font-semibold text-foreground">{feature.title}</strong>
                <span className="text-muted-foreground"> {feature.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-hairline" />
        <span>{story.closing}</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  )
}
