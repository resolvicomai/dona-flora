# ADR 001: Markdown Como Fonte De Verdade

## Status

Aceito.

## Contexto

Dona Flora nasce para bibliotecas pessoais, especialmente acervos físicos e notas que já vivem em editores como Obsidian. Um banco relacional para livros resolveria consultas, mas criaria aprisionamento de dados e obrigaria o usuário a confiar no app como única interface.

## Decisão

Cada livro é um arquivo Markdown com frontmatter YAML. O frontmatter guarda metadados estruturados; o corpo do arquivo continua livre para notas, highlights e texto humano.

## Consequências

- O usuário pode editar livros fora da Dona Flora.
- Git, Obsidian, VS Code e backups simples continuam funcionando.
- Migrações precisam ser conservadoras e nunca reescrever acervos sem intenção explícita.
- Consultas complexas devem ser resolvidas por leitura/indexação leve dos arquivos, não por schema SQL dos livros.
