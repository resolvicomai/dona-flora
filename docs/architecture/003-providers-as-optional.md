# ADR 003: Providers Externos Como Opcionais

## Status

Aceito.

## Contexto

O valor do produto está na bibliotecária conversando com o acervo do usuário. Essa conversa pode rodar localmente via Ollama ou em provedores externos, mas exigir nuvem quebraria a promessa local-first.

## Decisão

Ollama e endpoints OpenAI-compatible locais são caminhos principais. OpenAI, Anthropic e OpenRouter existem como opções configuráveis pelo usuário, nunca como dependência obrigatória para catalogar ou usar a biblioteca.

## Consequências

- O app precisa explicar claramente quando algo sai da máquina do usuário.
- Chaves externas devem ser opcionais, mascaradas na UI e protegidas localmente.
- Features externas, como visão para capa, devem ser opt-in.
- Erros de provider local precisam ser claros e recuperáveis.
