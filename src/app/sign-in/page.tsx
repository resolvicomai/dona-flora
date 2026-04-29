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
  if (session) {
    redirect('/')
  }

  const { reset } = await searchParams

  return (
    <AuthShell
      description="Entre para acessar seu acervo, suas conversas e as preferências salvas da Dona Flora."
      eyebrow="Entrar"
      title="Sua biblioteca espera por você."
      footer={
        <p>
          Primeiro acesso? Crie um usuário local e mantenha tudo nesta instalação.
        </p>
      }
    >
      <SignInForm resetComplete={reset === '1'} />
    </AuthShell>
  )
}
