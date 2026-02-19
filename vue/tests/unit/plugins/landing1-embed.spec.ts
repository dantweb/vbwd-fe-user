import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { PluginRegistry, PlatformSDK } from '@dantweb/view-component'
import { landing1Plugin } from '../../../../plugins/landing1'

const { mockLocale, mockRoute, MockLanding1View } = vi.hoisted(() => {
  const mockLocale = { value: 'en' }
  const mockRoute = { query: {} as Record<string, string>, meta: { embed: true }, params: {} }
  const MockLanding1View = {
    name: 'Landing1View',
    template: '<div class="mock-landing1"><slot /></div>',
    props: ['embedMode'],
    emits: ['plan-selected']
  }
  return { mockLocale, mockRoute, MockLanding1View }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: mockLocale })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => mockRoute
}))

vi.mock('../../../../plugins/landing1/Landing1View.vue', () => ({
  default: MockLanding1View
}))

// Import after mocks are set up
import EmbedLanding1View from '../../../../plugins/landing1/EmbedLanding1View.vue'

describe('Landing1 Embed Plugin Route', () => {
  let registry: PluginRegistry
  let sdk: PlatformSDK

  beforeEach(() => {
    registry = new PluginRegistry()
    sdk = new PlatformSDK()
    vi.clearAllMocks()
  })

  it('should register /embed/landing1 route', async () => {
    registry.register(landing1Plugin)
    await registry.installAll(sdk)

    const routes = sdk.getRoutes()
    const embedRoute = routes.find(r => r.path === '/embed/landing1')
    expect(embedRoute).toBeDefined()
    expect(embedRoute!.name).toBe('landing1-embed')
  })

  it('should mark embed route with meta.embed: true', async () => {
    registry.register(landing1Plugin)
    await registry.installAll(sdk)

    const routes = sdk.getRoutes()
    const embedRoute = routes.find(r => r.path === '/embed/landing1')
    expect(embedRoute!.meta).toEqual({ requiresAuth: false, embed: true })
  })

  it('should register both regular and embed routes', async () => {
    registry.register(landing1Plugin)
    await registry.installAll(sdk)

    const routes = sdk.getRoutes()
    expect(routes).toHaveLength(2)
    expect(routes.map(r => r.path)).toContain('/landing1')
    expect(routes.map(r => r.path)).toContain('/embed/landing1')
  })

  it('should not require auth on embed route', async () => {
    registry.register(landing1Plugin)
    await registry.installAll(sdk)

    const routes = sdk.getRoutes()
    const embedRoute = routes.find(r => r.path === '/embed/landing1')
    expect(embedRoute!.meta!.requiresAuth).toBe(false)
  })
})

describe('EmbedLanding1View', () => {
  let postMessageSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRoute.query = {}
    mockLocale.value = 'en'
    postMessageSpy = vi.fn()
    // Simulate being inside an iframe
    Object.defineProperty(window, 'parent', {
      value: { postMessage: postMessageSpy },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'parent', {
      value: window,
      writable: true,
      configurable: true
    })
  })

  function mountEmbed(query: Record<string, string> = {}) {
    mockRoute.query = query
    return mount(EmbedLanding1View, {
      global: {
        plugins: [createPinia()],
        mocks: { $t: (key: string) => key }
      }
    })
  }

  it('should render the embed wrapper', () => {
    const wrapper = mountEmbed()
    expect(wrapper.find('[data-testid="embed-landing1"]').exists()).toBe(true)
  })

  it('should render Landing1View with embedMode true', () => {
    const wrapper = mountEmbed()
    const landing1 = wrapper.findComponent(MockLanding1View)
    expect(landing1.exists()).toBe(true)
    expect(landing1.props('embedMode')).toBe(true)
  })

  it('should apply light theme by default', () => {
    const wrapper = mountEmbed()
    expect(wrapper.find('.vbwd-embed--light').exists()).toBe(true)
  })

  it('should apply dark theme from query param', () => {
    const wrapper = mountEmbed({ theme: 'dark' })
    expect(wrapper.find('.vbwd-embed--dark').exists()).toBe(true)
  })

  it('should sanitize invalid theme to light', () => {
    const wrapper = mountEmbed({ theme: '<script>' })
    expect(wrapper.find('.vbwd-embed--light').exists()).toBe(true)
  })

  it('should set locale from query param', async () => {
    mountEmbed({ locale: 'de' })
    await flushPromises()
    expect(mockLocale.value).toBe('de')
  })

  it('should not set invalid locale', async () => {
    mountEmbed({ locale: 'xx' })
    await flushPromises()
    expect(mockLocale.value).toBe('en')
  })

  it('should send postMessage on plan-selected event', async () => {
    const wrapper = mountEmbed()
    const landing1 = wrapper.findComponent(MockLanding1View)

    landing1.vm.$emit('plan-selected', {
      slug: 'basic',
      name: 'Basic Plan',
      price: 9.99,
      currency: 'USD',
    })
    await wrapper.vm.$nextTick()

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        type: 'vbwd:plan-selected',
        payload: {
          planSlug: 'basic',
          planName: 'Basic Plan',
          price: 9.99,
          currency: 'USD',
        }
      },
      '*'
    )
  })

  it('should include correct payload shape in postMessage', async () => {
    const wrapper = mountEmbed()
    const landing1 = wrapper.findComponent(MockLanding1View)

    landing1.vm.$emit('plan-selected', {
      slug: 'pro',
      name: 'Pro',
      price: 29.99,
      currency: 'EUR',
    })
    await wrapper.vm.$nextTick()

    const call = postMessageSpy.mock.calls[0]
    const payload = call[0].payload
    expect(payload).toHaveProperty('planSlug')
    expect(payload).toHaveProperty('planName')
    expect(payload).toHaveProperty('price')
    expect(payload).toHaveProperty('currency')
  })
})
