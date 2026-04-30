# Capas

Esta pasta cuida da camada local de capas.

- `cache.ts` resolve capa cacheada, baixa uma imagem remota quando possivel e gera placeholder local quando nao ha capa confiavel.
- `url.ts` contem utilitarios pequenos para validar e normalizar URLs de imagem.

A UI deve preferir a rota autenticada `/api/covers/[slug]` em vez de hotlink direto. O frontmatter continua guardando a URL original quando ela existe.
