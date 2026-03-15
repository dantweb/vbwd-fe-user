/**
 * TDD: Plugin tabs with a condition() predicate must NOT appear in the tab bar
 * when condition(planId) resolves to false.
 *
 * Covers the bug: GHRM "Software" and "GitHub Access" tabs were always shown
 * even on plans with no linked GhrmSoftwarePackage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
  createI18n: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { planSlug: 'enterprise' } }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))
vi.mock('@/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      id: 'plan-uuid-enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      billing_period: 'MONTHLY',
      trial_days: 0,
      is_active: true,
      features: [],
    }),
  },
}))

import { planDetailTabRegistry } from '../../../src/utils/planDetailTabRegistry'
import TarifPlanDetail from '../../../src/views/TarifPlanDetail.vue'

const conditionPass = vi.fn().mockResolvedValue(true)
const conditionFail = vi.fn().mockResolvedValue(false)

describe('TarifPlanDetail — conditional plugin tabs', () => {
  beforeEach(() => {
    // Reset registry
    planDetailTabRegistry.tabs.value = []
    conditionPass.mockReset().mockResolvedValue(true)
    conditionFail.mockReset().mockResolvedValue(false)
  })

  it('shows a tab whose condition() resolves to true', async () => {
    planDetailTabRegistry.register({
      id: 'visible-tab',
      label: 'Visible Tab',
      component: { template: '<div />' },
      condition: conditionPass,
    })

    setActivePinia(createPinia())
    const wrapper = mount(TarifPlanDetail, {
      global: { mocks: { $t: (k: string) => k }, stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="tab-visible-tab"]').exists()).toBe(true)
    expect(conditionPass).toHaveBeenCalledWith('plan-uuid-enterprise')
  })

  it('hides a tab whose condition() resolves to false', async () => {
    planDetailTabRegistry.register({
      id: 'hidden-tab',
      label: 'Hidden Tab',
      component: { template: '<div />' },
      condition: conditionFail,
    })

    setActivePinia(createPinia())
    const wrapper = mount(TarifPlanDetail, {
      global: { mocks: { $t: (k: string) => k }, stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="tab-hidden-tab"]').exists()).toBe(false)
    expect(conditionFail).toHaveBeenCalledWith('plan-uuid-enterprise')
  })

  it('shows a tab with no condition (unconditional)', async () => {
    planDetailTabRegistry.register({
      id: 'unconditional-tab',
      label: 'Unconditional',
      component: { template: '<div />' },
    })

    setActivePinia(createPinia())
    const wrapper = mount(TarifPlanDetail, {
      global: { mocks: { $t: (k: string) => k }, stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="tab-unconditional-tab"]').exists()).toBe(true)
  })
})
