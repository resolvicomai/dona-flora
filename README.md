# Dona Flora

**Dona Flora é uma biblioteca pessoal local-first com uma bibliotecária de IA que conversa com o seu acervo.**

Ela organiza livros físicos em arquivos Markdown, mantém esses arquivos legíveis no Obsidian ou em qualquer editor, e usa o contexto da sua própria biblioteca para responder perguntas, sugerir leituras e lembrar do que você já catalogou.

O ponto não é só ter um catálogo bonito. É ter uma Dona Flora que entende seus livros, suas notas, seus highlights, seus estados de leitura e seu jeito de perguntar.

## Por Que Dona Flora

O nome conversa com uma Dona Flora real ligada à Biblioteca Rio-Grandense. A biografia **Dona Flora e a biblioteca Rio-Grandense**, de Luci de Castro Oliveira, apresenta uma professora que esteve à frente da biblioteca por cerca de trinta anos, cuidando e enriquecendo um acervo histórico com presença, memória e paixão.

A aplicação não tenta representar essa pessoa literalmente. A inspiração é a figura da bibliotecária com memória: alguém que conhece o acervo, respeita o contexto e ajuda o leitor a se orientar sem pressa.

[Ler a referência](https://editoratelha.com.br/product/dona-flora-e-a-biblioteca-rio-grandense/)

## Quem Construiu

Dona Flora é um experimento open source e local-first da [Resolvi com AI](https://resolvicomai.app).

A proposta é mostrar um caminho para agentes pessoais úteis: dados do usuário no centro, IA configurável, contexto explícito e uma interface que não trate biblioteca pessoal como planilha disfarçada.

## O Que Ela Faz

- Usa Markdown como fonte de verdade dos livros.
- Conecta uma pasta local ou do Obsidian por usuário.
- Cataloga por busca manual, ISBN ou título.
- Busca metadados em Google Books e Open Library, com fallback de capa.
- Guarda capas em cache local autenticado e gera placeholder quando necessário.
- Permite seleção múltipla e edição em massa.
- Salva trilhas de leitura sugeridas no chat e acompanha progresso em `Trilhas`.
- Lê highlights em Markdown e leva trechos relevantes para o chat.
- Conversa com contexto real do acervo, não com recomendações genéricas.
- Usa Ollama local por padrão e aceita OpenAI, Anthropic, OpenRouter ou provider compatível com OpenAI.
- Mantém fallback externo e importação por foto como recursos opcionais.
- Funciona com login offline por usuário e senha.

## Como Os Dados Ficam

Os livros vivem em arquivos `.md`.

```markdown
---
title: O Peso da Gloria
author:
  - C. S. Lewis
status: quero-ler
rating: 5
tags:
  - ensaios
  - cristianismo
---

## Notas

Minha anotação livre.

## Highlights

- p.42: "Trecho literal" - minha nota
```

O banco SQLite local guarda conta, sessão, preferências, chats, cache e configurações. A pasta de livros continua sendo sua: pode ficar no Obsidian, iCloud Drive, Dropbox, Git ou onde fizer sentido no seu computador.

## Rodar Localmente

Requisitos:

- Node.js 22+
- npm
- Opcional: Ollama rodando em `http://127.0.0.1:11434/v1`

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Primeiro Uso

1. Crie uma conta local com usuário e senha.
2. Abra `Settings -> Pasta dos livros`.
3. Escolha a pasta onde os Markdown vivem.
4. Abra `Settings -> Dona Flora`.
5. Teste seu provider e escolha um modelo.
6. Adicione ou revise livros.
7. Abra o chat e pergunte algo sobre seu acervo.
8. Quando a Dona Flora sugerir uma sequência de leitura, salve a trilha e acompanhe em `Trilhas`.

No navegador puro não existe acesso irrestrito ao filesystem como num app nativo. Por isso a tela de pasta oferece navegação local server-side quando o app está rodando no seu Mac, além de aceitar caminho absoluto.

## IA Local E Providers

O padrão recomendado é Ollama local:

```bash
http://127.0.0.1:11434/v1
qwen3.6:27b
```

Também é possível configurar:

- OpenAI
- Anthropic
- OpenRouter
- OpenAI-compatible, como LM Studio, LocalAI, vLLM ou servidores próprios

As chaves ficam criptografadas no SQLite local usando o segredo da instalação. A UI mostra apenas se a chave está configurada; ela nunca retorna a chave em claro para o cliente.

## Biblioteca E Obsidian

Em `Settings -> Pasta dos livros`, aponte para a pasta que contém seus `.md`.

Exemplo:

```bash
/Users/seu-usuario/Obsidian/livros
```

Se você editar um arquivo no Obsidian, a Dona Flora relê a biblioteca quando o chat precisa de contexto. Para refresh automático durante desenvolvimento/local:

```bash
DONA_FLORA_LIBRARY_WATCH=1 npm run dev
```

O watcher fica desligado por padrão para evitar comportamento inesperado em deploys e ambientes serverless.

## Metadados De Livros

O fluxo de adicionar livro procura nesta ordem:

1. Google Books por ISBN ou título.
2. Open Library por ISBN ou título.
3. Fallback de capa da Amazon por ISBN-10/ASIN validado por `HEAD`, sem scraping.

Quando nada disso resolve, o cadastro manual continua visível. Isso é intencional: bibliotecas reais têm edições raras, livros antigos e capas que API nenhuma conhece.

## Trilhas De Leitura

Quando você pede uma sequência no chat, a Dona Flora pode montar uma trilha com livros do seu acervo. Ao salvar, ela aparece em `Trilhas`.

Cada trilha tem:

- Nome e objetivo editáveis.
- Notas livres.
- Botão de excluir.
- Progresso calculado pelo status real dos livros.

Não existe checklist paralelo: para acompanhar, abra o livro e mude o status para `lendo` ou `lido`. A trilha reflete esse estado automaticamente.

## Migração De ISBN

O schema aceita `isbn` legado e os campos novos `isbn_10` e `isbn_13`.

Dry-run:

```bash
npm run migrate:isbn -- --dir "/caminho/para/livros" --dry-run
```

Aplicar:

```bash
npm run migrate:isbn -- --dir "/caminho/para/livros" --write
```

A migração não roda automaticamente para evitar reescrever acervos sem intenção.

## Docker

```bash
docker compose up --build
```

O compose usa um volume Docker para dados internos. Se quiser conectar uma pasta do Obsidian do host dentro do container, monte essa pasta manualmente e aponte `LIBRARY_DIR` ou configure o caminho equivalente na UI.

## Variáveis Úteis

- `BETTER_AUTH_URL`: URL pública/local do app.
- `BETTER_AUTH_SECRET`: segredo da instalação. Gere um valor forte antes de uso real.
- `DATA_DIR`: onde SQLite, chats, trilhas e cache vivem.
- `LIBRARY_DIR`: fallback opcional para a pasta de livros antes da configuração por usuário.
- `GOOGLE_BOOKS_API_KEY`: chave opcional para Google Books.
- `DONA_FLORA_LIBRARY_WATCH`: `1` para ativar watcher local.

## Qualidade

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Antes De Publicar Um Fork

Não envie:

- `.env.local`
- `data/`
- banco SQLite
- cache de capas
- arquivos pessoais do Obsidian
- instruções locais de agente, como `AGENTS.md`

## Licença

MIT.
