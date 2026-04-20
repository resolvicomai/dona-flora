'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { fetchLocalAuthLink } from '@/lib/auth/dev-link-client'
import { Input } from '@/components/ui/input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

function verificationCallbackURL() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/verify-email?verified=1`
}

export function VerifyEmailPanel({
  email: initialEmail = '',
  errorCode,
  verified = false,
}: {
  email?: string
  errorCode?: string
  verified?: boolean
}) {
  const { copy } = useAppLanguage()
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | null>(
    errorCode ? `${copy.auth.verifyEmail.errorPrefix} (${errorCode}).` : null,
  )
  const [info, setInfo] = useState<string | null>(
    verified ? copy.auth.verifyEmail.verified : null,
  )
  const [localLink, setLocalLink] = useState<string | null>(null)
  const [isLoadingLocalLink, setIsLoadingLocalLink] = useState(
    Boolean(initialEmail) && !verified,
  )
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    let isActive = true

    if (!initialEmail || verified) {
      return () => {
        isActive = false
      }
    }

    void fetchLocalAuthLink({
      email: initialEmail,
      kind: 'verify-email',
    }).then((url) => {
      if (!isActive) {
        return
      }

      setLocalLink(url)
      setIsLoadingLocalLink(false)
    })

    return () => {
      isActive = false
    }
  }, [initialEmail, verified])

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsPending(true)

    const result = await authClient.sendVerificationEmail({
      callbackURL: verificationCallbackURL(),
      email,
    })

    setIsPending(false)

    if (result.error) {
      setError(result.error.message ?? copy.auth.verifyEmail.errorPrefix)
      return
    }

    setInfo(copy.auth.verifyEmail.resendSubtitle)
    setIsLoadingLocalLink(true)
    const url = await fetchLocalAuthLink({
      email,
      kind: 'verify-email',
    })
    setLocalLink(url)
    setIsLoadingLocalLink(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {info ? (
        <div className="rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {info}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {verified ? (
        <div className="flex flex-wrap gap-3">
          <Link className={buttonVariants()} href="/">
            {copy.auth.verifyEmail.goToLibrary}
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href="/sign-in"
          >
            {copy.auth.verifyEmail.otherAccount}
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleResend}>
          <p className="text-sm leading-7 text-muted-foreground">
            {copy.auth.verifyEmail.info}
          </p>

          {localLink ? (
            <div className="rounded-[1.4rem] border border-border/60 bg-surface/70 px-4 py-3 text-sm text-muted-foreground">
              {copy.auth.verifyEmail.localLinkNote}
              <div className="mt-3">
                <a className={buttonVariants({ variant: 'outline' })} href={localLink}>
                  {copy.auth.verifyEmail.localLinkTitle}
                </a>
              </div>
            </div>
          ) : isLoadingLocalLink ? (
            <div className="rounded-[1.4rem] border border-border/60 bg-surface/70 px-4 py-3 text-sm text-muted-foreground">
              {copy.auth.verifyEmail.preparingLocalLink}
            </div>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="eyebrow">{copy.auth.verifyEmail.emailLabel}</span>
            <Input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.auth.verifyEmail.emailPlaceholder}
              required
              type="email"
              value={email}
            />
          </label>

          <Button disabled={isPending} type="submit">
            {isPending ? copy.auth.verifyEmail.resending : copy.auth.verifyEmail.resend}
          </Button>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" href="/sign-in">
              {copy.auth.verifyEmail.backToSignIn}
            </Link>
            <Link className="hover:text-foreground" href="/sign-up">
              {copy.auth.verifyEmail.createAnotherAccount}
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
