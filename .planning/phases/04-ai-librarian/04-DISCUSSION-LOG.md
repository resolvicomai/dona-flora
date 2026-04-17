# Phase 4: AI Librarian - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisões ficam em CONTEXT.md — este log preserva as alternativas consideradas.

**Date:** 2026-04-17
**Phase:** 04-ai-librarian
**Areas discussed:** Superfície e ciclo do chat, Escopo de ações do agente, Persistência de conversa e trilha, Guardrails anti-alucinação

---

## Superfície e ciclo do chat

### Onde o chat vive?

| Option | Description | Selected |
|--------|-------------|----------|
| Página dedicada `/chat` | Rota própria, tela inteira | ✓ |
| Drawer lateral persistente | Painel que desliza, coexiste com browse | |
| Modal full-screen | Botão abre modal que toma tela | |
| FAB + drawer | Botão flutuante tipo Intercom | |

### Estado inicial do chat

| Option | Description | Selected |
|--------|-------------|----------|
| Empty + sugestões contextuais | 3-4 prompts sugeridos | |
| Welcome message do bibliotecário | Mensagem de boas-vindas com contagem da biblioteca | ✓ |
| Em branco, sem sugestões | Input vazio, mínimo | |

### Entrada principal

| Option | Description | Selected |
|--------|-------------|----------|
| Ícone no header (💬 ou Sparkles) | Botão pequeno ao lado de "Adicionar livro" | ✓ |
| Botão grande "Pergunte à Dona Flora" | Label pt-BR destacado no header | |
| Link no nav/menu | Item de navegação formal | |

### Atalho contextual em `/books/[slug]`

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, botão "Conversar sobre este livro" | Leva ao /chat com contexto pré-preenchido | ✓ |
| Não, só pelo chat principal | Usuário digita para encontrar | |
| Ambos | Botão + referência livre | |

---

## Escopo de ações do agente

### Pode agir na biblioteca?

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only — só conversa | Sem tools de escrita | ✓ |
| Tools de ação COM confirmação | Sugere, usuário confirma | |
| Tools automáticas | Age direto baseado no contexto | |

### Formato das recomendações

| Option | Description | Selected |
|--------|-------------|----------|
| Links clicáveis nas mensagens | Markdown links para /books/{slug} | |
| Cards inline de livro | Capa+título+autor renderizado inline | ✓ |
| Só texto, sem link | Menciona sem navegação | |

---

## Persistência de conversa e trilha

### Conversas são persistidas?

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, como .md editável (Obsidian) | `data/chats/{timestamp}-{slug}.md` | ✓ |
| Sim, mas só no browser (localStorage) | Cross-session no browser, sem export | |
| Não, efêmeras por sessão | Refresh = nova conversa | |

### Formato da trilha de leitura (AI-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Artefato `.md` em `data/trails/{slug}.md` | Frontmatter + ordem + progresso | ✓ |
| Lista inline na mensagem | Só texto numerado no chat | |
| Lista inline + botão "Salvar trilha" | Híbrido usuário-controlado | |

### Como voltar a conversa antiga?

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar/drawer com lista de conversas | Padrão tipo ChatGPT | ✓ |
| Só via arquivos no Obsidian | Fora do app | |
| Lista compacta no topo | Dropdown "Conversas anteriores" | |

---

## Guardrails anti-alucinação (AI-08)

### Como impedir recomendação de livro inventado?

| Option | Description | Selected |
|--------|-------------|----------|
| System prompt + contexto completo + validação pós-resposta | Robusto, mais código | ✓ |
| Só system prompt + contexto forte | Confia no modelo | |
| Tool-call obrigatório para referenciar | Mais estrito, contradiz read-only | |

### Tratamento de menção a livro

| Option | Description | Selected |
|--------|-------------|----------|
| Linkar ao slug real + card inline | Card inline para livros da biblioteca | ✓ |
| Card inline somente se existir | Silencia menções não-casadas | |
| Texto sempre, link quando existe | Hyperlink simples | |

### Livros fora da biblioteca

| Option | Description | Selected |
|--------|-------------|----------|
| Recusar e sugerir alternativa | Estrito, AI-08 literal | |
| Responder com aviso + sugerir adicionar | Flexível, mistura fontes | |
| Recusar firme | "Só falo da sua biblioteca" | |
| **Other (user freeform)** | "deve falar de tudo mas com foco no que está na biblioteca, nada deve impedir o usuário de descobrir novos livros por exemplo" | ✓ |

**User's note:** Descoberta de novos livros é parte do valor — não bloquear menção externa. Foco continua na biblioteca, livros externos são sugestões complementares com marcação visual distinta. Isso **reinterpreta AI-08** de "só recomendar da biblioteca" para "priorizar a biblioteca, diferenciar visualmente, nunca inventar livros (títulos/autores fictícios)".

---

## Claude's Discretion

- Formato exato do frontmatter YAML de chats/trilhas
- Algoritmo de geração de título da conversa
- Trigger para criação automática de trilha vs comando explícito
- Tom/voz do bibliotecário ("Dona Flora" com persona?)
- Two-tier context strategy (ativação e estratégia de resumo)

## Deferred Ideas

- Voz/áudio
- Análise quantitativa de hábitos de leitura
- Compartilhamento/exportação de trilhas
- UI de progresso em trilhas (tachar livros conforme lê)
- Integração com Goodreads (já em Out of Scope)
