'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'
import { loginToAuthIdentifier } from '@/lib/auth/local-identity'

export function SignInForm({ resetComplete = false }: { resetComplete?: boolean }) {
  const router = useRouter()
  const { copy } = useAppLanguage()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    const result = await authClient.signIn.email({
      email: loginToAuthIdentifier(usernameOrEmail),
      password,
      rememberMe: true,
    })

    setIsPending(false)

    if (result.error) {
      const message = result.error.message ?? copy.auth.signIn.error
      setError(message)
      return
    }

    startTransition(() => {
      router.push('/')
      router.refresh()
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {resetComplete ? (
        <div className="brand-inset px-4 py-3 text-sm text-foreground">
          {copy.auth.signIn.resetComplete}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.signIn.emailLabel}</span>
        <Input
          autoComplete="username"
          name="usernameOrEmail"
          onChange={(event) => setUsernameOrEmail(event.target.value)}
          placeholder={copy.auth.signIn.emailPlaceholder}
          required
          spellCheck={false}
          value={usernameOrEmail}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.signIn.passwordLabel}</span>
        <PasswordInput
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.auth.signIn.passwordPlaceholder}
          required
          value={password}
        />
      </label>

      <Button disabled={isPending} type="submit">
        {isPending ? copy.auth.signIn.signingIn : copy.auth.signIn.signIn}
      </Button>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <Link className="hover:text-foreground" href="/sign-up">
          {copy.auth.signIn.createAccount}
        </Link>
        <Link className="hover:text-foreground" href="/forgot-password">
          {copy.auth.signIn.forgotPassword}
        </Link>
      </div>
    </form>
  )
}
