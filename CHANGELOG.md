# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e este projeto usa versionamento semântico enquanto fizer sentido para a fase beta.

## [Não publicado]

### Corrigido

- **Chat:** mensagem do usuário agora aparece no instante do envio. Eliminada a corrida entre o estado local de `useChat`, polling de leitura no servidor, hidratação no `onFinish` e o reset por `chatId` que apagavam a draft otimista. `chat-main.tsx` é hoje a fonte única de verdade da lista de mensagens (−95 linhas líquidas, 6 commits atômicos).
- **Chat:** "Nova conversa" estando em `/chat` deixa de fazer reload da página inteira. Em vez disso, um evento custom dispara um remount do `ChatMain` via `key`, sem perder scroll nem piscar layout.
- **Books / Trails:** `alert()` nativo em deletar livro e deletar trilha substituído por erro inline com `role="alert"` no próprio AlertDialog.
- **Settings / Profile / Trails / dev-link:** todos os `await fetch` em handlers de save ganharam guarda de rede — antes uma falha de transporte deixava o spinner travado e o botão desabilitado.
- **i18n:** toolbar de seleção em massa de livros e radio de preferência de recomendação no chat estavam hardcoded em pt-BR e agora respeitam o idioma ativo (pt-BR / en / es / zh-CN).
- **Mobile foundation:** export de `viewport` com `viewport-fit: cover` ativa `env(safe-area-inset-*)` no iOS (estavam silenciosamente em zero); `min-h-dvh` no shell elimina o salto da barra de endereço em Safari/Chrome iOS.
- **Mobile chat:** novo hook `useVirtualKeyboard` lê `window.visualViewport` e levanta o composer acima do teclado virtual em iOS. Bubbles deixaram de vazar horizontalmente em portrait. Inputs com font-size <16px que disparavam auto-zoom no Safari foram normalizados. Auto-scroll do `MessageList` se reanima em transições de teclado.
- **Mobile shell:** breakpoint da sidebar/drawer do chat caiu de `xl:` (1280px) para `lg:` (1024px), então tablets entre 768–1279px passam a ter navegação. `Dialog` e `AlertDialog` ganharam `max-h-[calc(100dvh-2rem)] overflow-y-auto` — formulários longos não somem mais abaixo do fold em iPhone portrait.
- **Mobile pages:** TopNav esconde Theme + Language em `<md:` (continuam acessíveis via `/settings`); summary card da biblioteca passa de `text-5xl` para responsive; cards de trilha encolhem em `<sm:`; settings vira tabs horizontais com scroll em `<lg:` em vez de empilhar quatro cards verticais antes do conteúdo.

### Mudado

- `chat-main.tsx` (orquestrador do chat): refator estrutural removendo polling de leitura, `applyPersistedChatPayload`, `hydratePersistedChat`, `remoteGenerationStatus` (3-state) e o effect de reset redundante. `useChat` é a única fonte de verdade da lista; o servidor é canônico apenas em refresh.
- IDs de draft de mensagem usam `crypto.randomUUID()` reaproveitado em `sendMessage({ messageId })` para que o reconciliador do AI SDK v6 substitua a draft em vez de duplicá-la.

### Removido

- Componente `SegmentedRouteToggle` (sem importadores, copy hardcoded em pt-BR) — a navegação real vive em `TopNav`.
- 16 erros de TypeScript pré-existentes em fixtures de teste; `tsc --noEmit` exit clean.

### Comportamento aceito como regressão consciente

- Refresh durante streaming de chat: o cliente não retoma o stream em curso; mostra typing-dots se o servidor reportou `generating` e oferece retry. Mesmo padrão do ChatGPT.
- Multi-tab live mirror: a tab B só vê a conversa da tab A após refresh manual.

## [0.1.0] - 2026-04-30

### Adicionado

- Biblioteca pessoal local-first com livros em Markdown.
- Configuração de pasta de livros por usuário, incluindo pastas Obsidian.
- Login local com múltiplos usuários.
- Chat persistente com memória local.
- Provider de IA configurável com Ollama, OpenAI, Anthropic, OpenRouter e endpoints OpenAI-compatible.
- Busca de metadados por ISBN/título com Google Books, Open Library e fallback de capa.
- Schema rico para livros, incluindo subtítulo, editora, tradutor, tags, série, prioridade, progresso e ISBN 10/13.
- Cache local de capas e placeholder determinístico.
- Edição em massa de livros.
- Trilhas de leitura salvas localmente.
- Highlights extraídos do Markdown para contexto da IA.
- CI público com lint, testes e build.
- Documentação inicial para instalação, segurança e contribuição.

### Segurança

- `.env` e variantes são ignorados por padrão.
- `docker-compose.yml` exige `BETTER_AUTH_SECRET` explícito.
- Chaves externas opcionais são tratadas como segredo local.
