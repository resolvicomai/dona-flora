# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e este projeto usa versionamento semântico enquanto fizer sentido para a fase beta.

## [0.1.0] - 2026-04-30

### Adicionado

- Biblioteca pessoal local-first com livros em Markdown.
- Configuração de pasta de livros por usuário, incluindo pastas Obsidian.
- Login local com múltiplos usuários.
- Chat persistente com memória local.
- Provider de IA configurável com Ollama, OpenAI, Anthropic, OpenRouter e endpoints OpenAI-compatible.
- Busca de metadados por ISBN/título com Google Books, Open Library e fallback de capa.
- Schema rico para livros, incluindo subtítulo, editora, tradutor, tags, série, prioridade, progresso e ISBN 10/13.
- Cache local de capas e placeholder determinístico.
- Edição em massa de livros.
- Trilhas de leitura salvas localmente.
- Highlights extraídos do Markdown para contexto da IA.
- CI público com lint, testes e build.
- Documentação inicial para instalação, segurança e contribuição.

### Segurança

- `.env` e variantes são ignorados por padrão.
- `docker-compose.yml` exige `BETTER_AUTH_SECRET` explícito.
- Chaves externas opcionais são tratadas como segredo local.
