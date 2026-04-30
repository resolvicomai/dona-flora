'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

import { AddBookDialog } from '@/components/books/add-book-dialog'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { Button } from '@/components/ui/button'
import type { AppLanguage } from '@/lib/i18n/app-language'

export interface OnboardingChecklistProps {
  aiModel: string
  bookCount: number
  chatCount: number
  libraryConfigured: boolean
  trailCount: number
}

const STORAGE_KEY = 'dona-flora:onboarding-dismissed:v1'

const ONBOARDING_COPY: Record<
  AppLanguage,
  {
    aiAction: string
    aiConfigured: (model: string) => string
    aiMissing: string
    aiTitle: string
    bookAction: string
    booksConfigured: (count: number) => string
    booksMissing: string
    booksTitle: string
    chatAction: string
    chatConfigured: (count: number) => string
    chatMissing: string
    chatTitle: string
    dismissAria: string
    eyebrow: string
    intro: string
    libraryAction: string
    libraryConfigured: string
    libraryMissing: string
    libraryTitle: string
    title: string
    trailAction: string
    trailConfigured: (count: number) => string
    trailMissing: string
    trailTitle: string
  }
> = {
  'pt-BR': {
    aiAction: 'Escolher provedor',
    aiConfigured: (model) => `Modelo selecionado: ${model}.`,
    aiMissing: 'Escolha o provedor da Dona Flora e teste a conexão.',
    aiTitle: 'Preparar a Dona Flora',
    bookAction: 'Adicionar livro',
    booksConfigured: (count) => `${count} livro(s) no acervo.`,
    booksMissing: 'Adicione por busca, ISBN, foto ou manualmente.',
    booksTitle: 'Ter livros catalogados',
    chatAction: 'Abrir conversa',
    chatConfigured: (count) => `${count} conversa(s) salvas.`,
    chatMissing: 'Faça uma primeira pergunta sobre seu acervo.',
    chatTitle: 'Conversar com contexto',
    dismissAria: 'Ocultar checklist',
    eyebrow: 'Primeiro uso',
    intro:
      'A Dona Flora só fica boa quando sabe onde estão seus livros, qual modelo responde por ela e como começar a conversa.',
    libraryAction: 'Escolher pasta',
    libraryConfigured: 'A Dona Flora já sabe onde seus Markdown vivem.',
    libraryMissing: 'Aponte para a pasta dos livros no Obsidian ou no seu disco.',
    libraryTitle: 'Conectar a biblioteca',
    title: 'Primeiro, deixe a biblioteca encontrável.',
    trailAction: 'Ver trilhas',
    trailConfigured: (count) => `${count} trilha(s) salva(s).`,
    trailMissing: 'Quando a Dona Flora sugerir uma sequência, salve e acompanhe em Trilhas.',
    trailTitle: 'Acompanhar trilhas',
  },
  en: {
    aiAction: 'Choose provider',
    aiConfigured: (model) => `Selected model: ${model}.`,
    aiMissing: 'Choose Dona Flora’s provider and test the connection.',
    aiTitle: 'Prepare Dona Flora',
    bookAction: 'Add book',
    booksConfigured: (count) => `${count} book(s) in the library.`,
    booksMissing: 'Add by search, ISBN, photo, or manually.',
    booksTitle: 'Catalog books',
    chatAction: 'Open chat',
    chatConfigured: (count) => `${count} saved conversation(s).`,
    chatMissing: 'Ask a first question about your library.',
    chatTitle: 'Talk with context',
    dismissAria: 'Hide checklist',
    eyebrow: 'First use',
    intro:
      'Dona Flora gets good when she knows where your books live, which model speaks for her, and how to start the conversation.',
    libraryAction: 'Choose folder',
    libraryConfigured: 'Dona Flora already knows where your Markdown files live.',
    libraryMissing: 'Point to the books folder in Obsidian or on your disk.',
    libraryTitle: 'Connect the library',
    title: 'First, make the library findable.',
    trailAction: 'View trails',
    trailConfigured: (count) => `${count} saved trail(s).`,
    trailMissing: 'When Dona Flora suggests a sequence, save it and track it in Trails.',
    trailTitle: 'Track trails',
  },
  es: {
    aiAction: 'Elegir proveedor',
    aiConfigured: (model) => `Modelo seleccionado: ${model}.`,
    aiMissing: 'Elige el proveedor de Dona Flora y prueba la conexión.',
    aiTitle: 'Preparar a Dona Flora',
    bookAction: 'Agregar libro',
    booksConfigured: (count) => `${count} libro(s) en la biblioteca.`,
    booksMissing: 'Agrega por búsqueda, ISBN, foto o manualmente.',
    booksTitle: 'Tener libros catalogados',
    chatAction: 'Abrir conversación',
    chatConfigured: (count) => `${count} conversación(es) guardadas.`,
    chatMissing: 'Haz una primera pregunta sobre tu biblioteca.',
    chatTitle: 'Conversar con contexto',
    dismissAria: 'Ocultar checklist',
    eyebrow: 'Primer uso',
    intro:
      'Dona Flora mejora cuando sabe dónde están tus libros, qué modelo responde por ella y cómo empezar la conversación.',
    libraryAction: 'Elegir carpeta',
    libraryConfigured: 'Dona Flora ya sabe dónde viven tus Markdown.',
    libraryMissing: 'Apunta a la carpeta de libros en Obsidian o en tu disco.',
    libraryTitle: 'Conectar la biblioteca',
    title: 'Primero, haz que la biblioteca sea encontrable.',
    trailAction: 'Ver rutas',
    trailConfigured: (count) => `${count} ruta(s) guardada(s).`,
    trailMissing: 'Cuando Dona Flora sugiera una secuencia, guárdala y acompáñala en Rutas.',
    trailTitle: 'Acompañar rutas',
  },
  'zh-CN': {
    aiAction: '选择提供方',
    aiConfigured: (model) => `已选择模型：${model}。`,
    aiMissing: '选择 Dona Flora 的提供方并测试连接。',
    aiTitle: '准备 Dona Flora',
    bookAction: '添加图书',
    booksConfigured: (count) => `书库中有 ${count} 本书。`,
    booksMissing: '可通过搜索、ISBN、照片或手动添加。',
    booksTitle: '完成图书编目',
    chatAction: '打开对话',
    chatConfigured: (count) => `已保存 ${count} 个对话。`,
    chatMissing: '先问一个关于你书库的问题。',
    chatTitle: '带着上下文聊天',
    dismissAria: '隐藏检查清单',
    eyebrow: '首次使用',
    intro: '当 Dona Flora 知道书在哪里、由哪个模型回答、以及如何开始对话时，她才会真正好用。',
    libraryAction: '选择文件夹',
    libraryConfigured: 'Dona Flora 已知道你的 Markdown 文件在哪里。',
    libraryMissing: '指向 Obsidian 或磁盘中的图书文件夹。',
    libraryTitle: '连接书库',
    title: '第一步，让书库可以被找到。',
    trailAction: '查看路径',
    trailConfigured: (count) => `已保存 ${count} 条路径。`,
    trailMissing: 'Dona Flora 建议顺序后，保存并在“路径”中跟进。',
    trailTitle: '跟进路径',
  },
}

function subscribeToDismissal(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('dona-flora-onboarding-dismissed', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('dona-flora-onboarding-dismissed', callback)
  }
}

function getDismissalSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

function getDismissalServerSnapshot() {
  return false
}

export function OnboardingChecklist({
  aiModel,
  bookCount,
  chatCount,
  libraryConfigured,
  trailCount,
}: OnboardingChecklistProps) {
  const { locale } = useAppLanguage()
  const copy = ONBOARDING_COPY[locale]
  const dismissed = useSyncExternalStore(
    subscribeToDismissal,
    getDismissalSnapshot,
    getDismissalServerSnapshot,
  )

  const steps = [
    {
      action: (
        <Button render={<Link href="/settings?panel=library" />} variant="outline">
          {copy.libraryAction}
        </Button>
      ),
      completed: libraryConfigured,
      description: libraryConfigured ? copy.libraryConfigured : copy.libraryMissing,
      title: copy.libraryTitle,
    },
    {
      action: <AddBookDialog triggerLabel={copy.bookAction} />,
      completed: bookCount > 0,
      description: bookCount > 0 ? copy.booksConfigured(bookCount) : copy.booksMissing,
      title: copy.booksTitle,
    },
    {
      action: (
        <Button render={<Link href="/settings?panel=local-ai" />} variant="outline">
          {copy.aiAction}
        </Button>
      ),
      completed: Boolean(aiModel),
      description: aiModel ? copy.aiConfigured(aiModel) : copy.aiMissing,
      title: copy.aiTitle,
    },
    {
      action: (
        <Button render={<Link href="/chat" />} variant="outline">
          {copy.chatAction}
        </Button>
      ),
      completed: chatCount > 0,
      description: chatCount > 0 ? copy.chatConfigured(chatCount) : copy.chatMissing,
      title: copy.chatTitle,
    },
    {
      action: (
        <Button render={<Link href="/trails" />} variant="outline">
          {copy.trailAction}
        </Button>
      ),
      completed: trailCount > 0,
      description: trailCount > 0 ? copy.trailConfigured(trailCount) : copy.trailMissing,
      title: copy.trailTitle,
    },
  ]
  const completedCount = steps.filter((step) => step.completed).length
  const allDone = completedCount === steps.length
  const nextStepIndex = steps.findIndex((step) => !step.completed)

  if (dismissed || allDone) {
    return null
  }

  return (
    <section className="brand-guide overflow-hidden px-5 py-5 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal text-foreground md:text-2xl">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{copy.intro}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-md border border-hairline bg-surface px-3 py-2 font-mono text-sm text-foreground">
            {completedCount}/{steps.length}
          </span>
          <Button
            aria-label={copy.dismissAria}
            onClick={() => {
              window.localStorage.setItem(STORAGE_KEY, '1')
              window.dispatchEvent(new Event('dona-flora-onboarding-dismissed'))
            }}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <ol className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => {
          const isNext = index === nextStepIndex
          return (
            <li
              className={`surface-transition flex min-h-36 flex-col justify-between gap-4 rounded-lg border px-4 py-4 ${
                step.completed
                  ? 'border-hairline bg-surface/70'
                  : isNext
                    ? 'border-hairline-strong bg-surface shadow-mac-sm'
                    : 'border-hairline bg-transparent'
              }`}
              key={step.title}
            >
              <div className="flex items-start gap-3">
                <span
                  className={
                    step.completed
                      ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground'
                      : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-hairline-strong font-mono text-xs text-muted-foreground'
                  }
                >
                  {step.completed ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <div>{step.action}</div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
