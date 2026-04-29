# SkyServe Restaurant App (Expo)

Restaurant-side mobile app: receive new orders in real time and update their status.

## Setup

```bash
cd restaurant-app
cp .env.example .env
npm install
npx expo start
```

## Required env

Same shape as the consumer app:

| Key | Notes |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Defaults to `http://localhost:3000/api/v1` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Same Clerk instance as consumer app |
| `EXPO_PUBLIC_PUSHER_KEY` | Same Pusher app |
| `EXPO_PUBLIC_PUSHER_CLUSTER` | e.g. `mt1` |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional for menu image uploads |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Optional unsigned upload preset |

## Realtime channels

Subscribes to `private-restaurant-{restaurantId}` for `order_created` and `order_status_updated` events. The `restaurantId` is resolved via `GET /identity/me` after sign-in.

## Allowed status transitions

`PENDING → ACCEPTED → PREPARING → PICKED_UP` (PICKED_UP signals the order is ready for the drone). `CANCELLED` is available from `PENDING`, `ACCEPTED`, or `PREPARING`. Subsequent states (`IN_FLIGHT`, `DELIVERED`) are operator-driven on the admin dashboard.

## Phase B features

- Restaurant profile editor (name/address/lat/lon) and map preview.
- Menu CRUD (create/update/delete/availability toggle).
- Expo image picker + optional Cloudinary upload for menu item images.
- Expo local push notifications for realtime order events.
