export const THEME_COOKIE = "aza-theme";
export type Theme = "light" | "dark";

export function isValidTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}
