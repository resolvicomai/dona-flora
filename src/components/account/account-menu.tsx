'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Settings2, UserRound } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { authClient } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

function initialsFromName(name?: string | null, email?: string | null) {
  const seed = name?.trim() || email?.trim() || 'Dona Flora'
  return seed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AccountMenu() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const initials = initialsFromName(session?.user?.name, session?.user?.email)

  return (
    <Popover>
      <PopoverTrigger render={
        <Button
          aria-label="Abrir menu da conta"
          size="sm"
          variant="secondary"
          className="gap-2 pl-2.5"
        />
      }>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-glass-border bg-foreground/[0.06] text-[0.72rem] font-semibold tracking-[0.08em] text-foreground">
          {isPending ? '…' : initials}
        </span>
        <span className="hidden max-w-32 truncate sm:block">
          {session?.user?.name ?? 'Conta'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <p className="eyebrow">Conta</p>
          <PopoverTitle>{session?.user?.name ?? 'Dona Flora'}</PopoverTitle>
          <p className="text-sm text-muted-foreground">
            {session?.user?.email ?? 'Sessão carregando…'}
          </p>
        </PopoverHeader>

        <div className="grid gap-2">
          <Link
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'justify-start rounded-[1.2rem]',
            )}
            href="/profile"
          >
            <UserRound className="h-4 w-4" />
            Perfil
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'justify-start rounded-[1.2rem]',
            )}
            href="/settings"
          >
            <Settings2 className="h-4 w-4" />
            Settings da Dona Flora
          </Link>
          <Button
            className="justify-start rounded-[1.2rem]"
            onClick={handleSignOut}
            variant="ghost"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
