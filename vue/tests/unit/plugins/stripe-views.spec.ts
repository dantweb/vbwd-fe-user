import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'

// Mock the shared composables from @dantweb/view-component
const mockRedirect = {
  loading: ref(false),
  error: ref<string | null>(null),
  invoiceId: ref<string | null>(null),
  readInvoiceFromQuery: vi.fn(),
  createAndRedirect: vi.fn(),
}

const mockStatus = {
  polling: ref(false),
  confirmed: ref(false),
  timedOut: ref(false),
  error: ref<string | null>(null),
  statusData: ref(null),
  sessionId: ref<string | null>(null),
  readSessionFromQuery: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
}

vi.mock('@dantweb/view-component', () => ({
  usePaymentRedirect: () => mockRedirect,
  usePaymentStatus: () => mockStatus,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/api', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}))

import StripePaymentView from '../../../../plugins/stripe-payment/StripePaymentView.vue'
import StripeSuccessView from '../../../../plugins/stripe-payment/StripeSuccessView.vue'
import StripeCancelView from '../../../../plugins/stripe-payment/StripeCancelView.vue'

describe('StripePaymentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.loading.value = false
    mockRedirect.error.value = null
    mockRedirect.invoiceId.value = null
  })

  it('should show loading when redirecting', async () => {
    mockRedirect.loading.value = true
    const wrapper = mount(StripePaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('stripe.payment.redirecting')
  })

  it('should show error when no invoice in query', async () => {
    mockRedirect.invoiceId.value = null
    mockRedirect.error.value = null
    const wrapper = mount(StripePaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('stripe.payment.noInvoice')
  })

  it('should call readInvoiceFromQuery on mount', async () => {
    mount(StripePaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    await flushPromises()
    expect(mockRedirect.readInvoiceFromQuery).toHaveBeenCalled()
  })

  it('should show error and retry button on API failure', async () => {
    mockRedirect.error.value = 'Payment session failed'
    const wrapper = mount(StripePaymentView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('Payment session failed')
    expect(wrapper.text()).toContain('stripe.payment.retry')
  })
})

describe('StripeSuccessView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStatus.polling.value = false
    mockStatus.confirmed.value = false
    mockStatus.timedOut.value = false
    mockStatus.error.value = null
  })

  it('should show verifying when polling', async () => {
    mockStatus.polling.value = true
    const wrapper = mount(StripeSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('stripe.success.verifying')
  })

  it('should call startPolling on mount', async () => {
    mount(StripeSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    await flushPromises()
    expect(mockStatus.startPolling).toHaveBeenCalled()
  })

  it('should show confirmation when payment is complete', async () => {
    mockStatus.confirmed.value = true
    const wrapper = mount(StripeSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('stripe.success.title')
    expect(wrapper.text()).toContain('stripe.success.message')
  })

  it('should show processing message when timed out', async () => {
    mockStatus.timedOut.value = true
    const wrapper = mount(StripeSuccessView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('stripe.success.processing')
  })
})

describe('StripeCancelView', () => {
  it('should render cancel message and retry link', () => {
    const wrapper = mount(StripeCancelView, {
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $t: (key: string) => key } }
    })
    expect(wrapper.text()).toContain('stripe.cancel.title')
    expect(wrapper.text()).toContain('stripe.cancel.message')
    expect(wrapper.html()).toContain('stripe.cancel.tryAgain')
  })
})
