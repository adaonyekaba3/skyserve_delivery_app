#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Local smoke test for POST /api/v1/identity/webhooks/clerk.
 *
 * Usage examples:
 *   node scripts/test-clerk-webhook.mjs created  --email demo@skyserve.local
 *   node scripts/test-clerk-webhook.mjs updated  --email demo+2@skyserve.local
 *   node scripts/test-clerk-webhook.mjs deleted
 *
 * If CLERK_WEBHOOK_SECRET is set in .env, the script signs the payload with svix
 * the same way Clerk does in production. Otherwise the request is sent unsigned
 * and the server's dev fallback (no svix verification) accepts it.
 */
import 'dotenv/config';
import crypto from 'node:crypto';

const action = (process.argv[2] ?? 'created').toLowerCase();
const args = process.argv.slice(3);
const flag = (name, def) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
};

const baseUrl = flag(
  'url',
  process.env.SKYSERVE_API_BASE ?? 'http://localhost:3000',
);
const endpoint = `${baseUrl.replace(/\/$/, '')}/api/v1/identity/webhooks/clerk`;
const clerkUserId = flag(
  'clerkId',
  `user_smoke_${Math.random().toString(36).slice(2, 10)}`,
);
const email = flag('email', `${clerkUserId}@skyserve.local`);

const ACTIONS = {
  created: 'user.created',
  updated: 'user.updated',
  deleted: 'user.deleted',
};

const eventType = ACTIONS[action];
if (!eventType) {
  console.error(
    `Unknown action "${action}". Use one of: created | updated | deleted`,
  );
  process.exit(1);
}

const baseUserData = {
  id: clerkUserId,
  first_name: 'Smoke',
  last_name: 'Tester',
  primary_email_address_id: 'email_smoke',
  email_addresses: [{ id: 'email_smoke', email_address: email }],
};

const payload = {
  type: eventType,
  data:
    eventType === 'user.deleted'
      ? { id: clerkUserId, deleted: true }
      : baseUserData,
};

const body = JSON.stringify(payload);
const headers = { 'content-type': 'application/json' };

const secret = process.env.CLERK_WEBHOOK_SECRET;
if (secret) {
  const svixId = `msg_smoke_${Math.random().toString(36).slice(2, 10)}`;
  const svixTimestamp = Math.floor(Date.now() / 1000).toString();
  const signed = signSvix(secret, svixId, svixTimestamp, body);
  headers['svix-id'] = svixId;
  headers['svix-timestamp'] = svixTimestamp;
  headers['svix-signature'] = `v1,${signed}`;
  console.log(`Signing with CLERK_WEBHOOK_SECRET (svix-id=${svixId}).`);
} else {
  console.log(
    'CLERK_WEBHOOK_SECRET not set; sending unsigned (dev fallback only).',
  );
}

console.log(`POST ${endpoint}  type=${eventType}  clerkId=${clerkUserId}`);

try {
  const res = await fetch(endpoint, { method: 'POST', headers, body });
  const text = await res.text();
  console.log(`HTTP ${res.status}`);
  console.log(text);
  if (!res.ok) process.exit(1);
} catch (err) {
  console.error('Request failed:', err);
  process.exit(1);
}

function signSvix(rawSecret, svixId, timestamp, body) {
  const cleanSecret = rawSecret.startsWith('whsec_')
    ? rawSecret.slice('whsec_'.length)
    : rawSecret;
  const key = Buffer.from(cleanSecret, 'base64');
  const signedPayload = `${svixId}.${timestamp}.${body}`;
  return crypto
    .createHmac('sha256', key)
    .update(signedPayload)
    .digest('base64');
}
