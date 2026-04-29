import {
  USERNAME_REGEX,
  authIdentifierToDisplayLogin,
  loginToAuthIdentifier,
  normalizeUsername,
  usernameToAuthIdentifier,
} from '@/lib/auth/local-identity'

describe('local username identity helpers', () => {
  it('normalizes usernames before building the internal auth identifier', () => {
    expect(normalizeUsername(' Mauro_Dev ')).toBe('mauro_dev')
    expect(usernameToAuthIdentifier(' Mauro_Dev ')).toBe(
      'mauro_dev@local.donaflora.test',
    )
  })

  it('accepts legacy email sign-in while mapping usernames to internal identifiers', () => {
    expect(loginToAuthIdentifier('mauro')).toBe('mauro@local.donaflora.test')
    expect(loginToAuthIdentifier('owner@example.com')).toBe('owner@example.com')
  })

  it('displays local accounts as usernames and keeps legacy accounts readable', () => {
    expect(authIdentifierToDisplayLogin('mauro@local.donaflora.test')).toBe('mauro')
    expect(authIdentifierToDisplayLogin('owner@example.com')).toBe('owner@example.com')
  })

  it('uses the approved username regex', () => {
    expect(USERNAME_REGEX.test('mauro_dev-01')).toBe(true)
    expect(USERNAME_REGEX.test('ma')).toBe(false)
    expect(USERNAME_REGEX.test('Mauro')).toBe(false)
    expect(USERNAME_REGEX.test('nome.com.ponto')).toBe(false)
  })
})
