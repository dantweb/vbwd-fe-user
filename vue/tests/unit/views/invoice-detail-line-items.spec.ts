/**
 * TDD: fe-user InvoiceDetail line items must be fully clickable rows
 * that navigate to the correct detail page using catalog_item_id.
 *
 * Bugs:
 * 1. itemLink used /dashboard/plans/ (plural) — route is /dashboard/plan/ (singular)
 * 2. Type switch used lowercase 'subscription' but API returns 'SUBSCRIPTION'
 * 3. Only the description cell had a link — entire row must be clickable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { invoiceId: 'inv-uuid-1' } }),
  useRouter: () => ({ push: mockPush }),
  RouterLink: { template: '<a><slot /></a>', props: ['to'] },
}))

vi.mock('@/api', () => ({
  api: { get: vi.fn() },
}))

import InvoiceDetail from '../../../src/views/InvoiceDetail.vue'
import { api } from '@/api'

const mockGet = vi.mocked(api.get)

const baseInvoice = {
  id: 'inv-uuid-1',
  invoice_number: 'INV-001',
  status: 'PAID',
  amount: '29.99',
  currency: 'USD',
  created_at: '2026-01-01T00:00:00Z',
}

function mountView() {
  setActivePinia(createPinia())
  return mount(InvoiceDetail, {
    global: {
      mocks: { $t: (k: string) => k },
      stubs: { RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
    },
  })
}

describe('InvoiceDetail line items — clickable rows', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPush.mockClear()
  })

  it('SUBSCRIPTION row click navigates to /dashboard/plan/:catalog_item_id', async () => {
    mockGet.mockResolvedValue({
      ...baseInvoice,
      line_items: [{
        type: 'SUBSCRIPTION',
        item_id: 'sub-uuid-111',
        catalog_item_id: 'plan-uuid-999',
        description: 'Pro Plan - Monthly',
        quantity: 1,
        unit_price: '29.99',
        total_price: '29.99',
      }],
    })

    const wrapper = mountView()
    await flushPromises()

    const row = wrapper.find('tbody tr')
    expect(row.exists()).toBe(true)
    expect(row.attributes('style')).toContain('cursor: pointer')
    await row.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/plan/plan-uuid-999')
    expect(mockPush).not.toHaveBeenCalledWith('/dashboard/plans/plan-uuid-999')
  })

  it('subscription lowercase type also navigates (case insensitive)', async () => {
    mockGet.mockResolvedValue({
      ...baseInvoice,
      line_items: [{
        type: 'subscription',
        item_id: 'sub-uuid-111',
        catalog_item_id: 'plan-uuid-999',
        description: 'Pro Plan',
        quantity: 1,
        unit_price: '29.99',
        total_price: '29.99',
      }],
    })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('tbody tr').trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/plan/plan-uuid-999')
  })

  it('TOKEN_BUNDLE row click navigates to /dashboard/tokens/:catalog_item_id', async () => {
    mockGet.mockResolvedValue({
      ...baseInvoice,
      line_items: [{
        type: 'TOKEN_BUNDLE',
        item_id: 'purchase-uuid-222',
        catalog_item_id: 'bundle-uuid-888',
        description: '100 Token Bundle',
        quantity: 1,
        unit_price: '9.99',
        total_price: '9.99',
      }],
    })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('tbody tr').trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/tokens/bundle-uuid-888')
  })

  it('ADD_ON row click navigates to /dashboard/add-ons/info/:catalog_item_id', async () => {
    mockGet.mockResolvedValue({
      ...baseInvoice,
      line_items: [{
        type: 'ADD_ON',
        item_id: 'addon-sub-333',
        catalog_item_id: 'addon-uuid-777',
        description: 'Email Add-On',
        quantity: 1,
        unit_price: '4.99',
        total_price: '4.99',
      }],
    })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('tbody tr').trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/add-ons/info/addon-uuid-777')
  })

  it('row without catalog_item_id is not clickable (no cursor: pointer)', async () => {
    mockGet.mockResolvedValue({
      ...baseInvoice,
      line_items: [{
        type: 'SUBSCRIPTION',
        item_id: 'sub-uuid-111',
        // no catalog_item_id
        description: 'Pro Plan',
        quantity: 1,
        unit_price: '29.99',
        total_price: '29.99',
      }],
    })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.find('tbody tr').trigger('click')

    expect(mockPush).not.toHaveBeenCalled()
  })
})
