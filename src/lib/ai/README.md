# `lib/ai`

Camada de IA da Dona Flora.

Comece por:

- `provider.ts`: resolve o provider/modelo ativo para uma chamada de chat.
- `settings.ts`: lê e salva preferências de provider por usuário.
- `system-prompt.ts`: define a personalidade e as regras da Dona Flora.
- `tools.ts`: ferramentas que a IA pode usar para referenciar livros e trilhas.

Princípios:

- IA local deve ser o caminho mais natural.
- Providers externos são opcionais e configurados pelo usuário.
- Chaves nunca devem voltar cruas para o cliente.
- Erros de configuração precisam ser legíveis para usuário não técnico.
