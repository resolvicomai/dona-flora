# Segurança

Obrigado por ajudar a manter a Dona Flora segura.

## Versões Suportadas

Enquanto o projeto estiver em beta, a versão suportada é sempre a branch `main`.

| Versão | Suporte |
| --- | --- |
| `main` | Sim |
| versões antigas/forks | Não garantido |

## Como Reportar Vulnerabilidades

Não abra uma issue pública com segredo, token, banco local, caminho privado ou prova de exploração.

Se encontrar uma falha de segurança, envie um relatório privado para:

- GitHub Security Advisory do repositório, se disponível; ou
- contato da [Resolvi com AI](https://resolvicomai.app).

Inclua, se possível:

- descrição curta do problema;
- impacto esperado;
- passos mínimos para reproduzir;
- versão/commit testado;
- se envolve dependência, link do advisory.

## Escopo

Está dentro do escopo:

- vazamento de chaves ou tokens;
- leitura indevida de arquivos fora da pasta escolhida;
- falhas de autenticação local;
- exposição de dados de outro usuário local;
- problemas em rotas de API que permitam escrita/leitura indevida;
- XSS ou injeção em Markdown/renderização;
- falhas no armazenamento de chaves externas.

Fora do escopo:

- ataques que dependem de acesso total ao computador do usuário;
- problemas causados por publicar manualmente `.env.local`, banco SQLite ou pasta do Obsidian;
- vulnerabilidades em provedores externos sem impacto específico na Dona Flora;
- spam, social engineering ou phishing fora do app.

## Boas Práticas Para Instalar

- Defina um `BETTER_AUTH_SECRET` forte antes de configurar chaves externas.
- Não versionar `.env`, `.env.local`, `data/`, banco SQLite ou cache de capas.
- Use providers locais se quiser manter o chat 100% local.
- Revise permissões da pasta de livros antes de apontar o app para um vault grande.

