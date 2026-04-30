# i18n

A Dona Flora usa i18n co-located com componente. Cada componente com texto de UI traduzivel mantem um `copy.ts` ao lado, com:

- um tipo `<ComponentName>Copy` descrevendo o shape;
- uma constante `Record<AppLanguage, <ComponentName>Copy>` com todos os idiomas suportados.

## Por que co-located

Traducoes ficam perto do uso, entao revisar UI e texto acontece na mesma pasta. Isso evita uma central gigante de strings e facilita contribuicoes pequenas.

## O que fica aqui

Esta pasta deve guardar apenas infraestrutura compartilhada de idioma:

- `app-language.ts` define idiomas suportados, normalizacao e idioma default;
- helpers futuros de data, numero ou locale podem entrar aqui se forem realmente compartilhados.

Strings de UI nao ficam em `lib/i18n/`.

## Status de livros

`lib/books/status-labels.ts` e uma excecao intencional: status de livros sao enums de dominio usados por filtros, cards, linhas e formularios.
