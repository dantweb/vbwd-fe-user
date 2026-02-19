import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useInvoicesStore } from '../../../src/stores/invoices';
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

describe('InvoicesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with empty invoices list', () => {
    const store = useInvoicesStore();

    expect(store.invoices).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('fetches invoices list', async () => {
    const store = useInvoicesStore();

    const mockInvoices = [
      {
        id: 'inv_1',
        number: 'INV-001',
        date: '2025-01-01',
        amount: '$29.00',
        status: 'paid'
      },
      {
        id: 'inv_2',
        number: 'INV-002',
        date: '2025-02-01',
        amount: '$29.00',
        status: 'pending'
      }
    ];

    vi.mocked(api.get).mockResolvedValue({ invoices: mockInvoices });

    await store.fetchInvoices();

    expect(api.get).toHaveBeenCalledWith('/user/invoices');
    expect(store.invoices).toEqual(mockInvoices);
  });

  it('handles fetch error gracefully', async () => {
    const store = useInvoicesStore();

    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    await expect(store.fetchInvoices()).rejects.toThrow();
    expect(store.error).toBe('Network error');
    expect(store.loading).toBe(false);
  });

  it('downloads invoice PDF', async () => {
    const store = useInvoicesStore();

    vi.mocked(api.get).mockResolvedValue({
      downloadUrl: 'https://example.com/invoices/inv_1.pdf'
    });

    const result = await store.downloadInvoice('inv_1');

    expect(api.get).toHaveBeenCalledWith('/user/invoices/inv_1/download');
    expect(result.downloadUrl).toBeDefined();
  });

  it('sets loading state during fetch', async () => {
    const store = useInvoicesStore();

    vi.mocked(api.get).mockResolvedValue({ invoices: [] });

    const promise = store.fetchInvoices();
    expect(store.loading).toBe(true);

    await promise;
    expect(store.loading).toBe(false);
  });

  it('resets store state', () => {
    const store = useInvoicesStore();
    store.invoices = [{ id: 'inv_1', invoice_number: 'INV-001', invoiced_at: '2025-01-01', amount: '$29.00', status: 'paid' }] as never;
    store.error = 'Some error';
    store.loading = true;

    store.reset();

    expect(store.invoices).toEqual([]);
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });
});
