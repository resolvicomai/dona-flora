import type { AIPrimaryProvider } from '@/lib/auth/db'
import type { SettingsPanel } from './types'

export const SETTINGS_PANELS: Array<{
  body: string
  eyebrow: string
  id: SettingsPanel
  title: string
}> = [
  {
    body: 'Tom, idioma e como ela responde.',
    eyebrow: '01',
    id: 'preferences',
    title: 'Personalidade',
  },
  {
    body: 'Onde vivem os Markdown dos livros.',
    eyebrow: '02',
    id: 'library',
    title: 'Livros',
  },
  {
    body: 'Local, OpenAI, Anthropic ou compatível.',
    eyebrow: '03',
    id: 'local-ai',
    title: 'Provedor',
  },
  {
    body: 'Fallback e visão por foto, só se quiser.',
    eyebrow: '04',
    id: 'external-ai',
    title: 'Recursos externos',
  },
]

export const AI_PROVIDER_OPTIONS: Array<{
  body: string
  id: AIPrimaryProvider
  label: string
  meta: string
}> = [
  {
    body: 'Roda no seu Mac. Ideal para uso 100% local.',
    id: 'ollama',
    label: 'Ollama local',
    meta: 'sem chave',
  },
  {
    body: 'Usa sua chave da OpenAI direto no app local.',
    id: 'openai',
    label: 'OpenAI',
    meta: 'BYOK',
  },
  {
    body: 'Usa seu token da Anthropic direto no app local.',
    id: 'anthropic',
    label: 'Anthropic',
    meta: 'BYOK',
  },
  {
    body: 'Roteador externo opcional para vários modelos.',
    id: 'openrouter',
    label: 'OpenRouter',
    meta: 'BYOK',
  },
  {
    body: 'LM Studio, LocalAI, vLLM ou qualquer /v1 compatível.',
    id: 'openai-compatible',
    label: 'Compatível OpenAI',
    meta: 'local/custom',
  },
]
