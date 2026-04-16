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

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_WEBHOOK_SECRET`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_WEBHOOK_SECRET_HASH`

Provision and verify:

1. `vercel link`
2. `vercel env ls`
3. `vercel env pull .env.local`

Notes:
- If `DATABASE_URL` is still the placeholder host from `.env.example`, migration/app database calls will fail until a real Neon/Postgres host is configured.
- Keep callback/webhook URLs separately scoped for preview and production.

## Preview to Production Workflow

1. Push branch and trigger preview deploy: `npm run deploy:preview`
2. Run smoke checks on preview URL.
3. Promote after validation: `npm run deploy:prod`
4. Run post-deploy checks and capture deployment URL metadata.

## Rollback

1. Identify previous stable deployment in Vercel dashboard.
2. Promote previous deployment if regression occurs.
3. Re-run smoke checks and incident note updates.
