# `lib/books`

Modelo de domínio dos livros.

Comece por:

- `schema.ts`: campos aceitos no frontmatter Markdown.
- `library-service.ts`: leitura, escrita e atualização dos arquivos `.md`.
- `query.ts`: busca/filtro/ordenação em memória.
- `highlights.ts`: extração da seção `## Highlights`.
- `isbn.ts`: normalização e validação de ISBN.

Princípios:

- Markdown é a fonte de verdade.
- Atualizações devem preservar metadados existentes sempre que possível.
- `author` pode vir como string ou array, mas a UI deve consumir autores normalizados.
- Qualquer migração em lote precisa ter dry-run.
