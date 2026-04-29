'use client'

import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'

interface EmptyResultsProps {
  onClear: () => void
}

export function EmptyResults({ onClear }: EmptyResultsProps) {
  const { locale } = useAppLanguage()
  const copy = {
    'pt-BR': {
      body:
        'Você tem livros cadastrados, mas nenhum deles corresponde à sua busca ou filtros. Ajuste os filtros ou limpe tudo para ver a biblioteca completa.',
      clear: 'Limpar filtros',
      title: 'Nenhum livro bate com os filtros atuais',
    },
    en: {
      body:
        'You have books cataloged, but none match this search or filter set. Adjust the filters or clear everything to see the full library.',
      clear: 'Clear filters',
      title: 'No book matches the current filters',
    },
    es: {
      body:
        'Tienes libros catalogados, pero ninguno coincide con esta búsqueda o estos filtros. Ajusta los filtros o limpia todo para ver la biblioteca completa.',
      clear: 'Limpiar filtros',
      title: 'Ningún libro coincide con los filtros actuales',
    },
    'zh-CN': {
      body: '你已经有编目的图书，但没有一本符合当前搜索或筛选。调整筛选或清除全部以查看完整书库。',
      clear: '清除筛选',
      title: '没有图书匹配当前筛选',
    },
  }[locale]

  return (
    <div className="brand-window flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="brand-inset flex h-16 w-16 items-center justify-center text-muted-foreground">
        <SearchX className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="section-title max-w-lg text-balance text-foreground">
        {copy.title}
      </h2>
      <p className="max-w-md text-balance text-sm leading-7 text-muted-foreground">
        {copy.body}
      </p>
      <Button onClick={onClear}>
        {copy.clear}
      </Button>
    </div>
  )
}
