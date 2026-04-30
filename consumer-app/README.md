# Queen Consumer App (Expo)

The customer-facing mobile app for **Queen by Atelier Élevé**: browse curated luxury restaurants, build a cart, place an order, send packages by drone, and track delivery in real time.

## Setup

```bash
cd consumer-app
cp .env.example .env
npm install
npx expo start
```

## Required env

| Key                                 | Notes                                      |
| ----------------------------------- | ------------------------------------------ |
| `EXPO_PUBLIC_API_URL`               | Defaults to `http://localhost:3000/api/v1` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard                       |
| `EXPO_PUBLIC_PUSHER_KEY`            | From Pusher Channels app                   |
| `EXPO_PUBLIC_PUSHER_CLUSTER`        | e.g. `mt1`                                 |
| `EXPO_PUBLIC_MAP_PROVIDER`          | `google`, `mapbox`, or `none`              |
| `EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN`   | Optional, used for Mapbox static links     |

## Folder map

```
src/
  screens/      Auth, Restaurants, RestaurantDetail, Cart, Checkout, OrderTracking, OrderHistory
  components/   RestaurantCard, MenuItemRow, StatusTimeline, DroneCanvas
  services/     api.ts, realtime.ts, types.ts
  store/        cart.ts, orders.ts (zustand)
  hooks/        useOrderUpdates.ts
  navigation/   RootNavigator.tsx
```

## Realtime channels

- `private-customer-{dbUserId}` — `order_status_updated`, `order_created`
- `drones` — `drone_location_updated`

## Phase A features

- Checkout supports `STRIPE`, `PAYSTACK`, and `FLUTTERWAVE` provider initialization.
- Expo local push notifications fire when realtime order events are received.
- Order tracking includes native map rendering (`react-native-maps`) with Google/Mapbox external routing links.
