# Trilhas

Esta pasta guarda a persistencia das trilhas de leitura.

- `schema.ts` define o frontmatter e o formato dos itens da trilha.
- `store.ts` le, salva, atualiza e remove arquivos Markdown de trilhas.

Trilhas sao salvas em app data do usuario, nao dentro da pasta de livros. Isso evita misturar recomendacoes geradas pela Dona Flora com o acervo fonte do Obsidian.
