import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Pinia } from 'pinia';
import AddOns from '../../../src/views/AddOns.vue';
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

const mockAddItem = vi.fn();
vi.mock('vbwd-view-component', () => ({
  useCartStore: () => ({
    items: [],
    addItem: mockAddItem,
    clearCart: vi.fn()
  })
}));

const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
};

const independentAddon = {
  id: 'addon-1',
  name: 'Extra Storage',
  slug: 'extra-storage',
  description: 'More storage for everyone',
  price: '5.00',
  currency: 'EUR',
  billing_period: 'monthly',
  is_active: true,
  tarif_plan_ids: [],
  tarif_plans: []
};

const planSpecificAddon = {
  id: 'addon-2',
  name: 'Priority Support',
  slug: 'priority-support',
  description: 'Priority support for Pro users',
  price: '15.00',
  currency: 'EUR',
  billing_period: 'monthly',
  is_active: true,
  tarif_plan_ids: ['plan-pro'],
  tarif_plans: [{ id: 'plan-pro', name: 'Pro' }]
};

interface MockAddon {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  billing_period: string;
  is_active: boolean;
  tarif_plan_ids?: string[];
  tarif_plans?: { id: string; name: string }[];
}

let pinia: Pinia;

function mockApi(addons: MockAddon[] = [independentAddon, planSpecificAddon]) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/addons') return Promise.resolve({ addons });
    if (url === '/user/subscriptions/active') return Promise.resolve({ subscription: { status: 'active' } });
    return Promise.resolve({});
  });
}

function mountAddOns() {
  return mount(AddOns, {
    global: {
      plugins: [pinia],
      stubs: { 'router-link': RouterLinkStub },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('AddOns.vue — Plan-Based Filtering (Sprint 13)', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('separates independent and plan-specific addons', async () => {
    mockApi();
    const wrapper = mountAddOns();
    await flushPromises();

    // Global section should contain independent addon
    const globalSection = wrapper.find('[data-testid="global-addons-section"]');
    expect(globalSection.text()).toContain('Extra Storage');

    // Subscription section should contain plan-specific addon
    const subSection = wrapper.find('[data-testid="subscription-addons-section"]');
    expect(subSection.text()).toContain('Priority Support');
  });

  it('puts addon with empty tarif_plan_ids in global section', async () => {
    mockApi([independentAddon]);
    const wrapper = mountAddOns();
    await flushPromises();

    const globalSection = wrapper.find('[data-testid="global-addons-section"]');
    expect(globalSection.findAll('[data-testid^="addon-card-"]')).toHaveLength(1);

    const subSection = wrapper.find('[data-testid="subscription-addons-section"]');
    expect(subSection.text()).toContain('addons.subscriptionAddons.noAddons');
  });

  it('puts addon with tarif_plan_ids in subscription section', async () => {
    mockApi([planSpecificAddon]);
    const wrapper = mountAddOns();
    await flushPromises();

    const subSection = wrapper.find('[data-testid="subscription-addons-section"]');
    expect(subSection.findAll('[data-testid^="addon-card-"]')).toHaveLength(1);

    const globalSection = wrapper.find('[data-testid="global-addons-section"]');
    expect(globalSection.text()).toContain('addons.globalAddons.noAddons');
  });

  it('shows both sections when mixed addons present', async () => {
    mockApi([independentAddon, planSpecificAddon]);
    const wrapper = mountAddOns();
    await flushPromises();

    const subCards = wrapper.find('[data-testid="subscription-addons-section"]').findAll('[data-testid^="addon-card-"]');
    const globalCards = wrapper.find('[data-testid="global-addons-section"]').findAll('[data-testid^="addon-card-"]');
    expect(subCards).toHaveLength(1);
    expect(globalCards).toHaveLength(1);
  });

  it('handles addon without tarif_plan_ids field as independent', async () => {
    const legacyAddon = {
      id: 'addon-3',
      name: 'Legacy Addon',
      slug: 'legacy',
      description: 'No tarif_plan_ids field',
      price: '3.00',
      currency: 'EUR',
      billing_period: 'monthly',
      is_active: true
      // No tarif_plan_ids field at all
    };

    mockApi([legacyAddon]);
    const wrapper = mountAddOns();
    await flushPromises();

    const globalSection = wrapper.find('[data-testid="global-addons-section"]');
    expect(globalSection.text()).toContain('Legacy Addon');
  });

  it('filters out inactive addons', async () => {
    const inactiveAddon = {
      ...independentAddon,
      id: 'addon-inactive',
      name: 'Inactive Addon',
      is_active: false
    };

    mockApi([independentAddon, inactiveAddon]);
    const wrapper = mountAddOns();
    await flushPromises();

    // Only active addon should appear
    const allCards = wrapper.findAll('[data-testid^="addon-card-"]');
    expect(allCards).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Inactive Addon');
  });
});
