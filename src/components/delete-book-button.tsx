'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DeleteBookButtonProps {
  slug: string
  filename: string
}

export function DeleteBookButton({ slug, filename }: DeleteBookButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/books/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/')
    } catch {
      setDeleting(false)
      alert('Erro ao excluir livro.')
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button variant="ghost" className="text-red-600 hover:text-red-500 hover:bg-red-950/20">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir livro
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir livro?</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo {filename} sera removido permanentemente. Essa acao nao
            pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? 'Excluindo...' : 'Excluir livro'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
