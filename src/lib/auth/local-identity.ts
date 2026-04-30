export const LOCAL_AUTH_INTERNAL_DOMAIN = 'local.donaflora.test'
export const USERNAME_REGEX = /^[a-z0-9_-]{3,32}$/

export function normalizeUsername(input: string) {
  return input.trim().toLowerCase()
}

export function usernameToAuthIdentifier(username: string) {
  // Better Auth's email/password adapter expects an email-shaped login key.
  // The product experience stays username-first; this identifier is internal.
  return `${normalizeUsername(username)}@${LOCAL_AUTH_INTERNAL_DOMAIN}`
}

export function loginToAuthIdentifier(input: string) {
  const value = input.trim().toLowerCase()
  return value.includes('@') ? value : usernameToAuthIdentifier(value)
}

export function authIdentifierToDisplayLogin(identifier: string) {
  const suffix = `@${LOCAL_AUTH_INTERNAL_DOMAIN}`
  return identifier.endsWith(suffix) ? identifier.slice(0, -suffix.length) : identifier
}
