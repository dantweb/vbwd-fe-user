/**
 * Unit tests for CheckoutStepRegistry — Sprint 06h
 * TDD-first: tests before implementation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent } from 'vue'
import { CheckoutStepRegistry } from '../../../src/registries/checkoutStepRegistry'

const DummyStepA = defineComponent({ template: '<div>Step A</div>' })
const DummyStepB = defineComponent({ template: '<div>Step B</div>' })
const DummyCartSummary = defineComponent({ template: '<div>Cart Summary</div>' })

describe('CheckoutStepRegistry', () => {
  let registry: CheckoutStepRegistry

  beforeEach(() => {
    registry = new CheckoutStepRegistry()
  })

  describe('register / unregister', () => {
    it('registers a checkout context', () => {
      registry.register({
        plugin: 'ecommerce',
        steps: [
          { id: 'shipping-address', label: 'Address', component: DummyStepA, order: 10, plugin: 'ecommerce' },
        ],
      })
      expect(registry.getSteps()).toHaveLength(1)
    })

    it('unregisters by plugin name', () => {
      registry.register({
        plugin: 'ecommerce',
        steps: [
          { id: 'shipping', label: 'Shipping', component: DummyStepA, order: 10, plugin: 'ecommerce' },
        ],
      })
      registry.unregister('ecommerce')
      expect(registry.getSteps()).toHaveLength(0)
    })

    it('multiple plugins can register steps', () => {
      registry.register({
        plugin: 'ecommerce',
        steps: [
          { id: 'shipping-address', label: 'Address', component: DummyStepA, order: 10, plugin: 'ecommerce' },
        ],
      })
      registry.register({
        plugin: 'insurance',
        steps: [
          { id: 'insurance', label: 'Insurance', component: DummyStepB, order: 15, plugin: 'insurance' },
        ],
      })
      expect(registry.getSteps()).toHaveLength(2)
    })
  })

  describe('getSteps', () => {
    it('returns steps sorted by order', () => {
      registry.register({
        plugin: 'ecommerce',
        steps: [
          { id: 'shipping-method', label: 'Method', component: DummyStepB, order: 20, plugin: 'ecommerce' },
          { id: 'shipping-address', label: 'Address', component: DummyStepA, order: 10, plugin: 'ecommerce' },
        ],
      })
      const steps = registry.getSteps()
      expect(steps[0].id).toBe('shipping-address')
      expect(steps[1].id).toBe('shipping-method')
    })

    it('merges steps from multiple plugins sorted by order', () => {
      registry.register({
        plugin: 'ecommerce',
        steps: [
          { id: 'shipping', label: 'Shipping', component: DummyStepA, order: 20, plugin: 'ecommerce' },
        ],
      })
      registry.register({
        plugin: 'insurance',
        steps: [
          { id: 'insurance', label: 'Insurance', component: DummyStepB, order: 15, plugin: 'insurance' },
        ],
      })
      const steps = registry.getSteps()
      expect(steps[0].id).toBe('insurance')
      expect(steps[1].id).toBe('shipping')
    })

    it('returns empty array when no plugins registered', () => {
      expect(registry.getSteps()).toEqual([])
    })
  })

  describe('hasSteps', () => {
    it('returns false when no steps registered', () => {
      expect(registry.hasSteps()).toBe(false)
    })

    it('returns true when steps are registered', () => {
      registry.register({
        plugin: 'ecommerce',
        steps: [
          { id: 'address', label: 'Address', component: DummyStepA, order: 10, plugin: 'ecommerce' },
        ],
      })
      expect(registry.hasSteps()).toBe(true)
    })
  })

  describe('getCartSummary', () => {
    it('returns null when no cart summary registered', () => {
      expect(registry.getCartSummary()).toBeNull()
    })

    it('returns the registered cart summary component', () => {
      registry.register({
        plugin: 'ecommerce',
        steps: [],
        cartSummary: DummyCartSummary,
      })
      expect(registry.getCartSummary()).toBe(DummyCartSummary)
    })

    it('last registered cart summary wins', () => {
      registry.register({
        plugin: 'plugin-a',
        steps: [],
        cartSummary: DummyStepA,
      })
      registry.register({
        plugin: 'plugin-b',
        steps: [],
        cartSummary: DummyCartSummary,
      })
      expect(registry.getCartSummary()).toBe(DummyCartSummary)
    })
  })

  describe('hooks', () => {
    it('getBeforePaymentHooks returns registered hooks', () => {
      const hook = vi.fn()
      registry.register({
        plugin: 'ecommerce',
        steps: [],
        beforePayment: hook,
      })
      const hooks = registry.getBeforePaymentHooks()
      expect(hooks).toHaveLength(1)
      expect(hooks[0]).toBe(hook)
    })

    it('getAfterPaymentHooks returns registered hooks', () => {
      const hook = vi.fn()
      registry.register({
        plugin: 'ecommerce',
        steps: [],
        afterPayment: hook,
      })
      const hooks = registry.getAfterPaymentHooks()
      expect(hooks).toHaveLength(1)
    })

    it('hooks from unregistered plugin are removed', () => {
      const hook = vi.fn()
      registry.register({
        plugin: 'ecommerce',
        steps: [],
        beforePayment: hook,
      })
      registry.unregister('ecommerce')
      expect(registry.getBeforePaymentHooks()).toHaveLength(0)
    })
  })
})
