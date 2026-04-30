import { STATUS_LABELS, getStatusOptions, getStatusLabel } from '../status-labels'

describe('status-labels', () => {
  describe('STATUS_LABELS', () => {
    it('contains localized labels for all 5 BookStatus values in pt-BR', () => {
      expect(Object.keys(STATUS_LABELS['pt-BR']).sort()).toEqual([
        'abandonado',
        'lendo',
        'lido',
        'quero-ler',
        'quero-reler',
      ])
    })

    it('maps each status to correct pt-BR label', () => {
      expect(STATUS_LABELS['pt-BR']['quero-ler']).toBe('Quero ler')
      expect(STATUS_LABELS['pt-BR']['lendo']).toBe('Lendo')
      expect(STATUS_LABELS['pt-BR']['lido']).toBe('Lido')
      expect(STATUS_LABELS['pt-BR']['quero-reler']).toBe('Quero reler')
      expect(STATUS_LABELS['pt-BR']['abandonado']).toBe('Abandonado')
    })
  })

  describe('getStatusLabel', () => {
    it('returns label for valid status', () => {
      expect(getStatusLabel('lendo')).toBe('Lendo')
    })

    it('returns fallback for null/undefined and passes through unknown', () => {
      expect(getStatusLabel(null)).toBe('Selecione um status')
      expect(getStatusLabel(undefined)).toBe('Selecione um status')
      expect(getStatusLabel('totally-fake')).toBe('totally-fake')
    })
  })

  describe('getStatusOptions', () => {
    it('preserves order for dropdown', () => {
      const statusOptions = getStatusOptions('pt-BR')

      expect(statusOptions.map((o) => o.value)).toEqual([
        'quero-ler',
        'lendo',
        'lido',
        'quero-reler',
        'abandonado',
      ])
      expect(statusOptions[0]).toEqual({
        value: 'quero-ler',
        label: 'Quero ler',
      })
    })
  })
})
