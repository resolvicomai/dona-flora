# Dona Flora

**Uma biblioteca pessoal local-first, escrita em Markdown, com uma bibliotecária de IA que conversa com o seu acervo.**

Dona Flora é para quem tem livros físicos, notas espalhadas, vontade de ler melhor e uma certa intuição de que a própria biblioteca deveria conversar de volta.

Ela organiza livros em arquivos `.md`, funciona bem com Obsidian, guarda seus dados localmente e usa IA configurável para responder perguntas sobre o seu acervo real: livros lidos, livros na fila, notas, highlights, trilhas e preferências.

> O catálogo é só o começo. O centro da Dona Flora é a bibliotecária: uma agente pessoal que conhece seus livros e ajuda você a se orientar dentro deles.

## Por Que Existe

Bibliotecas pessoais costumam virar uma destas três coisas:

- uma planilha que ninguém quer abrir;
- uma estante bonita que a memória não acompanha;
- uma pilha de notas soltas que a IA genérica nunca viu.

A Dona Flora tenta outro caminho: seus livros continuam em arquivos simples, legíveis por humanos, mas ganham uma interface boa e uma camada conversacional que entende contexto.

Ela não quer substituir o Obsidian, nem prender seus dados em um banco opaco. Ela quer ser uma casa de leitura em cima de arquivos que continuam seus.

## Por Que "Dona Flora"

O nome conversa com uma Dona Flora real ligada à Biblioteca Rio-Grandense. A biografia **Dona Flora e a biblioteca Rio-Grandense**, de Luci de Castro Oliveira, apresenta uma professora que esteve à frente da biblioteca por cerca de trinta anos, cuidando e enriquecendo um acervo histórico com presença, memória e paixão.

A aplicação não tenta representar essa pessoa literalmente. A inspiração é a figura da bibliotecária com memória: alguém que conhece o acervo, respeita o contexto e ajuda o leitor a se orientar sem pressa.

[Ler a referência](https://editoratelha.com.br/product/dona-flora-e-a-biblioteca-rio-grandense/)

## Quem Construiu

Dona Flora é um experimento open source e local-first da [Resolvi com AI](https://resolvicomai.app).

A ideia é explorar um tipo de agente pessoal que começa do jeito certo: dados do usuário no centro, contexto explícito, IA configurável, fallback local e uma interface que não trate biblioteca pessoal como planilha disfarçada.

## O Que Ela Faz

- **Markdown como fonte de verdade:** cada livro é um arquivo `.md` simples.
- **Obsidian-friendly:** você pode apontar para uma pasta do seu vault.
- **Local-first:** conta, chats, trilhas, cache e preferências vivem no SQLite local.
- **IA local por padrão:** Ollama é o caminho principal; provedores externos são opcionais.
- **Providers flexíveis:** Ollama, OpenAI, Anthropic, OpenRouter e endpoints OpenAI-compatible.
- **Busca por metadados:** Google Books, Open Library e fallback de capa sem scraping.
- **Catalogação manual sem atrito:** quando API nenhuma conhece sua edição rara, você ainda consegue cadastrar.
- **Schema rico:** subtítulo, editora, tradutor, tags, série, prioridade, progresso, ISBN 10/13 e fonte da sinopse.
- **Capas resilientes:** cache local autenticado e placeholder gerado quando a capa não existe.
- **Edição em massa:** selecione vários livros e altere status, nota ou campos comuns.
- **Highlights para IA:** a seção `## Highlights` entra no contexto da conversa.
- **Trilhas de leitura:** salve sequências sugeridas pela Dona Flora e acompanhe pelo status real dos livros.
- **Chat com memória:** conversas persistem localmente e usam seu acervo como contexto.
- **Login offline:** múltiplos usuários locais com usuário e senha, sem depender de e-mail.

## Como Os Dados Ficam

Os livros vivem em arquivos Markdown.

```markdown
---
title: O Peso da Glória
author:
  - C. S. Lewis
translator: Paulo Mendes Campos
publisher: Thomas Nelson Brasil
status: quero-ler
rating: 5
tags:
  - ensaios
  - cristianismo
synopsis_source: manual
---

## Notas

Minha anotação livre sobre o livro.

## Highlights

- p.42: "Um trecho importante" - minha nota sobre ele
- "Um destaque sem página também funciona"
```

O corpo do arquivo é sua área livre de notas. A Dona Flora preserva o Markdown e usa o frontmatter como metadado estruturado.

## Onde Cada Coisa Vive

| Dado | Onde fica |
| --- | --- |
| Livros | Pasta Markdown escolhida por usuário |
| Notas dos livros | Corpo do próprio `.md` |
| Conta local | SQLite em `DATA_DIR` |
| Chats | Arquivos locais por usuário |
| Trilhas | Arquivos locais por usuário |
| Cache de capas | App data local por usuário |
| Chaves opcionais | SQLite local, criptografadas com `BETTER_AUTH_SECRET` |

Nada disso precisa ir para a nuvem para o app funcionar.

## Instalação Rápida

Requisitos:

- Node.js 22+
- npm
- Opcional: [Ollama](https://ollama.com/) para chat local

```bash
git clone https://github.com/resolvicomai/dona-flora.git
cd dona-flora
npm install
cp .env.example .env.local
npm run dev
```

Abra o endereço que aparecer no terminal, normalmente:

```bash
http://localhost:3000
```

## Primeiro Uso

1. Crie um usuário local com nome, usuário e senha.
2. Abra `Ajustes -> Pasta dos livros`.
3. Escolha a pasta onde seus Markdown vivem.
4. Abra `Ajustes -> Provedor da Dona Flora`.
5. Teste o Ollama ou configure outro provider.
6. Adicione livros manualmente, por ISBN ou por título.
7. Abra o chat e pergunte algo sobre seu acervo.
8. Se a Dona Flora sugerir uma trilha, salve e acompanhe em `Trilhas`.

No navegador puro não existe acesso irrestrito ao filesystem como em app nativo. Por isso a escolha de pasta acontece pelo app local rodando no seu computador, com navegação server-side e validação de caminho.

## Usando Com Obsidian

Em `Ajustes -> Pasta dos livros`, escolha uma pasta que contenha arquivos `.md`.

Exemplo genérico:

```bash
/Users/seu-usuario/Obsidian/livros
```

Se você editar um livro no Obsidian, a Dona Flora relê os arquivos quando precisa montar contexto para busca/chat.

Para refresh automático durante uso local:

```bash
DONA_FLORA_LIBRARY_WATCH=1 npm run dev
```

O watcher fica desligado por padrão para evitar comportamento inesperado em deploys, containers e ambientes serverless.

## IA Local E Providers

O caminho recomendado é começar com Ollama.

1. Instale o Ollama.
2. Baixe um modelo.
3. Abra os ajustes da Dona Flora.
4. Clique em testar conexão.
5. Escolha um modelo listado.

Exemplo:

```bash
ollama pull llama3.1:8b
npm run dev
```

Endpoint padrão:

```bash
http://127.0.0.1:11434/v1
```

Também dá para usar:

- OpenAI
- Anthropic
- OpenRouter
- LM Studio
- LocalAI
- vLLM
- qualquer servidor OpenAI-compatible

Provedores externos são opcionais. Se você quiser 100% local, use apenas Ollama ou outro provider local compatível.

## Busca De Metadados

Ao adicionar um livro, a Dona Flora tenta preencher metadados nesta ordem:

1. Google Books por ISBN ou título.
2. Open Library por ISBN ou título.
3. Fallback de capa por ISBN-10/ASIN validado por `HEAD`, sem scraping.

Quando nada resolve, o cadastro manual continua disponível. Isso é parte do design: bibliotecas reais têm edição antiga, clube de leitura, importados, sebos, capas raras e livros que API nenhuma conhece.

## Trilhas De Leitura

Você pode pedir algo como:

```text
Monte uma trilha com 5 livros para eu entender melhor tecnologia, poder e sociedade.
```

Quando a Dona Flora sugerir uma sequência, você pode salvar a trilha.

Cada trilha tem:

- título editável;
- objetivo editável;
- notas livres;
- exclusão;
- progresso calculado pelo status real dos livros.

Não existe checklist paralelo: para acompanhar, abra um livro e mude o status para `lendo` ou `lido`. A trilha reflete isso automaticamente.

## Highlights

Se o livro tiver uma seção assim:

```markdown
## Highlights

- p.42: "Texto literal" - minha nota
- p.108: "Outro trecho"
- "Sem página também funciona"
```

A Dona Flora extrai os destaques e inclui uma versão compacta no contexto do chat. Isso ajuda a conversa a sair de recomendações genéricas e entrar no que realmente te marcou.

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

## Variáveis De Ambiente

Copie `.env.example` para `.env.local` e ajuste só o que precisar.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `BETTER_AUTH_URL` | Sim | URL local/pública do app |
| `BETTER_AUTH_SECRET` | Recomendado | Segredo para sessão e criptografia local |
| `DATA_DIR` | Não | Pasta de SQLite, chats, trilhas e cache |
| `LIBRARY_DIR` | Não | Fallback inicial para livros antes da UI |
| `GOOGLE_BOOKS_API_KEY` | Não | Chave opcional para Google Books |
| `DONA_FLORA_LIBRARY_WATCH` | Não | `1` ativa refresh automático local |

Gere um segredo forte:

```bash
openssl rand -base64 32
```

## Scripts

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # iniciar build de produção
npm run lint         # lint
npm test -- --runInBand
npm run migrate:isbn -- --help
```

## Arquitetura

```text
Next.js App Router
├─ UI em React
├─ API routes para livros, chat, settings e capas
├─ Markdown como banco dos livros
├─ SQLite local para usuários, preferências e segredos
├─ Vercel AI SDK para providers
└─ Ollama/OpenAI/Anthropic/OpenRouter/OpenAI-compatible
```

Decisões importantes:

- livros não ficam presos no SQLite;
- Markdown continua editável fora do app;
- providers externos são opcionais;
- cache e sessões são locais;
- multiusuário local separa acervo, chats e preferências;
- importação por foto é opt-in e depende de provider externo configurado.

## Segurança E Privacidade

Antes de publicar ou fazer fork, confira:

- não envie `.env.local`;
- não envie `data/`;
- não envie banco SQLite;
- não envie cache de capas;
- não envie sua pasta do Obsidian;
- não envie instruções locais de agente, como `AGENTS.md`;
- não coloque chave de API em issue, print ou README.

As chaves opcionais são criptografadas localmente com segredo derivado de `BETTER_AUTH_SECRET`. Em desenvolvimento sem secret configurado, o app usa um fallback local, mas para uso real você deve definir o secret.

## Status Do Projeto

Dona Flora está em fase **beta local-first**.

Bom para:

- rodar localmente;
- catalogar acervo pessoal;
- usar com Obsidian;
- conversar com IA local;
- experimentar agentes pessoais com dados próprios.

Ainda merece evolução em:

- empacotamento desktop;
- instalação guiada para usuários não técnicos;
- importação por foto mais polida;
- sincronização entre dispositivos;
- testes de uso em bibliotecas maiores.

## Contribuindo

Contribuições são bem-vindas, principalmente em:

- UX de onboarding;
- acessibilidade;
- suporte a formatos de Markdown;
- metadados de livros brasileiros;
- providers locais;
- testes e documentação;
- empacotamento para desktop.

Antes de abrir PR:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Créditos

Criado por [Mauro Marques Filho](https://github.com/resolvicomai) e [Resolvi com AI](https://resolvicomai.app).

Inspirado pela ideia de que uma biblioteca pessoal não é apenas uma lista de livros. É memória, intenção, conversa e caminho.

## Licença

MIT.
