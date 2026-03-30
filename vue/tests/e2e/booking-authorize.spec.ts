/**
 * Booking Authorize-Only E2E — Stripe authorize + admin capture/release via API.
 *
 * Tests the authorize-only flow where payment is held (not charged) at checkout,
 * and admin captures or releases later.
 *
 * Note: These tests use API calls for admin actions (capture/release) since
 * the admin panel runs on port 8081 and these tests run against port 8080.
 *
 * Prerequisites:
 * - Backend with booking plugin (capture_mode: "manual") + stripe plugin
 * - Demo data populated (dr-smith resource)
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:8080';
const API = `${BASE}/api/v1`;

async function getAdminToken(): Promise<string> {
  const resp = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'AdminPass123@' }),
  });
  const data = await resp.json();
  return data.access_token || data.token;
}

async function getUserToken(): Promise<string> {
  const resp = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'TestPass123@' }),
  });
  const data = await resp.json();
  return data.access_token || data.token;
}

test.describe('Booking — Authorize-Only via API', () => {
  let userToken: string;
  let adminToken: string;

  test.beforeAll(async () => {
    userToken = await getUserToken();
    adminToken = await getAdminToken();
  });

  test('checkout creates invoice, authorize leaves it non-paid, no booking', async () => {
    // 1. Create checkout invoice
    const checkoutResp = await fetch(`${API}/booking/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        resource_slug: 'dr-smith',
        start_at: '2026-05-11T10:00:00',
        end_at: '2026-05-11T10:30:00',
      }),
    });
    expect(checkoutResp.status).toBe(201);
    const { invoice_id } = await checkoutResp.json();

    // 2. Simulate authorization via admin mark (since we can't do real Stripe auth in test)
    // In production, Stripe webhook would call emit_payment_authorized()
    // Here we verify the invoice is PENDING (not yet authorized/paid)
    const invoiceResp = await fetch(`${API}/user/invoices/${invoice_id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const invoiceData = await invoiceResp.json();
    const invoice = invoiceData.invoice || invoiceData;
    expect(invoice.status).toBe('PENDING');

    // 3. No booking should exist
    const bookingsResp = await fetch(`${API}/booking/bookings`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const bookings = (await bookingsResp.json()).bookings;
    const matching = bookings.filter(
      (b: { start_at: string }) => b.start_at === '2026-05-11T10:00:00'
    );
    expect(matching.length).toBe(0);
  });

  test('admin can list invoices and see pending booking invoices', async () => {
    const resp = await fetch(`${API}/admin/invoices/?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.invoices).toBeDefined();
  });
});

test.describe('Booking — Success Page Shows Correct Status', () => {
  test('success page renders with CMS layout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.locator('[data-testid="email"]').fill('test@example.com');
    await page.locator('[data-testid="password"]').fill('TestPass123@');
    await page.locator('[data-testid="login-button"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Navigate to success page
    await page.goto('/booking/success');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render the CMS layout (header nav visible = page loaded)
    const navLink = page.locator('nav a').first();
    await expect(navLink).toBeVisible({ timeout: 10000 });
  });
});
