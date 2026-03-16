/**
 * TDD: GhrmPlanGithubAccessTab must receive planId (UUID) and pass it to
 * getPackageByPlan() — NOT the planSlug string like "plugin-paypal".
 *
 * Bug: TarifPlanDetail.vue was only passing :plan-slug to plugin tabs.
 * getPackageByPlan() calls GET /api/v1/ghrm/packages/by-plan/<plan_id>
 * which expects a UUID — passing a slug returned 404.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
  createI18n: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} }),
}))

vi.mock('../../../../plugins/ghrm/src/api/ghrmApi', () => ({
  ghrmApi: { getPackageByPlan: vi.fn() },
}))

const accessStatusRef = ref<Record<string, unknown> | null>(null)

vi.mock('../../../../plugins/ghrm/src/stores/useGhrmStore', () => ({
  useGhrmStore: () => ({
    get accessStatus() { return accessStatusRef.value },
    installInstructions: null,
    currentPackage: null,
    fetchAccessStatus: vi.fn(),
    fetchInstallInstructions: vi.fn(),
  }),
}))

vi.mock('../../../../plugins/ghrm/src/components/GhrmGithubConnectButton.vue', () => ({
  default: { template: '<div />' },
}))

import GhrmPlanGithubAccessTab from '../../../../plugins/ghrm/src/components/GhrmPlanGithubAccessTab.vue'
import { ghrmApi } from '../../../../plugins/ghrm/src/api/ghrmApi'

const mockGetPackageByPlan = vi.mocked(ghrmApi.getPackageByPlan)

describe('GhrmPlanGithubAccessTab — planId prop', () => {
  beforeEach(() => {
    mockGetPackageByPlan.mockReset()
    accessStatusRef.value = null
  })

  it('calls getPackageByPlan with the UUID planId, not the planSlug', async () => {
    const planUuid = 'a1b2c3d4-0000-0000-0000-000000000001'
    const planSlug = 'plugin-paypal'

    accessStatusRef.value = { connected: true, github_username: 'dantweb', access_status: 'active' }
    mockGetPackageByPlan.mockResolvedValue({ slug: 'paypal-pkg' } as any)

    setActivePinia(createPinia())
    mount(GhrmPlanGithubAccessTab, {
      props: { planSlug, planId: planUuid },
      global: { mocks: { $t: (k: string) => k } },
    })
    await flushPromises()

    expect(mockGetPackageByPlan).toHaveBeenCalledWith(planUuid)
    expect(mockGetPackageByPlan).not.toHaveBeenCalledWith(planSlug)
  })

  it('does not call getPackageByPlan when not connected', async () => {
    accessStatusRef.value = { connected: false }

    setActivePinia(createPinia())
    mount(GhrmPlanGithubAccessTab, {
      props: { planSlug: 'plugin-paypal', planId: 'a1b2c3d4-0000-0000-0000-000000000001' },
      global: { mocks: { $t: (k: string) => k } },
    })
    await flushPromises()
    expect(mockGetPackageByPlan).not.toHaveBeenCalled()
  })
})
