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
import { chromium } from "/Users/dantweb/dantweb/vbwd-sdk-2/vbwd-fe-user/node_modules/playwright/index.mjs";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const HOST = "vbwd.cc";
// 'admin' is a reserved nickname in meinchat — pick a regular handle.
const ADMIN = { email: "admin@vbwd.cc", password: "AdminPassword@314", nickname: "daniel" };
const ALICE = { email: "alice@vbwd.cc", password: "AlicePass123!",    nickname: "alice" };
const OUT_DIR = "/Users/dantweb/dantweb/vbwd-sdk-2/docs/dev_log/20260511/reports/screenshots";
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
  // Either no nickname OR different one — set it
  const set = await api("PUT", "/nickname/me", { token, body: { nickname } });
  if (set.status >= 400 && set.status !== 409) {
    // 409 = already taken (e.g. by self with another casing) — acceptable
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
