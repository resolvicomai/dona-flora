import type { AppLanguage } from '@/lib/i18n/app-language'

export const signUpStoryCopy: Record<
  AppLanguage,
  {
    closing: string
    context: Array<{
      body: string
      href: string
      kicker: string
      linkLabel: string
      title: string
    }>
    currentBody: string
    currentTitle: string
    description: string
    eyebrow: string
    featuresEyebrow: string
    featuresTitle: string
    features: Array<{
      body: string
      title: string
    }>
    mobileReferenceLabel: string
    mobileSummary: string
    pathEyebrow: string
    steps: Array<{
      body: string
      kicker: string
      title: string
    }>
    title: string
  }
> = {
  en: {
    closing: 'After the profile, the setup continues automatically',
    context: [
      {
        body: 'The name nods to a real Dona Flora connected to the Biblioteca Rio-Grandense: a teacher who became a librarian by instinct and care.',
        href: 'https://editoratelha.com.br/product/dona-flora-e-a-biblioteca-rio-grandense/',
        kicker: 'Why Dona Flora',
        linkLabel: 'Read the reference',
        title: 'A librarian with memory',
      },
      {
        body: 'Dona Flora is an open local-first experiment by Resolvi com AI, created to show how personal agents can respect data, context, and tone.',
        href: 'https://resolvicomai.app',
        kicker: 'Who makes it',
        linkLabel: 'Visit the site',
        title: 'Built by Resolvi com AI',
      },
    ],
    currentBody: 'Create the local user now. Next, Dona Flora will ask for your books folder.',
    currentTitle: 'This step only creates your local access',
    description:
      'A quiet librarian for collections that still deserve memory, context, and ownership.',
    eyebrow: 'First run',
    featuresEyebrow: 'What she does',
    featuresTitle: 'Less dashboard. More reading companion.',
    features: [
      {
        body: 'Your books stay as Markdown files, editable in Obsidian or any editor.',
        title: 'Your folder is the source',
      },
      {
        body: 'Chat uses catalog, notes, highlights, status, and ratings as context.',
        title: 'Conversation with memory',
      },
      {
        body: 'ISBN lookup, cover cache, bulk editing, reading trails, and configurable AI provider are built in.',
        title: 'Cataloging and tracking without busywork',
      },
    ],
    mobileReferenceLabel: 'Read the origin of the name.',
    mobileSummary:
      'Dona Flora is inspired by a real librarian story and built by Resolvi com AI as a local-first personal agent.',
    pathEyebrow: 'Setup path',
    steps: [
      {
        body: 'Create the local user for this machine.',
        kicker: '01',
        title: 'Create local access',
      },
      {
        body: 'Choose where the Markdown books live.',
        kicker: '02',
        title: 'Connect the books folder',
      },
      {
        body: 'Choose Ollama, OpenAI, Anthropic, OpenRouter, or a compatible local server.',
        kicker: '03',
        title: 'Choose the provider',
      },
      {
        body: 'Save suggested reading trails and follow progress from the real book statuses.',
        kicker: '04',
        title: 'Track reading trails',
      },
    ],
    title: 'A librarian for the books you already carry.',
  },
  es: {
    closing: 'Después del perfil, la configuración continúa automáticamente',
    context: [
      {
        body: 'El nombre dialoga con una Dona Flora real ligada a la Biblioteca Rio-Grandense: una profesora que se volvió bibliotecaria por instinto y cuidado.',
        href: 'https://editoratelha.com.br/product/dona-flora-e-a-biblioteca-rio-grandense/',
        kicker: 'Por qué Dona Flora',
        linkLabel: 'Leer la referencia',
        title: 'Una bibliotecaria con memoria',
      },
      {
        body: 'Dona Flora es un experimento abierto y local-first de Resolvi com AI, creado para mostrar agentes personales con respeto por datos, contexto y tono.',
        href: 'https://resolvicomai.app',
        kicker: 'Quién lo hace',
        linkLabel: 'Visitar el sitio',
        title: 'Creado por Resolvi com AI',
      },
    ],
    currentBody: 'Crea el usuario local ahora. Luego Dona Flora pedirá la carpeta de libros.',
    currentTitle: 'Este paso solo crea tu acceso local',
    description:
      'Una bibliotecaria tranquila para acervos que merecen memoria, contexto y propiedad.',
    eyebrow: 'Primer uso',
    featuresEyebrow: 'Qué hace',
    featuresTitle: 'Menos panel. Más compañía de lectura.',
    features: [
      {
        body: 'Tus libros siguen como archivos Markdown, editables en Obsidian o cualquier editor.',
        title: 'Tu carpeta es la fuente',
      },
      {
        body: 'El chat usa catálogo, notas, destacados, estado y calificaciones como contexto.',
        title: 'Conversación con memoria',
      },
      {
        body: 'Búsqueda por ISBN, cache de portadas, edición masiva, rutas de lectura y proveedor de IA configurable ya vienen incluidos.',
        title: 'Catalogar y acompañar sin fricción',
      },
    ],
    mobileReferenceLabel: 'Leer el origen del nombre.',
    mobileSummary:
      'Dona Flora se inspira en una historia real de bibliotecaria y fue creada por Resolvi com AI como agente personal local-first.',
    pathEyebrow: 'Ruta de setup',
    steps: [
      {
        body: 'Crea el usuario local para esta máquina.',
        kicker: '01',
        title: 'Crear acceso local',
      },
      {
        body: 'Elige dónde viven tus libros Markdown.',
        kicker: '02',
        title: 'Conectar la carpeta',
      },
      {
        body: 'Elige Ollama, OpenAI, Anthropic, OpenRouter o un servidor local compatible.',
        kicker: '03',
        title: 'Elegir proveedor',
      },
      {
        body: 'Guarda rutas sugeridas y acompaña el progreso desde el estado real de cada libro.',
        kicker: '04',
        title: 'Acompañar rutas',
      },
    ],
    title: 'Una bibliotecaria para los libros que ya llevas contigo.',
  },
  'zh-CN': {
    closing: '创建资料后，设置会自动继续',
    context: [
      {
        body: '这个名字呼应一位与 Biblioteca Rio-Grandense 有关的真实 Dona Flora：她原是教师，后来凭直觉与热爱成为图书管理员。',
        href: 'https://editoratelha.com.br/product/dona-flora-e-a-biblioteca-rio-grandense/',
        kicker: '为什么叫 Dona Flora',
        linkLabel: '阅读参考',
        title: '一位有记忆的图书管理员',
      },
      {
        body: 'Dona Flora 是 Resolvi com AI 的开放本地优先实验，展示个人智能代理如何尊重数据、语境与语气。',
        href: 'https://resolvicomai.app',
        kicker: '谁做的',
        linkLabel: '访问网站',
        title: '由 Resolvi com AI 创建',
      },
    ],
    currentBody: '现在先创建本地用户。接下来 Dona Flora 会要求选择图书文件夹。',
    currentTitle: '这一步只创建本地访问',
    description: '一位安静的图书管理员，服务于那些仍值得拥有记忆、语境与归属权的藏书。',
    eyebrow: '首次使用',
    featuresEyebrow: '她能做什么',
    featuresTitle: '少一点仪表盘，多一点阅读陪伴。',
    features: [
      {
        body: '你的图书仍是 Markdown 文件，可在 Obsidian 或任意编辑器中编辑。',
        title: '文件夹就是来源',
      },
      {
        body: '聊天会使用目录、笔记、摘录、阅读状态和评分作为上下文。',
        title: '带记忆的对话',
      },
      {
        body: '内置 ISBN 检索、封面缓存、批量编辑、阅读路径和可配置 AI 提供方。',
        title: '低摩擦编目与跟进',
      },
    ],
    mobileReferenceLabel: '阅读名字来源。',
    mobileSummary:
      'Dona Flora 受到真实图书管理员故事启发，由 Resolvi com AI 打造为本地优先的个人智能代理。',
    pathEyebrow: '设置路径',
    steps: [
      {
        body: '为这台机器创建本地用户。',
        kicker: '01',
        title: '创建本地访问',
      },
      {
        body: '选择 Markdown 图书所在文件夹。',
        kicker: '02',
        title: '连接图书文件夹',
      },
      {
        body: '选择 Ollama、OpenAI、Anthropic、OpenRouter 或兼容的本地服务器。',
        kicker: '03',
        title: '选择提供方',
      },
      {
        body: '保存建议的阅读路径，并通过每本书的真实状态跟进进度。',
        kicker: '04',
        title: '跟进阅读路径',
      },
    ],
    title: '一位为你已有藏书而生的图书管理员。',
  },
  'pt-BR': {
    closing: 'Depois do perfil, o setup continua sozinho',
    context: [
      {
        body: 'O nome conversa com uma Dona Flora real da Biblioteca Rio-Grandense: professora que virou bibliotecária por instinto, cuidado e paixão pelo acervo.',
        href: 'https://editoratelha.com.br/product/dona-flora-e-a-biblioteca-rio-grandense/',
        kicker: 'Por que Dona Flora',
        linkLabel: 'Ler a referência',
        title: 'Uma bibliotecária com memória',
      },
      {
        body: 'Dona Flora é um experimento open source e local-first da Resolvi com AI para mostrar agentes pessoais que respeitam dados, contexto e tom de voz.',
        href: 'https://resolvicomai.app',
        kicker: 'Quem construiu',
        linkLabel: 'Conhecer o site',
        title: 'Feita pela Resolvi com AI',
      },
    ],
    currentBody:
      'Crie o usuário local agora. Em seguida a Dona Flora já abre a escolha da pasta dos livros.',
    currentTitle: 'Esta etapa só cria seu acesso local',
    description: 'Uma bibliotecária calma para acervos que ainda merecem memória, contexto e dono.',
    eyebrow: 'Primeiro uso',
    featuresEyebrow: 'O que ela faz',
    featuresTitle: 'Menos painel. Mais companhia de leitura.',
    features: [
      {
        body: 'Seus livros continuam em Markdown, editáveis no Obsidian ou em qualquer editor.',
        title: 'Sua pasta é a fonte',
      },
      {
        body: 'O chat usa acervo, notas, highlights, status e avaliações como contexto.',
        title: 'Conversa com memória',
      },
      {
        body: 'Busca por ISBN, cache de capas, edição em massa, trilhas de leitura e provedor de IA configurável já vêm no fluxo.',
        title: 'Catalogar e acompanhar sem sofrimento',
      },
    ],
    mobileReferenceLabel: 'Ler a origem do nome.',
    mobileSummary:
      'Dona Flora nasce de uma história real de bibliotecária e é um experimento local-first da Resolvi com AI.',
    pathEyebrow: 'Caminho de entrada',
    steps: [
      {
        body: 'Crie o usuário local deste Mac.',
        kicker: '01',
        title: 'Criar acesso local',
      },
      {
        body: 'Escolha onde vivem os Markdown.',
        kicker: '02',
        title: 'Conectar a pasta dos livros',
      },
      {
        body: 'Escolha Ollama, OpenAI, Anthropic, OpenRouter ou um servidor local compatível.',
        kicker: '03',
        title: 'Escolher o provedor',
      },
      {
        body: 'Salve trilhas sugeridas e acompanhe o progresso pelo status real de cada livro.',
        kicker: '04',
        title: 'Acompanhar trilhas',
      },
    ],
    title: 'Uma bibliotecária para os livros que você já carrega.',
  },
}

export type SignUpStory = (typeof signUpStoryCopy)[AppLanguage]

export const authShellCopy = {
  en: {
    signIn: {
      description:
        'Sign in with your local username to access your collection, conversations, and saved preferences.',
      eyebrow: 'Sign in',
      footer: 'First time here? Create a local username and keep everything on this installation.',
      title: 'Your library is waiting for you.',
    },
    signUp: {
      description:
        'This creates a local user so your library, chats, and preferences stay separate.',
      eyebrow: 'Create account',
      footer: 'After this, Dona Flora asks where your books live.',
      title: 'Create your local access.',
    },
    forgotPassword: {
      description: 'Create a local reset link so you can choose a new password.',
      eyebrow: 'Recovery',
      footer: 'In local mode, the reset link appears here. No email required.',
      title: 'Reset password',
    },
    resetPassword: {
      description: 'Choose a new password and return to the library.',
      eyebrow: 'New password',
      footer: 'For security, the reset link has a limited lifetime.',
      title: 'Update your credentials',
    },
    verifyEmail: {
      description: 'Validate the local account to continue to the collection and the chat.',
      eyebrow: 'Local access',
      footer: 'If the link expires, you can create a new local link without leaving here.',
      title: 'Validate local account',
    },
  },
  es: {
    signIn: {
      description:
        'Entra con tu usuario local para acceder a tu colección, conversaciones y ajustes guardados.',
      eyebrow: 'Entrar',
      footer: '¿Es tu primer acceso? Crea un usuario local y mantén todo en esta instalación.',
      title: 'Tu biblioteca te espera.',
    },
    signUp: {
      description: 'Esto crea un usuario local para separar biblioteca, chats y preferencias.',
      eyebrow: 'Crear cuenta',
      footer: 'Después de esto, Dona Flora pregunta dónde viven tus libros.',
      title: 'Crea tu acceso local.',
    },
    forgotPassword: {
      description: 'Crea un enlace local para elegir una nueva contraseña.',
      eyebrow: 'Recuperación',
      footer: 'En modo local, el enlace aparece aquí. No necesitas correo.',
      title: 'Restablecer contraseña',
    },
    resetPassword: {
      description: 'Elige una nueva contraseña y vuelve a la biblioteca.',
      eyebrow: 'Nueva contraseña',
      footer: 'Por seguridad, el enlace de restablecimiento tiene una validez limitada.',
      title: 'Actualiza tus credenciales',
    },
    verifyEmail: {
      description: 'Valida la cuenta local para continuar a la colección y al chat.',
      eyebrow: 'Acceso local',
      footer: 'Si el enlace expira, puedes crear un nuevo enlace local sin salir de aquí.',
      title: 'Valida la cuenta local',
    },
  },
  'zh-CN': {
    signIn: {
      description: '使用本地用户名登录，即可访问你的收藏、对话以及 Dona Flora 保存的设置。',
      eyebrow: '登录',
      footer: '首次使用？创建本地用户名，并把内容保留在此安装中。',
      title: '你的书库正在等你。',
    },
    signUp: {
      description: '这会创建本地用户，用来分隔书库、聊天和偏好。',
      eyebrow: '创建账户',
      footer: '接下来，Dona Flora 会询问你的图书保存在哪里。',
      title: '创建本地访问。',
    },
    forgotPassword: {
      description: '创建本地重置链接，方便你设置新密码。',
      eyebrow: '找回密码',
      footer: '本地模式下，重置链接会显示在这里，不需要邮箱。',
      title: '重置密码',
    },
    resetPassword: {
      description: '选择新密码，然后回到书库。',
      eyebrow: '新密码',
      footer: '出于安全原因，重置链接有时效限制。',
      title: '更新你的凭据',
    },
    verifyEmail: {
      description: '验证本地账户后，即可继续访问收藏与聊天。',
      eyebrow: '本地访问',
      footer: '如果链接过期，你可以在这里创建新的本地链接。',
      title: '验证本地账户',
    },
  },
  'pt-BR': {
    signIn: {
      description:
        'Entre com seu usuário local para acessar seu acervo, suas conversas e as preferências salvas da Dona Flora.',
      eyebrow: 'Entrar',
      footer: 'Primeiro acesso? Crie um usuário local e mantenha tudo nesta instalação.',
      title: 'Sua biblioteca espera por você.',
    },
    signUp: {
      description: 'Isto cria um usuário local para separar acervo, chats e preferências.',
      eyebrow: 'Criar conta',
      footer: 'Depois disso, a Dona Flora pergunta onde seus livros vivem.',
      title: 'Crie seu acesso local.',
    },
    forgotPassword: {
      description: 'Gere um link local para escolher uma nova senha.',
      eyebrow: 'Recuperação',
      footer: 'Em modo local, o link aparece aqui mesmo. Não precisa de e-mail.',
      title: 'Redefinir senha',
    },
    resetPassword: {
      description: 'Escolha uma nova senha e volte para a biblioteca.',
      eyebrow: 'Nova senha',
      footer: 'Por segurança, o link de redefinição tem validade limitada.',
      title: 'Atualize sua credencial',
    },
    verifyEmail: {
      description: 'Valide a conta local para continuar ao acervo e ao chat.',
      eyebrow: 'Acesso local',
      footer: 'Se o link expirar, você pode gerar um novo link local sem sair daqui.',
      title: 'Valide a conta local',
    },
  },
} as const
