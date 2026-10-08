import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
const THEME_EVENT = "themechange";

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function storedTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // storage unavailable
  }
  return "system";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? systemTheme() : theme;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage unavailable
  }
  applyTheme(theme);
}

function currentResolvedTheme(): ResolvedTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// The initial class is set by the inline script in DashboardLayout.astro.
// During prerender both values are undefined, so server-rendered markup must
// not depend on them.
export function useTheme() {
  const [theme, setThemeState] = useState<Theme | undefined>(() =>
    typeof document === "undefined" ? undefined : storedTheme(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(
    () =>
      typeof document === "undefined" ? undefined : currentResolvedTheme(),
  );

  useEffect(() => {
    const sync = () => {
      setThemeState(storedTheme());
      setResolvedTheme(currentResolvedTheme());
    };
    const onSystemChange = () => {
      if (storedTheme() === "system") applyTheme("system");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) applyTheme(storedTheme());
    };

    sync();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener("storage", onStorage);
    mql.addEventListener("change", onSystemChange);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener("storage", onStorage);
      mql.removeEventListener("change", onSystemChange);
    };
  }, []);

  return { theme, resolvedTheme, setTheme: useCallback(setTheme, []) };
}
