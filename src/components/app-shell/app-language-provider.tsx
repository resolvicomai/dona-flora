'use client'

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { useLocalStorage } from '@/lib/use-local-storage'

import {
  APP_LANGUAGE_STORAGE_KEY,
  DEFAULT_APP_LANGUAGE,
  normalizeAppLanguage,
  resolveHtmlLang,
  SUPPORTED_APP_LANGUAGES,
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
    trails: string
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
      trails: 'Trilhas',
    },
    shell: {
      accountBody: 'Acesso, recuperação e privacidade',
      accountLabel: 'Conta',
      aiBody: 'Tom, foco e idioma salvos',
      aiLabel: 'IA',
      eyebrow: 'Biblioteca pessoal',
      headline: 'Seu espaço de leitura, memória e conversa.',
      intro:
        'Organize o acervo, converse com a Dona Flora e mantenha tudo no seu próprio espaço.',
      libraryBody: 'Acervo próprio por conta',
      libraryLabel: 'Acervo',
      brandSubtitle: 'Biblioteca pessoal',
    },
    auth: {
      common: {
        emailLabel: 'Usuário',
        emailPlaceholder: 'leitor-local',
        nameLabel: 'Nome',
        namePlaceholder: 'Como você quer aparecer',
        passwordLabel: 'Senha',
        passwordPlaceholder: 'Sua senha',
      },
      forgotPassword: {
        emailLabel: 'Usuário',
        emailPlaceholder: 'leitor-local',
        error: 'Não foi possível gerar o link.',
        link: 'Esqueci minha senha',
        localLinkNote:
          'Link local pronto. Ele vale só para esta instalação da Dona Flora.',
        localLinkTitle: 'Abrir link local de redefinição',
        sending: 'Gerando…',
        success: 'Se esse usuário existir, o link de redefinição fica pronto aqui.',
        submit: 'Gerar link de redefinição',
      },
      resetPassword: {
        confirmPasswordLabel: 'Confirmar nova senha',
        confirmPasswordPlaceholder: 'Repita a nova senha',
        error: 'Não foi possível redefinir a senha.',
        invalidLink: 'O link de redefinição está incompleto ou expirou.',
        link: 'Pedir um novo link',
        mismatch: 'As senhas não conferem.',
        newPasswordLabel: 'Nova senha',
        newPasswordPlaceholder: 'Escolha uma nova senha',
        submit: 'Salvar nova senha',
        updating: 'Atualizando…',
      },
      signIn: {
        createAccount: 'Criar conta',
        emailLabel: 'Usuário',
        emailPlaceholder: 'leitor-local',
        error: 'Não foi possível entrar.',
        forgotPassword: 'Esqueci minha senha',
        passwordLabel: 'Senha',
        passwordPlaceholder: 'Sua senha',
        resetComplete:
          'Senha redefinida. Agora você já pode entrar com a nova credencial.',
        signIn: 'Entrar',
        signingIn: 'Entrando…',
      },
      signUp: {
        accountLink: 'Entrar',
        accountPrompt: 'Já tem conta?',
        confirmPasswordLabel: 'Confirmar senha',
        confirmPasswordPlaceholder: 'Repita a senha',
        creatingAccount: 'Criando conta…',
        emailLabel: 'Usuário',
        emailPlaceholder: 'leitor-local',
        error: 'Não foi possível criar a conta.',
        nameLabel: 'Nome',
        namePlaceholder: 'Como você quer aparecer',
        passwordLabel: 'Senha',
        passwordPlaceholder: 'Mínimo de 8 caracteres',
        passwordMismatch: 'As senhas não conferem.',
        submit: 'Criar conta',
      },
      verifyEmail: {
        createAnotherAccount: 'Criar outra conta',
        backToSignIn: 'Voltar para entrar',
        emailLabel: 'Usuário',
        emailPlaceholder: 'leitor-local',
        errorPrefix: 'Não foi possível validar a conta',
        goToLibrary: 'Ir para a biblioteca',
        info: 'Este app usa acesso local. Se esta tela aparecer, gere o link local abaixo e continue.',
        localLinkNote:
          'Link local pronto. Ele vale só para esta instalação da Dona Flora.',
        localLinkTitle: 'Abrir link local',
        otherAccount: 'Entrar em outra conta',
        preparingLocalLink: 'Preparando o link local…',
        resend: 'Gerar link local',
        resending: 'Gerando…',
        resendSubtitle: 'Link local gerado.',
        verified: 'Conta local validada. Sua biblioteca já está pronta.',
      },
    },
    settings: {
      additionalInstructionsLabel: 'Instruções adicionais',
      appLanguageLabel: 'Idioma do app',
      description:
        'Essas preferências entram no prompt-base da Dona Flora e moldam o jeito como ela conversa com você em toda nova sessão.',
      error: 'Não foi possível salvar as preferências.',
      externalOpennessLabel: 'Abertura a livros externos',
      focusLabel: 'Foco',
      save: 'Salvar preferências',
      saved: 'Preferências salvas.',
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
      trails: 'Trails',
    },
    shell: {
      accountBody: 'Access, recovery, and privacy',
      accountLabel: 'Account',
      aiBody: 'Saved tone, focus, and language',
      aiLabel: 'AI',
      eyebrow: 'Personal library',
      headline: 'Your space for reading, memory, and conversation.',
      intro:
        'Organize your library, talk with Dona Flora, and keep everything in your own space.',
      libraryBody: 'A private collection per account',
      libraryLabel: 'Collection',
      brandSubtitle: 'Personal library',
    },
    auth: {
      common: {
        emailLabel: 'Username',
        emailPlaceholder: 'local-reader',
        nameLabel: 'Name',
        namePlaceholder: 'How you want to appear',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Your password',
      },
      forgotPassword: {
        emailLabel: 'Username',
        emailPlaceholder: 'local-reader',
        error: 'We could not create the link.',
        link: 'Forgot password?',
        localLinkNote:
          'Local link ready. It only works in this Dona Flora installation.',
        localLinkTitle: 'Open local reset link',
        sending: 'Creating…',
        success: 'If this username exists, the reset link is ready here.',
        submit: 'Create reset link',
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
        emailLabel: 'Username',
        emailPlaceholder: 'local-reader',
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
        emailLabel: 'Username',
        emailPlaceholder: 'local-reader',
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
        emailLabel: 'Username',
        emailPlaceholder: 'local-reader',
        errorPrefix: 'We could not validate the account',
        goToLibrary: 'Go to the library',
        info: 'This app uses local access. If you see this screen, create the local link below and continue.',
        localLinkNote:
          'Local link ready. It only works in this Dona Flora installation.',
        localLinkTitle: 'Open local link',
        otherAccount: 'Sign in to another account',
        preparingLocalLink: 'Preparing local link…',
        resend: 'Create local link',
        resending: 'Creating…',
        resendSubtitle: 'Local link created.',
        verified: 'Local account validated. Your library is ready.',
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
      trails: 'Rutas',
    },
    shell: {
      accountBody: 'Acceso, recuperación y privacidad',
      accountLabel: 'Cuenta',
      aiBody: 'Tono, enfoque e idioma guardados',
      aiLabel: 'IA',
      eyebrow: 'Biblioteca personal',
      headline: 'Tu espacio para lectura, memoria y conversación.',
      intro:
        'Organiza tu biblioteca, conversa con Dona Flora y mantén todo en tu propio espacio.',
      libraryBody: 'Colección propia por cuenta',
      libraryLabel: 'Colección',
      brandSubtitle: 'Biblioteca personal',
    },
    auth: {
      common: {
        emailLabel: 'Usuario',
        emailPlaceholder: 'lector-local',
        nameLabel: 'Nombre',
        namePlaceholder: 'Cómo quieres aparecer',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: 'Tu contraseña',
      },
      forgotPassword: {
        emailLabel: 'Usuario',
        emailPlaceholder: 'lector-local',
        error: 'No pudimos crear el enlace.',
        link: '¿Olvidaste tu contraseña?',
        localLinkNote:
          'Enlace local listo. Solo funciona en esta instalación de Dona Flora.',
        localLinkTitle: 'Abrir enlace local de restablecimiento',
        sending: 'Creando…',
        success: 'Si este usuario existe, el enlace de restablecimiento queda listo aquí.',
        submit: 'Crear enlace de restablecimiento',
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
        emailLabel: 'Usuario',
        emailPlaceholder: 'lector-local',
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
        emailLabel: 'Usuario',
        emailPlaceholder: 'lector-local',
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
        emailLabel: 'Usuario',
        emailPlaceholder: 'lector-local',
        errorPrefix: 'No pudimos validar la cuenta',
        goToLibrary: 'Ir a la biblioteca',
        info: 'Esta app usa acceso local. Si ves esta pantalla, crea el enlace local abajo y continúa.',
        localLinkNote:
          'Enlace local listo. Solo funciona en esta instalación de Dona Flora.',
        localLinkTitle: 'Abrir enlace local',
        otherAccount: 'Entrar con otra cuenta',
        preparingLocalLink: 'Preparando el enlace local…',
        resend: 'Crear enlace local',
        resending: 'Creando…',
        resendSubtitle: 'Enlace local creado.',
        verified: 'Cuenta local validada. Tu biblioteca ya está lista.',
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
      trails: '路径',
    },
    shell: {
      accountBody: '访问、找回与隐私',
      accountLabel: '账户',
      aiBody: '已保存的语气、侧重与语言',
      aiLabel: 'AI',
      eyebrow: '个人书库',
      headline: '属于你的阅读、记忆与对话空间。',
      intro: '整理书库，与 Dona Flora 交流，并把一切保留在你自己的空间里。',
      libraryBody: '每个账户独立的收藏',
      libraryLabel: '收藏',
      brandSubtitle: '个人书库',
    },
    auth: {
      common: {
        emailLabel: '用户名',
        emailPlaceholder: 'local-reader',
        nameLabel: '姓名',
        namePlaceholder: '你想如何显示',
        passwordLabel: '密码',
        passwordPlaceholder: '你的密码',
      },
      forgotPassword: {
        emailLabel: '用户名',
        emailPlaceholder: 'local-reader',
        error: '我们无法创建链接。',
        link: '忘记密码？',
        localLinkNote: '本地链接已准备好，仅适用于此 Dona Flora 安装。',
        localLinkTitle: '打开本地重置链接',
        sending: '创建中…',
        success: '如果该用户名存在，重置链接会在这里准备好。',
        submit: '创建重置链接',
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
        emailLabel: '用户名',
        emailPlaceholder: 'local-reader',
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
        emailLabel: '用户名',
        emailPlaceholder: 'local-reader',
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
        emailLabel: '用户名',
        emailPlaceholder: 'local-reader',
        errorPrefix: '我们无法验证账户',
        goToLibrary: '前往书库',
        info: '此应用使用本地访问。如果看到此页面，请在下方创建本地链接后继续。',
        localLinkNote: '本地链接已准备好，仅适用于此 Dona Flora 安装。',
        localLinkTitle: '打开本地链接',
        otherAccount: '切换到其他账户登录',
        preparingLocalLink: '正在准备本地链接…',
        resend: '创建本地链接',
        resending: '创建中…',
        resendSubtitle: '本地链接已创建。',
        verified: '本地账户已验证。你的书库已准备好。',
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
  setLocale: (locale: AppLanguage) => void
}>({
  copy: defaultCopy,
  locale: DEFAULT_APP_LANGUAGE,
  setLocale: () => undefined,
})

export function AppLanguageProvider({
  children,
  locale,
}: {
  children: ReactNode
  locale: string | null | undefined
}) {
  const pathname = usePathname()
  const normalizedLocale = normalizeAppLanguage(locale)
  const [storedLocale, setStoredLocale] = useLocalStorage(
    APP_LANGUAGE_STORAGE_KEY,
    normalizedLocale,
    SUPPORTED_APP_LANGUAGES,
  )
  const isAuthRoute =
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email'
  const activeLocale = isAuthRoute ? storedLocale : normalizedLocale

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.lang = resolveHtmlLang(activeLocale)
  }, [activeLocale])

  return (
    <AppLanguageContext.Provider
      value={{
        copy: APP_LANGUAGE_COPY[activeLocale],
        locale: activeLocale,
        setLocale: (nextLocale) => {
          setStoredLocale(nextLocale)
        },
      }}
    >
      {children}
    </AppLanguageContext.Provider>
  )
}

export function useAppLanguage() {
  return useContext(AppLanguageContext)
}
