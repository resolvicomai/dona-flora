import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  getStatusLabel,
} from '../status-labels'

describe('status-labels', () => {
  describe('STATUS_LABELS', () => {
    it('contains all 5 BookStatus values', () => {
      expect(Object.keys(STATUS_LABELS).sort()).toEqual([
        'abandonado',
        'lendo',
        'lido',
        'quero-ler',
        'quero-reler',
      ])
    })

    it('maps each status to correct pt-BR label', () => {
      expect(STATUS_LABELS['quero-ler']).toBe('Quero ler')
      expect(STATUS_LABELS['lendo']).toBe('Lendo')
      expect(STATUS_LABELS['lido']).toBe('Lido')
      expect(STATUS_LABELS['quero-reler']).toBe('Quero reler')
      expect(STATUS_LABELS['abandonado']).toBe('Abandonado')
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

  describe('STATUS_OPTIONS', () => {
    it('preserves order for dropdown', () => {
      expect(STATUS_OPTIONS.map((o) => o.value)).toEqual([
        'quero-ler',
        'lendo',
        'lido',
        'quero-reler',
        'abandonado',
      ])
      expect(STATUS_OPTIONS[0]).toEqual({
        value: 'quero-ler',
        label: 'Quero ler',
      })
    })
  })
})
