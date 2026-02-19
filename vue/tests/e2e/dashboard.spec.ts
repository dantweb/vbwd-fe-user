import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fixtures/checkout.fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('displays dashboard after login', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('shows profile summary card', async ({ page }) => {
    await expect(page.locator('[data-testid="profile-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
  });

  test('shows subscription summary card', async ({ page }) => {
    await expect(page.locator('[data-testid="subscription-summary"]')).toBeVisible();
  });

  test('shows recent invoices card', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-invoices"]')).toBeVisible();
  });

  test('can navigate to profile from dashboard', async ({ page }) => {
    await page.click('text=View Profile');
    await expect(page).toHaveURL('/profile');
  });

  test('can navigate to subscription from dashboard', async ({ page }) => {
    await page.click('text=Manage Subscription');
    await expect(page).toHaveURL('/subscription');
  });

  test('can navigate to plans from dashboard', async ({ page }) => {
    await page.click('text=Browse Plans');
    await expect(page).toHaveURL('/plans');
  });

  test('can navigate to invoices from dashboard', async ({ page }) => {
    await page.click('text=View Invoices');
    await expect(page).toHaveURL('/invoices');
  });

  test('displays invoice items when invoices exist', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="recent-invoices"]');

    // Check if invoice items are visible (may be empty if no invoices)
    const invoiceItems = page.locator('[data-testid="invoice-item"]');
    const count = await invoiceItems.count();

    if (count > 0) {
      await expect(invoiceItems.first()).toBeVisible();
    } else {
      // If no invoices, check for empty state
      await expect(page.locator('text=No invoices yet')).toBeVisible();
    }
  });
});
