import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Pinia } from 'pinia';
import AddonDetail from '../../../src/views/AddonDetail.vue';
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
  useRoute: () => ({ params: { id: 'addon-sub-1' } })
}));

const RouterLinkStub = {
  template: '<a><slot /></a>',
  props: ['to']
};

let pinia: Pinia;

const mockActiveAddonSub = {
  id: 'addon-sub-1',
  user_id: 'user-1',
  addon_id: 'addon-1',
  subscription_id: null,
  invoice_id: 'inv-1',
  status: 'ACTIVE',
  is_valid: true,
  starts_at: '2026-01-01T00:00:00',
  expires_at: '2027-01-01T00:00:00',
  cancelled_at: null as string | null,
  created_at: '2026-01-01T00:00:00',
  addon: {
    name: 'Extra Storage',
    slug: 'extra-storage',
    description: '100GB additional storage',
    price: '9.99',
    billing_period: 'monthly'
  },
  invoice: {
    id: 'inv-1',
    invoice_number: 'INV-001',
    status: 'paid',
    amount: '9.99',
    currency: 'USD'
  }
};

const mockCancelledAddonSub = {
  ...mockActiveAddonSub,
  status: 'CANCELLED',
  is_valid: false,
  cancelled_at: '2026-06-01T00:00:00',
};

function mockApiForAddon(addonSub: typeof mockActiveAddonSub) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/user/addons/addon-sub-1') {
      return Promise.resolve({ addon_subscription: addonSub });
    }
    if (url === '/user/addons') {
      return Promise.resolve({ addon_subscriptions: [] });
    }
    return Promise.resolve({});
  });
}

function mountAddonDetail() {
  return mount(AddonDetail, {
    global: {
      plugins: [pinia],
      stubs: { 'router-link': RouterLinkStub },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('AddonDetail.vue', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('renders addon details (name, description, price)', async () => {
    mockApiForAddon(mockActiveAddonSub);
    const wrapper = mountAddonDetail();
    await flushPromises();

    expect(wrapper.find('[data-testid="addon-content"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="addon-name"]').text()).toContain('Extra Storage');
    expect(wrapper.find('[data-testid="addon-description"]').text()).toContain('100GB additional storage');
    expect(wrapper.text()).toContain('$9.99');
  });

  it('shows active status badge', async () => {
    mockApiForAddon(mockActiveAddonSub);
    const wrapper = mountAddonDetail();
    await flushPromises();

    const badge = wrapper.find('[data-testid="addon-status"]');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toContain('Active');
    expect(badge.classes()).toContain('active');
  });

  it('cancel button visible for active addon', async () => {
    mockApiForAddon(mockActiveAddonSub);
    const wrapper = mountAddonDetail();
    await flushPromises();

    const cancelBtn = wrapper.find('[data-testid="cancel-addon-btn"]');
    expect(cancelBtn.exists()).toBe(true);
  });

  it('cancel button hidden for cancelled addon', async () => {
    mockApiForAddon(mockCancelledAddonSub);
    const wrapper = mountAddonDetail();
    await flushPromises();

    const cancelBtn = wrapper.find('[data-testid="cancel-addon-btn"]');
    expect(cancelBtn.exists()).toBe(false);

    const notice = wrapper.find('[data-testid="cancel-notice"]');
    expect(notice.exists()).toBe(true);
  });

  it('cancel confirmation dialog works', async () => {
    mockApiForAddon(mockActiveAddonSub);
    vi.mocked(api.post).mockResolvedValue({ addon_subscription: mockCancelledAddonSub, message: 'Cancelled' });

    // After cancel, the re-fetch returns cancelled
    let callCount = 0;
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/user/addons/addon-sub-1') {
        callCount++;
        if (callCount <= 1) {
          return Promise.resolve({ addon_subscription: mockActiveAddonSub });
        }
        return Promise.resolve({ addon_subscription: mockCancelledAddonSub });
      }
      if (url === '/user/addons') {
        return Promise.resolve({ addon_subscriptions: [] });
      }
      return Promise.resolve({});
    });

    const wrapper = mountAddonDetail();
    await flushPromises();

    // Click cancel button
    const cancelBtn = wrapper.find('[data-testid="cancel-addon-btn"]');
    await cancelBtn.trigger('click');
    await flushPromises();

    // Confirmation dialog should appear
    const confirmDialog = wrapper.find('[data-testid="cancel-confirm"]');
    expect(confirmDialog.exists()).toBe(true);

    // Click confirm
    const confirmBtn = wrapper.find('[data-testid="confirm-cancel-btn"]');
    await confirmBtn.trigger('click');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/user/addons/addon-sub-1/cancel');
  });

  it('back to dashboard link exists', async () => {
    mockApiForAddon(mockActiveAddonSub);
    const wrapper = mountAddonDetail();
    await flushPromises();

    const backLink = wrapper.find('[data-testid="back-to-dashboard"]');
    expect(backLink.exists()).toBe(true);
  });
});
