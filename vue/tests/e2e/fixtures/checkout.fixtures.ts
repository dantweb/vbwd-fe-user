import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123@',
};

export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', TEST_USER.email);
  await page.fill('[data-testid="password"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

export async function navigateToCheckout(page: Page, planSlug: string = 'pro'): Promise<void> {
  await page.goto(`/checkout/${planSlug}`);
}

export async function selectPlanFromList(page: Page): Promise<void> {
  await page.goto('/plans');
  await page.click('[data-testid^="select-plan-"]');
  await page.waitForURL(/\/checkout\//);
}

/**
 * Fill out checkout form requirements to enable the confirm button
 * Requirements: billing address, payment method, terms acceptance
 *
 * Note: Requires payment methods to be configured in admin panel.
 * If no payment methods exist, this will throw an error.
 */
export async function fillCheckoutRequirements(page: Page): Promise<void> {
  // Wait for checkout form to load
  await page.waitForSelector('[data-testid="order-summary"]');

  // Wait for billing address block to load (it fetches countries async)
  await page.waitForSelector('[data-testid="billing-address-block"]');
  await page.waitForSelector('[data-testid="billing-street"]', { timeout: 5000 });

  // Fill billing address (required fields: street, city, zip, country)
  await page.fill('[data-testid="billing-street"]', '123 Test Street');
  await page.fill('[data-testid="billing-city"]', 'Test City');
  await page.fill('[data-testid="billing-zip"]', '12345');

  // Select first country option
  const countrySelect = page.locator('[data-testid="billing-country"]');
  await countrySelect.selectOption({ index: 1 });

  // Wait for payment methods block to finish loading
  await page.waitForSelector('[data-testid="payment-methods-block"]');
  // Wait for loading indicator to disappear
  await page.waitForSelector('[data-testid="payment-methods-loading"]', { state: 'hidden', timeout: 10000 }).catch(() => {});

  // Select first payment method if available
  const paymentMethod = page.locator('[data-testid^="payment-method-"]').first();
  const paymentMethodCount = await page.locator('[data-testid^="payment-method-"]').count();
  if (paymentMethodCount > 0) {
    await paymentMethod.click();
  }

  // Accept terms checkbox
  const termsCheckbox = page.locator('[data-testid="terms-checkbox"] input[type="checkbox"]');
  await termsCheckbox.check();

  // Wait for button to be enabled (with longer timeout for async validation)
  await page.waitForSelector('[data-testid="confirm-checkout"]:not([disabled])', { timeout: 10000 });
}
