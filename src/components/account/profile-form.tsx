'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import type { UserProfile } from '@/lib/auth/types'
import { authClient } from '@/lib/auth/client'

const PROFILE_COPY = {
  'pt-BR': {
    account: 'Conta',
    awaitingVerification: 'sessao local',
    changePassword: 'Alterar senha',
    currentPassword: 'Senha atual',
    displayName: 'Nome de exibicao',
    email: 'Usuario',
    owner: 'Owner',
    passwordMismatch: 'As senhas novas não conferem.',
    passwordSaveError: 'Não foi possível alterar a senha.',
    passwordSaved: 'Senha atualizada com sucesso.',
    pendingSave: 'Salvando…',
    pendingVerification: 'conta local ativa',
    profile: 'Perfil',
    profileSaveError: 'Não foi possível atualizar o perfil.',
    profileSaved: 'Perfil atualizado.',
    saveProfile: 'Salvar perfil',
    savingPassword: 'Atualizando…',
    security: 'Seguranca',
    title: 'Seu perfil',
    updatePassword: 'Atualizar senha',
    user: 'User',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirmar nova senha',
  },
  en: {
    account: 'Account',
    awaitingVerification: 'local session',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    displayName: 'Display name',
    email: 'Username',
    owner: 'Owner',
    passwordMismatch: 'The new passwords do not match.',
    passwordSaveError: 'Could not change the password.',
    passwordSaved: 'Password updated successfully.',
    pendingSave: 'Saving…',
    pendingVerification: 'local account active',
    profile: 'Profile',
    profileSaveError: 'Could not update the profile.',
    profileSaved: 'Profile updated.',
    saveProfile: 'Save profile',
    savingPassword: 'Updating…',
    security: 'Security',
    title: 'Your profile',
    updatePassword: 'Update password',
    user: 'User',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
  },
  es: {
    account: 'Cuenta',
    awaitingVerification: 'sesión local',
    changePassword: 'Cambiar contraseña',
    currentPassword: 'Contraseña actual',
    displayName: 'Nombre para mostrar',
    email: 'Usuario',
    owner: 'Owner',
    passwordMismatch: 'Las nuevas contraseñas no coinciden.',
    passwordSaveError: 'No fue posible cambiar la contraseña.',
    passwordSaved: 'Contraseña actualizada con éxito.',
    pendingSave: 'Guardando…',
    pendingVerification: 'cuenta local activa',
    profile: 'Perfil',
    profileSaveError: 'No fue posible actualizar el perfil.',
    profileSaved: 'Perfil actualizado.',
    saveProfile: 'Guardar perfil',
    savingPassword: 'Actualizando…',
    security: 'Seguridad',
    title: 'Tu perfil',
    updatePassword: 'Actualizar contraseña',
    user: 'User',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
  },
  'zh-CN': {
    account: '账户',
    awaitingVerification: '本地会话',
    changePassword: '修改密码',
    currentPassword: '当前密码',
    displayName: '显示名称',
    email: '用户名',
    owner: 'Owner',
    passwordMismatch: '两次输入的新密码不一致。',
    passwordSaveError: '无法修改密码。',
    passwordSaved: '密码已成功更新。',
    pendingSave: '正在保存…',
    pendingVerification: '本地账户已启用',
    profile: '个人资料',
    profileSaveError: '无法更新个人资料。',
    profileSaved: '个人资料已更新。',
    saveProfile: '保存资料',
    savingPassword: '正在更新…',
    security: '安全',
    title: '你的资料',
    updatePassword: '更新密码',
    user: 'User',
    newPassword: '新密码',
    confirmPassword: '确认新密码',
  },
} as const

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const { refetch } = authClient.useSession()
  const copy = PROFILE_COPY[locale]
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

    let response: Response
    try {
      response = await fetch('/api/profile', {
        body: JSON.stringify({ displayName }),
        headers: { 'content-type': 'application/json' },
        method: 'PATCH',
      })
    } catch {
      setIsSavingProfile(false)
      setProfileError(copy.profileSaveError)
      return
    }

    setIsSavingProfile(false)

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setProfileError(payload?.error ?? copy.profileSaveError)
      return
    }

    setProfileMessage(copy.profileSaved)
    await refetch()
    startTransition(() => router.refresh())
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordError(copy.passwordMismatch)
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
      setPasswordError(result.error.message ?? copy.passwordSaveError)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage(copy.passwordSaved)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="brand-panel p-6">
          <p className="eyebrow">{copy.account}</p>
          <div className="crt-screen mt-5 flex h-20 w-20 items-center justify-center rounded-lg font-mono text-2xl font-semibold tracking-normal">
            {initials}
          </div>
          <p className="mt-4 text-xl font-semibold tracking-normal text-foreground">
            {displayName}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{profile.email}</p>
          <p className="mt-5 font-mono text-xs tracking-normal text-muted-foreground">
            {profile.role === 'owner' ? copy.owner : copy.user} •{' '}
            {profile.emailVerified ? copy.pendingVerification : copy.awaitingVerification}
          </p>
        </div>

        <div className="grid gap-5">
          <form className="brand-window p-6" onSubmit={handleProfileSave}>
            <div className="space-y-2">
              <p className="eyebrow">{copy.profile}</p>
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-normal text-foreground">
                {copy.title}
              </h1>
            </div>

            {profileMessage ? (
              <div className="brand-inset mt-4 px-4 py-3 text-sm text-foreground">
                {profileMessage}
              </div>
            ) : null}

            {profileError ? (
              <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {profileError}
              </div>
            ) : null}

            <label className="mt-6 flex flex-col gap-2">
              <span className="eyebrow">{copy.displayName}</span>
              <Input
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
            </label>

            <label className="mt-4 flex flex-col gap-2">
              <span className="eyebrow">{copy.email}</span>
              <Input disabled readOnly value={profile.email} />
            </label>

            <Button className="mt-6" disabled={isSavingProfile} type="submit">
              {isSavingProfile ? copy.pendingSave : copy.saveProfile}
            </Button>
          </form>

          <form className="brand-window p-6" onSubmit={handlePasswordChange}>
            <div className="space-y-2">
              <p className="eyebrow">{copy.security}</p>
              <h2 className="text-2xl font-semibold tracking-normal text-foreground">
                {copy.changePassword}
              </h2>
            </div>

            {passwordMessage ? (
              <div className="brand-inset mt-4 px-4 py-3 text-sm text-foreground">
                {passwordMessage}
              </div>
            ) : null}

            {passwordError ? (
              <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {passwordError}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="eyebrow">{copy.currentPassword}</span>
                <PasswordInput
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  value={currentPassword}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="eyebrow">{copy.newPassword}</span>
                <PasswordInput
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  value={newPassword}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="eyebrow">{copy.confirmPassword}</span>
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
              {isChangingPassword ? copy.savingPassword : copy.updatePassword}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
