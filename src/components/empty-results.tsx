'use client'

import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyResultsProps {
  onClear: () => void
}

export function EmptyResults({ onClear }: EmptyResultsProps) {
  return (
    <div className="panel-solid flex flex-col items-center justify-center gap-5 rounded-[2rem] px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline bg-surface text-muted-foreground shadow-mac-sm">
        <SearchX className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="section-title max-w-lg text-balance text-foreground">
        Nenhum livro bate com os filtros atuais
      </h2>
      <p className="max-w-md text-balance text-sm leading-7 text-muted-foreground">
        Você tem livros cadastrados, mas nenhum deles corresponde à sua busca ou filtros. Ajuste os filtros ou limpe tudo para ver a biblioteca completa.
      </p>
      <Button onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  )
}
