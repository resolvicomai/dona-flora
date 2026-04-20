'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'

export function SignInForm({ resetComplete = false }: { resetComplete?: boolean }) {
  const router = useRouter()
  const { copy } = useAppLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    })

    setIsPending(false)

    if (result.error) {
      const message = result.error.message ?? copy.auth.signIn.error
      setError(message)
      if (message.toLowerCase().includes('verify')) {
        startTransition(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        })
      }
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
        <div className="rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {copy.auth.signIn.resetComplete}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.signIn.emailLabel}</span>
        <Input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.auth.signIn.emailPlaceholder}
          required
          spellCheck={false}
          type="email"
          value={email}
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
        <Link className="hover:text-foreground" href="/forgot-password">
          {copy.auth.signIn.forgotPassword}
        </Link>
        <Link className="hover:text-foreground" href="/sign-up">
          {copy.auth.signIn.createAccount}
        </Link>
      </div>
    </form>
  )
}
