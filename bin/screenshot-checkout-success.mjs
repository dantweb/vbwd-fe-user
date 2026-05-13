#!/usr/bin/env node
/**
 * Screenshot the post-checkout success page on each prod instance.
 *
 * Strategy (hybrid):
 *   1. Hit the API to create a real invoice via /user/checkout or /booking/checkout
 *      — same endpoint the SPA uses, so the resulting invoice is genuine.
 *   2. Drive Chromium to /checkout/confirmation?invoice_id=<the-id>, wait for
 *      the CheckoutConfirmation widget to mount, screenshot.
 *
 * Saves PNGs into:
 *   docs/dev_log/20260510/reports/screenshots/<site>-checkout-success.png
 */
// Environment:
//   VBWD_ADMIN_EMAIL / VBWD_ADMIN_PASSWORD  required
//   OUT_DIR   destination for the PNGs (default: ./screenshots/checkout-success
//             relative to the current working dir)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ADMIN_EMAIL    = process.env.VBWD_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.VBWD_ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("✗ set VBWD_ADMIN_EMAIL and VBWD_ADMIN_PASSWORD in the environment");
  process.exit(2);
}
const OUT_DIR = process.env.OUT_DIR || resolve(process.cwd(), "screenshots", "checkout-success");
mkdirSync(OUT_DIR, { recursive: true });

const sites = [
  { name: "vbwd.cc",        host: "vbwd.cc",        kind: "subscription" },
  { name: "hotel.vbwd.cc",  host: "hotel.vbwd.cc",  kind: "booking"      },
  { name: "doctor.vbwd.cc", host: "doctor.vbwd.cc", kind: "booking"      },
  { name: "ghrm.vbwd.cc",   host: "ghrm.vbwd.cc",   kind: "subscription" },
];

async function api(host, method, path, { token, body } = {}) {
  const url = `https://${host}/api/v1${path}`;
  const r = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}

async function login(host) {
  const r = await api(host, "POST", "/auth/login", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (r.status !== 200 || !r.json?.token) {
    throw new Error(`login: ${r.status} ${r.text.slice(0, 200)}`);
  }
  return r.json.token;
}

async function createSubscriptionInvoice(host, token) {
  const plansR = await api(host, "GET", "/tarif-plans", { token });
  const plans  = plansR.json?.plans || [];
  const paid   = plans
    .filter((p) => Number(p.display_price) > 0)
    .sort((a, b) => Number(a.display_price) - Number(b.display_price));
  const plan = paid[0] || plans[0];

  const r = await api(host, "POST", "/user/checkout", {
    token,
    body: {
      plan_id: plan.id,
      token_bundle_ids: [],
      add_on_ids: [],
      payment_method_code: "invoice",
    },
  });
  const invoice = r.json?.invoice || r.json;
  const invoiceId = invoice?.id || r.json?.invoice_id;
  if (!invoiceId) throw new Error(`subscription checkout: ${r.status} ${r.text.slice(0, 200)}`);
  return invoiceId;
}

async function createBookingInvoice(host, token) {
  const resources = (await api(host, "GET", "/booking/resources", { token })).json?.resources || [];
  const resource  = resources[0];
  if (!resource) throw new Error("no booking resources");

  const target = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  while (target.getUTCDay() === 0 || target.getUTCDay() === 6) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  const dateStr = target.toISOString().slice(0, 10);

  const slots = (await api(host, "GET", `/booking/resources/${resource.slug}/availability?date=${dateStr}`, { token })).json?.slots || [];
  const free  = slots.find((s) => (s.available_capacity ?? 1) > 0);
  if (!free) throw new Error(`no slot on ${dateStr}`);

  const toIso = (t) => t.includes("T") ? t : `${dateStr}T${t.length === 5 ? `${t}:00` : t}`;

  const r = await api(host, "POST", "/booking/checkout", {
    token,
    body: {
      resource_slug: resource.slug,
      start_at:      toIso(free.start),
      end_at:        toIso(free.end),
      quantity:      1,
    },
  });
  const invoiceId = r.json?.invoice_id;
  if (!invoiceId) throw new Error(`booking checkout: ${r.status} ${r.text.slice(0, 200)}`);
  return invoiceId;
}

async function main() {
  const browser = await chromium.launch();
  const errors = [];

  for (const site of sites) {
    process.stdout.write(`▶ ${site.name.padEnd(18)} … `);
    const t0 = Date.now();
    try {
      const token     = await login(site.host);
      const invoiceId =
        site.kind === "subscription"
          ? await createSubscriptionInvoice(site.host, token)
          : await createBookingInvoice(site.host, token);

      // Browser context with the auth token pre-seeded into localStorage so
      // the SPA recognises us as the buyer (the confirmation view fetches
      // /api/v1/user/invoices/<id> and that needs auth).
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
      await ctx.addInitScript((t) => {
        // SPA reads the JWT from localStorage('auth_token') —
        // see vbwd-fe-user/vue/src/api/index.ts. Anything else triggers
        // the "Session Expired" modal on /checkout/confirmation.
        localStorage.setItem("auth_token", t);
      }, token);

      const page = await ctx.newPage();
      const url = `https://${site.host}/checkout/confirmation?invoice_id=${invoiceId}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 25_000 });

      // Wait for the actual confirmation widget to mount, not just the page shell.
      await page.locator('[data-testid="confirmation-banner"]').first()
        .waitFor({ state: "visible", timeout: 20_000 });

      // Give it a beat for the invoice fetch to populate the table.
      await page.waitForTimeout(800);

      const out = resolve(OUT_DIR, `${site.name.replace(/\./g, "-")}-checkout-success.png`);
      await page.screenshot({ path: out, fullPage: true });
      const dt = Date.now() - t0;
      console.log(`✓ ${dt}ms  invoice=${invoiceId}\n  → ${out}`);
      await ctx.close();
    } catch (err) {
      const dt = Date.now() - t0;
      console.log(`✗ ${dt}ms  ${err.message}`);
      errors.push({ site: site.name, err: err.message });
    }
  }

  await browser.close();
  console.log("");
  console.log(errors.length === 0
    ? `✓ all ${sites.length} screenshots saved to ${OUT_DIR}`
    : `✗ ${errors.length}/${sites.length} failed:\n  ${errors.map(e => `${e.site}: ${e.err}`).join("\n  ")}`);
  process.exit(errors.length ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
