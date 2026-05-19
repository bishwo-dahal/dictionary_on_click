/** User preference: follow OS, or force light / dark. */
export type ThemeMode = "system" | "light" | "dark";

export type ResolvedTheme = "light" | "dark";

export const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"];

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light") {
    return "light";
  }
  if (mode === "dark") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Apply resolved theme to an element (`data-theme` + optional system listener). */
export function applyTheme(root: HTMLElement, mode: ThemeMode): () => void {
  const sync = (): void => {
    root.dataset.theme = resolveTheme(mode);
  };
  sync();

  if (mode !== "system") {
    return () => {};
  }

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", sync);
  return () => mq.removeEventListener("change", sync);
}
