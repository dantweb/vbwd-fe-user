import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Pinia } from 'pinia';
import Dashboard from '../../../src/views/Dashboard.vue';
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

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} })
}));

const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
};

interface MockAddonSub {
  id: string;
  addon_id: string;
  status: string;
  addon: { name: string; slug: string };
}

let pinia: Pinia;

function mockApiWithAddons(addonSubs: MockAddonSub[] = []) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/user/addons') return Promise.resolve({ addon_subscriptions: addonSubs });
    if (url === '/user/subscriptions') return Promise.resolve({ subscriptions: [] });
    if (url === '/user/subscriptions/active') return Promise.resolve({ subscription: null });
    if (url === '/user/profile') return Promise.resolve({ user: { email: 'test@test.com' }, details: {} });
    if (url === '/user/tokens/balance') return Promise.resolve({ balance: 0 });
    if (url.startsWith('/user/tokens/transactions')) return Promise.resolve({ transactions: [] });
    if (url === '/user/invoices') return Promise.resolve({ invoices: [], total: 0 });
    return Promise.resolve({});
  });
}

function mountDashboard() {
  return mount(Dashboard, {
    global: {
      plugins: [pinia],
      stubs: { 'router-link': RouterLinkStub },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('Dashboard — Add-ons Card', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('renders addons card', async () => {
    mockApiWithAddons([
      { id: '1', addon_id: 'a1', status: 'ACTIVE', addon: { name: 'Priority Support', slug: 'priority-support' } },
      { id: '2', addon_id: 'a2', status: 'CANCELLED', addon: { name: 'Extra Storage', slug: 'extra-storage' } },
    ]);
    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.find('[data-testid="user-addons"]').exists()).toBe(true);
  });

  it('groups active and expired addons', async () => {
    mockApiWithAddons([
      { id: '1', addon_id: 'a1', status: 'ACTIVE', addon: { name: 'Priority Support', slug: 'priority-support' } },
      { id: '2', addon_id: 'a2', status: 'CANCELLED', addon: { name: 'Extra Storage', slug: 'extra-storage' } },
    ]);
    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.findAll('[data-testid="addon-item"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="addon-item-inactive"]')).toHaveLength(1);
  });

  it('shows empty state when no addons', async () => {
    mockApiWithAddons([]);
    const wrapper = mountDashboard();
    await flushPromises();

    const addonsCard = wrapper.find('[data-testid="user-addons"]');
    expect(addonsCard.text()).toContain('dashboard.addonsCard.noAddons');
  });

  it('shows addon name and status', async () => {
    mockApiWithAddons([
      { id: '1', addon_id: 'a1', status: 'ACTIVE', addon: { name: 'Priority Support', slug: 'priority-support' } },
    ]);
    const wrapper = mountDashboard();
    await flushPromises();

    const item = wrapper.find('[data-testid="addon-item"]');
    expect(item.text()).toContain('Priority Support');
    expect(item.text()).toContain('Active');
  });
});
