import type { ThemeMode } from "./theme.js";
import { applyTheme } from "./theme.js";
import type { UserSettings } from "./types.js";

const SETTINGS_KEY = "userSettings";

let disposeTheme: (() => void) | null = null;

export function bindTheme(root: HTMLElement, mode: ThemeMode): void {
  disposeTheme?.();
  disposeTheme = applyTheme(root, mode);
}

export function watchTheme(root: HTMLElement, getMode: () => Promise<ThemeMode>): void {
  void getMode().then((mode) => bindTheme(root, mode));

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[SETTINGS_KEY]) {
      return;
    }
    const next = changes[SETTINGS_KEY].newValue as Partial<UserSettings> | undefined;
    if (next?.theme) {
      bindTheme(root, next.theme);
    }
  });
}
