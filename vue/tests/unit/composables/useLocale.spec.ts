import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// Polyfill document.cookie in jsdom-like env
function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const key = c.trim().split('=')[0]
    if (key) document.cookie = `${key}=; max-age=0`
  })
}

import { getCookieLang, getBrowserLang, useLocale } from '../../../src/composables/useLocale'

describe('getCookieLang', () => {
  beforeEach(clearCookies)
  afterEach(clearCookies)

  it('returns null when no cookie set', () => {
    expect(getCookieLang()).toBeNull()
  })

  it('reads existing vbwd_lang cookie', () => {
    document.cookie = 'vbwd_lang=de; path=/'
    expect(getCookieLang()).toBe('de')
  })
})

describe('getBrowserLang', () => {
  it('returns first 2 chars of navigator.language', () => {
    const lang = getBrowserLang()
    // jsdom sets navigator.language to 'en' or similar
    expect(lang).toMatch(/^[a-z]{2}$/)
  })
})

describe('useLocale', () => {
  beforeEach(clearCookies)
  afterEach(clearCookies)

  it('setLang updates currentLang ref', () => {
    const { currentLang, setLang } = useLocale()
    setLang('de')
    expect(currentLang.value).toBe('de')
  })

  it('setLang writes vbwd_lang cookie', () => {
    const { setLang } = useLocale()
    setLang('fr')
    expect(document.cookie).toContain('vbwd_lang=fr')
  })

  it('initialises currentLang from cookie', () => {
    document.cookie = 'vbwd_lang=es; path=/'
    const { currentLang } = useLocale()
    expect(currentLang.value).toBe('es')
  })
})
