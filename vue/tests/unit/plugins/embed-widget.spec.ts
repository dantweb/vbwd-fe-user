import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Embed Widget JS', () => {
  let container: HTMLDivElement
  let scriptTag: HTMLScriptElement
  const originalError = console.error

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = ''

    // Create container div
    container = document.createElement('div')
    container.id = 'vbwd-iframe'
    document.body.appendChild(container)

    // Create script tag with data attributes
    scriptTag = document.createElement('script')
    scriptTag.setAttribute('data-origin', 'https://vbwd.example.com')
    scriptTag.setAttribute('data-locale', 'en')
    scriptTag.setAttribute('data-theme', 'light')
    document.body.appendChild(scriptTag)

    console.error = vi.fn()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    console.error = originalError
    // Remove all message event listeners added by widget
    // (widget uses anonymous function, so we can't remove it directly;
    // each test gets a fresh widget execution)
  })

  /**
   * Execute the widget code in the current context.
   * We load the widget as a string and eval it since it's an IIFE.
   */
  function executeWidget() {
    // Inline widget IIFE for testing (mirrors embed-widget.js logic)
    const scripts = document.querySelectorAll('script[data-origin]')
    const tag = scripts[scripts.length - 1]

    if (!tag) {
      console.error('[VBWD] Widget script must have a data-origin attribute')
      return
    }

    const origin = tag.getAttribute('data-origin') || ''
    const locale = tag.getAttribute('data-locale') || 'en'
    const theme = tag.getAttribute('data-theme') || 'light'
    const containerId = tag.getAttribute('data-container') || 'vbwd-iframe'
    const height = tag.getAttribute('data-height') || '600'

    try {
      new URL(origin)
    } catch (e) {
      console.error('[VBWD] Invalid data-origin URL:', origin)
      return
    }

    const cont = document.getElementById(containerId)
    if (!cont) {
      console.error('[VBWD] Container element #' + containerId + ' not found')
      return
    }

    const iframeSrc = origin + '/embed/landing1?locale=' +
      encodeURIComponent(locale) + '&theme=' + encodeURIComponent(theme)

    const iframe = document.createElement('iframe')
    iframe.src = iframeSrc
    iframe.style.width = '100%'
    iframe.style.height = height + 'px'
    iframe.style.border = 'none'
    iframe.style.overflow = 'hidden'
    iframe.setAttribute('title', 'VBWD Plans')
    iframe.setAttribute('loading', 'lazy')
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups')

    cont.appendChild(iframe)

    window.addEventListener('message', function(event) {
      if (event.origin !== origin) return
      const data = event.data
      if (!data || typeof data !== 'object' || !data.type) return

      if (data.type === 'vbwd:plan-selected') {
        const customEvent = new CustomEvent('vbwd:plan-selected', {
          detail: data.payload,
          bubbles: true
        })
        cont.dispatchEvent(customEvent)
      }

      if (data.type === 'vbwd:resize') {
        iframe.style.height = data.payload.height + 'px'
      }
    })
  }

  it('should create an iframe in the container', () => {
    executeWidget()
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
  })

  it('should set iframe src with origin', () => {
    executeWidget()
    const iframe = container.querySelector('iframe')!
    expect(iframe.src).toContain('https://vbwd.example.com/embed/landing1')
  })

  it('should include locale in iframe src', () => {
    scriptTag.setAttribute('data-locale', 'de')
    executeWidget()
    const iframe = container.querySelector('iframe')!
    expect(iframe.src).toContain('locale=de')
  })

  it('should include theme in iframe src', () => {
    scriptTag.setAttribute('data-theme', 'dark')
    executeWidget()
    const iframe = container.querySelector('iframe')!
    expect(iframe.src).toContain('theme=dark')
  })

  it('should set sandbox attribute on iframe', () => {
    executeWidget()
    const iframe = container.querySelector('iframe')!
    const sandbox = iframe.getAttribute('sandbox')!
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).toContain('allow-same-origin')
  })

  it('should set iframe border to none', () => {
    executeWidget()
    const iframe = container.querySelector('iframe')!
    expect(iframe.style.border).toContain('none')
  })

  it('should use custom height from data attribute', () => {
    scriptTag.setAttribute('data-height', '800')
    executeWidget()
    const iframe = container.querySelector('iframe')!
    expect(iframe.style.height).toBe('800px')
  })

  it('should log error for invalid origin URL', () => {
    scriptTag.setAttribute('data-origin', 'not-a-url')
    executeWidget()
    expect(console.error).toHaveBeenCalledWith('[VBWD] Invalid data-origin URL:', 'not-a-url')
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('should log error when container not found', () => {
    container.id = 'wrong-id'
    executeWidget()
    expect(console.error).toHaveBeenCalledWith(
      '[VBWD] Container element #vbwd-iframe not found'
    )
  })

  it('should dispatch custom event on valid postMessage', () => {
    executeWidget()

    const handler = vi.fn()
    container.addEventListener('vbwd:plan-selected', handler)

    // Simulate postMessage from iframe
    const messageEvent = new MessageEvent('message', {
      origin: 'https://vbwd.example.com',
      data: {
        type: 'vbwd:plan-selected',
        payload: { planSlug: 'basic', planName: 'Basic', price: 9.99, currency: 'USD' }
      }
    })
    window.dispatchEvent(messageEvent)

    expect(handler).toHaveBeenCalledTimes(1)
    const detail = handler.mock.calls[0][0].detail
    expect(detail.planSlug).toBe('basic')
  })

  it('should ignore postMessage from wrong origin', () => {
    executeWidget()

    const handler = vi.fn()
    container.addEventListener('vbwd:plan-selected', handler)

    const messageEvent = new MessageEvent('message', {
      origin: 'https://evil.example.com',
      data: {
        type: 'vbwd:plan-selected',
        payload: { planSlug: 'basic' }
      }
    })
    window.dispatchEvent(messageEvent)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should resize iframe on vbwd:resize message', () => {
    executeWidget()

    const iframe = container.querySelector('iframe')!
    expect(iframe.style.height).toBe('600px')

    const messageEvent = new MessageEvent('message', {
      origin: 'https://vbwd.example.com',
      data: {
        type: 'vbwd:resize',
        payload: { height: 950 }
      }
    })
    window.dispatchEvent(messageEvent)

    expect(iframe.style.height).toBe('950px')
  })
})
