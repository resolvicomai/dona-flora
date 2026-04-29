'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { cn } from '@/lib/utils'

interface PageReturnLinkProps {
  href?: string
  label?: string
  className?: string
}

export function PageReturnLink({
  href = '/',
  label,
  className,
}: PageReturnLinkProps) {
  const { locale } = useAppLanguage()
  const defaultLabel = {
    'pt-BR': 'Voltar para Biblioteca',
    en: 'Back to Library',
    es: 'Volver a Biblioteca',
    'zh-CN': '返回书库',
  }[locale]

  return (
    <Link
      href={href}
      className={cn(
        'surface-transition inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 py-2 text-sm font-medium text-foreground shadow-none',
        'hover:-translate-y-px hover:border-hairline-strong hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label ?? defaultLabel}
    </Link>
  )
}
