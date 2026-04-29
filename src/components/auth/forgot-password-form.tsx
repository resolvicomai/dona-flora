'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { fetchLocalAuthLink } from '@/lib/auth/dev-link-client'
import { Input } from '@/components/ui/input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'
import { loginToAuthIdentifier } from '@/lib/auth/local-identity'

function resetRedirectURL() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/reset-password`
}

export function ForgotPasswordForm({ initialLogin = '' }: { initialLogin?: string }) {
  const { copy } = useAppLanguage()
  const [usernameOrEmail, setUsernameOrEmail] = useState(initialLogin)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [localLink, setLocalLink] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsPending(true)
    const authIdentifier = loginToAuthIdentifier(usernameOrEmail)

    const result = await authClient.requestPasswordReset({
      email: authIdentifier,
      redirectTo: resetRedirectURL(),
    })

    setIsPending(false)

    if (result.error) {
      setError(result.error.message ?? copy.auth.forgotPassword.error)
      return
    }

    setSuccess(copy.auth.forgotPassword.success)
    const nextLocalLink = await fetchLocalAuthLink({
      kind: 'reset-password',
      login: usernameOrEmail,
    })
    setLocalLink(nextLocalLink)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="brand-inset px-4 py-3 text-sm text-foreground">{success}</div>
      ) : null}

      {localLink ? (
        <div className="brand-inset px-4 py-3 text-sm text-muted-foreground">
          {copy.auth.forgotPassword.localLinkNote}
          <div className="mt-3">
            <a
              className="inline-flex h-10 items-center justify-center rounded-md border border-hairline-strong bg-surface-elevated px-4 text-[0.84rem] font-medium text-foreground shadow-none transition hover:-translate-y-0.5 hover:bg-surface-strong"
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
          autoComplete="username"
          name="usernameOrEmail"
          onChange={(event) => setUsernameOrEmail(event.target.value)}
          placeholder={copy.auth.forgotPassword.emailPlaceholder}
          required
          spellCheck={false}
          type="text"
          value={usernameOrEmail}
        />
      </label>

      <Button disabled={isPending} type="submit">
        {isPending ? copy.auth.forgotPassword.sending : copy.auth.forgotPassword.submit}
      </Button>
    </form>
  )
}
