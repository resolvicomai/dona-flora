'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, LogOut, Settings2, UserRound } from 'lucide-react'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { authClient } from '@/lib/auth/client'
import { authIdentifierToDisplayLogin } from '@/lib/auth/local-identity'
import { cn } from '@/lib/utils'

function initialsFromName(name?: string | null, email?: string | null) {
  const seed = name?.trim() || email?.trim() || 'Dona Flora'
  return seed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const ACCOUNT_MENU_COPY = {
  'pt-BR': {
    emailLoading: 'Sessão carregando…',
    menuLabel: 'Abrir menu da conta',
    profile: 'Perfil',
    settings: 'Ajustes da Dona Flora',
    signOut: 'Sair',
    title: 'Conta',
    unnamed: 'Conta',
  },
  en: {
    emailLoading: 'Loading session…',
    menuLabel: 'Open account menu',
    profile: 'Profile',
    settings: 'Dona Flora settings',
    signOut: 'Sign out',
    title: 'Account',
    unnamed: 'Account',
  },
  es: {
    emailLoading: 'Cargando sesión…',
    menuLabel: 'Abrir menú de la cuenta',
    profile: 'Perfil',
    settings: 'Ajustes de Dona Flora',
    signOut: 'Cerrar sesión',
    title: 'Cuenta',
    unnamed: 'Cuenta',
  },
  'zh-CN': {
    emailLoading: '正在加载会话…',
    menuLabel: '打开账户菜单',
    profile: '个人资料',
    settings: 'Dona Flora 设置',
    signOut: '退出登录',
    title: '账户',
    unnamed: '账户',
  },
} as const

export function AccountMenu() {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const [open, setOpen] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const copy = ACCOUNT_MENU_COPY[locale]
  const displayLogin = session?.user?.email
    ? authIdentifierToDisplayLogin(session.user.email)
    : null

  async function handleSignOut() {
    setOpen(false)
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  function handleMenuNavigation() {
    setOpen(false)
  }

  const initials = initialsFromName(session?.user?.name, displayLogin)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label={copy.menuLabel}
            size="sm"
            variant="secondary"
            className="gap-2 pl-2.5"
          />
        }
      >
        <span className="crt-screen flex h-7 w-7 items-center justify-center rounded-md font-mono text-[0.72rem] font-semibold tracking-normal">
          {isPending ? '…' : initials}
        </span>
        <span className="hidden max-w-32 truncate sm:block">
          {session?.user?.name ?? copy.unnamed}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <p className="eyebrow">{copy.title}</p>
          <PopoverTitle>{session?.user?.name ?? 'Dona Flora'}</PopoverTitle>
          <p className="text-sm text-muted-foreground">{displayLogin ?? copy.emailLoading}</p>
        </PopoverHeader>

        <div className="grid gap-2">
          <Link
            className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start rounded-md')}
            href="/profile"
            onClick={handleMenuNavigation}
          >
            <UserRound className="h-4 w-4" />
            {copy.profile}
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start rounded-md')}
            href="/settings"
            onClick={handleMenuNavigation}
          >
            <Settings2 className="h-4 w-4" />
            {copy.settings}
          </Link>
          <Button className="justify-start rounded-md" onClick={handleSignOut} variant="ghost">
            <LogOut className="h-4 w-4" />
            {copy.signOut}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
