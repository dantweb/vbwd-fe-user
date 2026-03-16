import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
  createI18n: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} }),
}))

vi.mock('../../../../plugins/ghrm/src/api/ghrmApi', () => ({
  ghrmApi: {
    getPackageByPlan: vi.fn(),
  },
}))

const storeFetchPackage = vi.fn()
const storeFetchVersions = vi.fn()

vi.mock('../../../../plugins/ghrm/src/stores/useGhrmStore', () => ({
  useGhrmStore: () => ({
    currentPackage: {
      readme: '# Hello',
      changelog: null,
      docs: null,
      screenshots: [],
    },
    versions: [],
    fetchPackage: storeFetchPackage,
    fetchVersions: storeFetchVersions,
  }),
}))

vi.mock('../../../../plugins/ghrm/src/components/GhrmMarkdownRenderer.vue', () => ({
  default: { template: '<div class="mock-md" />', props: ['content'] },
}))
vi.mock('../../../../plugins/ghrm/src/components/GhrmVersionsTable.vue', () => ({
  default: { template: '<div class="mock-versions" />', props: ['versions'] },
}))

import GhrmPlanSoftwareTab from '../../../../plugins/ghrm/src/components/GhrmPlanSoftwareTab.vue'
import { ghrmApi } from '../../../../plugins/ghrm/src/api/ghrmApi'

const mockGetPackageByPlan = vi.mocked(ghrmApi.getPackageByPlan)

function mountTab() {
  setActivePinia(createPinia())
  return mount(GhrmPlanSoftwareTab, {
    props: { planSlug: 'my-plan', planId: 'plan-uuid-123' },
    global: { mocks: { $t: (k: string) => k } },
  })
}

describe('GhrmPlanSoftwareTab', () => {
  beforeEach(() => {
    mockGetPackageByPlan.mockReset()
    storeFetchPackage.mockReset()
    storeFetchVersions.mockReset()
  })

  it('shows loading initially', () => {
    mockGetPackageByPlan.mockImplementation(() => new Promise(() => {}))
    const wrapper = mountTab()
    expect(wrapper.find('.ghrm-loading').exists()).toBe(true)
  })

  it('shows no-software message when 404', async () => {
    mockGetPackageByPlan.mockRejectedValue(new Error('Not Found'))
    const wrapper = mountTab()
    await flushPromises()
    expect(wrapper.find('[data-testid="no-package-message"]').exists()).toBe(true)
  })

  it('calls fetchPackage and fetchVersions on success', async () => {
    mockGetPackageByPlan.mockResolvedValue({ slug: 'my-pkg' } as any)
    storeFetchPackage.mockResolvedValue(undefined)
    storeFetchVersions.mockResolvedValue(undefined)
    mountTab()
    await new Promise(r => setTimeout(r, 10))
    expect(storeFetchPackage).toHaveBeenCalledWith('my-pkg')
    expect(storeFetchVersions).toHaveBeenCalledWith('my-pkg')
  })

  it('renders overview sub-tab by default', async () => {
    mockGetPackageByPlan.mockResolvedValue({ slug: 'my-pkg' } as any)
    storeFetchPackage.mockResolvedValue(undefined)
    storeFetchVersions.mockResolvedValue(undefined)
    const wrapper = mountTab()
    await new Promise(r => setTimeout(r, 10))
    // overview tab should be active - markdown renderer shown
    expect(wrapper.find('.mock-md').exists()).toBe(true)
  })
})
