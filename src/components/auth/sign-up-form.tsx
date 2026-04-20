'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'

function verificationCallbackURL() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/verify-email?verified=1`
}

export function SignUpForm() {
  const router = useRouter()
  const { copy } = useAppLanguage()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(copy.auth.signUp.passwordMismatch)
      return
    }

    setIsPending(true)
    const result = await authClient.signUp.email({
      callbackURL: verificationCallbackURL(),
      email,
      name: displayName,
      password,
    })
    setIsPending(false)

    if (result.error) {
      setError(result.error.message ?? copy.auth.signUp.error)
      return
    }

    startTransition(() => {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.signUp.nameLabel}</span>
        <Input
          autoComplete="name"
          name="displayName"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={copy.auth.signUp.namePlaceholder}
          required
          value={displayName}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.common.emailLabel}</span>
        <Input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.auth.common.emailPlaceholder}
          required
          spellCheck={false}
          type="email"
          value={email}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.common.passwordLabel}</span>
        <PasswordInput
          autoComplete="new-password"
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.auth.signUp.passwordPlaceholder}
          required
          value={password}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.signUp.confirmPasswordLabel}</span>
        <PasswordInput
          autoComplete="new-password"
          minLength={8}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={copy.auth.signUp.confirmPasswordPlaceholder}
          required
          value={confirmPassword}
        />
      </label>

      <Button disabled={isPending} type="submit">
        {isPending ? copy.auth.signUp.creatingAccount : copy.auth.signUp.submit}
      </Button>

      <p className="text-sm text-muted-foreground">
        {copy.auth.signUp.accountPrompt}{' '}
        <Link className="text-foreground hover:opacity-80" href="/sign-in">
          {copy.auth.signUp.accountLink}
        </Link>
      </p>
    </form>
  )
}
