# `lib/library`

Contexto agregado da biblioteca para busca, chat e reindexação leve.

Comece por:

- `context.ts`: monta o contexto compacto usado pela IA.
- `slug-set.ts`: carrega slugs conhecidos para validar referências.
- `watch.ts`: refresh automático opcional para edições no Obsidian.
- `readiness.ts`: relatório de prontidão da biblioteca.

Princípios:

- Ler a biblioteca dinamicamente é aceitável para acervos pessoais.
- Watcher é opt-in e deve ficar desligado em ambientes serverless.
- Contexto para IA precisa ser útil, mas limitado para não explodir prompt.
