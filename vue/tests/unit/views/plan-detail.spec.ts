import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Pinia } from 'pinia';
import PlanDetailView from '../../../src/views/PlanDetailView.vue';
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
  useRoute: () => ({ params: { planId: 'plan-123' } })
}));

const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
};

let pinia: Pinia;

const mockPlan = {
  id: 'plan-123',
  name: 'Pro Plan',
  slug: 'pro',
  price: 29.99,
  display_price: 29.99,
  display_currency: 'USD',
  billing_period: 'monthly',
  description: 'Professional plan with all features',
  features: ['Unlimited API calls', '100GB Storage', 'Priority support'],
  is_active: true
};

function mountView() {
  return mount(PlanDetailView, {
    global: {
      plugins: [pinia],
      stubs: { 'router-link': RouterLinkStub },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('PlanDetailView', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    const wrapper = mountView();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="plan-detail-loading"]').exists()).toBe(true);
  });

  it('fetches plan via API and renders details', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ plan: mockPlan });
    const wrapper = mountView();
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/tarif-plans/plan-123');
    expect(wrapper.find('[data-testid="plan-detail-content"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="plan-name"]').text()).toContain('Pro Plan');
    expect(wrapper.text()).toContain('29.99');
    expect(wrapper.text()).toContain('monthly');
  });

  it('renders features list', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ plan: mockPlan });
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="plan-features"]').exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="plan-features"] li');
    expect(items).toHaveLength(3);
    expect(items[0].text()).toBe('Unlimited API calls');
  });

  it('hides features section when no features', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ plan: { ...mockPlan, features: [] } });
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="plan-features"]').exists()).toBe(false);
  });

  it('shows error state on fetch failure', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Not found'));
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="plan-detail-error"]').exists()).toBe(true);
  });

  it('has back link', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ plan: mockPlan });
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="back-link"]').exists()).toBe(true);
  });
});
