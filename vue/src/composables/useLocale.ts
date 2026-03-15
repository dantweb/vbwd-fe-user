import { ref } from 'vue';

const COOKIE_NAME = 'vbwd_lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getCookieLang(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getBrowserLang(): string | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.language?.slice(0, 2).toLowerCase() ?? null;
}

export function useLocale() {
  const currentLang = ref(getCookieLang() ?? getBrowserLang() ?? 'en');

  function setLang(lang: string) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(lang)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    currentLang.value = lang;
  }

  return { currentLang, setLang };
}
