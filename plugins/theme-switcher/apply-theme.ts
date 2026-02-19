import type { ThemePreset } from './presets';

export function applyTheme(preset: ThemePreset): void {
  const root = document.documentElement;
  for (const [property, value] of Object.entries(preset.colors)) {
    root.style.setProperty(property, value);
  }
}

export function clearTheme(preset: ThemePreset): void {
  const root = document.documentElement;
  for (const property of Object.keys(preset.colors)) {
    root.style.removeProperty(property);
  }
}
