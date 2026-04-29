# ADR 002: Local-First Com SQLite Para Dados Do App

## Status

Aceito.

## Contexto

Os livros devem permanecer em Markdown, mas o app também precisa guardar sessões, usuários locais, preferências, chaves opcionais, chats, trilhas e cache. Esses dados são operacionais e não precisam morar no mesmo arquivo do livro.

## Decisão

A Dona Flora usa SQLite local e arquivos locais por usuário para dados de aplicação. Livros continuam fora do banco, na pasta Markdown escolhida pelo usuário.

## Consequências

- O app funciona sem serviço de banco externo.
- Multiusuário local separa preferências, chats e trilhas.
- Chaves opcionais podem ser criptografadas localmente.
- Backups devem considerar duas camadas: pasta de livros e `DATA_DIR`.
- Deploy serverless não é o alvo principal; o foco é uso local/desktop-like.
