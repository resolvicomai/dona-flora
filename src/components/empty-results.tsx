'use client'

import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyResultsProps {
  onClear: () => void
}

export function EmptyResults({ onClear }: EmptyResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <SearchX className="h-16 w-16 text-zinc-700" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-zinc-100">
        Nenhum livro bate com os filtros atuais
      </h2>
      <p className="max-w-sm text-sm text-zinc-400">
        Você tem livros cadastrados, mas nenhum deles corresponde à sua busca ou filtros. Ajuste os filtros ou limpe tudo para ver a biblioteca completa.
      </p>
      <Button onClick={onClear}>Limpar filtros</Button>
    </div>
  )
}
