# Storage

Esta pasta define onde os dados locais vivem.

- `data-root.ts` resolve caminhos de runtime e subpastas de dados.
- `context.ts` cria o contexto de storage por usuario e garante as pastas isoladas.
- `library-settings.ts` valida a pasta externa de livros escolhida pelo usuario.

O app separa livros, chats e trilhas por usuario, mas permite que a pasta de livros aponte para um vault Obsidian externo.
