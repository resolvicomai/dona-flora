import type { AIPrimaryProvider } from '@/lib/auth/db'
import type { AppLanguage } from '@/lib/i18n/app-language'
import type { SettingsPanel } from './types'

export type SettingsUiCopy = {
  aside: {
    body: string
    eyebrow: string
    navAria: string
    title: string
  }
  external: {
    apiKeyLabel: string
    apiKeyPlaceholderConfigured: string
    apiKeyPlaceholderEmpty: string
    apiKeyStatus: string
    body: string
    disabled: string
    enabled: string
    eyebrow: string
    fallbackDescription: string
    fallbackLabel: string
    fallbackModel: string
    save: string
    saving: string
    title: string
    visionDescription: string
    visionLabel: string
    visionModel: string
  }
  library: {
    absolutePath: string
    body: string
    browse: string
    browseError: string
    browsePrompt: string
    browsing: string
    browsingEyebrow: string
    connected: (count: number) => string
    connectError: string
    connectFolder: string
    contextBody: string
    contextEyebrow: string
    contextTitle: string
    dirConfigured: string
    dirMissing: string
    helper: string
    indexError: string
    mdCount: (count: number) => string
    reindex: string
    reindexed: (bookCount: number, contextChars: number) => string
    reindexing: string
    status: string
    selectedHint: string
    up: string
    useThisFolder: string
    emptyFolders: string
    eyebrow: string
    title: string
    validating: string
  }
  localAI: {
    apiKeyEncryptionNote: string
    apiKeyLabel: (provider: string) => string
    apiKeyPlaceholderConfigured: string
    apiKeyPlaceholderEmpty: string
    body: string
    compatibleHint: string
    compatibleToken: string
    eyebrow: string
    keyConfigured: string
    keyMissing: string
    keyStatus: string
    manualHelper: string
    manualModel: string
    modelMissing: string
    modelPicked: string
    modelsEmpty: string
    modelsFound: (count: number) => string
    modelsTruncated: (count: number) => string
    noOAuth: string
    ollamaHint: string
    providerError: string
    save: string
    saved: (provider: string) => string
    saving: string
    showManual: string
    hideManual: string
    test: string
    testing: string
    testPrompt: string
    title: string
    tokenPlaceholderConfigured: string
    tokenPlaceholderEmpty: string
    urlCompatible: string
    urlOllama: string
  }
  panels: Record<SettingsPanel, { body: string; title: string }>
  providerOptions: Record<AIPrimaryProvider, { body: string; label: string; meta: string }>
}

export const SETTINGS_UI_COPY: Record<AppLanguage, SettingsUiCopy> = {
  'pt-BR': {
    aside: {
      body: 'Escolha uma área. Cada tela mostra só o que precisa decidir.',
      eyebrow: 'Ajustes',
      navAria: 'Seções de configurações',
      title: 'Ajustes da Dona Flora',
    },
    external: {
      apiKeyLabel: 'Chave OpenRouter opcional',
      apiKeyPlaceholderConfigured: 'Chave já configurada; deixe vazio para manter',
      apiKeyPlaceholderEmpty: 'Cole a chave apenas se quiser fallback',
      apiKeyStatus: 'Chave externa',
      body: 'Aqui ficam as coisas que podem gerar custo: fallback OpenRouter e importação por foto. Deixe desligado para uso 100% local no chat.',
      disabled: 'não configurada',
      enabled: 'configurada',
      eyebrow: 'Opcional',
      fallbackDescription: 'Só usa quando o provedor principal não responder.',
      fallbackLabel: 'Habilitar fallback OpenRouter',
      fallbackModel: 'Modelo fallback',
      save: 'Salvar externos',
      saving: 'Salvando...',
      title: 'Recursos externos',
      visionDescription:
        'Usa a chave externa para ler imagem de capa e sugerir um candidato editável.',
      visionLabel: 'Habilitar importação por foto',
      visionModel: 'Modelo de visão externo',
    },
    library: {
      absolutePath: 'Caminho absoluto',
      body: 'Escolha a pasta onde os Markdown vivem. Como é navegador, o caminho precisa ficar visível para o servidor local ler e escrever os arquivos.',
      browse: 'Procurar',
      browseError: 'Não foi possível abrir esta pasta.',
      browsePrompt: 'Abra uma pasta para navegar pelo filesystem local deste Mac.',
      browsing: 'Abrindo...',
      browsingEyebrow: 'Navegando',
      connected: (count) => `Pasta conectada. ${count} arquivos Markdown encontrados.`,
      connectError: 'Não foi possível conectar a pasta.',
      connectFolder: 'Conectar pasta',
      contextBody:
        'O chat relê os Markdown antes de responder. Este teste força essa leitura agora e mostra se o acervo entrou no contexto.',
      contextEyebrow: 'Leitura da Dona Flora',
      contextTitle: 'Contexto da biblioteca',
      dirConfigured: 'pasta informada',
      dirMissing: 'não configurada',
      helper:
        'Use Procurar para navegar com atalhos de iCloud/Obsidian, ou cole o caminho absoluto.',
      indexError: 'Não foi possível reler a biblioteca.',
      mdCount: (count) => `${count} arquivo(s) Markdown nesta pasta.`,
      reindex: 'Reler biblioteca agora',
      reindexed: (bookCount, contextChars) =>
        `Biblioteca relida: ${bookCount} livros, ${contextChars} caracteres de contexto para a Dona Flora.`,
      reindexing: 'Relendo...',
      status: 'Status',
      selectedHint: 'Pasta selecionada. Clique em Conectar pasta para validar e salvar.',
      up: 'Subir',
      useThisFolder: 'Usar esta pasta',
      emptyFolders: 'Nenhuma subpasta visível aqui.',
      eyebrow: 'Biblioteca local',
      title: 'Pasta dos livros',
      validating: 'Validando...',
    },
    localAI: {
      apiKeyEncryptionNote:
        'A chave fica criptografada no SQLite local e nunca volta em claro para a tela.',
      apiKeyLabel: (provider) => `Chave de ${provider}`,
      apiKeyPlaceholderConfigured: 'Chave já configurada; deixe vazio para manter',
      apiKeyPlaceholderEmpty: 'Cole sua chave ou token aqui',
      body: 'Ollama continua sendo o caminho local. Se quiser, escolha OpenAI, Anthropic, OpenRouter ou um servidor compatível usando sua própria chave.',
      compatibleHint: 'Funciona com LM Studio, LocalAI, vLLM e servidores /v1 compatíveis.',
      compatibleToken: 'Token opcional do servidor compatível',
      eyebrow: 'IA da conversa',
      keyConfigured: 'configurada',
      keyMissing: 'não configurada',
      keyStatus: 'Chave',
      manualHelper: 'Use exatamente o ID esperado pelo provedor.',
      manualModel: 'Modelo manual',
      modelMissing: 'Nenhum modelo escolhido ainda.',
      modelPicked: 'Modelo escolhido',
      modelsEmpty: 'Conectado, mas nenhum modelo foi listado.',
      modelsFound: (count) => `Conectado. ${count} modelo(s) encontrado(s).`,
      modelsTruncated: (count) =>
        `Mostrando os primeiros ${count} modelos. Use o campo manual se o seu modelo não aparecer aqui.`,
      noOAuth:
        'OAuth real não entra nesta etapa. O fluxo atual é chave/token local do usuário, com armazenamento criptografado e sem expor segredo no cliente.',
      ollamaHint: 'Normalmente é http://127.0.0.1:11434/v1.',
      providerError: 'Não foi possível conectar ao provedor neste endereço.',
      save: 'Salvar provedor',
      saved: (provider) => `Configuração salva. A Dona Flora vai usar ${provider}.`,
      saving: 'Salvando...',
      showManual: 'Preencher modelo manual',
      hideManual: 'Ocultar manual',
      test: 'Testar e listar modelos',
      testing: 'Testando...',
      testPrompt: 'Teste a conexão para carregar modelos ou preencha o modelo manual.',
      title: 'Escolher o cérebro da Dona Flora',
      tokenPlaceholderConfigured: 'Token já configurado; deixe vazio para manter',
      tokenPlaceholderEmpty: 'Preencha só se o servidor exigir autenticação',
      urlCompatible: 'URL compatível',
      urlOllama: 'Endereço do Ollama',
    },
    panels: {
      preferences: { body: 'Tom, idioma e como ela responde.', title: 'Personalidade' },
      library: { body: 'Onde vivem os Markdown dos livros.', title: 'Livros' },
      'local-ai': { body: 'Local, OpenAI, Anthropic ou compatível.', title: 'Provedor' },
      'external-ai': {
        body: 'Fallback e visão por foto, só se quiser.',
        title: 'Recursos externos',
      },
    },
    providerOptions: {
      ollama: {
        body: 'Roda no seu Mac. Ideal para uso 100% local.',
        label: 'Ollama local',
        meta: 'sem chave',
      },
      openai: {
        body: 'Usa sua chave da OpenAI direto no app local.',
        label: 'OpenAI',
        meta: 'BYOK',
      },
      anthropic: {
        body: 'Usa seu token da Anthropic direto no app local.',
        label: 'Anthropic',
        meta: 'BYOK',
      },
      openrouter: {
        body: 'Roteador externo opcional para vários modelos.',
        label: 'OpenRouter',
        meta: 'BYOK',
      },
      'openai-compatible': {
        body: 'LM Studio, LocalAI, vLLM ou qualquer /v1 compatível.',
        label: 'Compatível OpenAI',
        meta: 'local/custom',
      },
    },
  },
  en: {
    aside: {
      body: 'Choose an area. Each screen shows only what needs a decision.',
      eyebrow: 'Settings',
      navAria: 'Settings sections',
      title: 'Dona Flora settings',
    },
    external: {
      apiKeyLabel: 'Optional OpenRouter key',
      apiKeyPlaceholderConfigured: 'Key already configured; leave empty to keep it',
      apiKeyPlaceholderEmpty: 'Paste the key only if you want fallback',
      apiKeyStatus: 'External key',
      body: 'Cost-bearing features live here: OpenRouter fallback and photo import. Leave them off for 100% local chat.',
      disabled: 'not configured',
      enabled: 'configured',
      eyebrow: 'Optional',
      fallbackDescription: 'Used only when the primary provider does not respond.',
      fallbackLabel: 'Enable OpenRouter fallback',
      fallbackModel: 'Fallback model',
      save: 'Save external features',
      saving: 'Saving...',
      title: 'External features',
      visionDescription:
        'Uses the external key to read a cover image and suggest an editable candidate.',
      visionLabel: 'Enable photo import',
      visionModel: 'External vision model',
    },
    library: {
      absolutePath: 'Absolute path',
      body: 'Choose the folder where your Markdown files live. Because this runs in a browser, the path must be visible to the local server.',
      browse: 'Browse',
      browseError: 'Could not open this folder.',
      browsePrompt: 'Open a folder to browse this Mac’s local filesystem.',
      browsing: 'Opening...',
      browsingEyebrow: 'Browsing',
      connected: (count) => `Folder connected. ${count} Markdown files found.`,
      connectError: 'Could not connect the folder.',
      connectFolder: 'Connect folder',
      contextBody:
        'The chat rereads Markdown before answering. This test forces that read now and shows whether the library entered the context.',
      contextEyebrow: 'Dona Flora reading',
      contextTitle: 'Library context',
      dirConfigured: 'folder provided',
      dirMissing: 'not configured',
      helper: 'Use Browse to navigate iCloud/Obsidian shortcuts, or paste the absolute path.',
      indexError: 'Could not reread the library.',
      mdCount: (count) => `${count} Markdown file(s) in this folder.`,
      reindex: 'Reread library now',
      reindexed: (bookCount, contextChars) =>
        `Library reread: ${bookCount} books, ${contextChars} context characters for Dona Flora.`,
      reindexing: 'Rereading...',
      status: 'Status',
      selectedHint: 'Folder selected. Click Connect folder to validate and save it.',
      up: 'Up',
      useThisFolder: 'Use this folder',
      emptyFolders: 'No visible subfolders here.',
      eyebrow: 'Local library',
      title: 'Books folder',
      validating: 'Validating...',
    },
    localAI: {
      apiKeyEncryptionNote:
        'The key is encrypted in the local SQLite database and never returns to the screen in clear text.',
      apiKeyLabel: (provider) => `${provider} key`,
      apiKeyPlaceholderConfigured: 'Key already configured; leave empty to keep it',
      apiKeyPlaceholderEmpty: 'Paste your key or token here',
      body: 'Ollama remains the local path. If you want, choose OpenAI, Anthropic, OpenRouter, or a compatible server with your own key.',
      compatibleHint: 'Works with LM Studio, LocalAI, vLLM, and compatible /v1 servers.',
      compatibleToken: 'Optional compatible server token',
      eyebrow: 'Conversation AI',
      keyConfigured: 'configured',
      keyMissing: 'not configured',
      keyStatus: 'Key',
      manualHelper: 'Use the exact ID expected by the provider.',
      manualModel: 'Manual model',
      modelMissing: 'No model selected yet.',
      modelPicked: 'Selected model',
      modelsEmpty: 'Connected, but no models were listed.',
      modelsFound: (count) => `Connected. ${count} model(s) found.`,
      modelsTruncated: (count) =>
        `Showing the first ${count} models. Use the manual field if yours is not listed.`,
      noOAuth:
        'Real OAuth is not part of this step. The current flow is a local user key/token, encrypted at rest and never exposed back to the client.',
      ollamaHint: 'Usually http://127.0.0.1:11434/v1.',
      providerError: 'Could not connect to the provider at this address.',
      save: 'Save provider',
      saved: (provider) => `Settings saved. Dona Flora will use ${provider}.`,
      saving: 'Saving...',
      showManual: 'Fill model manually',
      hideManual: 'Hide manual field',
      test: 'Test and list models',
      testing: 'Testing...',
      testPrompt: 'Test the connection to load models, or fill the model manually.',
      title: 'Choose Dona Flora’s brain',
      tokenPlaceholderConfigured: 'Token already configured; leave empty to keep it',
      tokenPlaceholderEmpty: 'Fill only if the server requires authentication',
      urlCompatible: 'Compatible URL',
      urlOllama: 'Ollama address',
    },
    panels: {
      preferences: { body: 'Tone, language, and response style.', title: 'Personality' },
      library: { body: 'Where the book Markdown files live.', title: 'Books' },
      'local-ai': { body: 'Local, OpenAI, Anthropic, or compatible.', title: 'Provider' },
      'external-ai': {
        body: 'Fallback and photo vision, only if wanted.',
        title: 'External features',
      },
    },
    providerOptions: {
      ollama: {
        body: 'Runs on your Mac. Ideal for 100% local use.',
        label: 'Local Ollama',
        meta: 'no key',
      },
      openai: {
        body: 'Uses your OpenAI key directly in the local app.',
        label: 'OpenAI',
        meta: 'BYOK',
      },
      anthropic: {
        body: 'Uses your Anthropic token directly in the local app.',
        label: 'Anthropic',
        meta: 'BYOK',
      },
      openrouter: {
        body: 'Optional external router for many models.',
        label: 'OpenRouter',
        meta: 'BYOK',
      },
      'openai-compatible': {
        body: 'LM Studio, LocalAI, vLLM, or any compatible /v1 server.',
        label: 'OpenAI compatible',
        meta: 'local/custom',
      },
    },
  },
  es: {
    aside: {
      body: 'Elige un área. Cada pantalla muestra solo lo que necesitas decidir.',
      eyebrow: 'Ajustes',
      navAria: 'Secciones de configuración',
      title: 'Ajustes de Dona Flora',
    },
    external: {
      apiKeyLabel: 'Clave OpenRouter opcional',
      apiKeyPlaceholderConfigured: 'Clave ya configurada; deja vacío para mantenerla',
      apiKeyPlaceholderEmpty: 'Pega la clave solo si quieres fallback',
      apiKeyStatus: 'Clave externa',
      body: 'Aquí quedan los recursos que pueden generar costo: fallback OpenRouter e importación por foto. Déjalos apagados para chat 100% local.',
      disabled: 'no configurada',
      enabled: 'configurada',
      eyebrow: 'Opcional',
      fallbackDescription: 'Solo se usa cuando el proveedor principal no responde.',
      fallbackLabel: 'Habilitar fallback OpenRouter',
      fallbackModel: 'Modelo fallback',
      save: 'Guardar externos',
      saving: 'Guardando...',
      title: 'Recursos externos',
      visionDescription:
        'Usa la clave externa para leer una imagen de portada y sugerir un candidato editable.',
      visionLabel: 'Habilitar importación por foto',
      visionModel: 'Modelo de visión externo',
    },
    library: {
      absolutePath: 'Ruta absoluta',
      body: 'Elige la carpeta donde viven los Markdown. Como es navegador, la ruta debe estar visible para que el servidor local lea y escriba los archivos.',
      browse: 'Buscar',
      browseError: 'No se pudo abrir esta carpeta.',
      browsePrompt: 'Abre una carpeta para navegar el filesystem local de este Mac.',
      browsing: 'Abriendo...',
      browsingEyebrow: 'Navegando',
      connected: (count) => `Carpeta conectada. ${count} archivos Markdown encontrados.`,
      connectError: 'No se pudo conectar la carpeta.',
      connectFolder: 'Conectar carpeta',
      contextBody:
        'El chat vuelve a leer los Markdown antes de responder. Esta prueba fuerza esa lectura ahora y muestra si la biblioteca entró en contexto.',
      contextEyebrow: 'Lectura de Dona Flora',
      contextTitle: 'Contexto de la biblioteca',
      dirConfigured: 'carpeta informada',
      dirMissing: 'no configurada',
      helper: 'Usa Buscar para navegar atajos de iCloud/Obsidian, o pega la ruta absoluta.',
      indexError: 'No se pudo releer la biblioteca.',
      mdCount: (count) => `${count} archivo(s) Markdown en esta carpeta.`,
      reindex: 'Releer biblioteca ahora',
      reindexed: (bookCount, contextChars) =>
        `Biblioteca releída: ${bookCount} libros, ${contextChars} caracteres de contexto para Dona Flora.`,
      reindexing: 'Releyendo...',
      status: 'Estado',
      selectedHint: 'Carpeta seleccionada. Haz clic en Conectar carpeta para validar y guardar.',
      up: 'Subir',
      useThisFolder: 'Usar esta carpeta',
      emptyFolders: 'No hay subcarpetas visibles aquí.',
      eyebrow: 'Biblioteca local',
      title: 'Carpeta de libros',
      validating: 'Validando...',
    },
    localAI: {
      apiKeyEncryptionNote:
        'La clave queda cifrada en el SQLite local y nunca vuelve en claro a la pantalla.',
      apiKeyLabel: (provider) => `Clave de ${provider}`,
      apiKeyPlaceholderConfigured: 'Clave ya configurada; deja vacío para mantenerla',
      apiKeyPlaceholderEmpty: 'Pega tu clave o token aquí',
      body: 'Ollama sigue siendo el camino local. Si quieres, elige OpenAI, Anthropic, OpenRouter o un servidor compatible usando tu propia clave.',
      compatibleHint: 'Funciona con LM Studio, LocalAI, vLLM y servidores /v1 compatibles.',
      compatibleToken: 'Token opcional del servidor compatible',
      eyebrow: 'IA de la conversación',
      keyConfigured: 'configurada',
      keyMissing: 'no configurada',
      keyStatus: 'Clave',
      manualHelper: 'Usa exactamente el ID esperado por el proveedor.',
      manualModel: 'Modelo manual',
      modelMissing: 'Aún no hay modelo elegido.',
      modelPicked: 'Modelo elegido',
      modelsEmpty: 'Conectado, pero no se listó ningún modelo.',
      modelsFound: (count) => `Conectado. ${count} modelo(s) encontrado(s).`,
      modelsTruncated: (count) =>
        `Mostrando los primeros ${count} modelos. Usa el campo manual si el tuyo no aparece aquí.`,
      noOAuth:
        'OAuth real no entra en esta etapa. El flujo actual es clave/token local del usuario, con almacenamiento cifrado y sin exponer secretos al cliente.',
      ollamaHint: 'Normalmente es http://127.0.0.1:11434/v1.',
      providerError: 'No se pudo conectar al proveedor en esta dirección.',
      save: 'Guardar proveedor',
      saved: (provider) => `Configuración guardada. Dona Flora usará ${provider}.`,
      saving: 'Guardando...',
      showManual: 'Rellenar modelo manual',
      hideManual: 'Ocultar manual',
      test: 'Probar y listar modelos',
      testing: 'Probando...',
      testPrompt: 'Prueba la conexión para cargar modelos o rellena el modelo manual.',
      title: 'Elegir el cerebro de Dona Flora',
      tokenPlaceholderConfigured: 'Token ya configurado; deja vacío para mantenerlo',
      tokenPlaceholderEmpty: 'Rellena solo si el servidor exige autenticación',
      urlCompatible: 'URL compatible',
      urlOllama: 'Dirección de Ollama',
    },
    panels: {
      preferences: { body: 'Tono, idioma y cómo responde.', title: 'Personalidad' },
      library: { body: 'Dónde viven los Markdown de los libros.', title: 'Libros' },
      'local-ai': { body: 'Local, OpenAI, Anthropic o compatible.', title: 'Proveedor' },
      'external-ai': {
        body: 'Fallback y visión por foto, solo si quieres.',
        title: 'Recursos externos',
      },
    },
    providerOptions: {
      ollama: {
        body: 'Corre en tu Mac. Ideal para uso 100% local.',
        label: 'Ollama local',
        meta: 'sin clave',
      },
      openai: {
        body: 'Usa tu clave de OpenAI directamente en la app local.',
        label: 'OpenAI',
        meta: 'BYOK',
      },
      anthropic: {
        body: 'Usa tu token de Anthropic directamente en la app local.',
        label: 'Anthropic',
        meta: 'BYOK',
      },
      openrouter: {
        body: 'Router externo opcional para varios modelos.',
        label: 'OpenRouter',
        meta: 'BYOK',
      },
      'openai-compatible': {
        body: 'LM Studio, LocalAI, vLLM o cualquier servidor /v1 compatible.',
        label: 'Compatible OpenAI',
        meta: 'local/custom',
      },
    },
  },
  'zh-CN': {
    aside: {
      body: '选择一个区域。每个页面只显示需要决定的内容。',
      eyebrow: '设置',
      navAria: '设置分区',
      title: 'Dona Flora 设置',
    },
    external: {
      apiKeyLabel: '可选 OpenRouter 密钥',
      apiKeyPlaceholderConfigured: '密钥已配置；留空即可保留',
      apiKeyPlaceholderEmpty: '仅在需要 fallback 时粘贴密钥',
      apiKeyStatus: '外部密钥',
      body: '可能产生成本的功能在这里：OpenRouter fallback 和照片导入。保持关闭即可让聊天 100% 本地运行。',
      disabled: '未配置',
      enabled: '已配置',
      eyebrow: '可选',
      fallbackDescription: '仅在主提供方没有响应时使用。',
      fallbackLabel: '启用 OpenRouter fallback',
      fallbackModel: 'Fallback 模型',
      save: '保存外部功能',
      saving: '保存中...',
      title: '外部功能',
      visionDescription: '使用外部密钥读取封面图片并建议可编辑候选。',
      visionLabel: '启用照片导入',
      visionModel: '外部视觉模型',
    },
    library: {
      absolutePath: '绝对路径',
      body: '选择 Markdown 文件所在的文件夹。因为这是浏览器应用，路径必须对本地服务器可见。',
      browse: '浏览',
      browseError: '无法打开此文件夹。',
      browsePrompt: '打开一个文件夹以浏览此 Mac 的本地文件系统。',
      browsing: '打开中...',
      browsingEyebrow: '正在浏览',
      connected: (count) => `文件夹已连接。找到 ${count} 个 Markdown 文件。`,
      connectError: '无法连接文件夹。',
      connectFolder: '连接文件夹',
      contextBody:
        '聊天会在回答前重新读取 Markdown。此测试会立即强制读取，并显示书库是否进入上下文。',
      contextEyebrow: 'Dona Flora 阅读',
      contextTitle: '书库上下文',
      dirConfigured: '已提供文件夹',
      dirMissing: '未配置',
      helper: '使用“浏览”访问 iCloud/Obsidian 快捷入口，或粘贴绝对路径。',
      indexError: '无法重新读取书库。',
      mdCount: (count) => `此文件夹中有 ${count} 个 Markdown 文件。`,
      reindex: '立即重新读取书库',
      reindexed: (bookCount, contextChars) =>
        `书库已重新读取：${bookCount} 本书，${contextChars} 个上下文字符供 Dona Flora 使用。`,
      reindexing: '重新读取中...',
      status: '状态',
      selectedHint: '文件夹已选择。点击连接文件夹以验证并保存。',
      up: '上一级',
      useThisFolder: '使用此文件夹',
      emptyFolders: '这里没有可见子文件夹。',
      eyebrow: '本地书库',
      title: '图书文件夹',
      validating: '验证中...',
    },
    localAI: {
      apiKeyEncryptionNote: '密钥会加密保存在本地 SQLite 中，并且不会以明文回到界面。',
      apiKeyLabel: (provider) => `${provider} 密钥`,
      apiKeyPlaceholderConfigured: '密钥已配置；留空即可保留',
      apiKeyPlaceholderEmpty: '在这里粘贴密钥或令牌',
      body: 'Ollama 仍是本地路径。你也可以使用自己的密钥选择 OpenAI、Anthropic、OpenRouter 或兼容服务器。',
      compatibleHint: '适用于 LM Studio、LocalAI、vLLM 和兼容 /v1 的服务器。',
      compatibleToken: '兼容服务器的可选令牌',
      eyebrow: '对话 AI',
      keyConfigured: '已配置',
      keyMissing: '未配置',
      keyStatus: '密钥',
      manualHelper: '使用提供方期望的准确 ID。',
      manualModel: '手动模型',
      modelMissing: '尚未选择模型。',
      modelPicked: '已选模型',
      modelsEmpty: '已连接，但没有列出模型。',
      modelsFound: (count) => `已连接。找到 ${count} 个模型。`,
      modelsTruncated: (count) =>
        `显示前 ${count} 个模型。如果你的模型不在列表中，请使用手动字段。`,
      noOAuth:
        '真实 OAuth 不属于此阶段。当前流程是用户本地密钥/令牌，加密保存，并且不会暴露给客户端。',
      ollamaHint: '通常是 http://127.0.0.1:11434/v1。',
      providerError: '无法连接到此地址的提供方。',
      save: '保存提供方',
      saved: (provider) => `设置已保存。Dona Flora 将使用 ${provider}。`,
      saving: '保存中...',
      showManual: '手动填写模型',
      hideManual: '隐藏手动字段',
      test: '测试并列出模型',
      testing: '测试中...',
      testPrompt: '测试连接以加载模型，或手动填写模型。',
      title: '选择 Dona Flora 的大脑',
      tokenPlaceholderConfigured: '令牌已配置；留空即可保留',
      tokenPlaceholderEmpty: '仅在服务器要求认证时填写',
      urlCompatible: '兼容 URL',
      urlOllama: 'Ollama 地址',
    },
    panels: {
      preferences: { body: '语气、语言和回复方式。', title: '个性' },
      library: { body: '图书 Markdown 文件的位置。', title: '图书' },
      'local-ai': { body: '本地、OpenAI、Anthropic 或兼容。', title: '提供方' },
      'external-ai': { body: 'Fallback 和照片视觉，仅在需要时启用。', title: '外部功能' },
    },
    providerOptions: {
      ollama: {
        body: '在你的 Mac 上运行。适合 100% 本地使用。',
        label: '本地 Ollama',
        meta: '无需密钥',
      },
      openai: { body: '在本地应用中直接使用你的 OpenAI 密钥。', label: 'OpenAI', meta: '自带密钥' },
      anthropic: {
        body: '在本地应用中直接使用你的 Anthropic 令牌。',
        label: 'Anthropic',
        meta: '自带密钥',
      },
      openrouter: { body: '可选的多模型外部路由。', label: 'OpenRouter', meta: '自带密钥' },
      'openai-compatible': {
        body: 'LM Studio、LocalAI、vLLM 或任何兼容 /v1 的服务器。',
        label: 'OpenAI 兼容',
        meta: '本地/自定义',
      },
    },
  },
}
