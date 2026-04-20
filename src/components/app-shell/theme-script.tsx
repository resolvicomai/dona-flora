import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY } from "@/lib/theme"

const themeScript = `
(() => {
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  const mediaQuery = ${JSON.stringify(THEME_MEDIA_QUERY)};
  const root = document.documentElement;
  let storedPreference = null;

  try {
    storedPreference = window.localStorage.getItem(storageKey);
  } catch {
    storedPreference = null;
  }

  const preference =
    storedPreference === "light" ||
    storedPreference === "dark" ||
    storedPreference === "system"
      ? storedPreference
      : "system";

  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia(mediaQuery).matches;

  const resolved =
    preference === "system"
      ? prefersDark
        ? "dark"
        : "light"
      : preference;

  root.classList.toggle("dark", resolved === "dark");
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-preference", preference);
  root.style.colorScheme = resolved;
})();
`.trim()

export function ThemeScript() {
  return (
    <script
      id="dona-flora-theme-script"
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  )
}
