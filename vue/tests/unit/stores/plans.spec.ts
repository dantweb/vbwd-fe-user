import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlansStore } from '../../../src/stores/plans';
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

describe('PlansStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with empty plans list', () => {
    const store = usePlansStore();

    expect(store.plans).toEqual([]);
    expect(store.selectedPlan).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('fetches available plans', async () => {
    const store = usePlansStore();

    const mockPlans = [
      {
        id: 'free',
        name: 'Free',
        slug: 'free',
        display_price: 0,
        display_currency: 'EUR'
      },
      {
        id: 'pro',
        name: 'Pro',
        slug: 'pro',
        display_price: 29,
        display_currency: 'EUR'
      }
    ];

    vi.mocked(api.get).mockResolvedValue({ plans: mockPlans, currency: 'EUR', country: null });

    await store.fetchPlans();

    expect(api.get).toHaveBeenCalledWith('/tarif-plans');
    expect(store.plans).toEqual(mockPlans);
  });

  it('handles fetch error gracefully', async () => {
    const store = usePlansStore();

    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    await expect(store.fetchPlans()).rejects.toThrow();
    expect(store.error).toBe('Network error');
    expect(store.loading).toBe(false);
  });

  it('selects a plan', () => {
    const store = usePlansStore();
    store.plans = [
      { id: 'free', name: 'Free', slug: 'free', display_price: 0, display_currency: 'EUR' },
      { id: 'pro', name: 'Pro', slug: 'pro', display_price: 29, display_currency: 'EUR' }
    ] as never;

    store.selectPlan('pro');

    expect(store.selectedPlan?.id).toBe('pro');
  });

  it('subscribes to a plan', async () => {
    const store = usePlansStore();
    store.plans = [
      { id: 'pro', name: 'Pro', slug: 'pro', display_price: 29, display_currency: 'EUR' }
    ] as never;

    vi.mocked(api.post).mockResolvedValue({
      subscription_id: 'sub_123',
      checkout_url: 'https://checkout.example.com/session_123'
    });

    const result = await store.subscribe('pro');

    expect(api.post).toHaveBeenCalledWith('/subscriptions', { plan_id: 'pro' });
    expect(result.subscription_id).toBe('sub_123');
  });

  it('gets plan by ID', () => {
    const store = usePlansStore();
    store.plans = [
      { id: 'free', name: 'Free', slug: 'free', display_price: 0, display_currency: 'EUR' },
      { id: 'pro', name: 'Pro', slug: 'pro', display_price: 29, display_currency: 'EUR' }
    ] as never;

    const plan = store.getPlanById('pro');

    expect(plan?.id).toBe('pro');
  });

  it('returns undefined for non-existent plan', () => {
    const store = usePlansStore();
    store.plans = [
      { id: 'free', name: 'Free', slug: 'free', display_price: 0, display_currency: 'EUR' }
    ] as never;

    const plan = store.getPlanById('enterprise');

    expect(plan).toBeUndefined();
  });

  it('resets store state', () => {
    const store = usePlansStore();
    store.plans = [{ id: 'free', name: 'Free', slug: 'free', display_price: 0, display_currency: 'EUR' }] as never;
    store.selectedPlan = { id: 'free', name: 'Free', slug: 'free', display_price: 0, display_currency: 'EUR' } as never;
    store.error = 'Some error';
    store.loading = true;

    store.reset();

    expect(store.plans).toEqual([]);
    expect(store.selectedPlan).toBeNull();
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });
});
