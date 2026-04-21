import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <AuthShell
      description="Enviaremos um link seguro para voce escolher uma nova senha."
      eyebrow="Recuperacao"
      title="Redefinir senha"
      footer={<p>Se o email existir, o link fica disponivel tambem no outbox local de desenvolvimento.</p>}
    >
      <ForgotPasswordForm initialEmail={email ?? ''} />
    </AuthShell>
  )
}
