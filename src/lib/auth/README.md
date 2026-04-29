# `lib/auth`

Autenticação local e persistência de conta.

Comece por:

- `auth.ts`: configuração do Better Auth e callbacks principais.
- `server.ts`: helpers de sessão usados por rotas protegidas.
- `db.ts`: schema SQLite local e operações de conta/perfil.
- `local-identity.ts`: normalização de usuário local.
- `mailer.ts`: fluxo legado/dev de links locais de autenticação.

Cuidados:

- Não reintroduzir obrigatoriedade de e-mail para uso offline.
- Não logar tokens fora do fluxo local de desenvolvimento.
- Não misturar dados de usuários locais.
- Mudanças aqui devem ser pequenas: Better Auth tem integração sensível.
