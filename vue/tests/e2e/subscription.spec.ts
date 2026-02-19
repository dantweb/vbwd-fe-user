import { test, expect } from '@playwright/test';

test.describe('Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPass123@');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('displays current subscription', async ({ page }) => {
    await page.goto('/subscription');

    await expect(page.locator('[data-testid="plan-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-status"]')).toBeVisible();
  });

  test('shows usage statistics', async ({ page }) => {
    await page.goto('/subscription');

    await expect(page.locator('[data-testid="usage-api"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-storage"]')).toBeVisible();
  });

  test('can navigate to plan selection', async ({ page }) => {
    await page.goto('/subscription');
    await page.click('[data-testid="change-plan"]');

    await expect(page).toHaveURL('/plans');
  });

  test('can cancel subscription with confirmation', async ({ page }) => {
    await page.goto('/subscription');
    await page.click('[data-testid="cancel-subscription"]');

    // Confirmation modal appears
    await expect(page.locator('[data-testid="cancel-modal"]')).toBeVisible();
    await page.click('[data-testid="confirm-cancel"]');

    await expect(page.locator('[data-testid="cancellation-notice"]')).toBeVisible();
  });
});
