# API de metadata

Esta pasta integra provedores externos usados na catalogacao assistida.

- `google-books.ts` e a fonte principal para busca por titulo ou ISBN.
- `open-library.ts` e o fallback aberto quando o Google nao traz resultado bom.
- `amazon-cover.ts` tenta apenas resolver URL de capa por ISBN/ASIN, sem scraping.
- `dedupe.ts` remove duplicados entre provedores antes da UI mostrar os candidatos.

Comece por `google-books.ts` para entender o shape compartilhado `BookSearchResult`.
