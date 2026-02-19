import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistry, PlatformSDK } from '@vbwd/view-component';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} })
}));

describe('Plugin i18n Integration', () => {
  let registry: PluginRegistry;
  let sdk: PlatformSDK;
  let mockMerge: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registry = new PluginRegistry();
    mockMerge = vi.fn();
    sdk = new PlatformSDK({ global: { mergeLocaleMessage: mockMerge } });
    vi.clearAllMocks();
  });

  it('should add landing1 EN translations on install', async () => {
    const { landing1Plugin } = await import('../../../../plugins/landing1');
    registry.register(landing1Plugin);
    await registry.installAll(sdk);

    const en = sdk.getTranslations()['en'] as Record<string, unknown>;
    expect(en).toHaveProperty('landing1');
    expect((en.landing1 as Record<string, unknown>).title).toBe('Choose Your Plan');
  });

  it('should add landing1 DE translations on install', async () => {
    const { landing1Plugin } = await import('../../../../plugins/landing1');
    registry.register(landing1Plugin);
    await registry.installAll(sdk);

    const de = sdk.getTranslations()['de'] as Record<string, unknown>;
    expect(de).toHaveProperty('landing1');
    expect((de.landing1 as Record<string, unknown>).title).toBe('Wählen Sie Ihren Tarif');
  });

  it('should add checkout translations on install', async () => {
    const { checkoutPlugin } = await import('../../../../plugins/checkout');
    registry.register(checkoutPlugin);
    await registry.installAll(sdk);

    const en = sdk.getTranslations()['en'] as Record<string, unknown>;
    expect(en).toHaveProperty('checkout');
    expect((en.checkout as Record<string, unknown>).title).toBe('Checkout');
  });

  it('should add stripe translations on install', async () => {
    const { stripePaymentPlugin } = await import('../../../../plugins/stripe-payment');
    registry.register(stripePaymentPlugin);
    await registry.installAll(sdk);

    const en = sdk.getTranslations()['en'] as Record<string, unknown>;
    expect(en).toHaveProperty('stripe');
  });

  it('should add paypal translations on install', async () => {
    const { paypalPaymentPlugin } = await import('../../../../plugins/paypal-payment');
    registry.register(paypalPaymentPlugin);
    await registry.installAll(sdk);

    const en = sdk.getTranslations()['en'] as Record<string, unknown>;
    expect(en).toHaveProperty('paypal');
  });

  it('should add yookassa translations on install', async () => {
    const { yookassaPaymentPlugin } = await import('../../../../plugins/yookassa-payment');
    registry.register(yookassaPaymentPlugin);
    await registry.installAll(sdk);

    const en = sdk.getTranslations()['en'] as Record<string, unknown>;
    expect(en).toHaveProperty('yookassa');
  });

  it('should call mergeLocaleMessage for each plugin locale', async () => {
    const { landing1Plugin } = await import('../../../../plugins/landing1');
    registry.register(landing1Plugin);
    await registry.installAll(sdk);

    // landing1 calls addTranslations('en', ...) and addTranslations('de', ...)
    expect(mockMerge).toHaveBeenCalledWith('en', expect.objectContaining({ landing1: expect.any(Object) }));
    expect(mockMerge).toHaveBeenCalledWith('de', expect.objectContaining({ landing1: expect.any(Object) }));
  });

  it('should verify global en.json has no plugin keys', async () => {
    const en = await import('../../../src/i18n/locales/en.json');
    expect(en).not.toHaveProperty('landing1');
    expect(en).not.toHaveProperty('checkout');
    expect(en).not.toHaveProperty('stripe');
    expect(en).not.toHaveProperty('paypal');
    expect(en).not.toHaveProperty('yookassa');
  });

  it('should not collide when multiple plugins installed', async () => {
    const { landing1Plugin } = await import('../../../../plugins/landing1');
    const { checkoutPlugin } = await import('../../../../plugins/checkout');
    registry.register(landing1Plugin);
    registry.register(checkoutPlugin);
    await registry.installAll(sdk);

    const en = sdk.getTranslations()['en'] as Record<string, unknown>;
    expect(en).toHaveProperty('landing1');
    expect(en).toHaveProperty('checkout');
  });

  it('should work for plugins without translations', async () => {
    // A minimal plugin with no addTranslations call
    const minimalPlugin = {
      name: 'no-i18n',
      version: '1.0.0',
      _active: false,
      install() { /* no translations */ },
      activate() { },
      deactivate() { }
    };
    registry.register(minimalPlugin);
    await registry.installAll(sdk);
    // Should not throw
    expect(sdk.getTranslations()).toBeDefined();
  });
});
