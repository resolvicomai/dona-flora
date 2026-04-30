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

export function getFriendlySignUpError(message: string | undefined, fallback: string) {
  if (!message) {
    return 'Não consegui criar a conta local. Atualize esta aba e tente de novo.'
  }

  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('already') || normalizedMessage.includes('exists')) {
    return 'Esse usuário já existe nesta instalação. Entre com ele ou escolha outro nome.'
  }

  if (message.includes('[body.email]') || normalizedMessage.includes('invalid email')) {
    return 'Esse usuário não virou uma credencial local válida. Use letras, números, hífen ou underline.'
  }

  if (normalizedMessage.includes('fetch') || normalizedMessage.includes('network')) {
    return 'Não consegui falar com a Dona Flora nesta aba. Confira se o app está aberto na porta certa e tente de novo.'
  }

  if (message === fallback) {
    return 'Não consegui criar a conta local. Atualize esta aba e tente de novo.'
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
      setError(
        'Use um usuário com 3 a 32 caracteres: letras minúsculas, números, hífen ou underline.',
      )
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
