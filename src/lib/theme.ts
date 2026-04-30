import { z } from 'zod'

export const THEME_STORAGE_KEY = 'dona-flora-theme'
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const ThemePreferenceSchema = z.enum(['light', 'dark', 'system'])

export type ThemePreference = z.infer<typeof ThemePreferenceSchema>
export type ResolvedTheme = Exclude<ThemePreference, 'system'>

export const THEME_PREFERENCES = ThemePreferenceSchema.options as readonly ThemePreference[]

export function parseThemePreference(value: unknown): ThemePreference | null {
  const parsed = ThemePreferenceSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return systemDark ? 'dark' : 'light'
  }

  return preference
}

export function applyThemePreference(
  target: Element,
  preference: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  const resolved = resolveThemePreference(preference, systemDark)

  target.classList.toggle('dark', resolved === 'dark')
  target.setAttribute('data-theme', resolved)
  target.setAttribute('data-theme-preference', preference)

  if (target instanceof HTMLElement) {
    target.style.colorScheme = resolved
  }

  return resolved
}
