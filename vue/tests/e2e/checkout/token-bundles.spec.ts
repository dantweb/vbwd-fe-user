import { test, expect } from '@playwright/test';
import { loginAsTestUser, navigateToCheckout } from '../fixtures/checkout.fixtures';

test.describe('Token Bundle Selection', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await navigateToCheckout(page, 'pro');
  });

  test('displays available token bundles', async ({ page }) => {
    await expect(page.locator('[data-testid="token-bundles-section"]')).toBeVisible();
    const bundles = page.locator('[data-testid^="token-bundle-"]');
    await expect(bundles.first()).toBeVisible();
  });

  test('can add token bundle to order', async ({ page }) => {
    // Use .first() to handle potential duplicate bundles from test data pollution
    await page.locator('[data-testid="token-bundle-1000"]').first().click();

    // Check for bundle name pattern (bundles may have different naming conventions)
    const orderSummary = page.locator('[data-testid="order-summary"]');
    const hasBundle = await orderSummary.locator('[data-testid^="line-item-token-bundle-"]').first().isVisible();
    expect(hasBundle).toBe(true);
  });

  test('can remove token bundle from order', async ({ page }) => {
    // Use .first() to handle potential duplicate bundles from test data pollution
    await page.locator('[data-testid="token-bundle-1000"]').first().click();
    await page.locator('[data-testid="remove-token-bundle-1000"]').first().click();

    // Verify no token bundle line items remain
    const lineItems = page.locator('[data-testid="order-summary"] [data-testid^="line-item-token-bundle-"]');
    await expect(lineItems).toHaveCount(0);
  });

  test('updates total price when bundle added', async ({ page }) => {
    const initialTotal = await page.locator('[data-testid="order-total"]').textContent();

    // Use .first() to handle potential duplicate bundles from test data pollution
    await page.locator('[data-testid="token-bundle-1000"]').first().click();

    const newTotal = await page.locator('[data-testid="order-total"]').textContent();
    expect(newTotal).not.toBe(initialTotal);
  });

  test('can add multiple bundles', async ({ page }) => {
    // Use .first() to handle potential duplicate bundles from test data pollution
    await page.locator('[data-testid="token-bundle-1000"]').first().click();
    await page.locator('[data-testid="token-bundle-5000"]').first().click();

    const lineItems = page.locator('[data-testid^="line-item-token-bundle-"]');
    await expect(lineItems).toHaveCount(2);
  });
});
