import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; login?: string }>
}) {
  const { email, login } = await searchParams

  return (
    <AuthShell
      description="Gere um link local para escolher uma nova senha."
      eyebrow="Recuperação"
      title="Redefinir senha"
      footer={<p>Em modo local, o link aparece aqui mesmo. Não precisa de e-mail.</p>}
    >
      <ForgotPasswordForm initialLogin={login ?? email ?? ''} />
    </AuthShell>
  )
}
