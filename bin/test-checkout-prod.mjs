#!/usr/bin/env node
/**
 * Direct-API checkout smoke test for the 4 prod instances:
 *
 *   vbwd.cc          — subscription plan checkout (Pro plan)
 *   hotel.vbwd.cc    — booking checkout (dr-smith resource, next-week slot)
 *   doctor.vbwd.cc   — booking checkout
 *   ghrm.vbwd.cc     — subscription plan checkout (first plan with a positive price)
 *
 * Strategy: log in as the admin (creds from env), pick the relevant entity,
 * POST to the right /checkout endpoint with
 * payment_method_code=invoice (no real money moves), assert invoice id.
 *
 * Run:
 *   node bin/test-checkout-prod.mjs
 */

// Credentials come from the environment. Hard-coding them would leak into
// public repos — set them per-environment (e.g., via a .env file) or pass
// them inline:  VBWD_ADMIN_EMAIL=… VBWD_ADMIN_PASSWORD=… node bin/test-checkout-prod.mjs
const ADMIN_EMAIL    = process.env.VBWD_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.VBWD_ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("✗ set VBWD_ADMIN_EMAIL and VBWD_ADMIN_PASSWORD in the environment");
  process.exit(2);
}

const sites = [
  { name: "vbwd.cc",        host: "vbwd.cc",        kind: "subscription" },
  { name: "hotel.vbwd.cc",  host: "hotel.vbwd.cc",  kind: "booking"      },
  { name: "doctor.vbwd.cc", host: "doctor.vbwd.cc", kind: "booking"      },
  { name: "ghrm.vbwd.cc",   host: "ghrm.vbwd.cc",   kind: "subscription" },
];

// Pre-flight invariant: the /checkout/confirmation page must be seeded in CMS
// on every instance — otherwise the post-payment landing 404s. (See incident
// 2026-05-04: hotel.vbwd.cc was missing this page after booking checkout.)
async function checkConfirmationPageSeeded(host) {
  const r = await api(host, "GET", "/cms/pages/checkout-confirmation");
  if (r.status !== 200) {
    throw new Error(
      `/cms/pages/checkout-confirmation: HTTP ${r.status} — run populate_checkout_cms() on the api container`,
    );
  }
}

async function api(host, method, path, { token, body } = {}) {
  const url = `https://${host}/api/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}

async function login(host) {
  const r = await api(host, "POST", "/auth/login", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (r.status !== 200 || !r.json?.token) {
    throw new Error(`login ${host}: ${r.status} ${r.text.slice(0, 100)}`);
  }
  return r.json.token;
}

async function checkSubscription(host, token) {
  // Pick the lowest-priced non-free plan to keep amounts realistic.
  const plansR = await api(host, "GET", "/tarif-plans", { token });
  if (plansR.status !== 200) throw new Error(`tarif-plans: ${plansR.status}`);
  const plans = plansR.json?.plans || [];
  if (plans.length === 0) throw new Error("no plans returned");

  const paid = plans
    .filter((p) => Number(p.display_price) > 0)
    .sort((a, b) => Number(a.display_price) - Number(b.display_price));
  const plan = paid[0] || plans[0];

  const checkoutR = await api(host, "POST", "/user/checkout", {
    token,
    body: {
      plan_id: plan.id,
      token_bundle_ids: [],
      add_on_ids: [],
      payment_method_code: "invoice",
    },
  });
  if (checkoutR.status !== 200 && checkoutR.status !== 201) {
    throw new Error(`POST /user/checkout: ${checkoutR.status} ${checkoutR.text.slice(0, 200)}`);
  }
  const invoice = checkoutR.json?.invoice || checkoutR.json;
  const invoiceId =
    invoice?.id || checkoutR.json?.invoice_id || checkoutR.json?.invoice?.id;
  if (!invoiceId) {
    throw new Error(`no invoice id in response: ${checkoutR.text.slice(0, 200)}`);
  }
  return {
    plan: `${plan.name} (${plan.display_currency} ${plan.display_price})`,
    invoiceId,
    invoiceNumber: invoice?.invoice_number || checkoutR.json?.invoice_number,
  };
}

async function checkBooking(host, token) {
  const resR = await api(host, "GET", "/booking/resources", { token });
  if (resR.status !== 200) throw new Error(`/booking/resources: ${resR.status}`);
  const resources = resR.json?.resources || resR.json?.items || [];
  if (resources.length === 0) throw new Error("no booking resources");
  const resource = resources[0];

  // Find a slot for next week. Pull the resource's availability for a date a
  // few days out to dodge today's lead-time / already-booked complications.
  const target = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  // Booking schedules typically operate Mon-Fri; if next-week-same-weekday
  // lands on Sat/Sun, bump forward to Monday.
  while (target.getUTCDay() === 0 || target.getUTCDay() === 6) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  const dateStr = target.toISOString().slice(0, 10);
  const availR = await api(host, "GET", `/booking/resources/${resource.slug}/availability?date=${dateStr}`, { token });
  if (availR.status !== 200) throw new Error(`/availability: ${availR.status} ${availR.text.slice(0, 200)}`);
  const slots = availR.json?.slots || [];
  const free = slots.find((s) => (s.available_capacity ?? 1) > 0);
  if (!free) throw new Error(`no available slot on ${dateStr}: ${JSON.stringify(slots).slice(0, 200)}`);

  // Slots come back as bare HH:MM strings (e.g. "09:00"). The API expects a
  // full ISO-ish datetime like "2026-05-18T09:00:00".
  const toIso = (t) =>
    t.includes("T") ? t : `${dateStr}T${t.length === 5 ? `${t}:00` : t}`;

  const checkoutR = await api(host, "POST", "/booking/checkout", {
    token,
    body: {
      resource_slug: resource.slug,
      start_at:      toIso(free.start || free.start_at),
      end_at:        toIso(free.end   || free.end_at),
      quantity:      1,
    },
  });
  if (checkoutR.status !== 200 && checkoutR.status !== 201) {
    throw new Error(`POST /booking/checkout: ${checkoutR.status} ${checkoutR.text.slice(0, 200)}`);
  }
  const invoiceId = checkoutR.json?.invoice_id;
  if (!invoiceId) throw new Error(`no invoice_id: ${checkoutR.text.slice(0, 200)}`);
  return {
    resource: `${resource.name || resource.slug} @ ${dateStr} ${free.start?.slice(11, 16) || ""}`,
    invoiceId,
    invoiceNumber: checkoutR.json.invoice_number,
  };
}

const results = [];
for (const site of sites) {
  process.stdout.write(`▶ ${site.name.padEnd(18)} (${site.kind}) … `);
  const t0 = Date.now();
  try {
    await checkConfirmationPageSeeded(site.host);
    const token = await login(site.host);
    const out =
      site.kind === "subscription"
        ? await checkSubscription(site.host, token)
        : await checkBooking(site.host, token);
    const dt = Date.now() - t0;
    process.stdout.write(`✓ ${dt}ms — ${JSON.stringify(out)}\n`);
    results.push({ site: site.name, ok: true, ...out });
  } catch (err) {
    const dt = Date.now() - t0;
    process.stdout.write(`✗ ${dt}ms — ${err.message}\n`);
    results.push({ site: site.name, ok: false, error: err.message });
  }
}

console.log("");
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
console.log(`Summary: ${pass}/${results.length} passed${fail ? ` · ${fail} failed` : ""}`);
process.exit(fail ? 1 : 0);
