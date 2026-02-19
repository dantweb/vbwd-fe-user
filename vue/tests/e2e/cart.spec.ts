import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fixtures/checkout.fixtures';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    // Clear cart before each test
    await page.evaluate(() => localStorage.removeItem('vbwd_cart'));
  });

  test('cart icon is visible in header', async ({ page }) => {
    await page.goto('/plans');
    await expect(page.locator('[data-testid="cart-icon"]')).toBeVisible();
  });

  test('cart shows zero count when empty', async ({ page }) => {
    await page.goto('/plans');
    const cartCount = page.locator('[data-testid="cart-count"]');
    // Either not visible or shows 0
    const count = await cartCount.textContent();
    expect(count === null || count === '0' || count === '').toBeTruthy();
  });

  test('adding item updates cart count', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('adding multiple items updates cart count', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();
    await page.locator('[data-testid^="add-to-cart-token-"]').nth(1).click();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2');
  });

  test('clicking cart icon opens dropdown', async ({ page }) => {
    await page.goto('/plans');
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-dropdown"]')).toBeVisible();
  });

  test('cart dropdown shows added items', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();

    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-dropdown"]')).toBeVisible();
    await expect(page.locator('[data-testid^="cart-item-"]').first()).toBeVisible();
  });

  test('can remove item from cart', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid^="remove-cart-item-"]');

    // Cart should be empty or count reduced
    const count = await page.locator('[data-testid="cart-count"]').textContent();
    expect(count === null || count === '0' || count === '').toBeTruthy();
  });

  test('cart shows total price', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();

    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('can navigate to checkout from cart', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();

    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="cart-checkout-btn"]');

    await expect(page).toHaveURL(/\/checkout/);
  });

  test('cart persists across page navigation', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    await page.goto('/add-ons');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('cart persists after page refresh', async ({ page }) => {
    await page.goto('/tokens');
    await page.locator('[data-testid^="add-to-cart-token-"]').first().click();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    await page.reload();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('empty cart shows empty state message', async ({ page }) => {
    await page.goto('/plans');
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-empty-message"]')).toBeVisible();
  });
});
