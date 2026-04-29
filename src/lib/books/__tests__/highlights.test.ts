import { parseHighlights } from '../highlights'

describe('parseHighlights', () => {
  it('extracts page, quote and reader note from Highlights section', () => {
    expect(
      parseHighlights(`
Intro livre.

## Highlights

- p.42: "Texto literal" — minha nota
- "Outro trecho"

## Notas

- fora da secao
`),
    ).toEqual([{ note: 'minha nota', page: 42, quote: 'Texto literal' }, { quote: 'Outro trecho' }])
  })

  it('returns an empty array when the section is absent', () => {
    expect(parseHighlights('## Notas\n\n- nada estruturado')).toEqual([])
  })
})
