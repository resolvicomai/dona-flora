'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import type { UserProfile } from '@/lib/auth/types'
import { authClient } from '@/lib/auth/client'

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const { refetch } = authClient.useSession()
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || profile.initials

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError(null)
    setProfileMessage(null)
    setIsSavingProfile(true)

    const response = await fetch('/api/profile', {
      body: JSON.stringify({ displayName }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    })

    setIsSavingProfile(false)

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setProfileError(payload?.error ?? 'Nao foi possivel atualizar o perfil.')
      return
    }

    setProfileMessage('Perfil atualizado.')
    await refetch()
    startTransition(() => router.refresh())
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas novas nao conferem.')
      return
    }

    setIsChangingPassword(true)
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    })
    setIsChangingPassword(false)

    if (result.error) {
      setPasswordError(result.error.message ?? 'Nao foi possivel alterar a senha.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Senha atualizada com sucesso.')
  }

  return (
    <div className="page-frame flex flex-1 flex-col gap-6 pt-7 md:pt-9">
      <section className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="panel-quiet rounded-[2rem] p-6">
          <p className="eyebrow">Conta</p>
          <div className="mt-5 flex h-20 w-20 items-center justify-center rounded-full border border-glass-border bg-foreground/[0.05] text-2xl font-semibold tracking-[-0.06em] text-foreground">
            {initials}
          </div>
          <p className="mt-4 text-xl font-semibold tracking-[-0.04em] text-foreground">
            {displayName}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{profile.email}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {profile.role === 'owner' ? 'Owner' : 'User'} •{' '}
            {profile.emailVerified ? 'email verificado' : 'aguardando verificacao'}
          </p>
        </div>

        <div className="grid gap-5">
          <form className="panel-solid rounded-[2rem] p-6" onSubmit={handleProfileSave}>
            <div className="space-y-2">
              <p className="eyebrow">Perfil</p>
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.08em] text-foreground">
                Seu perfil
              </h1>
            </div>

            {profileMessage ? (
              <div className="mt-4 rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {profileMessage}
              </div>
            ) : null}

            {profileError ? (
              <div className="mt-4 rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {profileError}
              </div>
            ) : null}

            <label className="mt-6 flex flex-col gap-2">
              <span className="eyebrow">Nome de exibicao</span>
              <Input
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
            </label>

            <label className="mt-4 flex flex-col gap-2">
              <span className="eyebrow">Email</span>
              <Input disabled readOnly value={profile.email} />
            </label>

            <Button className="mt-6" disabled={isSavingProfile} type="submit">
              {isSavingProfile ? 'Salvando…' : 'Salvar perfil'}
            </Button>
          </form>

          <form className="panel-solid rounded-[2rem] p-6" onSubmit={handlePasswordChange}>
            <div className="space-y-2">
              <p className="eyebrow">Seguranca</p>
              <h2 className="text-2xl font-semibold tracking-[-0.06em] text-foreground">
                Alterar senha
              </h2>
            </div>

            {passwordMessage ? (
              <div className="mt-4 rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {passwordMessage}
              </div>
            ) : null}

            {passwordError ? (
              <div className="mt-4 rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {passwordError}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="eyebrow">Senha atual</span>
                <PasswordInput
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  value={currentPassword}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="eyebrow">Nova senha</span>
                <PasswordInput
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  value={newPassword}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="eyebrow">Confirmar nova senha</span>
                <PasswordInput
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  value={confirmPassword}
                />
              </label>
            </div>

            <Button className="mt-6" disabled={isChangingPassword} type="submit">
              {isChangingPassword ? 'Atualizando…' : 'Atualizar senha'}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
