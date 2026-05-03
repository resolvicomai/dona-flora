'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
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
  const { locale } = useAppLanguage()
  const copy = {
    'pt-BR': {
      action: 'Excluir livro',
      cancel: 'Cancelar',
      deleting: 'Excluindo...',
      description: (name: string) =>
        `O arquivo ${name} será removido permanentemente. Essa ação não pode ser desfeita.`,
      error: 'Erro ao excluir livro.',
      title: 'Excluir livro?',
    },
    en: {
      action: 'Delete book',
      cancel: 'Cancel',
      deleting: 'Deleting...',
      description: (name: string) =>
        `The file ${name} will be permanently removed. This cannot be undone.`,
      error: 'Could not delete the book.',
      title: 'Delete book?',
    },
    es: {
      action: 'Eliminar libro',
      cancel: 'Cancelar',
      deleting: 'Eliminando...',
      description: (name: string) =>
        `El archivo ${name} se eliminará permanentemente. Esta acción no se puede deshacer.`,
      error: 'No se pudo eliminar el libro.',
      title: '¿Eliminar libro?',
    },
    'zh-CN': {
      action: '删除图书',
      cancel: '取消',
      deleting: '删除中...',
      description: (name: string) => `文件 ${name} 将被永久删除。此操作无法撤销。`,
      error: '无法删除图书。',
      title: '删除图书？',
    },
  }[locale]
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/books/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/')
    } catch {
      setDeleting(false)
      setErrorMessage(copy.error)
    }
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) setErrorMessage(null)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {copy.action}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description(filename)}</AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} variant="destructive">
            {deleting ? copy.deleting : copy.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
