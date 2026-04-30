# `lib/library`

Contexto agregado da biblioteca para busca, chat e reindexação leve.

Comece por:

- `snapshot.ts`: leitura tolerante do Acervo, com livros válidos, diagnósticos e cache por arquivo.
- `context.ts`: monta o contexto compacto usado pela IA.
- `slug-set.ts`: carrega slugs conhecidos para validar referências.
- `watch.ts`: refresh automático opcional para edições no Obsidian.
- `readiness.ts`: relatório de prontidão da biblioteca.

Princípios:

- Markdown local continua sendo a fonte de verdade; snapshot/cache só aceleram leitura.
- Arquivos inválidos viram diagnósticos sem derrubar livros válidos.
- Watcher é opt-in e deve ficar desligado em ambientes serverless.
- Contexto para IA precisa ser útil, mas limitado para não explodir prompt.
