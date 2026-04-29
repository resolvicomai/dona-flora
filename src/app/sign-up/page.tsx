import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignUpForm } from '@/components/auth/sign-up-form'
import { getServerSession } from '@/lib/auth/server'

export default async function SignUpPage() {
  const session = await getServerSession()
  if (session) {
    redirect('/')
  }

  return (
    <AuthShell
      description="Crie sua conta para ganhar um espaço próprio, com livros, chats e trilhas isolados por usuário."
      eyebrow="Criar conta"
      title="Comece sua Dona Flora pessoal."
      footer={
        <p>O cadastro é local: usuário e senha ficam neste app.</p>
      }
    >
      <SignUpForm />
    </AuthShell>
  )
}
