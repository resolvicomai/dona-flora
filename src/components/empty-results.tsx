'use client'

import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyResultsProps {
  onClear: () => void
}

export function EmptyResults({ onClear }: EmptyResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card/80 px-6 py-10 text-center shadow-mac-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-mac-sm">
        <SearchX className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Nenhum livro bate com os filtros atuais
      </h2>
      <p className="max-w-sm text-balance text-sm leading-6 text-muted-foreground">
        Você tem livros cadastrados, mas nenhum deles corresponde à sua busca ou filtros. Ajuste os filtros ou limpe tudo para ver a biblioteca completa.
      </p>
      <Button onClick={onClear} className="shadow-mac-sm">
        Limpar filtros
      </Button>
    </div>
  )
}
