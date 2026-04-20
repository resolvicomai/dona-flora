'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { authClient } from '@/lib/auth/client'

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter()
  const { copy } = useAppLanguage()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError(copy.auth.resetPassword.invalidLink)
      return
    }

    if (newPassword !== confirmPassword) {
      setError(copy.auth.resetPassword.mismatch)
      return
    }

    setIsPending(true)
    const result = await authClient.resetPassword({
      newPassword,
      token,
    })
    setIsPending(false)

    if (result.error) {
      setError(result.error.message ?? copy.auth.resetPassword.error)
      return
    }

    startTransition(() => {
      router.push('/sign-in?reset=1')
    })
  }

  if (!token) {
      return (
      <div className="space-y-4">
        <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {copy.auth.resetPassword.invalidLink}
        </div>
        <Link className="text-sm text-foreground hover:opacity-80" href="/forgot-password">
          {copy.auth.resetPassword.link}
        </Link>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.resetPassword.newPasswordLabel}</span>
        <PasswordInput
          autoComplete="new-password"
          minLength={8}
          name="newPassword"
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder={copy.auth.resetPassword.newPasswordPlaceholder}
          required
          value={newPassword}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="eyebrow">{copy.auth.resetPassword.confirmPasswordLabel}</span>
        <PasswordInput
          autoComplete="new-password"
          minLength={8}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={copy.auth.resetPassword.confirmPasswordPlaceholder}
          required
          value={confirmPassword}
        />
      </label>

      <Button disabled={isPending} type="submit">
        {isPending ? copy.auth.resetPassword.updating : copy.auth.resetPassword.submit}
      </Button>
    </form>
  )
}
