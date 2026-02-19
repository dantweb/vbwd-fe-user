import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'

// Must use vi.hoisted for variables referenced inside vi.mock factories
const { mockApi } = vi.hoisted(() => ({
  mockApi: { post: vi.fn(), get: vi.fn() },
}))

// Mock the shared composables from @dantweb/view-component
const mockRedirect = {
  loading: ref(false),
  error: ref<string | null>(null),
  invoiceId: ref<string | null>(null),
  readInvoiceFromQuery: vi.fn(),
  createAndRedirect: vi.fn(),
}

vi.mock('@dantweb/view-component', () => ({
  usePaymentRedirect: () => mockRedirect,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/api', () => ({
  api: mockApi,
}))

import PayPalPaymentView from '../../../../plugins/paypal-payment/PayPalPaymentView.vue'
import PayPalSuccessView from '../../../../plugins/paypal-payment/PayPalSuccessView.vue'
import PayPalCancelView from '../../../../plugins/paypal-payment/PayPalCancelView.vue'

describe('PayPalPaymentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.loading.value = false
    mockRedirect.error.value = null
    mockRedirect.invoiceId.value = null
  })

  it('should show loading when redirecting', async () => {
    mockRedirect.loading.value = true
    const wrapper = mount(PayPalPaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('paypal.payment.redirecting')
  })

  it('should show error when no invoice in query', async () => {
    mockRedirect.invoiceId.value = null
    mockRedirect.error.value = null
    const wrapper = mount(PayPalPaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('paypal.payment.noInvoice')
  })

  it('should call readInvoiceFromQuery on mount', async () => {
    mount(PayPalPaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    await flushPromises()
    expect(mockRedirect.readInvoiceFromQuery).toHaveBeenCalled()
  })

  it('should show error and retry button on API failure', async () => {
    mockRedirect.error.value = 'Payment session failed'
    const wrapper = mount(PayPalPaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('Payment session failed')
    expect(wrapper.text()).toContain('paypal.payment.retry')
  })
})

describe('PayPalSuccessView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.post.mockReset()
    // Default: no query params
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    })
  })

  it('should show verifying initially', () => {
    const wrapper = mount(PayPalSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('paypal.success.verifying')
  })

  it('should show confirmed after successful capture', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=ORDER-123' },
      writable: true,
    })
    mockApi.post.mockResolvedValueOnce({ status: 'COMPLETED', capture_id: 'CAP-1' })

    const wrapper = mount(PayPalSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    await flushPromises()

    expect(mockApi.post).toHaveBeenCalledWith('/plugins/paypal/capture-order', { order_id: 'ORDER-123' })
    expect(wrapper.text()).toContain('paypal.success.title')
    expect(wrapper.text()).toContain('paypal.success.message')
  })

  it('should show confirmed for subscription (no capture needed)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?subscription_id=I-SUB-123' },
      writable: true,
    })

    const wrapper = mount(PayPalSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    await flushPromises()

    expect(mockApi.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('paypal.success.title')
  })

  it('should show error on capture failure', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?token=ORDER-BAD' },
      writable: true,
    })
    mockApi.post.mockRejectedValueOnce(new Error('Capture failed'))

    const wrapper = mount(PayPalSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Capture failed')
  })

  it('should show error when no token in URL', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    })

    const wrapper = mount(PayPalSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('No order token found')
  })
})

describe('PayPalCancelView', () => {
  it('should render cancel message and retry link', () => {
    const wrapper = mount(PayPalCancelView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('paypal.cancel.title')
    expect(wrapper.text()).toContain('paypal.cancel.message')
    expect(wrapper.html()).toContain('paypal.cancel.tryAgain')
  })
})
