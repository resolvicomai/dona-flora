import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { getServerSession } from '@/lib/auth/server'

export default async function SignUpPage() {
  const session = await getServerSession()
  if (session?.user.emailVerified) {
    redirect('/')
  }

  if (session?.user.email && !session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`)
  }

  return (
    <AuthShell
      description="Crie sua conta para ganhar um espaco proprio, com livros, chats e trilhas isolados por usuario."
      eyebrow="Criar conta"
      title="Comece sua Dona Flora pessoal."
      footer={
        <p>O cadastro e aberto, mas o acesso so libera depois da verificacao de email.</p>
      }
    >
      <SignUpForm />
    </AuthShell>
  )
}
