import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Pinia } from 'pinia';
import TokenBundleDetailView from '../../../src/views/TokenBundleDetailView.vue';
import { api } from '../../../src/api';

vi.mock('../../../src/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn()
  },
  initializeApi: vi.fn(),
  clearApiAuth: vi.fn(),
  isAuthenticated: vi.fn(() => true)
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

const mockBack = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useRoute: () => ({ params: { bundleId: 'bundle-456' } })
}));

const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
};

let pinia: Pinia;

const mockBundle = {
  id: 'bundle-456',
  name: '1000 Token Pack',
  description: 'One thousand tokens for your account',
  token_amount: 1000,
  price: '49.99',
  is_active: true
};

function mountView() {
  return mount(TokenBundleDetailView, {
    global: {
      plugins: [pinia],
      stubs: { 'router-link': RouterLinkStub },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('TokenBundleDetailView', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const wrapper = mountView();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="bundle-detail-loading"]').exists()).toBe(true);
  });

  it('fetches bundle via API and renders details', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ bundle: mockBundle });
    const wrapper = mountView();
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/token-bundles/bundle-456');
    expect(wrapper.find('[data-testid="bundle-detail-content"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="bundle-name"]').text()).toContain('1000 Token Pack');
    expect(wrapper.text()).toContain('1,000');
    expect(wrapper.text()).toContain('49.99');
  });

  it('shows description when present', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ bundle: mockBundle });
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('One thousand tokens');
  });

  it('shows error state on fetch failure', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Not found'));
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="bundle-detail-error"]').exists()).toBe(true);
  });

  it('has back link', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ bundle: mockBundle });
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="back-link"]').exists()).toBe(true);
  });
});
