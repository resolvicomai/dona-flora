import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { VerifyEmailPanel } from '@/components/auth/verify-email-panel'
import { getServerSession } from '@/lib/auth/server'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; verified?: string }>
}) {
  const session = await getServerSession()
  const { email, error, verified } = await searchParams

  if (session?.user.emailVerified && verified !== '1') {
    redirect('/')
  }

  return (
    <AuthShell
      description="Valide a conta local para continuar ao acervo e ao chat."
      eyebrow="Acesso local"
      title={verified === '1' ? 'Conta local validada.' : 'Valide a conta local'}
      footer={<p>Se o link expirar, você pode gerar um novo link local sem sair daqui.</p>}
    >
      <VerifyEmailPanel
        key={`${email ?? session?.user.email ?? 'guest'}-${verified === '1' ? 'verified' : 'pending'}`}
        loginIdentifier={email ?? session?.user.email}
        errorCode={error}
        verified={verified === '1' || Boolean(session?.user.emailVerified)}
      />
    </AuthShell>
  )
}
