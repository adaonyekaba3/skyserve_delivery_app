# SkyServe Admin Dashboard (Next.js)

Web dashboard for operations:

- Orders table with status filtering
- Drone fleet panel
- Live map tracking
- Realtime updates with Pusher

## Setup

```bash
cd admin-dashboard
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required env

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`
