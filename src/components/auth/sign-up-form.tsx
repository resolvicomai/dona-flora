'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'
import {
  USERNAME_REGEX,
  normalizeUsername,
  usernameToAuthIdentifier,
} from '@/lib/auth/local-identity'

function getFriendlySignUpError(message: string | undefined, fallback: string) {
  if (!message) {
    return fallback
  }

  if (message.includes('[body.email]') || message.includes('Invalid email')) {
    return 'Não consegui criar seu usuário local. Tente outro nome de usuário.'
  }

  return message
}

export function SignUpForm() {
  const router = useRouter()
  const { copy } = useAppLanguage()
  const nameId = useId()
  const usernameId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
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

    const normalizedUsername = normalizeUsername(username)
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      setError(copy.auth.signUp.error)
      return
    }

    setIsPending(true)
    const result = await authClient.signUp.email({
      email: usernameToAuthIdentifier(normalizedUsername),
      name: displayName,
      password,
    })
    setIsPending(false)

    if (result.error) {
      setError(getFriendlySignUpError(result.error.message, copy.auth.signUp.error))
      return
    }

    startTransition(() => {
      router.push('/settings?panel=library&onboarding=1')
      router.refresh()
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="eyebrow" htmlFor={nameId}>
          {copy.auth.signUp.nameLabel}
        </label>
        <Input
          aria-describedby={`${nameId}-help`}
          autoComplete="name"
          id={nameId}
          name="displayName"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={copy.auth.signUp.namePlaceholder}
          required
          value={displayName}
        />
        <p className="text-xs leading-5 text-muted-foreground" id={`${nameId}-help`}>
          Só para a Dona Flora te chamar do jeito certo.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="eyebrow" htmlFor={usernameId}>
          {copy.auth.common.emailLabel}
        </label>
        <Input
          aria-describedby={`${usernameId}-help`}
          autoComplete="username"
          id={usernameId}
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder={copy.auth.common.emailPlaceholder}
          required
          spellCheck={false}
          value={username}
        />
        <p className="text-xs leading-5 text-muted-foreground" id={`${usernameId}-help`}>
          Use letras minúsculas, números, hífen ou underline. Não precisa de e-mail.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="eyebrow" htmlFor={passwordId}>
          {copy.auth.common.passwordLabel}
        </label>
        <PasswordInput
          autoComplete="new-password"
          id={passwordId}
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.auth.signUp.passwordPlaceholder}
          required
          value={password}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="eyebrow" htmlFor={confirmPasswordId}>
          {copy.auth.signUp.confirmPasswordLabel}
        </label>
        <PasswordInput
          autoComplete="new-password"
          id={confirmPasswordId}
          minLength={8}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={copy.auth.signUp.confirmPasswordPlaceholder}
          required
          value={confirmPassword}
        />
      </div>

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
