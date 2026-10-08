export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const KEY = "theme";
const BAR_COLORS = { light: "#ffffff", dark: "#242526" };

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    return THEMES.includes(saved as Theme) ? (saved as Theme) : "system";
  } catch {
    return "system";
  }
}

// "system" leaves the colors to prefers-color-scheme, the others force them
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }

  // the browser bar follows the page colors
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      const systemColor = meta.media.includes("dark")
        ? BAR_COLORS.dark
        : BAR_COLORS.light;
      meta.content = theme === "system" ? systemColor : BAR_COLORS[theme];
    });
}

export function saveTheme(theme: Theme) {
  try {
    if (theme === "system") {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, theme);
    }
  } catch {
    // private mode without storage, the choice lasts until the page closes
  }
  applyTheme(theme);
}
