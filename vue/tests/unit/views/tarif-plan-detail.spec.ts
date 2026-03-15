import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
  createI18n: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { planSlug: 'test-plan' } }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('../../../src/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('../../../src/utils/planDetailTabRegistry', () => ({
  planDetailTabRegistry: {
    tabs: { value: [] },
    register: vi.fn(),
  },
}))

import TarifPlanDetail from '../../../src/views/TarifPlanDetail.vue'
import { api } from '../../../src/api'

const mockGet = vi.mocked(api.get)

const mockPlan = {
  id: 'plan-1',
  name: 'Test Plan',
  slug: 'test-plan',
  price: 9.99,
  billing_period: 'MONTHLY',
  trial_days: 14,
  description: 'A test plan',
  features: ['Feature A', 'Feature B'],
}

function mountComponent() {
  setActivePinia(createPinia())
  return mount(TarifPlanDetail, {
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      mocks: { $t: (k: string) => k },
    },
  })
}

describe('TarifPlanDetail', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('renders plan name after loading', async () => {
    mockGet.mockResolvedValue({ plan: mockPlan })
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('[data-testid="plan-name"]').text()).toBe('Test Plan')
  })

  it('renders price and billing period', async () => {
    mockGet.mockResolvedValue({ plan: mockPlan })
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('[data-testid="plan-billing-period"]').text()).toBe('MONTHLY')
  })

  it('renders features table', async () => {
    mockGet.mockResolvedValue({ plan: mockPlan })
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('[data-testid="plan-features"]').exists()).toBe(true)
  })

  it('shows loading state initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {}))
    const wrapper = mountComponent()
    expect(wrapper.find('[data-testid="plan-loading"]').exists()).toBe(true)
  })

  it('shows error state on failure', async () => {
    mockGet.mockRejectedValue(new Error('Not found'))
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('[data-testid="plan-error"]').exists()).toBe(true)
  })

  it('renders Plan Description tab button', async () => {
    mockGet.mockResolvedValue({ plan: mockPlan })
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('[data-testid="tab-plan-description"]').exists()).toBe(true)
  })

  it('does not render plugin tabs when registry is empty', async () => {
    mockGet.mockResolvedValue({ plan: mockPlan })
    const wrapper = mountComponent()
    await flushPromises()
    // only the built-in tab should be present
    expect(wrapper.findAll('.pf-tabs__tab').length).toBe(1)
  })
})
