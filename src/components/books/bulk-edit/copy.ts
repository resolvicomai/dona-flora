import type { AppLanguage } from '@/lib/i18n/app-language'
import type { TagMode } from './types'

export const BULK_COPY: Record<
  AppLanguage,
  {
    apply: string
    applying: string
    cancel: string
    currentPageDescription: string
    currentPageLabel: string
    currentPagePlaceholder: string
    emptyRemoves: string
    fieldRequired: string
    noRating: string
    noSelection: string
    priorityDescription: string
    priorityLabel: string
    priorityPlaceholder: string
    progressDescription: string
    progressLabel: string
    progressPlaceholder: string
    ratingDescription: string
    ratingLabel: string
    statusDescription: string
    statusLabel: string
    submit: string
    success: (updatedCount: number) => string
    partialSuccess: (updatedCount: number, failedCount: number) => string
    tagsDescription: string
    tagsLabel: string
    tagsPlaceholder: string
    tagModes: Record<TagMode, string>
    title: (count: number) => string
    updateError: string
    explanation: string
  }
> = {
  'pt-BR': {
    apply: 'Aplicar mudanças',
    applying: 'Aplicando...',
    cancel: 'Cancelar',
    currentPageDescription: 'Página atual',
    currentPageLabel: 'Página',
    currentPagePlaceholder: 'ex: 42',
    emptyRemoves: 'Vazio remove o campo.',
    fieldRequired: 'Escolha pelo menos um campo para atualizar.',
    noRating: 'Sem nota',
    noSelection: 'Selecione pelo menos um livro antes de aplicar.',
    priorityDescription: '1 a 5',
    priorityLabel: 'Prioridade',
    priorityPlaceholder: 'ex: 5',
    progressDescription: '0 a 100%',
    progressLabel: 'Progresso',
    progressPlaceholder: 'ex: 100',
    ratingDescription: 'Use zero estrelas para remover a nota dos livros selecionados.',
    ratingLabel: 'Nota',
    statusDescription: 'Bom para marcar vários livros como lidos, lendo ou quero reler.',
    statusLabel: 'Status',
    submit: 'Editar em massa',
    success: (updatedCount) => `${updatedCount} livro(s) atualizado(s).`,
    partialSuccess: (updatedCount, failedCount) =>
      `${updatedCount} livro(s) atualizado(s), ${failedCount} com erro.`,
    tagsDescription: 'Separe por vírgula. Use substituir vazio para limpar tags.',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'filosofia, estudar, favoritos',
    tagModes: {
      add: 'Adicionar',
      remove: 'Remover',
      replace: 'Substituir',
    },
    title: (count) => `Editar ${count} livro(s)`,
    updateError: 'Não foi possível atualizar os livros.',
    explanation:
      'Só os campos marcados serão alterados. Os outros metadados do Markdown permanecem como estão.',
  },
  en: {
    apply: 'Apply changes',
    applying: 'Applying...',
    cancel: 'Cancel',
    currentPageDescription: 'Current page',
    currentPageLabel: 'Page',
    currentPagePlaceholder: 'e.g. 42',
    emptyRemoves: 'Empty removes the field.',
    fieldRequired: 'Choose at least one field to update.',
    noRating: 'No rating',
    noSelection: 'Select at least one book before applying.',
    priorityDescription: '1 to 5',
    priorityLabel: 'Priority',
    priorityPlaceholder: 'e.g. 5',
    progressDescription: '0 to 100%',
    progressLabel: 'Progress',
    progressPlaceholder: 'e.g. 100',
    ratingDescription: 'Use zero stars to remove the rating from selected books.',
    ratingLabel: 'Rating',
    statusDescription: 'Useful for marking several books as read, reading, or want to reread.',
    statusLabel: 'Status',
    submit: 'Bulk edit',
    success: (updatedCount) => `${updatedCount} book(s) updated.`,
    partialSuccess: (updatedCount, failedCount) =>
      `${updatedCount} book(s) updated, ${failedCount} failed.`,
    tagsDescription: 'Separate with commas. Use empty replace to clear tags.',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'philosophy, study, favorites',
    tagModes: {
      add: 'Add',
      remove: 'Remove',
      replace: 'Replace',
    },
    title: (count) => `Edit ${count} book(s)`,
    updateError: 'Could not update the books.',
    explanation: 'Only checked fields will change. Other Markdown metadata stays as it is.',
  },
  es: {
    apply: 'Aplicar cambios',
    applying: 'Aplicando...',
    cancel: 'Cancelar',
    currentPageDescription: 'Página actual',
    currentPageLabel: 'Página',
    currentPagePlaceholder: 'ej: 42',
    emptyRemoves: 'Vacío elimina el campo.',
    fieldRequired: 'Elige al menos un campo para actualizar.',
    noRating: 'Sin nota',
    noSelection: 'Selecciona al menos un libro antes de aplicar.',
    priorityDescription: '1 a 5',
    priorityLabel: 'Prioridad',
    priorityPlaceholder: 'ej: 5',
    progressDescription: '0 a 100%',
    progressLabel: 'Progreso',
    progressPlaceholder: 'ej: 100',
    ratingDescription: 'Usa cero estrellas para quitar la nota de los libros seleccionados.',
    ratingLabel: 'Nota',
    statusDescription: 'Útil para marcar varios libros como leídos, leyendo o quiero releer.',
    statusLabel: 'Estado',
    submit: 'Editar en masa',
    success: (updatedCount) => `${updatedCount} libro(s) actualizado(s).`,
    partialSuccess: (updatedCount, failedCount) =>
      `${updatedCount} libro(s) actualizado(s), ${failedCount} con error.`,
    tagsDescription: 'Separa por comas. Usa reemplazar vacío para limpiar tags.',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'filosofía, estudiar, favoritos',
    tagModes: {
      add: 'Agregar',
      remove: 'Eliminar',
      replace: 'Reemplazar',
    },
    title: (count) => `Editar ${count} libro(s)`,
    updateError: 'No se pudieron actualizar los libros.',
    explanation:
      'Solo se cambiarán los campos marcados. Los demás metadatos del Markdown quedan como están.',
  },
  'zh-CN': {
    apply: '应用更改',
    applying: '应用中...',
    cancel: '取消',
    currentPageDescription: '当前页码',
    currentPageLabel: '页码',
    currentPagePlaceholder: '例如：42',
    emptyRemoves: '留空会移除此字段。',
    fieldRequired: '至少选择一个要更新的字段。',
    noRating: '无评分',
    noSelection: '应用前请至少选择一本书。',
    priorityDescription: '1 到 5',
    priorityLabel: '优先级',
    priorityPlaceholder: '例如：5',
    progressDescription: '0 到 100%',
    progressLabel: '进度',
    progressPlaceholder: '例如：100',
    ratingDescription: '使用零星可移除所选图书的评分。',
    ratingLabel: '评分',
    statusDescription: '适合批量标记为已读、在读或想重读。',
    statusLabel: '状态',
    submit: '批量编辑',
    success: (updatedCount) => `已更新 ${updatedCount} 本书。`,
    partialSuccess: (updatedCount, failedCount) =>
      `已更新 ${updatedCount} 本书，${failedCount} 本失败。`,
    tagsDescription: '用逗号分隔。选择替换并留空可清除标签。',
    tagsLabel: '标签',
    tagsPlaceholder: '哲学, 学习, 收藏',
    tagModes: {
      add: '添加',
      remove: '移除',
      replace: '替换',
    },
    title: (count) => `编辑 ${count} 本书`,
    updateError: '无法更新图书。',
    explanation: '只会更改勾选的字段。其他 Markdown 元数据会保持不变。',
  },
}
