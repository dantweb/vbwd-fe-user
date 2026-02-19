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

describe('SubscriptionStore — History', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches history and populates state', async () => {
    const store = useSubscriptionStore();

    const mockSubs = [
      { id: '1', status: 'active', started_at: '2026-01-01', plan: { name: 'Pro' } },
      { id: '2', status: 'cancelled', started_at: '2025-06-01', plan: { name: 'Starter' } },
      { id: '3', status: 'expired', started_at: '2025-01-01', plan: { name: 'Free' } },
    ];

    vi.mocked(api.get).mockResolvedValue({ subscriptions: mockSubs });

    await store.fetchHistory();

    expect(api.get).toHaveBeenCalledWith('/user/subscriptions');
    expect(store.history).toHaveLength(3);
  });

  it('sorts history newest first', async () => {
    const store = useSubscriptionStore();

    const mockSubs = [
      { id: '1', status: 'expired', started_at: '2025-01-01' },
      { id: '2', status: 'active', started_at: '2026-02-01' },
      { id: '3', status: 'cancelled', started_at: '2025-06-01' },
    ];

    vi.mocked(api.get).mockResolvedValue({ subscriptions: mockSubs });

    await store.fetchHistory();

    expect(store.history[0].id).toBe('2');
    expect(store.history[1].id).toBe('3');
    expect(store.history[2].id).toBe('1');
  });

  it('sets error on fetch failure', async () => {
    const store = useSubscriptionStore();

    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    await expect(store.fetchHistory()).rejects.toThrow();
    expect(store.historyError).toBe('Network error');
    expect(store.historyLoading).toBe(false);
  });

  it('history includes plan names from API', async () => {
    const store = useSubscriptionStore();

    vi.mocked(api.get).mockResolvedValue({
      subscriptions: [
        { id: '1', status: 'active', started_at: '2026-01-01', plan: { name: 'Enterprise', slug: 'enterprise' } },
      ]
    });

    await store.fetchHistory();

    expect(store.history[0].plan?.name).toBe('Enterprise');
  });
});
