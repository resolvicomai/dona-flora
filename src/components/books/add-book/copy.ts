import type { AppLanguage } from '@/lib/i18n/app-language'

export const BOOK_LANGUAGE_FILTER_COPY: Record<
  AppLanguage,
  {
    all: string
    label: string
  }
> = {
  'pt-BR': {
    all: 'Todos',
    label: 'Idioma do livro',
  },
  en: {
    all: 'All',
    label: 'Book language',
  },
  es: {
    all: 'Todos',
    label: 'Idioma del libro',
  },
  'zh-CN': {
    all: '全部',
    label: '图书语言',
  },
}

export type AddBookCopy = {
  add: string
  adding: string
  andMoreAuthors: string
  authorLabel: string
  authorPlaceholder: string
  back: string
  coverLabel: string
  coverSourceExternal: string
  dialogTitle: string
  manualTitle: string
  metadataSource: {
    googleBooks: string
    openLibrary: string
    visionImport: string
  }
  noResults: string
  notFoundManual: string
  photoBody: string
  photoTitle: string
  publisherLabel: string
  readingPhoto: string
  retry: string
  saveError: string
  searchError: string
  searchPlaceholder: string
  sendCover: string
  sourceLabel: string
  statusLabel: string
  synopsisLabel: string
  titleLabel: string
  titlePlaceholder: string
  unableToLoadMore: string
  unableToReadPhoto: string
  unknownAuthor: string
}

export const ADD_BOOK_COPY: Record<AppLanguage, AddBookCopy> = {
  'pt-BR': {
    add: 'Adicionar',
    adding: 'Adicionando…',
    andMoreAuthors: 'e +',
    authorLabel: 'Autor',
    authorPlaceholder: 'Autor',
    back: 'Voltar',
    coverLabel: 'Capa',
    coverSourceExternal: 'externa',
    dialogTitle: 'Adicionar livro',
    manualTitle: 'Adicionar manualmente',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: 'Foto da capa',
    },
    noResults: 'Nenhum resultado encontrado.',
    notFoundManual: 'Não encontrei meu livro',
    photoBody: 'Opcional: usa visão externa só se você habilitou nas settings.',
    photoTitle: 'Catalogar por foto',
    publisherLabel: 'Editora',
    readingPhoto: 'Lendo foto…',
    retry: 'Tentar novamente',
    saveError: 'Erro ao adicionar livro. Tente novamente.',
    searchError: 'Erro ao buscar. Tente novamente.',
    searchPlaceholder: 'Buscar por título ou ISBN…',
    sendCover: 'Enviar capa',
    sourceLabel: 'Fonte',
    statusLabel: 'Status',
    synopsisLabel: 'Sinopse',
    titleLabel: 'Título do livro',
    titlePlaceholder: 'Título do livro',
    unableToLoadMore: 'Não foi possível carregar mais resultados.',
    unableToReadPhoto: 'Não foi possível ler a foto.',
    unknownAuthor: 'Autor desconhecido',
  },
  en: {
    add: 'Add',
    adding: 'Adding…',
    andMoreAuthors: 'and +',
    authorLabel: 'Author',
    authorPlaceholder: 'Author',
    back: 'Back',
    coverLabel: 'Cover',
    coverSourceExternal: 'external',
    dialogTitle: 'Add book',
    manualTitle: 'Add manually',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: 'Cover photo',
    },
    noResults: 'No results found.',
    notFoundManual: 'I cannot find my book',
    photoBody: 'Optional: uses external vision only if you enabled it in settings.',
    photoTitle: 'Catalog from photo',
    publisherLabel: 'Publisher',
    readingPhoto: 'Reading photo…',
    retry: 'Try again',
    saveError: 'Could not add the book. Try again.',
    searchError: 'Search failed. Try again.',
    searchPlaceholder: 'Search by title or ISBN…',
    sendCover: 'Upload cover',
    sourceLabel: 'Source',
    statusLabel: 'Status',
    synopsisLabel: 'Synopsis',
    titleLabel: 'Book title',
    titlePlaceholder: 'Book title',
    unableToLoadMore: 'Could not load more results.',
    unableToReadPhoto: 'Could not read the photo.',
    unknownAuthor: 'Unknown author',
  },
  es: {
    add: 'Agregar',
    adding: 'Agregando…',
    andMoreAuthors: 'y +',
    authorLabel: 'Autor',
    authorPlaceholder: 'Autor',
    back: 'Volver',
    coverLabel: 'Portada',
    coverSourceExternal: 'externa',
    dialogTitle: 'Agregar libro',
    manualTitle: 'Agregar manualmente',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: 'Foto de portada',
    },
    noResults: 'No se encontraron resultados.',
    notFoundManual: 'No encontré mi libro',
    photoBody: 'Opcional: usa visión externa solo si la habilitaste en configuración.',
    photoTitle: 'Catalogar por foto',
    publisherLabel: 'Editorial',
    readingPhoto: 'Leyendo foto…',
    retry: 'Intentar de nuevo',
    saveError: 'No se pudo agregar el libro. Inténtalo de nuevo.',
    searchError: 'Error al buscar. Inténtalo de nuevo.',
    searchPlaceholder: 'Buscar por título o ISBN…',
    sendCover: 'Enviar portada',
    sourceLabel: 'Fuente',
    statusLabel: 'Estado',
    synopsisLabel: 'Sinopsis',
    titleLabel: 'Título del libro',
    titlePlaceholder: 'Título del libro',
    unableToLoadMore: 'No se pudieron cargar más resultados.',
    unableToReadPhoto: 'No se pudo leer la foto.',
    unknownAuthor: 'Autor desconocido',
  },
  'zh-CN': {
    add: '添加',
    adding: '添加中…',
    andMoreAuthors: '另 +',
    authorLabel: '作者',
    authorPlaceholder: '作者',
    back: '返回',
    coverLabel: '封面',
    coverSourceExternal: '外部',
    dialogTitle: '添加图书',
    manualTitle: '手动添加',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: '封面照片',
    },
    noResults: '没有找到结果。',
    notFoundManual: '找不到我的书',
    photoBody: '可选：仅在设置中启用外部视觉后使用。',
    photoTitle: '通过照片编目',
    publisherLabel: '出版社',
    readingPhoto: '正在读取照片…',
    retry: '重试',
    saveError: '无法添加图书。请重试。',
    searchError: '搜索失败。请重试。',
    searchPlaceholder: '按标题或 ISBN 搜索…',
    sendCover: '上传封面',
    sourceLabel: '来源',
    statusLabel: '状态',
    synopsisLabel: '简介',
    titleLabel: '书名',
    titlePlaceholder: '书名',
    unableToLoadMore: '无法加载更多结果。',
    unableToReadPhoto: '无法读取照片。',
    unknownAuthor: '未知作者',
  },
}
