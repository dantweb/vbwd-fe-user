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

const storeFetchAccessStatus = vi.fn()
const storeFetchInstallInstructions = vi.fn()

// Use reactive refs so the template re-renders when values change
const accessStatusRef = ref<Record<string, unknown> | null>(null)
const installInstructionsRef = ref<Record<string, string> | null>(null)

vi.mock('../../../../plugins/ghrm/src/stores/useGhrmStore', () => ({
  useGhrmStore: () => ({
    get accessStatus() { return accessStatusRef.value },
    get installInstructions() { return installInstructionsRef.value },
    currentPackage: null,
    fetchAccessStatus: storeFetchAccessStatus,
    fetchInstallInstructions: storeFetchInstallInstructions,
  }),
}))

vi.mock('../../../../plugins/ghrm/src/components/GhrmGithubConnectButton.vue', () => ({
  default: { template: '<div data-testid="connect-btn" />' },
}))

import GhrmPlanGithubAccessTab from '../../../../plugins/ghrm/src/components/GhrmPlanGithubAccessTab.vue'
import { ghrmApi } from '../../../../plugins/ghrm/src/api/ghrmApi'

const mockGetPackageByPlan = vi.mocked(ghrmApi.getPackageByPlan)

function mountTab() {
  setActivePinia(createPinia())
  return mount(GhrmPlanGithubAccessTab, {
    props: { planSlug: 'plan-uuid-123', planId: 'plan-id-123' },
    global: { mocks: { $t: (k: string) => k } },
  })
}

describe('GhrmPlanGithubAccessTab', () => {
  beforeEach(() => {
    mockGetPackageByPlan.mockReset()
    storeFetchAccessStatus.mockReset()
    storeFetchInstallInstructions.mockReset()
    accessStatusRef.value = null
    installInstructionsRef.value = null
  })

  it('shows connect button', async () => {
    storeFetchAccessStatus.mockImplementation(() => { accessStatusRef.value = { connected: false } })
    const wrapper = mountTab()
    await flushPromises()
    expect(wrapper.find('[data-testid="connect-btn"]').exists()).toBe(true)
  })

  it('shows not-connected message when not connected', async () => {
    storeFetchAccessStatus.mockImplementation(() => { accessStatusRef.value = { connected: false } })
    const wrapper = mountTab()
    await flushPromises()
    expect(wrapper.find('[data-testid="not-connected-message"]').exists()).toBe(true)
  })

  it('shows connected label when connected', async () => {
    storeFetchAccessStatus.mockImplementation(() => {
      accessStatusRef.value = { connected: true, github_username: 'dantweb', access_status: 'active' }
    })
    mockGetPackageByPlan.mockResolvedValue({ slug: 'my-pkg' } as any)
    storeFetchInstallInstructions.mockImplementation(() => {
      installInstructionsRef.value = { git: 'git clone ...', npm: 'npm install ...', pip: 'pip install ...', composer: 'composer require ...' }
    })
    const wrapper = mountTab()
    await flushPromises()
    expect(wrapper.find('[data-testid="connected-label"]').exists()).toBe(true)
  })

  it('shows install instructions when connected and active', async () => {
    storeFetchAccessStatus.mockImplementation(() => {
      accessStatusRef.value = { connected: true, github_username: 'dantweb', access_status: 'active' }
    })
    mockGetPackageByPlan.mockResolvedValue({ slug: 'my-pkg' } as any)
    storeFetchInstallInstructions.mockImplementation(() => {
      installInstructionsRef.value = { git: 'git clone ...', npm: 'npm install ...', pip: 'pip install ...', composer: 'composer require ...' }
    })
    const wrapper = mountTab()
    await flushPromises()
    expect(wrapper.find('[data-testid="install-instructions"]').exists()).toBe(true)
  })

  it('shows inactive message when connected but not active', async () => {
    storeFetchAccessStatus.mockImplementation(() => {
      accessStatusRef.value = { connected: true, github_username: 'dantweb', access_status: 'pending' }
    })
    mockGetPackageByPlan.mockResolvedValue({ slug: 'my-pkg' } as any)
    storeFetchInstallInstructions.mockResolvedValue(undefined)
    const wrapper = mountTab()
    await flushPromises()
    expect(wrapper.find('[data-testid="inactive-message"]').exists()).toBe(true)
  })
})
