# Dona Flora

Dona Flora e uma biblioteca pessoal local-first. O produto organiza livros em Markdown local e usa esse material para sustentar catalogacao, busca, trilhas e conversa com a bibliotecaria de IA.

## Language

**Acervo**:
A colecao local de livros em Markdown escolhida pelo usuario como fonte de verdade.
_Avoid_: banco de livros, corpus, biblioteca carregada

**Snapshot do Acervo**:
Uma leitura pontual do **Acervo** em um momento especifico, possivelmente acelerada por cache de arquivos.
_Avoid_: indice vivo, estado global da biblioteca

**Projecao do Acervo**:
Uma forma derivada do **Snapshot do Acervo** para uma superficie atual do produto.
_Avoid_: feature nova, ranking inteligente, estatistica avancada

**Mutacao de Livro**:
Uma alteracao conservadora em um arquivo Markdown de livro do **Acervo**.
_Avoid_: escrita do acervo, patch solto de frontmatter

**Diagnostico do Acervo**:
Um problema encontrado ao ler o **Acervo** sem impedir que livros validos continuem disponiveis.
_Avoid_: erro fatal da biblioteca, falha silenciosa

## Relationships

- O **Acervo** pertence a um usuario local.
- O **Acervo** e composto por um ou mais arquivos Markdown de livro.
- A Dona Flora le o **Acervo** para busca, catalogacao, contexto de IA e trilhas.
- Um **Snapshot do Acervo** nunca substitui o **Acervo** como fonte de verdade.
- Cache e watcher podem acelerar ou invalidar um **Snapshot do Acervo**, mas nao sao fonte de verdade.
- Uma **Projecao do Acervo** deve servir uma superficie existente do produto, como lista de livros, busca, contexto da IA, readiness, known slugs ou resumo basico.
- O **Acervo** responde o que existe; uma **Mutacao de Livro** altera arquivos Markdown preservando o que o usuario escreveu.
- Um **Snapshot do Acervo** pode conter **Diagnosticos do Acervo** junto com os livros validos.
- Um **Diagnostico do Acervo** nao deve derrubar browse ou chat quando houver livros validos.
- O contexto da IA e uma **Projecao do Acervo** derivada de livros validos normalizados, notas e highlights, nao de um parse bruto paralelo.
- Mudancas no Module do **Acervo** devem preservar compatibilidade por fachada: funcoes antigas podem delegar para a nova leitura enquanto callers migram aos poucos.

## Example dialogue

> **Dev:** "Quando a Dona Flora responde no chat, ela deve consultar o banco de livros?"
> **Domain expert:** "Nao. Ela deve ler o **Acervo**: os Markdown locais continuam sendo a fonte de verdade."

> **Dev:** "Podemos manter um indice vivo da biblioteca em memoria?"
> **Domain expert:** "Nao como fonte principal. Prefira um **Snapshot do Acervo** com cache por arquivo; se o Obsidian alterar um Markdown, a proxima leitura precisa refletir o disco."

> **Dev:** "Quando dizemos que o Module do Acervo deve ser completo, devemos incluir recomendacao e estatisticas avancadas?"
> **Domain expert:** "Nao. Completo significa cobrir as **Projecoes do Acervo** que o produto atual ja usa, sem adicionar features novas."

> **Dev:** "O Module do Acervo deve tambem editar livros?"
> **Domain expert:** "Nao nesta decisao. O **Acervo** deve ler e projetar; **Mutacao de Livro** deve cuidar das escritas conservadoras."

> **Dev:** "Se um arquivo Markdown estiver invalido, a biblioteca inteira deve falhar?"
> **Domain expert:** "Nao. O **Snapshot do Acervo** deve ser tolerante: usar livros validos e expor **Diagnosticos do Acervo** para reindex/settings."

> **Dev:** "A IA deve reler o Markdown bruto para nao perder campos?"
> **Domain expert:** "Nao. A IA deve usar uma **Projecao do Acervo** baseada nos livros validos normalizados; campos importantes entram pelo schema."

> **Dev:** "Devemos trocar todas as chamadas antigas para o novo Module de uma vez?"
> **Domain expert:** "Nao. Preserve compatibilidade por fachada para reduzir risco durante o refactor."

## Flagged ambiguities

- "Library Corpus" foi usado como nome tecnico de arquitetura, mas o termo de dominio aprovado e **Acervo**.
- "Indice vivo" foi rejeitado como modelo obrigatorio; o modelo aprovado e **Snapshot do Acervo** com cache por arquivo.
- "Completo" foi resolvido como cobertura das **Projecoes do Acervo** existentes, nao expansao de escopo do produto.
