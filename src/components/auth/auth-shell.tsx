'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { useAppLanguage } from '@/components/app-shell/app-language-provider'

interface AuthShellProps {
  children: ReactNode
  description: string
  eyebrow: string
  footer?: ReactNode
  title: string
}

export function AuthShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: AuthShellProps) {
  const pathname = usePathname()
  const { copy, locale } = useAppLanguage()

  const route =
    pathname.startsWith('/sign-up')
      ? 'signUp'
      : pathname.startsWith('/forgot-password')
        ? 'forgotPassword'
        : pathname.startsWith('/reset-password')
          ? 'resetPassword'
          : pathname.startsWith('/verify-email')
            ? 'verifyEmail'
            : 'signIn'

  const shellCopy = copy.shell
  const routeCopy = locale === 'pt-BR' ? null : authShellCopy[locale][route]

  return (
    <div className="page-frame flex flex-1 items-center py-8 md:py-12">
      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,32rem)]">
        <section className="panel-quiet hidden rounded-[2.2rem] p-8 lg:flex lg:min-h-[36rem] lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="text-xl font-semibold tracking-[-0.05em] text-foreground">
                Dona Flora
              </span>
              <span className="eyebrow">{shellCopy.brandSubtitle}</span>
            </Link>
            <div className="max-w-xl space-y-4">
              <p className="eyebrow">{routeCopy?.eyebrow ?? eyebrow}</p>
              <h1 className="text-[clamp(3.25rem,6vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.1em] text-foreground">
                {routeCopy?.title ?? title}
              </h1>
              <p className="max-w-lg text-base leading-8 text-muted-foreground">
                {routeCopy?.description ?? description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-hairline bg-surface px-4 py-4">
              <p className="eyebrow">{shellCopy.libraryLabel}</p>
              <p className="mt-2 text-sm text-foreground">{shellCopy.libraryBody}</p>
            </div>
            <div className="rounded-[1.5rem] border border-hairline bg-surface px-4 py-4">
              <p className="eyebrow">{shellCopy.aiLabel}</p>
              <p className="mt-2 text-sm text-foreground">{shellCopy.aiBody}</p>
            </div>
            <div className="rounded-[1.5rem] border border-hairline bg-surface px-4 py-4">
              <p className="eyebrow">{shellCopy.accountLabel}</p>
              <p className="mt-2 text-sm text-foreground">{shellCopy.accountBody}</p>
            </div>
          </div>
        </section>

        <section className="panel-solid mx-auto flex w-full max-w-xl flex-col rounded-[2.2rem] p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">{routeCopy?.eyebrow ?? eyebrow}</p>
            <h2 className="text-[clamp(2rem,5vw,3.15rem)] font-semibold leading-[0.95] tracking-[-0.08em] text-foreground">
              {routeCopy?.title ?? title}
            </h2>
            <p className="max-w-lg text-sm leading-7 text-muted-foreground">
              {routeCopy?.description ?? description}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4">{children}</div>

          {footer ? (
            <div className="mt-6 border-t border-hairline pt-5 text-sm text-muted-foreground">
              {routeCopy?.footer ? <p>{routeCopy.footer}</p> : footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

const authShellCopy = {
  en: {
    signIn: {
      description:
        'Sign in to access your collection, your conversations, and Dona Flora’s saved settings.',
      eyebrow: 'Sign in',
      footer:
        'First time here? Use the open sign-up flow and confirm your email to unlock the library.',
      title: 'Your library is waiting for you.',
    },
    signUp: {
      description:
        'Create your account to get a private space, with books, chats, and trails isolated per user.',
      eyebrow: 'Create account',
      footer:
        'Registration is open, but access only unlocks after email verification.',
      title: 'Start your personal Dona Flora.',
    },
    forgotPassword: {
      description: 'We will send a secure link so you can choose a new password.',
      eyebrow: 'Recovery',
      footer:
        'If the email exists, the link is also available in the local development outbox.',
      title: 'Reset password',
    },
    resetPassword: {
      description: 'Choose a new password and return to the library.',
      eyebrow: 'New password',
      footer: 'For security, the reset link has a limited lifetime.',
      title: 'Update your credentials',
    },
    verifyEmail: {
      description: 'Confirm your email to unlock access to the collection and the chat.',
      eyebrow: 'Verification',
      footer: 'If the link expires, you can resend a new verification without leaving here.',
      title: 'Confirm your email',
    },
  },
  es: {
    signIn: {
      description:
        'Entra para acceder a tu colección, tus conversaciones y los ajustes guardados de Dona Flora.',
      eyebrow: 'Entrar',
      footer:
        '¿Es tu primer acceso? Usa el registro abierto y confirma tu correo para desbloquear la biblioteca.',
      title: 'Tu biblioteca te espera.',
    },
    signUp: {
      description:
        'Crea tu cuenta para tener un espacio propio, con libros, chats y rutas aislados por usuario.',
      eyebrow: 'Crear cuenta',
      footer:
        'El registro está abierto, pero el acceso solo se libera después de verificar el correo.',
      title: 'Empieza tu Dona Flora personal.',
    },
    forgotPassword: {
      description: 'Te enviaremos un enlace seguro para que elijas una nueva contraseña.',
      eyebrow: 'Recuperación',
      footer:
        'Si el correo existe, el enlace también estará disponible en la bandeja local de desarrollo.',
      title: 'Restablecer contraseña',
    },
    resetPassword: {
      description: 'Elige una nueva contraseña y vuelve a la biblioteca.',
      eyebrow: 'Nueva contraseña',
      footer: 'Por seguridad, el enlace de restablecimiento tiene una validez limitada.',
      title: 'Actualiza tus credenciales',
    },
    verifyEmail: {
      description: 'Confirma tu correo para desbloquear el acceso a la colección y al chat.',
      eyebrow: 'Verificación',
      footer:
        'Si el enlace expira, puedes reenviar una nueva verificación sin salir de aquí.',
      title: 'Confirma tu correo',
    },
  },
  'zh-CN': {
    signIn: {
      description: '登录后即可访问你的收藏、对话以及 Dona Flora 保存的设置。',
      eyebrow: '登录',
      footer: '首次使用？通过开放注册并完成邮箱验证即可解锁书库。',
      title: '你的书库正在等你。',
    },
    signUp: {
      description: '创建账户，拥有独立空间，让书籍、聊天与轨迹按用户隔离。',
      eyebrow: '创建账户',
      footer: '注册是开放的，但只有邮箱验证后才能正式访问。',
      title: '开始你的专属 Dona Flora。',
    },
    forgotPassword: {
      description: '我们会发送安全链接，方便你设置新密码。',
      eyebrow: '找回密码',
      footer: '如果邮箱存在，本地开发邮箱中也会提供该链接。',
      title: '重置密码',
    },
    resetPassword: {
      description: '选择新密码，然后回到书库。',
      eyebrow: '新密码',
      footer: '出于安全原因，重置链接有时效限制。',
      title: '更新你的凭据',
    },
    verifyEmail: {
      description: '完成邮箱验证后，即可解锁收藏与聊天访问。',
      eyebrow: '验证',
      footer: '如果链接过期，你可以在这里重新发送验证，而无需离开页面。',
      title: '确认你的邮箱',
    },
  },
  'pt-BR': {
    signIn: {
      description:
        'Entre para acessar seu acervo, suas conversas e as settings persistidas da Dona Flora.',
      eyebrow: 'Entrar',
      footer:
        'Primeiro acesso? Use o cadastro aberto e confirme seu email para liberar a biblioteca.',
      title: 'Sua biblioteca espera por voce.',
    },
    signUp: {
      description:
        'Crie sua conta para ganhar um espaco proprio, com livros, chats e trilhas isolados por usuario.',
      eyebrow: 'Criar conta',
      footer:
        'O cadastro e aberto, mas o acesso so libera depois da verificacao de email.',
      title: 'Comece sua Dona Flora pessoal.',
    },
    forgotPassword: {
      description: 'Enviaremos um link seguro para voce escolher uma nova senha.',
      eyebrow: 'Recuperacao',
      footer:
        'Se o email existir, o link fica disponivel tambem no outbox local de desenvolvimento.',
      title: 'Redefinir senha',
    },
    resetPassword: {
      description: 'Escolha uma nova senha e volte para a biblioteca.',
      eyebrow: 'Nova senha',
      footer: 'Por seguranca, o link de redefinicao tem validade limitada.',
      title: 'Atualize sua credencial',
    },
    verifyEmail: {
      description: 'Confirme seu email para liberar o acesso ao acervo e ao chat.',
      eyebrow: 'Verificacao',
      footer:
        'Se o link expirar, voce pode reenviar uma nova verificacao sem sair daqui.',
      title: 'Confirme seu email',
    },
  },
} as const
