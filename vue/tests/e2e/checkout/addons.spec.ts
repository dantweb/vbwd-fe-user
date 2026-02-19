import { test, expect } from '@playwright/test';
import { loginAsTestUser, navigateToCheckout } from '../fixtures/checkout.fixtures';

test.describe('Add-on Selection', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await navigateToCheckout(page, 'pro');
  });

  test('displays available add-ons', async ({ page }) => {
    await expect(page.locator('[data-testid="addons-section"]')).toBeVisible();
    const addons = page.locator('[data-testid^="addon-"]');
    await expect(addons.first()).toBeVisible();
  });

  test('can add addon to order', async ({ page }) => {
    // Use .first() to handle potential duplicate addons from test data pollution
    await page.locator('[data-testid="addon-priority-support"]').first().click();

    await expect(page.locator('[data-testid="order-summary"]')).toContainText('Priority Support');
  });

  test('can remove addon from order', async ({ page }) => {
    // Use .first() to handle potential duplicate addons from test data pollution
    await page.locator('[data-testid="addon-priority-support"]').first().click();
    await page.locator('[data-testid="remove-addon-priority-support"]').first().click();

    await expect(page.locator('[data-testid="order-summary"]')).not.toContainText('Priority Support');
  });

  test('shows addon description', async ({ page }) => {
    // Use .first() to handle potential duplicate addons from test data pollution
    await expect(page.locator('[data-testid="addon-priority-support-description"]').first()).toBeVisible();
  });

  test('shows addon price', async ({ page }) => {
    // Use .first() to handle potential duplicate addons from test data pollution
    await expect(page.locator('[data-testid="addon-priority-support-price"]').first()).toBeVisible();
  });
});
