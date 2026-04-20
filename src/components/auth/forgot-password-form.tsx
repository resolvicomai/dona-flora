'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { fetchLocalAuthLink } from '@/lib/auth/dev-link-client'
import { Input } from '@/components/ui/input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'

function resetRedirectURL() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/reset-password`
}

export function ForgotPasswordForm({ initialEmail = '' }: { initialEmail?: string }) {
  const { copy } = useAppLanguage()
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [localLink, setLocalLink] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsPending(true)

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: resetRedirectURL(),
    })

    setIsPending(false)

    if (result.error) {
      setError(result.error.message ?? copy.auth.forgotPassword.error)
      return
    }

    setSuccess(copy.auth.forgotPassword.success)
    const nextLocalLink = await fetchLocalAuthLink({
      email,
      kind: 'reset-password',
    })
    setLocalLink(nextLocalLink)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      {localLink ? (
        <div className="rounded-[1.4rem] border border-border/60 bg-surface/70 px-4 py-3 text-sm text-muted-foreground">
          {copy.auth.forgotPassword.localLinkNote}
          <div className="mt-3">
            <a
              className="inline-flex h-10 items-center justify-center rounded-full border border-hairline bg-surface-elevated px-4 text-[0.84rem] font-medium text-foreground shadow-mac-sm transition hover:bg-surface-strong"
              href={localLink}
            >
              {copy.auth.forgotPassword.localLinkTitle}
            </a>
          </div>
        </div>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.forgotPassword.emailLabel}</span>
        <Input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.auth.forgotPassword.emailPlaceholder}
          required
          spellCheck={false}
          type="email"
          value={email}
        />
      </label>

      <Button disabled={isPending} type="submit">
        {isPending ? copy.auth.forgotPassword.sending : copy.auth.forgotPassword.submit}
      </Button>
    </form>
  )
}
