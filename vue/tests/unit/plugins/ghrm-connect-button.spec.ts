import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
  createI18n: vi.fn(),
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ params: {} }),
}))

vi.mock('../../../../plugins/ghrm/src/api/ghrmApi', () => ({
  ghrmApi: {
    getOAuthUrl: vi.fn(),
    disconnect: vi.fn(),
  },
}))

vi.mock('../../../../plugins/ghrm/src/stores/useGhrmStore', () => ({
  useGhrmStore: () => ({
    accessStatus: null,
    fetchAccessStatus: vi.fn(),
    disconnect: vi.fn(),
  }),
}))

vi.mock('vbwd-view-component', () => ({
  useAuthStore: vi.fn(),
}))

import GhrmGithubConnectButton from '../../../../plugins/ghrm/src/components/GhrmGithubConnectButton.vue'
import { ghrmApi } from '../../../../plugins/ghrm/src/api/ghrmApi'
import { useAuthStore } from 'vbwd-view-component'

const mockGetOAuthUrl = vi.mocked(ghrmApi.getOAuthUrl)

function mountBtn(isAuthenticated = true) {
  setActivePinia(createPinia())
  vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated } as ReturnType<typeof useAuthStore>)
  return mount(GhrmGithubConnectButton, {
    global: { mocks: { $t: (k: string) => k } },
  })
}

describe('GhrmGithubConnectButton — connect()', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockGetOAuthUrl.mockReset()
  })

  it('calls getOAuthUrl and does not push /login when authenticated', async () => {
    mockGetOAuthUrl.mockResolvedValue({ url: 'https://github.com/login/oauth/authorize?test=1' })
    const wrapper = mountBtn(true)
    await wrapper.find('[data-testid="ghrm-connect-github"]').trigger('click')
    await flushPromises()
    expect(mockGetOAuthUrl).toHaveBeenCalledOnce()
    expect(mockPush).not.toHaveBeenCalledWith('/login')
  })

  it('does NOT redirect to /login even when authStore.isAuthenticated is false', async () => {
    // Bug: previously the button checked !authStore.isAuthenticated and pushed '/login',
    // which the router guard bounced to /dashboard.
    // After fix: connect() never pushes /login — it calls getOAuthUrl directly.
    mockGetOAuthUrl.mockResolvedValue({ url: 'https://github.com/login/oauth/authorize?test=1' })
    const wrapper = mountBtn(false)
    await wrapper.find('[data-testid="ghrm-connect-github"]').trigger('click')
    await flushPromises()
    expect(mockPush).not.toHaveBeenCalledWith('/login')
    expect(mockGetOAuthUrl).toHaveBeenCalledOnce()
  })

  it('shows error message when getOAuthUrl throws', async () => {
    mockGetOAuthUrl.mockRejectedValue(new Error('GitHub App not configured'))
    const wrapper = mountBtn(true)
    await wrapper.find('[data-testid="ghrm-connect-github"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('.ghrm-connect-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('GitHub App not configured')
  })
})
