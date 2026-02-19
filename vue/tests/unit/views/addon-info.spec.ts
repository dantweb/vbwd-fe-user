import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Pinia } from 'pinia';
import AddonInfoView from '../../../src/views/AddonInfoView.vue';
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
  useRoute: () => ({ params: { addonId: 'addon-789' } })
}));

const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
};

let pinia: Pinia;

const mockAddon = {
  id: 'addon-789',
  name: 'Extra Storage',
  slug: 'extra-storage',
  description: '100GB additional cloud storage',
  price: '9.99',
  currency: 'USD',
  billing_period: 'monthly',
  is_active: true
};

function mountView() {
  return mount(AddonInfoView, {
    global: {
      plugins: [pinia],
      stubs: { 'router-link': RouterLinkStub },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('AddonInfoView', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const wrapper = mountView();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="addon-info-loading"]').exists()).toBe(true);
  });

  it('fetches addon via API and renders details', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ addon: mockAddon });
    const wrapper = mountView();
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/addons/addon-789');
    expect(wrapper.find('[data-testid="addon-info-content"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="addon-info-name"]').text()).toContain('Extra Storage');
    expect(wrapper.text()).toContain('9.99');
    expect(wrapper.text()).toContain('monthly');
  });

  it('shows description when present', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ addon: mockAddon });
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('100GB additional cloud storage');
  });

  it('shows error state on fetch failure', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Not found'));
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="addon-info-error"]').exists()).toBe(true);
  });

  it('has back link', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ addon: mockAddon });
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="back-link"]').exists()).toBe(true);
  });
});
