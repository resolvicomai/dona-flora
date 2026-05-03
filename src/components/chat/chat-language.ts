import type { AppLanguage } from '@/lib/i18n/app-language'

type ChatCopy = {
  bookCta: {
    aboutBookAria: (title: string) => string
    aboutBookLabel: string
    headerAria: string
  }
  bookCard: {
    openAria: (title: string, author: string, status: string) => string
    unavailable: string
  }
  composer: {
    ariaLabel: string
    placeholder: string
    sendAria: string
    stopAria: string
  }
  error: {
    genericMessage: string
    localProviderMessage: string
    retry: string
    title: string
  }
  externalPreference: {
    eyebrow: string
    groupAria: string
    optionsAriaHint: string
    options: {
      acervo: { label: string; aria: string }
      ambos: { label: string; aria: string }
      externo: { label: string; aria: string }
    }
  }
  item: {
    cancel: string
    deleteAria: (title: string) => string
    deleteConfirm: string
    deleteDescription: (title: string) => string
    deleteError: string
    deleteTitle: string
    deleting: string
    externalLabel: string
    pinAria: (title: string) => string
    renameAria: (title: string) => string
    save: string
    titleInputAria: string
    unpinAria: (title: string) => string
    updateError: string
    youLabel: string
  }
  main: {
    brandEyebrow: string
    conversation: string
    newConversation: string
    openHistoryAria: string
    responding: string
    seedBook: (title: string, author: string) => string
  }
  messageList: {
    thinkingAria: string
  }
  sidebar: {
    backToLibrary: string
    emptyBody: string
    emptyTitle: string
    eyebrow: string
    newConversationAria: string
    noResults: string
    searchAria: string
    searchPlaceholder: string
    title: string
  }
  trail: {
    assembling: string
    assemblingBody: string
    defaultTitle: string
    error: string
    retry: string
    saved: string
    saving: string
    open: string
    save: string
    title: string
  }
  welcome: {
    emptyBody: string
    emptyCta: string
    heading: string
    pluralBody: (count: number) => string
    singularBody: string
  }
}

const CHAT_COPY: Record<AppLanguage, ChatCopy> = {
  'pt-BR': {
    bookCta: {
      aboutBookAria: (title) => `Conversar sobre ${title} com a Dona Flora`,
      aboutBookLabel: 'Conversar sobre este livro',
      headerAria: 'Conversar com a Dona Flora',
    },
    bookCard: {
      openAria: (title, author, status) => `Abrir ${title} de ${author} — status ${status}`,
      unavailable: '(livro mencionado indisponível)',
    },
    composer: {
      ariaLabel: 'Mensagem para a Dona Flora',
      placeholder: 'Pergunte para a Dona Flora...',
      sendAria: 'Enviar mensagem',
      stopAria: 'Parar de gerar resposta',
    },
    error: {
      genericMessage: 'Algo deu errado na conversa. Tente de novo em alguns segundos.',
      localProviderMessage:
        'Ollama local não respondeu. Abra o Ollama, confira se o modelo escolhido está baixado e teste a conexão em Configurações.',
      retry: 'Tentar novamente',
      title: 'Erro ao gerar resposta.',
    },
    externalPreference: {
      eyebrow: 'Preferência de recomendação',
      groupAria: 'Preferência de recomendação',
      optionsAriaHint: 'Opções de preferência disponíveis.',
      options: {
        acervo: { label: 'Acervo', aria: 'Recomendar apenas do meu acervo' },
        ambos: { label: 'Ambos', aria: 'Recomendar do acervo ou externos' },
        externo: { label: 'Externo', aria: 'Recomendar apenas externos' },
      },
    },
    item: {
      cancel: 'Cancelar',
      deleteAria: (title) => `Excluir conversa ${title}`,
      deleteConfirm: 'Excluir conversa',
      deleteDescription: (title) =>
        `A conversa "${title}" será removida permanentemente do disco. Essa ação não pode ser desfeita.`,
      deleteError: 'Não consegui excluir esta conversa.',
      deleteTitle: 'Excluir esta conversa?',
      deleting: 'Excluindo…',
      externalLabel: 'fora do acervo',
      pinAria: (title) => `Fixar conversa ${title}`,
      renameAria: (title) => `Renomear conversa ${title}`,
      save: 'Salvar',
      titleInputAria: 'Novo nome da conversa',
      unpinAria: (title) => `Desafixar conversa ${title}`,
      updateError: 'Não consegui atualizar esta conversa.',
      youLabel: 'Você',
    },
    main: {
      brandEyebrow: 'Dona Flora',
      conversation: 'Conversa',
      newConversation: 'Nova conversa',
      openHistoryAria: 'Abrir histórico de conversas',
      responding: 'Dona Flora está respondendo.',
      seedBook: (title, author) =>
        `Conte-me mais sobre "${title}" de ${author}. O que você acha dessa minha escolha?`,
    },
    messageList: {
      thinkingAria: 'Dona Flora está pensando',
    },
    sidebar: {
      backToLibrary: '← Biblioteca',
      emptyBody: 'Suas conversas com a Dona Flora aparecem aqui.',
      emptyTitle: 'Nenhuma conversa ainda.',
      eyebrow: 'Chat',
      newConversationAria: 'Nova conversa',
      noResults: 'Nenhuma conversa encontrada.',
      searchAria: 'Buscar conversas',
      searchPlaceholder: 'Buscar conversas…',
      title: 'Conversas',
    },
    trail: {
      assembling: 'Montando a trilha...',
      assemblingBody: 'A sequência ainda está chegando. Em instantes ela fica pronta para salvar.',
      defaultTitle: 'Trilha de leitura',
      error: 'Não consegui salvar a trilha.',
      retry: 'Tentar novamente',
      saved: 'Trilha salva',
      saving: 'Salvando…',
      open: 'Abrir trilha',
      save: 'Salvar trilha',
      title: 'Trilha de leitura sugerida',
    },
    welcome: {
      emptyBody:
        'Sua biblioteca ainda está vazia. Eu preciso de alguns livros catalogados para conversar sobre o seu acervo — comece adicionando os livros que você tem na estante. Quando voltar, eu estarei aqui.',
      emptyCta: 'Ir para a biblioteca',
      heading: 'Oi! Sou a Dona Flora, sua bibliotecária.',
      pluralBody: (count) =>
        `Você tem ${count} livros aqui. Posso te ajudar a escolher o próximo, montar uma trilha para um tema que te interessa, ou conversar sobre algum livro que você já leu. O que você tem em mente?`,
      singularBody:
        'Você tem 1 livro aqui. Posso te ajudar a pensar sobre ele, ou conversar sobre leituras futuras. O que você gostaria?',
    },
  },
  en: {
    bookCta: {
      aboutBookAria: (title) => `Talk about ${title} with Dona Flora`,
      aboutBookLabel: 'Talk about this book',
      headerAria: 'Talk with Dona Flora',
    },
    bookCard: {
      openAria: (title, author, status) => `Open ${title} by ${author} — status ${status}`,
      unavailable: '(mentioned book unavailable)',
    },
    composer: {
      ariaLabel: 'Message Dona Flora',
      placeholder: 'Ask Dona Flora...',
      sendAria: 'Send message',
      stopAria: 'Stop generating',
    },
    error: {
      genericMessage: 'Something went wrong in the conversation. Try again in a few seconds.',
      localProviderMessage:
        'Local Ollama did not respond. Open Ollama, check whether the selected model is downloaded, and test the connection in Settings.',
      retry: 'Try again',
      title: 'Could not generate a response.',
    },
    externalPreference: {
      eyebrow: 'Recommendation preference',
      groupAria: 'Recommendation preference',
      optionsAriaHint: 'Available preference options.',
      options: {
        acervo: { label: 'Library', aria: 'Recommend only from my library' },
        ambos: { label: 'Both', aria: 'Recommend from the library or external sources' },
        externo: { label: 'External', aria: 'Recommend only external books' },
      },
    },
    item: {
      cancel: 'Cancel',
      deleteAria: (title) => `Delete conversation ${title}`,
      deleteConfirm: 'Delete conversation',
      deleteDescription: (title) =>
        `The conversation "${title}" will be permanently removed from disk. This cannot be undone.`,
      deleteError: 'I could not delete this conversation.',
      deleteTitle: 'Delete this conversation?',
      deleting: 'Deleting…',
      externalLabel: 'outside the library',
      pinAria: (title) => `Pin conversation ${title}`,
      renameAria: (title) => `Rename conversation ${title}`,
      save: 'Save',
      titleInputAria: 'New conversation name',
      unpinAria: (title) => `Unpin conversation ${title}`,
      updateError: 'I could not update this conversation.',
      youLabel: 'You',
    },
    main: {
      brandEyebrow: 'Dona Flora',
      conversation: 'Conversation',
      newConversation: 'New conversation',
      openHistoryAria: 'Open conversation history',
      responding: 'Dona Flora is replying.',
      seedBook: (title, author) =>
        `Tell me more about "${title}" by ${author}. What do you think of this choice?`,
    },
    messageList: {
      thinkingAria: 'Dona Flora is thinking',
    },
    sidebar: {
      backToLibrary: '← Library',
      emptyBody: 'Your conversations with Dona Flora appear here.',
      emptyTitle: 'No conversations yet.',
      eyebrow: 'Chat',
      newConversationAria: 'New conversation',
      noResults: 'No conversations found.',
      searchAria: 'Search conversations',
      searchPlaceholder: 'Search conversations…',
      title: 'Conversations',
    },
    trail: {
      assembling: 'Building the trail...',
      assemblingBody: 'The sequence is still arriving. It will be ready to save in a moment.',
      defaultTitle: 'Reading trail',
      error: 'I could not save the trail.',
      retry: 'Try again',
      saved: 'Trail saved',
      saving: 'Saving…',
      open: 'Open trail',
      save: 'Save trail',
      title: 'Suggested reading trail',
    },
    welcome: {
      emptyBody:
        'Your library is still empty. I need a few cataloged books before I can talk about your collection — start by adding the books on your shelf. I will be here when you come back.',
      emptyCta: 'Go to the library',
      heading: 'Hi! I am Dona Flora, your librarian.',
      pluralBody: (count) =>
        `You have ${count} books here. I can help you choose the next one, build a reading trail around a theme, or talk about something you have already read. What is on your mind?`,
      singularBody:
        'You have 1 book here. I can help you think about it or talk about future readings. What would you like?',
    },
  },
  es: {
    bookCta: {
      aboutBookAria: (title) => `Conversar sobre ${title} con Dona Flora`,
      aboutBookLabel: 'Conversar sobre este libro',
      headerAria: 'Conversar con Dona Flora',
    },
    bookCard: {
      openAria: (title, author, status) => `Abrir ${title} de ${author} — estado ${status}`,
      unavailable: '(libro mencionado no disponible)',
    },
    composer: {
      ariaLabel: 'Mensaje para Dona Flora',
      placeholder: 'Pregúntale a Dona Flora...',
      sendAria: 'Enviar mensaje',
      stopAria: 'Detener generación',
    },
    error: {
      genericMessage: 'Algo salió mal en la conversación. Inténtalo de nuevo en unos segundos.',
      localProviderMessage:
        'Ollama local no respondió. Abre Ollama, confirma que el modelo elegido esté descargado y prueba la conexión en Configuración.',
      retry: 'Intentar de nuevo',
      title: 'No se pudo generar la respuesta.',
    },
    externalPreference: {
      eyebrow: 'Preferencia de recomendación',
      groupAria: 'Preferencia de recomendación',
      optionsAriaHint: 'Opciones de preferencia disponibles.',
      options: {
        acervo: { label: 'Acervo', aria: 'Recomendar solo desde mi acervo' },
        ambos: { label: 'Ambos', aria: 'Recomendar del acervo o externos' },
        externo: { label: 'Externo', aria: 'Recomendar solo externos' },
      },
    },
    item: {
      cancel: 'Cancelar',
      deleteAria: (title) => `Eliminar conversación ${title}`,
      deleteConfirm: 'Eliminar conversación',
      deleteDescription: (title) =>
        `La conversación "${title}" se eliminará permanentemente del disco. Esta acción no se puede deshacer.`,
      deleteError: 'No pude eliminar esta conversación.',
      deleteTitle: '¿Eliminar esta conversación?',
      deleting: 'Eliminando…',
      externalLabel: 'fuera de la biblioteca',
      pinAria: (title) => `Fijar conversación ${title}`,
      renameAria: (title) => `Renombrar conversación ${title}`,
      save: 'Guardar',
      titleInputAria: 'Nuevo nombre de la conversación',
      unpinAria: (title) => `Desfijar conversación ${title}`,
      updateError: 'No pude actualizar esta conversación.',
      youLabel: 'Tú',
    },
    main: {
      brandEyebrow: 'Dona Flora',
      conversation: 'Conversación',
      newConversation: 'Nueva conversación',
      openHistoryAria: 'Abrir historial de conversaciones',
      responding: 'Dona Flora está respondiendo.',
      seedBook: (title, author) =>
        `Cuéntame más sobre "${title}" de ${author}. ¿Qué opinas de esta elección?`,
    },
    messageList: {
      thinkingAria: 'Dona Flora está pensando',
    },
    sidebar: {
      backToLibrary: '← Biblioteca',
      emptyBody: 'Tus conversaciones con Dona Flora aparecen aquí.',
      emptyTitle: 'Aún no hay conversaciones.',
      eyebrow: 'Chat',
      newConversationAria: 'Nueva conversación',
      noResults: 'No se encontraron conversaciones.',
      searchAria: 'Buscar conversaciones',
      searchPlaceholder: 'Buscar conversaciones…',
      title: 'Conversaciones',
    },
    trail: {
      assembling: 'Montando la ruta...',
      assemblingBody:
        'La secuencia todavía está llegando. En un momento estará lista para guardar.',
      defaultTitle: 'Ruta de lectura',
      error: 'No pude guardar la ruta.',
      retry: 'Intentar de nuevo',
      saved: 'Ruta guardada',
      saving: 'Guardando…',
      open: 'Abrir ruta',
      save: 'Guardar ruta',
      title: 'Ruta de lectura sugerida',
    },
    welcome: {
      emptyBody:
        'Tu biblioteca todavía está vacía. Necesito algunos libros catalogados para conversar sobre tu colección: empieza agregando los libros que tienes en la estantería. Cuando vuelvas, estaré aquí.',
      emptyCta: 'Ir a la biblioteca',
      heading: '¡Hola! Soy Dona Flora, tu bibliotecaria.',
      pluralBody: (count) =>
        `Tienes ${count} libros aquí. Puedo ayudarte a elegir el próximo, armar una ruta sobre un tema que te interese o conversar sobre algún libro que ya leíste. ¿Qué tienes en mente?`,
      singularBody:
        'Tienes 1 libro aquí. Puedo ayudarte a pensar sobre él o conversar sobre lecturas futuras. ¿Qué te gustaría?',
    },
  },
  'zh-CN': {
    bookCta: {
      aboutBookAria: (title) => `和 Dona Flora 聊聊《${title}》`,
      aboutBookLabel: '聊聊这本书',
      headerAria: '和 Dona Flora 聊天',
    },
    bookCard: {
      openAria: (title, author, status) => `打开 ${author} 的《${title}》— 状态 ${status}`,
      unavailable: '（提到的图书不可用）',
    },
    composer: {
      ariaLabel: '给 Dona Flora 的消息',
      placeholder: '问问 Dona Flora...',
      sendAria: '发送消息',
      stopAria: '停止生成',
    },
    error: {
      genericMessage: '对话中出了点问题。请稍后再试。',
      localProviderMessage:
        '本地 Ollama 没有响应。请打开 Ollama，确认所选模型已经下载，并在设置中测试连接。',
      retry: '重试',
      title: '无法生成回复。',
    },
    externalPreference: {
      eyebrow: '推荐偏好',
      groupAria: '推荐偏好',
      optionsAriaHint: '可选偏好。',
      options: {
        acervo: { label: '书库', aria: '只推荐我的书库内的书' },
        ambos: { label: '都可以', aria: '可以推荐书库内或书库外的书' },
        externo: { label: '书库之外', aria: '只推荐书库之外的书' },
      },
    },
    item: {
      cancel: '取消',
      deleteAria: (title) => `删除对话 ${title}`,
      deleteConfirm: '删除对话',
      deleteDescription: (title) => `对话“${title}”将从磁盘永久删除。此操作无法撤销。`,
      deleteError: '无法删除此对话。',
      deleteTitle: '删除此对话？',
      deleting: '删除中…',
      externalLabel: '书库之外',
      pinAria: (title) => `置顶对话 ${title}`,
      renameAria: (title) => `重命名对话 ${title}`,
      save: '保存',
      titleInputAria: '新的对话名称',
      unpinAria: (title) => `取消置顶对话 ${title}`,
      updateError: '无法更新此对话。',
      youLabel: '你',
    },
    main: {
      brandEyebrow: 'Dona Flora',
      conversation: '对话',
      newConversation: '新对话',
      openHistoryAria: '打开对话历史',
      responding: 'Dona Flora 正在回复。',
      seedBook: (title, author) => `请和我聊聊 ${author} 的《${title}》。你觉得我这次选择怎么样？`,
    },
    messageList: {
      thinkingAria: 'Dona Flora 正在思考',
    },
    sidebar: {
      backToLibrary: '← 书库',
      emptyBody: '你和 Dona Flora 的对话会出现在这里。',
      emptyTitle: '还没有对话。',
      eyebrow: '聊天',
      newConversationAria: '新对话',
      noResults: '没有找到对话。',
      searchAria: '搜索对话',
      searchPlaceholder: '搜索对话…',
      title: '对话',
    },
    trail: {
      assembling: '正在整理阅读路线...',
      assemblingBody: '路线还在生成中，稍后就可以保存。',
      defaultTitle: '阅读路线',
      error: '无法保存阅读路线。',
      retry: '重试',
      saved: '路线已保存',
      saving: '保存中…',
      open: '打开路线',
      save: '保存路线',
      title: '建议阅读路线',
    },
    welcome: {
      emptyBody:
        '你的书库还是空的。我需要先看到一些已编目的书，才能谈论你的收藏：先把书架上的书添加进来。回来时我会在这里等你。',
      emptyCta: '前往书库',
      heading: '你好！我是 Dona Flora，你的图书管理员。',
      pluralBody: (count) =>
        `这里有 ${count} 本书。我可以帮你选择下一本、围绕某个主题整理阅读路线，或者聊聊你已经读过的书。你现在想从哪里开始？`,
      singularBody: '这里有 1 本书。我可以帮你思考它，也可以聊聊之后的阅读。你想怎么开始？',
    },
  },
}

export function getChatCopy(locale: AppLanguage): ChatCopy {
  return CHAT_COPY[locale] ?? CHAT_COPY['pt-BR']
}
