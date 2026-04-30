# Queen by Atelier Élevé — Frontend Runbook

This runbook covers local development for:

- Backend API (`/Volumes/T7/skyrunner_drone_delivery`)
- Consumer Expo app (`/consumer-app`)
- Restaurant Expo app (`/restaurant-app`)
- Admin Next.js dashboard (`/admin-dashboard`)
- Drone telemetry simulator (`scripts/drones-simulator.mjs`)

## 1) Backend setup

From repo root:

```bash
npm install
cp .env.example .env
```

Fill required `.env` values:

- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
- `ALLOW_DEV_TOKEN=true` (for local simulator/dev token flows)

Initialize database:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Start API:

```bash
npm run start:dev
```

API base URL used by frontends:

- `http://localhost:3000/api/v1`

## 2) Consumer app (`/consumer-app`)

```bash
cd consumer-app
cp .env.example .env
npm install
npx expo start
```

Set env:

- `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=...`
- `EXPO_PUBLIC_PUSHER_KEY=...`
- `EXPO_PUBLIC_PUSHER_CLUSTER=mt1`
- `EXPO_PUBLIC_MAP_PROVIDER=google` (or `mapbox` / `none`)
- `EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN=...` (optional)

Core flow:

1. Sign in/sign up with Clerk.
2. Open a restaurant and add menu items.
3. Checkout creates an order and opens tracking.
4. Tracking updates from Pusher channels.
5. Checkout defaults to Flutterwave POS with bank-transfer fallback.
6. Send Package flow is available from Home -> Send a package.

## 3) Restaurant app (`/restaurant-app`)

```bash
cd restaurant-app
cp .env.example .env
npm install
npx expo start
```

Set same API/Clerk/Pusher env values as consumer plus optional image upload vars:

- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...`
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...`

Core flow:

1. Sign in as a restaurant owner account.
2. Orders feed receives `order_created` in realtime.
3. Update status `PENDING -> ACCEPTED -> PREPARING -> PICKED_UP`.
4. Use "Manage" from the orders header for restaurant + menu CRUD.

## 4) Admin dashboard (`/admin-dashboard`)

```bash
cd admin-dashboard
cp .env.example .env.local
npm install
npm run dev
```

Open: `http://localhost:3000`

Set env:

- `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...`
- `CLERK_SECRET_KEY=...`
- `NEXT_PUBLIC_PUSHER_KEY=...`
- `NEXT_PUBLIC_PUSHER_CLUSTER=mt1`

Views:

- `/orders` realtime orders table + status filtering
- `/packages` package-delivery queue (recipient type, route, tracking token)
- `/bank-transfers` proof review queue with approve/reject actions
- `/fleet` drone list + live status/battery
- `/map` live map (Leaflet) with drone markers

## Dev auto-seed behavior

`npm run dev` now runs:

1. `npm run db:migrate`
2. `npm run seed:dev`
3. backend dev server

This auto-loads curated luxury vendors + menu data for local testing.

## 5) Drone simulator

From backend root:

```bash
OPERATOR_DEV_TOKEN=dev-token npm run sim:drones
```

Optional tuning:

- `DRONE_SIM_INTERVAL_MS=1000` for faster updates
- `API_BASE_URL=http://localhost:3000/api/v1`

The simulator:

- Reads active deliveries from Postgres.
- Moves each drone toward delivery coords.
- Calls `PATCH /api/v1/drones/:code/telemetry`.
- Triggers realtime map/fleet updates through backend Pusher publish.

## 6) Smoke checklist

1. `GET /api/v1/restaurants` returns seeded rows.
2. Consumer app can place order from menu.
3. Restaurant app receives new order without refresh.
4. Restaurant app status updates appear instantly in:
   - Consumer tracking screen
   - Admin orders table
5. Running simulator moves drones in `/map` and updates `/fleet`.
6. Restaurant app menu image picker uploads to Cloudinary when vars are set.

## 7) Mobile production deploy (EAS)

Consumer app:

```bash
cd consumer-app
npx eas login
npm run eas:build:preview
npm run eas:build:prod
```

Restaurant app:

```bash
cd restaurant-app
npx eas login
npm run eas:build:preview
npm run eas:build:prod
```

Notes:

- Both apps include `eas.json` with `development`, `preview`, and `production` profiles.
- Keep secrets in EAS environment variables; only `EXPO_PUBLIC_*` values are bundled client-side.

## 8) Clerk webhooks -> Neon user sync

The backend exposes `POST /api/v1/identity/webhooks/clerk` which:

- Verifies the `svix-id` / `svix-timestamp` / `svix-signature` headers when `CLERK_WEBHOOK_SECRET` is set.
- On `user.created` and `user.updated`: upserts a row in `users` (by `clerk_user_id`), refreshing `email`, `full_name`, and `is_active=true`. The `role` column is preserved across updates so admin/owner role assignments survive Clerk profile edits.
- On `user.deleted`: soft-deletes the row by setting `is_active=false` and tombstoning the email so re-signups don't collide with the unique index.

### Production setup

1. Deploy the backend (Vercel preview is enough to test).
2. Open the Clerk Dashboard -> Webhooks -> "Add Endpoint".
3. URL: `https://<your-deployment>/api/v1/identity/webhooks/clerk`.
4. Subscribe to `user.created`, `user.updated`, `user.deleted`.
5. Copy the signing secret (starts with `whsec_`) into Vercel env as `CLERK_WEBHOOK_SECRET` for both `preview` and `production`.

### Local setup (with ngrok)

```bash
ngrok http 3000
# copy https://<id>.ngrok-free.app
```

Then in Clerk Dashboard -> Webhooks add a second endpoint pointed at `https://<id>.ngrok-free.app/api/v1/identity/webhooks/clerk`, subscribe to the same three events, and copy the signing secret into your local `.env`:

```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

Restart the backend (`npm run start:dev`) and create / edit / delete a user in Clerk to see Neon update in real time.

### Local smoke (no Clerk dashboard required)

A smoke script generates a fake event and round-trips it through the live route:

```bash
node scripts/test-clerk-webhook.mjs created  --email demo@skyserve.local
node scripts/test-clerk-webhook.mjs updated  --email demo+2@skyserve.local --clerkId user_smoke_xxxx
node scripts/test-clerk-webhook.mjs deleted  --clerkId user_smoke_xxxx
```

When `CLERK_WEBHOOK_SECRET` is set, the script also signs the body with the same svix algorithm Clerk uses; otherwise it falls back to an unsigned request that the dev server accepts because `NODE_ENV` is not `production`.

## 9) Frontend E2E tests (Admin dashboard)

```bash
cd admin-dashboard
npm install
npm run dev
```

In another terminal:

```bash
cd admin-dashboard
npm run e2e
```
