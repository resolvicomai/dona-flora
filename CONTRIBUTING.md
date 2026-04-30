# Contribuindo

Obrigado por considerar contribuir com a Dona Flora.

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Antes de abrir PR

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Cuidados importantes

- Não envie `.env.local`, `data/`, banco SQLite, cache de capas ou arquivos pessoais do Obsidian.
- Preserve Markdown como fonte de verdade dos livros.
- Evite migrações destrutivas ou reescrita automática do acervo.
- Recursos externos devem continuar opcionais; o chat principal deve funcionar com Ollama local.
