# Dona Flora — Agent Context

## Produto

Dona Flora é uma biblioteca pessoal local-first com IA. Os livros vivem em arquivos Markdown, editáveis em Obsidian, VS Code ou qualquer editor. O app oferece uma interface web para catalogar, filtrar, editar em massa, acompanhar trilhas de leitura e conversar com uma bibliotecária de IA que conhece o acervo.

Valor central: **o bibliotecário pessoal que você nunca teve**.

## Stack Atual

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Better Auth
- SQLite local para contas, sessões e preferências
- Markdown + YAML frontmatter para livros
- Vercel AI SDK 6
- Providers configuráveis: Ollama, OpenAI, Anthropic, OpenRouter e OpenAI-compatible
- Google Books e Open Library como lookup opcional de metadados

## Princípios

- Markdown é a fonte de verdade dos livros.
- SQLite guarda dados operacionais do app, não substitui o acervo.
- Recursos externos são opcionais.
- O chat deve funcionar com provider local quando configurado.
- Não reescrever acervos em lote sem ação explícita do usuário.
- Não commitar `.env.local`, `data/`, banco SQLite, cache de capas ou arquivos pessoais de vault.

## Estrutura Importante

- `src/lib/books/`: schema, parsing, escrita e consulta dos livros.
- `src/lib/library/`: contexto usado pela Dona Flora e watcher local.
- `src/lib/ai/`: resolução de provider/modelo e prompt de sistema.
- `src/lib/auth/`: Better Auth, SQLite, settings e identidade local.
- `src/components/chat/`: experiência de conversa.
- `src/app/trails/` e `src/lib/trails/`: trilhas de leitura salvas pelo chat.
- `src/components/account/settings-form.tsx`: configuração de biblioteca, IA e recursos opcionais.
- `scripts/migrate-isbn-frontmatter.mjs`: migração manual de ISBN com dry-run.

## Workflow

Antes de mudanças grandes, entender o contexto pelo código e pelos artefatos `.planning/` quando existirem. Preferir patches pequenos, reversíveis e testados.

Verificações principais:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## GSD

Este projeto usa GSD como camada de planejamento. Quando disponível, use os comandos GSD para iniciar ou retomar fases. Se a ferramenta local não estiver disponível, registre a limitação e siga com mudanças pequenas e verificáveis.
