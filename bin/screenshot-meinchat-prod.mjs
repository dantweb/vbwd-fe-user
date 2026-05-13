#!/usr/bin/env node
/**
 * Live vbwd.cc screenshot: meinchat dashboard with an active conversation
 * and the "Send tokens" dialog visible.
 *
 * Flow (all against https://vbwd.cc/api/v1):
 *   1. Log in as admin + alice; ensure both have nicknames.
 *   2. Admin starts/finds a conversation with alice.
 *   3. Both exchange a couple of messages.
 *   4. Browser-login as admin → /dashboard/messages
 *        → screenshot 1: inbox
 *      → /dashboard/messages/alice
 *        → screenshot 2: open conversation
 *      → click 'conversation-send-tokens'
 *        → screenshot 3: token transfer dialog open
 *
 * Saved into docs/dev_log/20260511/reports/screenshots/.
 */
// Environment (NO hardcoded creds — this file ships in a public repo):
//   VBWD_HOST                target host                  (default: vbwd.cc)
//   VBWD_ADMIN_EMAIL         user 1 — sender              (required)
//   VBWD_ADMIN_PASSWORD                                    (required)
//   VBWD_ADMIN_NICKNAME      meinchat handle for sender   (default: chatuser-a)
//   VBWD_PEER_EMAIL          user 2 — receiver            (required)
//   VBWD_PEER_PASSWORD                                     (required)
//   VBWD_PEER_NICKNAME       meinchat handle for receiver (default: chatuser-b)
//   OUT_DIR                  destination for PNGs         (default: ./screenshots/meinchat)
//
// Notes:
//   * 'admin' is a reserved nickname in meinchat — pick any non-reserved
//     handle for VBWD_ADMIN_NICKNAME.
//   * Pick a peer nickname that isn't already claimed on the target instance.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

function envOrDie(name) {
  const v = process.env[name];
  if (!v) { console.error(`✗ env var ${name} is required`); process.exit(2); }
  return v;
}

const HOST = process.env.VBWD_HOST || "vbwd.cc";
const ADMIN = {
  email:    envOrDie("VBWD_ADMIN_EMAIL"),
  password: envOrDie("VBWD_ADMIN_PASSWORD"),
  nickname: process.env.VBWD_ADMIN_NICKNAME || "chatuser-a",
};
const ALICE = {
  email:    envOrDie("VBWD_PEER_EMAIL"),
  password: envOrDie("VBWD_PEER_PASSWORD"),
  nickname: process.env.VBWD_PEER_NICKNAME || "chatuser-b",
};
const OUT_DIR = process.env.OUT_DIR || resolve(process.cwd(), "screenshots", "meinchat");
mkdirSync(OUT_DIR, { recursive: true });

async function api(method, path, { token, body } = {}) {
  const r = await fetch(`https://${HOST}/api/v1${path}`, {
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

async function login(user) {
  const r = await api("POST", "/auth/login", {
    body: { email: user.email, password: user.password },
  });
  if (!r.json?.token) throw new Error(`login ${user.email}: ${r.status} ${r.text.slice(0, 200)}`);
  return r.json.token;
}

async function ensureNickname(token, nickname) {
  const cur = await api("GET", "/nickname/me", { token });
  if (cur.json?.nickname === nickname) return;
  const set = await api("PUT", "/nickname/me", { token, body: { nickname } });
  if (set.status >= 400) {
    throw new Error(`set nickname ${nickname}: ${set.status} ${set.text.slice(0, 200)}`);
  }
}

async function startConversation(token, peerNickname) {
  const r = await api("POST", "/messaging/conversations", {
    token, body: { peer_nickname: peerNickname },
  });
  if (!r.json?.id) throw new Error(`start conv: ${r.status} ${r.text.slice(0, 200)}`);
  return r.json;
}

async function sendMessage(token, convId, body) {
  const r = await api("POST", `/messaging/conversations/${convId}/messages`, {
    token, body: { body },
  });
  if (r.status >= 400) throw new Error(`send msg: ${r.status} ${r.text.slice(0, 200)}`);
  return r.json;
}

async function main() {
  console.log("» api: log in as admin + alice");
  const adminToken = await login(ADMIN);
  const aliceToken = await login(ALICE);

  console.log("» api: ensure nicknames");
  await ensureNickname(adminToken, ADMIN.nickname);
  await ensureNickname(aliceToken, ALICE.nickname);

  console.log("» api: start conversation from both sides");
  // start_or_get is idempotent — both calls resolve to the same conversation id.
  // Both participants must call it so the peer is registered in their inbox.
  const convA = await startConversation(adminToken, ALICE.nickname);
  const convB = await startConversation(aliceToken, ADMIN.nickname);
  if (convA.id !== convB.id) {
    throw new Error(`conversation id mismatch: ${convA.id} vs ${convB.id}`);
  }
  const convId = convA.id;

  console.log("» api: exchange messages");
  await sendMessage(adminToken, convId, "hey alice — quick question about the platform demo");
  await sendMessage(aliceToken, convId, "sure, what's up?");
  await sendMessage(adminToken, convId, "want to grab the GHRM software catalogue copy for our deck?");
  await sendMessage(aliceToken, convId, "yep, sending it now 🚀");

  console.log("» browser: launch + login as admin");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((t) => { localStorage.setItem("auth_token", t); }, adminToken);
  const page = await ctx.newPage();

  // ─── Screenshot 1: inbox ────────────────────────────────────────────────
  await page.goto(`https://${HOST}/dashboard/messages`, { waitUntil: "networkidle", timeout: 25_000 });
  await page.locator('[data-testid="inbox-row"]').first().waitFor({ state: "visible", timeout: 15_000 });
  const inboxPath = resolve(OUT_DIR, "vbwd-cc-meinchat-1-inbox.png");
  await page.screenshot({ path: inboxPath, fullPage: true });
  console.log(`✓ ${inboxPath}`);

  // ─── Screenshot 2: active conversation ──────────────────────────────────
  await page.locator('[data-testid="inbox-row"]').first().click();
  await page.locator('[data-testid="meinchat-conversation"]').waitFor({ state: "visible", timeout: 10_000 });
  await page.locator('[data-testid="meinchat-messages"]').waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(500);
  const convPath = resolve(OUT_DIR, "vbwd-cc-meinchat-2-conversation.png");
  await page.screenshot({ path: convPath, fullPage: true });
  console.log(`✓ ${convPath}`);

  // ─── Screenshot 3: send-tokens dialog open ──────────────────────────────
  await page.locator('[data-testid="conversation-send-tokens"]').click();
  await page.locator('[data-testid="token-transfer-dialog"]').waitFor({ state: "visible", timeout: 10_000 });
  // Pre-fill the amount + a note so the dialog has visible content for the shot
  await page.locator('[data-testid="token-transfer-amount"]').fill("25");
  await page.locator('[data-testid="token-transfer-note"]').fill("for the GHRM catalogue copy");
  await page.waitForTimeout(300);
  const dialogPath = resolve(OUT_DIR, "vbwd-cc-meinchat-3-send-tokens.png");
  await page.screenshot({ path: dialogPath, fullPage: true });
  console.log(`✓ ${dialogPath}`);

  await browser.close();
  console.log(`\nAll 3 screenshots saved into ${OUT_DIR}`);
}

main().catch((err) => { console.error("✗", err.message); process.exit(1); });
