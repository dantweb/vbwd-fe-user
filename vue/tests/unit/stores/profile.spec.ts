import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProfileStore } from '../../../src/stores/profile';
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

describe('ProfileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with empty profile', () => {
    const store = useProfileStore();

    expect(store.profile).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading state during fetch', async () => {
    const store = useProfileStore();

    vi.mocked(api.get).mockResolvedValue({
      user: { id: '1', email: 'john@example.com', status: 'active', role: 'user' },
      details: { first_name: 'John', last_name: 'Doe' }
    });

    const promise = store.fetchProfile();
    expect(store.loading).toBe(true);

    await promise;
    expect(store.loading).toBe(false);
  });

  it('fetches profile from API', async () => {
    const store = useProfileStore();

    vi.mocked(api.get).mockResolvedValue({
      user: { id: '1', email: 'john@example.com', status: 'active', role: 'user' },
      details: { first_name: 'John', last_name: 'Doe' }
    });

    await store.fetchProfile();

    expect(api.get).toHaveBeenCalledWith('/user/profile');
    expect(store.profile).toEqual({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  it('handles fetch error gracefully', async () => {
    const store = useProfileStore();

    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    await expect(store.fetchProfile()).rejects.toThrow();
    expect(store.error).toBe('Network error');
    expect(store.loading).toBe(false);
  });

  it('updates profile with valid data', async () => {
    const store = useProfileStore();
    store.profile = { id: '1', name: 'John', email: 'john@example.com' };

    vi.mocked(api.put).mockResolvedValue({});

    await store.updateProfile({ name: 'Jane' });

    expect(api.put).toHaveBeenCalledWith('/user/details', { first_name: 'Jane', last_name: '' });
    expect(store.profile?.name).toBe('Jane');
  });

  it('changes password with current password validation', async () => {
    const store = useProfileStore();

    vi.mocked(api.post).mockResolvedValue({ success: true });

    const result = await store.changePassword('oldpass', 'newpass');

    expect(api.post).toHaveBeenCalledWith('/user/change-password', {
      currentPassword: 'oldpass',
      newPassword: 'newpass'
    });
    expect(result.success).toBe(true);
  });

  it('resets store state', () => {
    const store = useProfileStore();
    store.profile = { id: '1', name: 'John', email: 'john@example.com' };
    store.error = 'Some error';
    store.loading = true;

    store.reset();

    expect(store.profile).toBeNull();
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });
});
