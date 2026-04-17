'use client'

import Link from 'next/link'
import { BookHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeStateProps {
  bookCount: number
}

/**
 * Initial empty-conversation state shown when `messages.length === 0`.
 *
 * Copy is prescribed by UI-SPEC §Copywriting "Welcome state" with three
 * pluralization branches:
 *  - `bookCount === 0`: onboarding-style body + CTA to `/` (biblioteca vazia)
 *  - `bookCount === 1`: singular "1 livro aqui"
 *  - `bookCount >= 2`: plural "N livros aqui"
 *
 * Persona: the heading is the stable signature "Oi! Sou a Dona Flora, sua
 * bibliotecária." (never varies in Phase 4 — fixes the brand).
 */
export function WelcomeState({ bookCount }: WelcomeStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 px-4 text-center">
      <BookHeart
        className="h-16 w-16 text-zinc-700"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold text-zinc-100">
        Oi! Sou a Dona Flora, sua bibliotecária.
      </h2>
      {bookCount === 0 ? (
        <>
          <p className="max-w-md text-sm text-zinc-400">
            Sua biblioteca ainda está vazia. Eu preciso de alguns livros
            catalogados para conversar sobre o seu acervo — comece adicionando
            os livros que você tem na estante. Quando voltar, eu estarei aqui.
          </p>
          <Button render={<Link href="/" />}>Ir para a biblioteca</Button>
        </>
      ) : bookCount === 1 ? (
        <p className="max-w-md text-sm text-zinc-400">
          Você tem 1 livro aqui. Posso te ajudar a pensar sobre ele, ou
          conversar sobre leituras futuras. O que você gostaria?
        </p>
      ) : (
        <p className="max-w-md text-sm text-zinc-400">
          Você tem {bookCount} livros aqui. Posso te ajudar a escolher o
          próximo, montar uma trilha para um tema que te interessa, ou
          conversar sobre algum livro que você já leu. O que você tem em mente?
        </p>
      )}
    </div>
  )
}
