import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSubscriptionStore } from '../../../src/stores/subscription';
import { api } from '../../../src/api';

vi.mock('../../../src/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  },
  isAuthenticated: vi.fn(() => true)
}));

describe('SubscriptionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with null subscription', () => {
    const store = useSubscriptionStore();

    expect(store.subscription).toBeNull();
    expect(store.usage).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('fetches current subscription', async () => {
    const store = useSubscriptionStore();

    const mockSubscription = {
      id: 'sub_123',
      user_id: 'user_1',
      tarif_plan_id: 'pro',
      pending_plan_id: null,
      status: 'ACTIVE',
      is_valid: true,
      days_remaining: 30,
      started_at: '2025-01-01',
      expires_at: '2025-02-01',
      cancelled_at: null,
      paused_at: null,
      plan: { id: 'pro', name: 'Pro Plan', slug: 'pro', price: 29, billing_period: 'monthly' }
    };

    vi.mocked(api.get).mockResolvedValue({ subscription: mockSubscription });

    await store.fetchSubscription();

    expect(api.get).toHaveBeenCalledWith('/user/subscriptions/active');
    expect(store.subscription).toEqual(mockSubscription);
  });

  it('fetches usage statistics', async () => {
    const store = useSubscriptionStore();

    vi.mocked(api.get).mockResolvedValue({
      apiCalls: { used: 500, limit: 1000 },
      storage: { used: 50, limit: 100, unit: 'MB' }
    });

    await store.fetchUsage();

    expect(api.get).toHaveBeenCalledWith('/user/usage');
    expect(store.usage).toEqual({
      apiCalls: { used: 500, limit: 1000 },
      storage: { used: 50, limit: 100, unit: 'MB' }
    });
  });

  it('handles fetch error gracefully', async () => {
    const store = useSubscriptionStore();

    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    await expect(store.fetchSubscription()).rejects.toThrow();
    expect(store.error).toBe('Network error');
    expect(store.loading).toBe(false);
  });

  it('cancels subscription', async () => {
    const store = useSubscriptionStore();
    store.subscription = {
      id: 'sub_123',
      user_id: 'user_1',
      tarif_plan_id: 'pro',
      pending_plan_id: null,
      status: 'ACTIVE',
      is_valid: true,
      days_remaining: 30,
      started_at: '2025-01-01',
      expires_at: '2025-02-01',
      cancelled_at: null,
      paused_at: null
    };

    // Mock cancel response and refetch
    vi.mocked(api.post).mockResolvedValue({
      subscription: { ...store.subscription, status: 'cancelling' },
      message: 'Subscription cancelled'
    });
    vi.mocked(api.get).mockResolvedValue({
      subscription: { ...store.subscription, status: 'cancelling' }
    });

    const result = await store.cancelSubscription();

    expect(api.post).toHaveBeenCalledWith('/user/subscriptions/sub_123/cancel');
    expect(result.message).toBe('Subscription cancelled');
  });

  it('changes subscription plan', async () => {
    const store = useSubscriptionStore();
    store.subscription = {
      id: 'sub_123',
      user_id: 'user_1',
      tarif_plan_id: 'free',
      pending_plan_id: null,
      status: 'ACTIVE',
      is_valid: true,
      days_remaining: 30,
      started_at: '2025-01-01',
      expires_at: '2025-02-01',
      cancelled_at: null,
      paused_at: null
    };

    // Mock upgrade response and refetch
    vi.mocked(api.post).mockResolvedValue({ success: true });
    vi.mocked(api.get).mockResolvedValue({
      subscription: { ...store.subscription, tarif_plan_id: 'pro' }
    });

    await store.changePlan('pro');

    expect(api.post).toHaveBeenCalledWith('/user/subscriptions/sub_123/upgrade', { plan_id: 'pro' });
  });

  it('resets store state', () => {
    const store = useSubscriptionStore();
    store.subscription = {
      id: 'sub_123',
      user_id: 'user_1',
      tarif_plan_id: 'pro',
      pending_plan_id: null,
      status: 'ACTIVE',
      is_valid: true,
      days_remaining: 30,
      started_at: '2025-01-01',
      expires_at: '2025-02-01',
      cancelled_at: null,
      paused_at: null
    };
    store.error = 'Some error';
    store.loading = true;

    store.reset();

    expect(store.subscription).toBeNull();
    expect(store.usage).toBeNull();
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });
});
