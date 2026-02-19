/**
 * Vue i18n configuration for user app
 * Active languages: EN, DE, ES, FR, JA, RU, TH, ZH
 */
import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import th from './locales/th.json';
import zh from './locales/zh.json';

export type LocaleCode = 'en' | 'de' | 'es' | 'fr' | 'ja' | 'ru' | 'th' | 'zh';

export const availableLocales: LocaleCode[] = ['en', 'de', 'es', 'fr', 'ja', 'ru', 'th', 'zh'];

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    de,
    es,
    fr,
    ja,
    ru,
    th,
    zh,
  },
});

/**
 * Set the current locale
 */
export function setLocale(locale: LocaleCode): void {
  i18n.global.locale.value = locale;
  localStorage.setItem('user_locale', locale);
}

/**
 * Get the current locale
 */
export function getLocale(): LocaleCode {
  return i18n.global.locale.value as LocaleCode;
}

/**
 * Initialize locale from stored preference or default
 */
export function initLocale(defaultLocale: LocaleCode = 'en'): void {
  const stored = localStorage.getItem('user_locale') as LocaleCode | null;
  if (stored && availableLocales.includes(stored)) {
    setLocale(stored);
  } else {
    setLocale(defaultLocale);
  }
}

export default i18n;
