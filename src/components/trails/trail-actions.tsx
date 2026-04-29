'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface TrailActionsProps {
  goal: string
  notes: string
  slug: string
  title: string
}

const COPY = {
  'pt-BR': {
    cancel: 'Cancelar',
    delete: 'Excluir trilha',
    deleteDescription:
      'A trilha será removida do app. Os livros continuam no acervo e nenhum Markdown de livro será alterado.',
    deleteError: 'Não consegui excluir a trilha.',
    deleteTitle: 'Excluir esta trilha?',
    deleting: 'Excluindo...',
    edit: 'Editar trilha',
    editDescription: 'Ajuste o nome, o objetivo e as notas da trilha.',
    goal: 'Objetivo',
    goalPlaceholder: 'Ex.: entender tecnologia e poder sem perder o fio',
    notes: 'Notas',
    notesPlaceholder: 'Alguma orientação para você mesmo ao seguir esta trilha.',
    save: 'Salvar alterações',
    saveError: 'Não consegui salvar a trilha.',
    saving: 'Salvando...',
    title: 'Nome da trilha',
  },
  en: {
    cancel: 'Cancel',
    delete: 'Delete trail',
    deleteDescription:
      'The trail will be removed from the app. Books stay in the library and no book Markdown will be changed.',
    deleteError: 'I could not delete the trail.',
    deleteTitle: 'Delete this trail?',
    deleting: 'Deleting...',
    edit: 'Edit trail',
    editDescription: 'Adjust the trail name, goal, and notes.',
    goal: 'Goal',
    goalPlaceholder: 'Example: understand technology and power without losing the thread',
    notes: 'Notes',
    notesPlaceholder: 'Any guidance for yourself while following this trail.',
    save: 'Save changes',
    saveError: 'I could not save the trail.',
    saving: 'Saving...',
    title: 'Trail name',
  },
  es: {
    cancel: 'Cancelar',
    delete: 'Eliminar ruta',
    deleteDescription:
      'La ruta se eliminará del app. Los libros siguen en la biblioteca y ningún Markdown de libro será alterado.',
    deleteError: 'No pude eliminar la ruta.',
    deleteTitle: '¿Eliminar esta ruta?',
    deleting: 'Eliminando...',
    edit: 'Editar ruta',
    editDescription: 'Ajusta el nombre, objetivo y notas de la ruta.',
    goal: 'Objetivo',
    goalPlaceholder: 'Ej.: entender tecnología y poder sin perder el hilo',
    notes: 'Notas',
    notesPlaceholder: 'Alguna orientación para ti al seguir esta ruta.',
    save: 'Guardar cambios',
    saveError: 'No pude guardar la ruta.',
    saving: 'Guardando...',
    title: 'Nombre de la ruta',
  },
  'zh-CN': {
    cancel: '取消',
    delete: '删除路径',
    deleteDescription: '路径会从应用中移除。书籍仍保留在书库中，书籍 Markdown 不会被修改。',
    deleteError: '无法删除路径。',
    deleteTitle: '删除这条路径？',
    deleting: '删除中...',
    edit: '编辑路径',
    editDescription: '调整路径名称、目标和备注。',
    goal: '目标',
    goalPlaceholder: '例如：理解技术与权力，不丢失主线',
    notes: '备注',
    notesPlaceholder: '给自己跟进这条路径时的提示。',
    save: '保存更改',
    saveError: '无法保存路径。',
    saving: '保存中...',
    title: '路径名称',
  },
} as const

export function TrailActions({ goal, notes, slug, title }: TrailActionsProps) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const copy = COPY[locale]
  const [open, setOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftGoal, setDraftGoal] = useState(goal)
  const [draftNotes, setDraftNotes] = useState(notes)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)

    const response = await fetch(`/api/trails/${slug}`, {
      body: JSON.stringify({
        goal: draftGoal,
        notes: draftNotes,
        title: draftTitle,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    })

    setSaving(false)

    if (!response.ok) {
      setError(copy.saveError)
      return
    }

    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const response = await fetch(`/api/trails/${slug}`, { method: 'DELETE' })

    if (!response.ok) {
      setDeleting(false)
      alert(copy.deleteError)
      return
    }

    router.push('/trails')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>
          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
          {copy.edit}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{copy.edit}</DialogTitle>
              <DialogDescription>{copy.editDescription}</DialogDescription>
            </DialogHeader>

            {error ? (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <label className="mt-5 flex flex-col gap-2">
              <span className="eyebrow">{copy.title}</span>
              <Input
                onChange={(event) => setDraftTitle(event.target.value)}
                required
                value={draftTitle}
              />
            </label>

            <label className="mt-4 flex flex-col gap-2">
              <span className="eyebrow">{copy.goal}</span>
              <Textarea
                className="min-h-24"
                onChange={(event) => setDraftGoal(event.target.value)}
                placeholder={copy.goalPlaceholder}
                value={draftGoal}
              />
            </label>

            <label className="mt-4 flex flex-col gap-2">
              <span className="eyebrow">{copy.notes}</span>
              <Textarea
                className="min-h-28"
                onChange={(event) => setDraftNotes(event.target.value)}
                placeholder={copy.notesPlaceholder}
                value={draftNotes}
              />
            </label>

            <DialogFooter className="mt-5">
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                {copy.cancel}
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? copy.saving : copy.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            />
          }
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          {copy.delete}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDelete}
              variant="destructive"
            >
              {deleting ? copy.deleting : copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
