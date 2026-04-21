import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignInForm } from '@/components/auth/sign-in-form'
import { getServerSession } from '@/lib/auth/server'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const session = await getServerSession()
  if (session?.user.emailVerified) {
    redirect('/')
  }

  if (session?.user.email && !session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`)
  }

  const { reset } = await searchParams

  return (
    <AuthShell
      description="Entre para acessar seu acervo, suas conversas e as preferencias salvas da Dona Flora."
      eyebrow="Entrar"
      title="Sua biblioteca espera por voce."
      footer={
        <p>
          Primeiro acesso? Use o cadastro aberto e confirme seu email para liberar
          a biblioteca.
        </p>
      }
    >
      <SignInForm resetComplete={reset === '1'} />
    </AuthShell>
  )
}
