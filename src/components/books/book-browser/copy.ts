import type { AppLanguage } from '@/lib/i18n/app-language'

export type BrowseCopy = {
  collectionBody: string
  collectionCount: (count: number) => string
  collectionEyebrow: string
  connectFolderCta: string
  emptyBody: string
  emptyTitle: string
  firstBookCta: string
  heroBody: string
  heroEyebrow: string
  heroTitle: string
  readingLabel: string
  readingValue: string
  searchLabel: string
  searchValue: string
  startCardBody: string
  startHints: Array<{
    body: string
    index: string
    title: string
  }>
  summaryCount: (count: number) => string
  summaryEyebrow: string
}

export const BROWSE_COPY: Record<AppLanguage, BrowseCopy> = {
  'pt-BR': {
    collectionBody: 'Os livros que fazem sentido para este recorte da sua biblioteca.',
    collectionCount: (count) => `${count} ${count === 1 ? 'título em foco' : 'títulos em foco'}`,
    collectionEyebrow: 'Acervo',
    connectFolderCta: 'Conectar pasta',
    emptyBody:
      'Adicione o primeiro livro por ISBN ou título, e a Dona Flora passa a ler o seu contexto junto com você.',
    emptyTitle: 'Sua biblioteca começa aqui',
    firstBookCta: 'Adicionar primeiro livro',
    heroBody:
      'Busque, filtre e retome livros sem ruído, enquanto a Dona Flora acompanha o contexto da sua leitura.',
    heroEyebrow: 'Biblioteca pessoal',
    heroTitle: 'Seu acervo merece silêncio, clareza e presença.',
    readingLabel: 'Leitura',
    readingValue: 'Com contexto',
    searchLabel: 'Busca',
    searchValue: 'Tempo real',
    startCardBody:
      'Nenhum título catalogado ainda. O primeiro passo é conectar sua pasta ou adicionar um livro manualmente.',
    startHints: [
      {
        body: 'Markdown no Obsidian ou em uma pasta local.',
        index: '01',
        title: 'Fonte',
      },
      {
        body: 'Notas, status e highlights entram na conversa.',
        index: '02',
        title: 'Contexto',
      },
      {
        body: 'Você cataloga aos poucos, sem depender de planilha.',
        index: '03',
        title: 'Ritmo',
      },
    ],
    summaryCount: (count) => (count === 1 ? 'título catalogado' : 'títulos catalogados'),
    summaryEyebrow: 'Panorama',
  },
  en: {
    collectionBody: 'The books that matter in this slice of your library.',
    collectionCount: (count) => `${count} ${count === 1 ? 'title in focus' : 'titles in focus'}`,
    collectionEyebrow: 'Collection',
    connectFolderCta: 'Connect folder',
    emptyBody:
      'Add the first book by ISBN or title, and Dona Flora starts learning your reading context with you.',
    emptyTitle: 'Your library starts here',
    firstBookCta: 'Add first book',
    heroBody:
      'Search, filter, and return to books with less friction, while Dona Flora keeps track of your reading context.',
    heroEyebrow: 'Personal library',
    heroTitle: 'Your library deserves calm, clarity, and presence.',
    readingLabel: 'Reading',
    readingValue: 'With context',
    searchLabel: 'Search',
    searchValue: 'Real time',
    startCardBody:
      'No titles cataloged yet. Start by connecting your folder or adding a book manually.',
    startHints: [
      {
        body: 'Markdown in Obsidian or in a local folder.',
        index: '01',
        title: 'Source',
      },
      {
        body: 'Notes, status, and highlights become chat context.',
        index: '02',
        title: 'Context',
      },
      {
        body: 'Catalog gradually, without turning this into a spreadsheet.',
        index: '03',
        title: 'Pace',
      },
    ],
    summaryCount: (count) => (count === 1 ? 'cataloged title' : 'cataloged titles'),
    summaryEyebrow: 'Overview',
  },
  es: {
    collectionBody: 'Los libros que importan en este recorte de tu biblioteca.',
    collectionCount: (count) => `${count} ${count === 1 ? 'título en foco' : 'títulos en foco'}`,
    collectionEyebrow: 'Coleccion',
    connectFolderCta: 'Conectar carpeta',
    emptyBody:
      'Agrega el primer libro por ISBN o título y Dona Flora empieza a leer tu contexto junto contigo.',
    emptyTitle: 'Tu biblioteca empieza aqui',
    firstBookCta: 'Agregar primer libro',
    heroBody:
      'Busca, filtra y retoma libros con menos ruido, mientras Dona Flora acompana el contexto de tu lectura.',
    heroEyebrow: 'Biblioteca personal',
    heroTitle: 'Tu biblioteca merece calma, claridad y presencia.',
    readingLabel: 'Lectura',
    readingValue: 'Con contexto',
    searchLabel: 'Busqueda',
    searchValue: 'Tiempo real',
    startCardBody:
      'Todavía no hay títulos catalogados. Empieza conectando tu carpeta o agregando un libro manualmente.',
    startHints: [
      {
        body: 'Markdown en Obsidian o en una carpeta local.',
        index: '01',
        title: 'Fuente',
      },
      {
        body: 'Notas, estado y destacados entran en la conversación.',
        index: '02',
        title: 'Contexto',
      },
      {
        body: 'Catalogas de a poco, sin depender de una planilla.',
        index: '03',
        title: 'Ritmo',
      },
    ],
    summaryCount: (count) => (count === 1 ? 'título catalogado' : 'títulos catalogados'),
    summaryEyebrow: 'Panorama',
  },
  'zh-CN': {
    collectionBody: '这个视图里，留下的是此刻最重要的书。',
    collectionCount: (count) => `${count} 本当前聚焦`,
    collectionEyebrow: '书库',
    connectFolderCta: '连接文件夹',
    emptyBody: '按 ISBN 或书名添加第一本书，Dona Flora 就会开始理解你的阅读脉络。',
    emptyTitle: '你的书库从这里开始',
    firstBookCta: '添加第一本书',
    heroBody: '更轻松地搜索、筛选和重拾书籍，让 Dona Flora 始终理解你的阅读语境。',
    heroEyebrow: '个人书库',
    heroTitle: '你的书库值得更安静、更清晰、更从容。',
    readingLabel: '阅读',
    readingValue: '有上下文',
    searchLabel: '搜索',
    searchValue: '实时',
    startCardBody: '还没有整理图书。先连接书籍文件夹，或手动添加一本书。',
    startHints: [
      {
        body: 'Obsidian 或本地文件夹中的 Markdown。',
        index: '01',
        title: '来源',
      },
      {
        body: '笔记、状态和摘录会进入对话上下文。',
        index: '02',
        title: '上下文',
      },
      {
        body: '可以慢慢整理，不必变成表格工程。',
        index: '03',
        title: '节奏',
      },
    ],
    summaryCount: () => '已整理图书',
    summaryEyebrow: '概览',
  },
}
