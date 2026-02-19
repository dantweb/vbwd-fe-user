import { test, expect } from '@playwright/test';
import { loginAsTestUser, navigateToCheckout, fillCheckoutRequirements } from '../fixtures/checkout.fixtures';

test.describe('Checkout Submission', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await navigateToCheckout(page, 'pro');
    await fillCheckoutRequirements(page);
  });

  test('creates pending subscription on confirm', async ({ page }) => {
    await page.click('[data-testid="confirm-checkout"]');

    await expect(page.locator('[data-testid="checkout-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-status"]')).toHaveText('Pending');
  });

  test('shows invoice number after checkout', async ({ page }) => {
    await page.click('[data-testid="confirm-checkout"]');

    await expect(page.locator('[data-testid="invoice-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-number"]')).toContainText('INV-');
  });

  test('shows payment required message', async ({ page }) => {
    await page.click('[data-testid="confirm-checkout"]');

    await expect(page.locator('[data-testid="payment-required-message"]')).toBeVisible();
  });

  test('shows invoice line items after checkout', async ({ page }) => {
    // Note: fillCheckoutRequirements already called in beforeEach
    await page.click('[data-testid="token-bundle-1000"]');
    await page.click('[data-testid="addon-priority-support"]');
    await page.click('[data-testid="confirm-checkout"]');

    const lineItems = page.locator('[data-testid^="invoice-line-item-"]');
    await expect(lineItems).toHaveCount(3); // subscription + bundle + addon
  });

  test('shows loading state during submission', async ({ page }) => {
    await page.route('**/api/v1/user/checkout', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.click('[data-testid="confirm-checkout"]');

    // Button shows "Processing..." text during submission
    await expect(page.locator('[data-testid="confirm-checkout"]')).toContainText('Processing');
  });

  test('handles API error gracefully', async ({ page }) => {
    await page.route('**/api/v1/user/checkout', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid plan' }),
      });
    });

    await page.click('[data-testid="confirm-checkout"]');

    await expect(page.locator('[data-testid="checkout-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-error"]')).toContainText('Invalid plan');
  });

  test('disables confirm button during submission', async ({ page }) => {
    await page.route('**/api/v1/user/checkout', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.click('[data-testid="confirm-checkout"]');

    await expect(page.locator('[data-testid="confirm-checkout"]')).toBeDisabled();
  });
});
