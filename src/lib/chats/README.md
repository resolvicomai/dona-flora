# `lib/chats`

Persistência e serialização das conversas com a Dona Flora.

Comece por:

- `store.ts`: cria, atualiza, renomeia, fixa e remove conversas.
- `serialize.ts`: converte mensagens entre formato interno e UI/API.
- `memory.ts`: resumo persistente de conversa.
- `list.ts`: listagem ordenada da sidebar.

Cuidados:

- Conversas são locais e separadas por usuário.
- Apagar conversa precisa remover a persistência, não apenas esconder da UI.
- Memória deve ajudar continuidade sem inventar fatos fora do histórico/acervo.
