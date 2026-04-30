import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string }>
}) {
  const { token } = await searchParams

  return (
    <AuthShell
      description="Escolha uma nova senha e volte para a biblioteca."
      eyebrow="Nova senha"
      title="Atualize sua credencial"
      footer={<p>Por segurança, o link de redefinição tem validade limitada.</p>}
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
