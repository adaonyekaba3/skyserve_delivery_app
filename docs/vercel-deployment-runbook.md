# Vercel Deployment Runbook

## Local Parity

1. Install dependencies: `npm install`
2. Copy env file: `cp .env.example .env`
3. Start local app: `npm run start:dev`
4. Start Vercel local runtime (non-interactive): `npx vercel dev --yes`
5. Verify endpoints:
   - `GET /api/v1/identity/me`
   - `GET /api/v1/orders`
   - `GET /api/v1/operator/dashboard`

## Environment Provisioning

Required variables for `development`, `preview`, and `production`:

- `DATABASE_URL` (provisioned in Production + Preview/`chore/neon-env-update`)
- `DATABASE_URL_UNPOOLED` (provisioned in Production + Preview/`chore/neon-env-update`)
- `CLERK_SECRET_KEY` (pending real key)
- `CLERK_PUBLISHABLE_KEY` (pending real key)
- `CLERK_WEBHOOK_SECRET` (pending real key)
- `PAYSTACK_SECRET_KEY` (pending real key)
- `PAYSTACK_WEBHOOK_SECRET` (pending real key)
- `FLUTTERWAVE_SECRET_KEY` (pending real key)
- `FLUTTERWAVE_WEBHOOK_SECRET_HASH` (pending real key)

Provision and verify:

1. `vercel link`
2. `vercel env ls`
3. `vercel env pull .env.local`

Add a value non-interactively (the CLI v52 requires `--value` and a branch for Preview):

```bash
vercel env add DATABASE_URL production --value "$DB_POOLED_URL" --yes
vercel env add DATABASE_URL preview <branch> --value "$DB_POOLED_URL" --yes
```

To overwrite an existing value, remove first or pass `--force`:

```bash
vercel env rm DATABASE_URL production --yes
vercel env add DATABASE_URL production --value "$NEW_VALUE" --yes
```

Notes:
- `DrizzleService.onModuleInit()` throws `Error: DATABASE_URL is required` at startup; missing this in any environment causes `500: FUNCTION_INVOCATION_FAILED` on first request.
- Auth/payment modules do not throw at startup, so a preview can boot with only `DATABASE_URL` set; calls into Clerk/Paystack/Flutterwave will return runtime errors until their secrets are provisioned.
- Keep callback/webhook URLs separately scoped for preview and production.

## Preview to Production Workflow

1. Push branch and trigger preview deploy: `npm run deploy:preview`
2. Run smoke checks on preview URL (see "Authenticated Preview Smoke" below).
3. Promote after validation: `npm run deploy:prod`
4. Run post-deploy checks and capture deployment URL metadata.

## Authenticated Preview Smoke

Vercel **Deployment Protection** is enabled, so plain `curl` against any preview URL returns `HTTP/2 401` from `server: Vercel` with a `_vercel_sso_nonce` cookie. That is the SSO challenge — not an app failure. For Phase 1 we accept this as the smoke ceiling and use the following acceptance signals:

1. `npx vercel inspect <preview-url>` returns `status: ● Ready` and lists serverless lambdas.
2. `curl -I <preview-url>` returns `401` from `server: Vercel` (SSO wall) — **not** the `500: FUNCTION_INVOCATION_FAILED` HTML page.
3. (Optional, when needed) `npx vercel logs <deployment-id> --no-follow` is free of `Error: DATABASE_URL is required` or other startup throws.

To run a deeper smoke that traverses the SSO wall, either:
- Generate a Vercel **Protection Bypass for Automation** token in the project settings and pass it as `x-vercel-protection-bypass: <token>` (and `x-vercel-set-bypass-cookie: true`) on `curl`.
- Or temporarily disable Deployment Protection for testing and re-enable afterwards.

## Rollback

1. Identify previous stable deployment in Vercel dashboard.
2. Promote previous deployment if regression occurs.
3. Re-run smoke checks and incident note updates.
