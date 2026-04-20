'use client'

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'

import {
  DEFAULT_APP_LANGUAGE,
  normalizeAppLanguage,
  type AppLanguage,
} from '@/lib/i18n/app-language'

type LanguageOption = {
  label: string
  value: AppLanguage
}

export type AppLanguageCopy = {
  nav: {
    brandSubtitle: string
    chat: string
    homeAriaLabel: string
    library: string
    primaryNavigationLabel: string
  }
  shell: {
    accountBody: string
    accountLabel: string
    aiBody: string
    aiLabel: string
    eyebrow: string
    headline: string
    intro: string
    libraryBody: string
    libraryLabel: string
    brandSubtitle: string
  }
  auth: {
    common: {
      emailLabel: string
      emailPlaceholder: string
      nameLabel: string
      namePlaceholder: string
      passwordLabel: string
      passwordPlaceholder: string
    }
    forgotPassword: {
      emailLabel: string
      emailPlaceholder: string
      error: string
      link: string
      localLinkNote: string
      localLinkTitle: string
      sending: string
      success: string
      submit: string
    }
    resetPassword: {
      confirmPasswordLabel: string
      confirmPasswordPlaceholder: string
      error: string
      invalidLink: string
      link: string
      mismatch: string
      newPasswordLabel: string
      newPasswordPlaceholder: string
      submit: string
      updating: string
    }
    signIn: {
      createAccount: string
      creatingAccountLink?: string
      emailLabel: string
      emailPlaceholder: string
      error: string
      forgotPassword: string
      passwordLabel: string
      passwordPlaceholder: string
      resetComplete: string
      signIn: string
      signingIn: string
    }
    signUp: {
      accountLink: string
      accountPrompt: string
      confirmPasswordLabel: string
      confirmPasswordPlaceholder: string
      creatingAccount: string
      emailLabel: string
      emailPlaceholder: string
      error: string
      nameLabel: string
      namePlaceholder: string
      passwordLabel: string
      passwordPlaceholder: string
      passwordMismatch: string
      submit: string
    }
      verifyEmail: {
        createAnotherAccount: string
        emailLabel: string
        emailPlaceholder: string
        errorPrefix: string
        backToSignIn: string
        goToLibrary: string
        info: string
        localLinkNote: string
        localLinkTitle: string
        otherAccount: string
        preparingLocalLink: string
        resend: string
        resending: string
        resendSubtitle: string
        verified: string
      }
  }
  settings: {
    additionalInstructionsLabel: string
    additionalInstructionsPlaceholder: string
    appLanguageLabel: string
    description: string
    error: string
    externalOpennessLabel: string
    focusLabel: string
    save: string
    saved: string
    saving: string
    subtitle: string
    title: string
    toneLabel: string
    responseStyleLabel: string
    languageOptions: LanguageOption[]
    placeholders: {
      externalOpenness: string
      focus: string
      responseStyle: string
      tone: string
      language: string
    }
  }
}

const APP_LANGUAGE_COPY: Record<AppLanguage, AppLanguageCopy> = {
  'pt-BR': {
    nav: {
      brandSubtitle: 'Biblioteca pessoal',
      chat: 'Chat',
      homeAriaLabel: 'Dona Flora — ir para a biblioteca',
      library: 'Biblioteca',
      primaryNavigationLabel: 'Navegação principal',
    },
    shell: {
      accountBody: 'Sessão e recuperação seguras',
      accountLabel: 'Conta',
      aiBody: 'Preferências persistidas',
      aiLabel: 'IA',
      eyebrow: 'Biblioteca pessoal',
      headline: 'Leitura, memória e conversa no mesmo lugar.',
      intro:
        'Entre na sua biblioteca, ajuste o comportamento da Dona Flora e mantenha cada acervo isolado no seu próprio espaço.',
      libraryBody: 'Markdown por usuário',
      libraryLabel: 'Acervo',
      brandSubtitle: 'Biblioteca pessoal',
    },
    auth: {
      common: {
        emailLabel: 'Email',
        emailPlaceholder: 'voce@exemplo.com',
        nameLabel: 'Nome',
        namePlaceholder: 'Como voce quer aparecer',
        passwordLabel: 'Senha',
        passwordPlaceholder: 'Sua senha',
      },
      forgotPassword: {
        emailLabel: 'Email',
        emailPlaceholder: 'voce@exemplo.com',
        error: 'Nao foi possivel enviar o link.',
        link: 'Esqueci minha senha',
        localLinkNote:
          'Como este ambiente esta sem provedor de email externo, o link local ja esta pronto.',
        localLinkTitle: 'Abrir link local de redefinicao',
        sending: 'Enviando…',
        success: 'Se esse email existir, enviamos um link seguro de redefinicao.',
        submit: 'Enviar link de redefinicao',
      },
      resetPassword: {
        confirmPasswordLabel: 'Confirmar nova senha',
        confirmPasswordPlaceholder: 'Repita a nova senha',
        error: 'Nao foi possivel redefinir a senha.',
        invalidLink: 'O link de redefinicao esta incompleto ou expirou.',
        link: 'Pedir um novo link',
        mismatch: 'As senhas nao conferem.',
        newPasswordLabel: 'Nova senha',
        newPasswordPlaceholder: 'Escolha uma nova senha',
        submit: 'Salvar nova senha',
        updating: 'Atualizando…',
      },
      signIn: {
        createAccount: 'Criar conta',
        emailLabel: 'Email',
        emailPlaceholder: 'voce@exemplo.com',
        error: 'Nao foi possivel entrar.',
        forgotPassword: 'Esqueci minha senha',
        passwordLabel: 'Senha',
        passwordPlaceholder: 'Sua senha',
        resetComplete:
          'Senha redefinida. Agora voce ja pode entrar com a nova credencial.',
        signIn: 'Entrar',
        signingIn: 'Entrando…',
      },
      signUp: {
        accountLink: 'Entrar',
        accountPrompt: 'Ja tem conta?',
        confirmPasswordLabel: 'Confirmar senha',
        confirmPasswordPlaceholder: 'Repita a senha',
        creatingAccount: 'Criando conta…',
        emailLabel: 'Email',
        emailPlaceholder: 'voce@exemplo.com',
        error: 'Nao foi possivel criar a conta.',
        nameLabel: 'Nome',
        namePlaceholder: 'Como voce quer aparecer',
        passwordLabel: 'Senha',
        passwordPlaceholder: 'Minimo de 8 caracteres',
        passwordMismatch: 'As senhas nao conferem.',
        submit: 'Criar conta',
      },
      verifyEmail: {
        createAnotherAccount: 'Criar outra conta',
        backToSignIn: 'Voltar para entrar',
        emailLabel: 'Email',
        emailPlaceholder: 'voce@exemplo.com',
        errorPrefix: 'Nao foi possivel verificar o email',
        goToLibrary: 'Ir para a biblioteca',
        info: 'Abra o link enviado para o seu email. Se precisar, voce pode reenviar a verificacao abaixo.',
        localLinkNote:
          'Neste ambiente local, voce pode continuar por aqui sem depender de email externo.',
        localLinkTitle: 'Abrir link local de verificacao',
        otherAccount: 'Entrar em outra conta',
        preparingLocalLink: 'Preparando o link local de verificacao…',
        resend: 'Reenviar verificacao',
        resending: 'Reenviando…',
        resendSubtitle: 'Reenviamos o link de verificacao para o seu email.',
        verified: 'Email confirmado com sucesso. Sua biblioteca ja esta pronta.',
      },
    },
    settings: {
      additionalInstructionsLabel: 'Instruções adicionais',
      appLanguageLabel: 'Idioma do app',
      description:
        'Essas preferências entram no prompt-base da Dona Flora e moldam o jeito como ela conversa com você em toda nova sessão.',
      error: 'Nao foi possivel salvar as settings.',
      externalOpennessLabel: 'Abertura a livros externos',
      focusLabel: 'Foco',
      save: 'Salvar preferências',
      saved: 'Settings salvas.',
      saving: 'Salvando…',
      subtitle: 'Dona Flora',
      title: 'Preferências da bibliotecária',
      toneLabel: 'Tom',
      responseStyleLabel: 'Estilo de resposta',
      additionalInstructionsPlaceholder:
        'Ex.: prefira relacionar os livros com o que eu já li ou com minhas notas.',
      languageOptions: [
        { label: 'Português (Brasil)', value: 'pt-BR' },
        { label: 'English', value: 'en' },
        { label: 'Español', value: 'es' },
        { label: '中文（简体）', value: 'zh-CN' },
      ],
      placeholders: {
        externalOpenness: 'Selecione uma abertura',
        focus: 'Selecione um foco',
        responseStyle: 'Selecione um estilo',
        tone: 'Selecione um tom',
        language: 'Selecione um idioma',
      },
    },
  },
  en: {
    nav: {
      brandSubtitle: 'Personal library',
      chat: 'Chat',
      homeAriaLabel: 'Dona Flora - go to the library',
      library: 'Library',
      primaryNavigationLabel: 'Primary navigation',
    },
    shell: {
      accountBody: 'Secure session and recovery',
      accountLabel: 'Account',
      aiBody: 'Persisted preferences',
      aiLabel: 'AI',
      eyebrow: 'Personal library',
      headline: 'Reading, memory, and conversation in one place.',
      intro:
        'Sign in to your library, tune Dona Flora, and keep each collection isolated in its own space.',
      libraryBody: 'Markdown per user',
      libraryLabel: 'Collection',
      brandSubtitle: 'Personal library',
    },
    auth: {
      common: {
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        nameLabel: 'Name',
        namePlaceholder: 'How you want to appear',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Your password',
      },
      forgotPassword: {
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        error: 'We could not send the link.',
        link: 'Forgot password?',
        localLinkNote:
          'This environment does not have an external email provider, so the local link is ready.',
        localLinkTitle: 'Open local reset link',
        sending: 'Sending…',
        success: 'If this email exists, we sent a secure reset link.',
        submit: 'Send reset link',
      },
      resetPassword: {
        confirmPasswordLabel: 'Confirm new password',
        confirmPasswordPlaceholder: 'Repeat the new password',
        error: 'We could not reset the password.',
        invalidLink: 'The reset link is incomplete or expired.',
        link: 'Request a new link',
        mismatch: 'The passwords do not match.',
        newPasswordLabel: 'New password',
        newPasswordPlaceholder: 'Choose a new password',
        submit: 'Save new password',
        updating: 'Updating…',
      },
      signIn: {
        createAccount: 'Create account',
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        error: 'We could not sign you in.',
        forgotPassword: 'Forgot password?',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Your password',
        resetComplete: 'Password reset. You can now sign in with the new credential.',
        signIn: 'Sign in',
        signingIn: 'Signing in…',
      },
      signUp: {
        accountLink: 'Sign in',
        accountPrompt: 'Already have an account?',
        confirmPasswordLabel: 'Confirm password',
        confirmPasswordPlaceholder: 'Repeat the password',
        creatingAccount: 'Creating account…',
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        error: 'We could not create the account.',
        nameLabel: 'Name',
        namePlaceholder: 'How you want to appear',
        passwordLabel: 'Password',
        passwordPlaceholder: 'At least 8 characters',
        passwordMismatch: 'The passwords do not match.',
        submit: 'Create account',
      },
      verifyEmail: {
        createAnotherAccount: 'Create another account',
        backToSignIn: 'Back to sign in',
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        errorPrefix: 'We could not verify the email',
        goToLibrary: 'Go to the library',
        info: 'Open the link sent to your email. If needed, you can resend verification below.',
        localLinkNote:
          'In this local environment, you can continue here without an external email provider.',
        localLinkTitle: 'Open local verification link',
        otherAccount: 'Sign in to another account',
        preparingLocalLink: 'Preparing local verification link…',
        resend: 'Resend verification',
        resending: 'Resending…',
        resendSubtitle: 'We sent the verification link again to your email.',
        verified: 'Email confirmed successfully. Your library is ready.',
      },
    },
    settings: {
      additionalInstructionsLabel: 'Additional instructions',
      appLanguageLabel: 'App language',
      description:
        'These preferences feed Dona Flora’s base prompt and shape how she talks to you in every new session.',
      error: 'We could not save the settings.',
      externalOpennessLabel: 'Openness to outside books',
      focusLabel: 'Focus',
      save: 'Save preferences',
      saved: 'Settings saved.',
      saving: 'Saving…',
      subtitle: 'Dona Flora',
      title: 'Librarian preferences',
      toneLabel: 'Tone',
      responseStyleLabel: 'Response style',
      additionalInstructionsPlaceholder:
        'e.g. prefer connecting books to what I have already read or my notes.',
      languageOptions: [
        { label: 'Portuguese (Brazil)', value: 'pt-BR' },
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'Chinese (Simplified)', value: 'zh-CN' },
      ],
      placeholders: {
        externalOpenness: 'Select an option',
        focus: 'Select a focus',
        responseStyle: 'Select a style',
        tone: 'Select a tone',
        language: 'Select a language',
      },
    },
  },
  es: {
    nav: {
      brandSubtitle: 'Biblioteca personal',
      chat: 'Chat',
      homeAriaLabel: 'Dona Flora - ir a la biblioteca',
      library: 'Biblioteca',
      primaryNavigationLabel: 'Navegación principal',
    },
    shell: {
      accountBody: 'Sesión y recuperación seguras',
      accountLabel: 'Cuenta',
      aiBody: 'Preferencias guardadas',
      aiLabel: 'IA',
      eyebrow: 'Biblioteca personal',
      headline: 'Lectura, memoria y conversación en un solo lugar.',
      intro:
        'Entra en tu biblioteca, ajusta a Dona Flora y mantén cada colección aislada en su propio espacio.',
      libraryBody: 'Markdown por usuario',
      libraryLabel: 'Colección',
      brandSubtitle: 'Biblioteca personal',
    },
    auth: {
      common: {
        emailLabel: 'Correo electrónico',
        emailPlaceholder: 'tu@ejemplo.com',
        nameLabel: 'Nombre',
        namePlaceholder: 'Cómo quieres aparecer',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: 'Tu contraseña',
      },
      forgotPassword: {
        emailLabel: 'Correo electrónico',
        emailPlaceholder: 'tu@ejemplo.com',
        error: 'No pudimos enviar el enlace.',
        link: '¿Olvidaste tu contraseña?',
        localLinkNote:
          'Este entorno no tiene un proveedor de correo externo, así que el enlace local ya está listo.',
        localLinkTitle: 'Abrir enlace local de restablecimiento',
        sending: 'Enviando…',
        success: 'Si este correo existe, enviamos un enlace seguro de restablecimiento.',
        submit: 'Enviar enlace de restablecimiento',
      },
      resetPassword: {
        confirmPasswordLabel: 'Confirmar nueva contraseña',
        confirmPasswordPlaceholder: 'Repite la nueva contraseña',
        error: 'No pudimos restablecer la contraseña.',
        invalidLink: 'El enlace de restablecimiento está incompleto o expiró.',
        link: 'Solicitar un nuevo enlace',
        mismatch: 'Las contraseñas no coinciden.',
        newPasswordLabel: 'Nueva contraseña',
        newPasswordPlaceholder: 'Elige una nueva contraseña',
        submit: 'Guardar nueva contraseña',
        updating: 'Actualizando…',
      },
      signIn: {
        createAccount: 'Crear cuenta',
        emailLabel: 'Correo electrónico',
        emailPlaceholder: 'tu@ejemplo.com',
        error: 'No pudimos iniciar sesión.',
        forgotPassword: '¿Olvidaste tu contraseña?',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: 'Tu contraseña',
        resetComplete: 'Contraseña restablecida. Ya puedes entrar con la nueva credencial.',
        signIn: 'Iniciar sesión',
        signingIn: 'Iniciando sesión…',
      },
      signUp: {
        accountLink: 'Entrar',
        accountPrompt: '¿Ya tienes cuenta?',
        confirmPasswordLabel: 'Confirmar contraseña',
        confirmPasswordPlaceholder: 'Repite la contraseña',
        creatingAccount: 'Creando cuenta…',
        emailLabel: 'Correo electrónico',
        emailPlaceholder: 'tu@ejemplo.com',
        error: 'No pudimos crear la cuenta.',
        nameLabel: 'Nombre',
        namePlaceholder: 'Cómo quieres aparecer',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: 'Mínimo de 8 caracteres',
        passwordMismatch: 'Las contraseñas no coinciden.',
        submit: 'Crear cuenta',
      },
      verifyEmail: {
        createAnotherAccount: 'Crear otra cuenta',
        backToSignIn: 'Volver a iniciar sesión',
        emailLabel: 'Correo electrónico',
        emailPlaceholder: 'tu@ejemplo.com',
        errorPrefix: 'No pudimos verificar el correo',
        goToLibrary: 'Ir a la biblioteca',
        info: 'Abre el enlace enviado a tu correo. Si lo necesitas, puedes reenviar la verificación abajo.',
        localLinkNote:
          'En este entorno local, puedes continuar aquí sin depender de un proveedor de correo externo.',
        localLinkTitle: 'Abrir enlace local de verificación',
        otherAccount: 'Entrar con otra cuenta',
        preparingLocalLink: 'Preparando el enlace local de verificación…',
        resend: 'Reenviar verificación',
        resending: 'Reenviando…',
        resendSubtitle: 'Reenviamos el enlace de verificación a tu correo.',
        verified: 'Correo confirmado con éxito. Tu biblioteca ya está lista.',
      },
    },
    settings: {
      additionalInstructionsLabel: 'Instrucciones adicionales',
      appLanguageLabel: 'Idioma de la app',
      description:
        'Estas preferencias entran en el prompt base de Dona Flora y moldean cómo habla contigo en cada nueva sesión.',
      error: 'No pudimos guardar la configuración.',
      externalOpennessLabel: 'Apertura a libros externos',
      focusLabel: 'Enfoque',
      save: 'Guardar preferencias',
      saved: 'Configuración guardada.',
      saving: 'Guardando…',
      subtitle: 'Dona Flora',
      title: 'Preferencias de la bibliotecaria',
      toneLabel: 'Tono',
      responseStyleLabel: 'Estilo de respuesta',
      additionalInstructionsPlaceholder:
        'p. ej., preferir relacionar los libros con lo que ya leí o con mis notas.',
      languageOptions: [
        { label: 'Portugués (Brasil)', value: 'pt-BR' },
        { label: 'Inglés', value: 'en' },
        { label: 'Español', value: 'es' },
        { label: 'Chino (simplificado)', value: 'zh-CN' },
      ],
      placeholders: {
        externalOpenness: 'Selecciona una opción',
        focus: 'Selecciona un enfoque',
        responseStyle: 'Selecciona un estilo',
        tone: 'Selecciona un tono',
        language: 'Selecciona un idioma',
      },
    },
  },
  'zh-CN': {
    nav: {
      brandSubtitle: '个人书库',
      chat: '聊天',
      homeAriaLabel: 'Dona Flora - 前往书库',
      library: '书库',
      primaryNavigationLabel: '主导航',
    },
    shell: {
      accountBody: '安全的会话与找回',
      accountLabel: '账户',
      aiBody: '已保存的偏好',
      aiLabel: 'AI',
      eyebrow: '个人书库',
      headline: '阅读、记忆与对话，汇聚一处。',
      intro: '登录你的书库，调整 Dona Flora，让每个收藏空间彼此独立。',
      libraryBody: '每位用户的 Markdown',
      libraryLabel: '收藏',
      brandSubtitle: '个人书库',
    },
    auth: {
      common: {
        emailLabel: '电子邮件',
        emailPlaceholder: 'you@example.com',
        nameLabel: '姓名',
        namePlaceholder: '你想如何显示',
        passwordLabel: '密码',
        passwordPlaceholder: '你的密码',
      },
      forgotPassword: {
        emailLabel: '电子邮件',
        emailPlaceholder: 'you@example.com',
        error: '我们无法发送链接。',
        link: '忘记密码？',
        localLinkNote: '当前环境没有外部邮件服务，因此本地链接已准备好。',
        localLinkTitle: '打开本地重置链接',
        sending: '发送中…',
        success: '如果该邮箱存在，我们已发送安全的重置链接。',
        submit: '发送重置链接',
      },
      resetPassword: {
        confirmPasswordLabel: '确认新密码',
        confirmPasswordPlaceholder: '重复新密码',
        error: '我们无法重置密码。',
        invalidLink: '重置链接不完整或已过期。',
        link: '申请新链接',
        mismatch: '两次密码不一致。',
        newPasswordLabel: '新密码',
        newPasswordPlaceholder: '选择一个新密码',
        submit: '保存新密码',
        updating: '更新中…',
      },
      signIn: {
        createAccount: '创建账户',
        emailLabel: '电子邮件',
        emailPlaceholder: 'you@example.com',
        error: '我们无法登录。',
        forgotPassword: '忘记密码？',
        passwordLabel: '密码',
        passwordPlaceholder: '你的密码',
        resetComplete: '密码已重置。现在可以使用新凭据登录。',
        signIn: '登录',
        signingIn: '登录中…',
      },
      signUp: {
        accountLink: '登录',
        accountPrompt: '已有账户？',
        confirmPasswordLabel: '确认密码',
        confirmPasswordPlaceholder: '重复密码',
        creatingAccount: '创建账户中…',
        emailLabel: '电子邮件',
        emailPlaceholder: 'you@example.com',
        error: '我们无法创建账户。',
        nameLabel: '姓名',
        namePlaceholder: '你想如何显示',
        passwordLabel: '密码',
        passwordPlaceholder: '至少 8 个字符',
        passwordMismatch: '两次密码不一致。',
        submit: '创建账户',
      },
      verifyEmail: {
        createAnotherAccount: '创建另一个账户',
        backToSignIn: '返回登录',
        emailLabel: '电子邮件',
        emailPlaceholder: 'you@example.com',
        errorPrefix: '我们无法验证邮箱',
        goToLibrary: '前往书库',
        info: '打开发送到你邮箱的链接。如有需要，可在下方重新发送验证。',
        localLinkNote: '在本地环境中，你无需外部邮件服务也可以继续。',
        localLinkTitle: '打开本地验证链接',
        otherAccount: '切换到其他账户登录',
        preparingLocalLink: '正在准备本地验证链接…',
        resend: '重新发送验证',
        resending: '重新发送中…',
        resendSubtitle: '我们已再次向你的邮箱发送验证链接。',
        verified: '邮箱验证成功。你的书库已准备好。',
      },
    },
    settings: {
      additionalInstructionsLabel: '附加说明',
      appLanguageLabel: '应用语言',
      description: '这些偏好会进入 Dona Flora 的基础提示，并影响她在每次新会话中的说话方式。',
      error: '我们无法保存设置。',
      externalOpennessLabel: '对外部书籍的开放程度',
      focusLabel: '关注点',
      save: '保存偏好',
      saved: '设置已保存。',
      saving: '保存中…',
      subtitle: 'Dona Flora',
      title: '图书管理员偏好',
      toneLabel: '语气',
      responseStyleLabel: '回复风格',
      additionalInstructionsPlaceholder: '例如：优先把书和我已读过的内容或笔记联系起来。',
      languageOptions: [
        { label: '葡萄牙语（巴西）', value: 'pt-BR' },
        { label: '英语', value: 'en' },
        { label: '西班牙语', value: 'es' },
        { label: '简体中文', value: 'zh-CN' },
      ],
      placeholders: {
        externalOpenness: '选择一个选项',
        focus: '选择一个关注点',
        responseStyle: '选择一种风格',
        tone: '选择一种语气',
        language: '选择一种语言',
      },
    },
  },
}

const defaultCopy = APP_LANGUAGE_COPY[DEFAULT_APP_LANGUAGE]

const AppLanguageContext = createContext<{
  copy: AppLanguageCopy
  locale: AppLanguage
}>({
  copy: defaultCopy,
  locale: DEFAULT_APP_LANGUAGE,
})

export function AppLanguageProvider({
  children,
  locale,
}: {
  children: ReactNode
  locale: string | null | undefined
}) {
  const normalizedLocale = normalizeAppLanguage(locale)

  return (
    <AppLanguageContext.Provider
      value={{
        copy: APP_LANGUAGE_COPY[normalizedLocale],
        locale: normalizedLocale,
      }}
    >
      {children}
    </AppLanguageContext.Provider>
  )
}

export function useAppLanguage() {
  return useContext(AppLanguageContext)
}
