# SkyServe Frontend Runbook

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
5. Checkout presents Stripe/Paystack/Flutterwave provider options.

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
- `/fleet` drone list + live status/battery
- `/map` live map (Leaflet) with drone markers

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

## 8) Frontend E2E tests (Admin dashboard)

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
