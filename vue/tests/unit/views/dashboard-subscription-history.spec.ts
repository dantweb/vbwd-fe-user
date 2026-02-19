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

// Stub router-link to render as <a>
const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
};

let pinia: Pinia;

function mockApiDefaults() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/user/subscriptions') {
      return Promise.resolve({
        subscriptions: [
          {
            id: 'sub-1', status: 'active', started_at: '2026-01-01', expires_at: '2026-02-01',
            cancelled_at: null, tarif_plan_id: 'p1',
            plan: { id: 'p1', name: 'Pro Plan', slug: 'pro', price: 29, billing_period: 'monthly' }
          },
          {
            id: 'sub-2', status: 'cancelled', started_at: '2025-06-01', expires_at: '2025-07-01',
            cancelled_at: '2025-06-15', tarif_plan_id: 'p2',
            plan: { id: 'p2', name: 'Starter', slug: 'starter', price: 9, billing_period: 'monthly' }
          }
        ]
      });
    }
    if (url === '/user/subscriptions/active') {
      return Promise.resolve({
        subscription: {
          id: 'sub-1', status: 'active', started_at: '2026-01-01', expires_at: '2026-02-01',
          tarif_plan_id: 'p1',
          plan: { id: 'p1', name: 'Pro Plan', slug: 'pro', price: 29, billing_period: 'monthly' }
        }
      });
    }
    if (url === '/user/profile') {
      return Promise.resolve({ user: { email: 'test@test.com' }, details: { first_name: 'John', last_name: 'Doe' } });
    }
    if (url === '/user/tokens/balance') {
      return Promise.resolve({ balance: 500 });
    }
    if (url.startsWith('/user/tokens/transactions')) {
      return Promise.resolve({ transactions: [] });
    }
    if (url === '/user/addons') {
      return Promise.resolve({ addon_subscriptions: [] });
    }
    if (url === '/user/invoices') {
      return Promise.resolve({ invoices: [], total: 0 });
    }
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

describe('Dashboard — Subscription History Card', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('renders subscription history card with items', async () => {
    mockApiDefaults();
    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.find('[data-testid="subscription-history"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="history-item"]')).toHaveLength(2);
  });

  it('shows status badges for history items', async () => {
    mockApiDefaults();
    const wrapper = mountDashboard();
    await flushPromises();

    const badges = wrapper.findAll('[data-testid="history-status"]');
    expect(badges.length).toBeGreaterThanOrEqual(2);
    expect(badges[0].classes()).toContain('active');
    expect(badges[1].classes()).toContain('cancelled');
  });

  it('shows empty state when no history', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/user/subscriptions') return Promise.resolve({ subscriptions: [] });
      if (url === '/user/subscriptions/active') return Promise.resolve({ subscription: null });
      if (url === '/user/profile') return Promise.resolve({ user: { email: 'test@test.com' }, details: {} });
      if (url === '/user/tokens/balance') return Promise.resolve({ balance: 0 });
      if (url.startsWith('/user/tokens/transactions')) return Promise.resolve({ transactions: [] });
      if (url === '/user/addons') return Promise.resolve({ addon_subscriptions: [] });
      if (url === '/user/invoices') return Promise.resolve({ invoices: [], total: 0 });
      return Promise.resolve({});
    });

    const wrapper = mountDashboard();
    await flushPromises();

    const historyCard = wrapper.find('[data-testid="subscription-history"]');
    expect(historyCard.exists()).toBe(true);
    expect(historyCard.text()).toContain('dashboard.historyCard.noHistory');
  });

  it('shows plan name and date range in history items', async () => {
    mockApiDefaults();
    const wrapper = mountDashboard();
    await flushPromises();

    const items = wrapper.findAll('[data-testid="history-item"]');
    expect(items[0].text()).toContain('Pro Plan');
    expect(items[1].text()).toContain('Starter');
  });
});
