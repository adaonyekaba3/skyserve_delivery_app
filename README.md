# SkyServe Backend

Production-ready NestJS backend scaffold for the SkyServe drone delivery platform.

## Stack

- Node.js 20 LTS
- NestJS
- PostgreSQL
- Prisma ORM
- JWT authentication
- Neon serverless Postgres ready
- Vercel deployment ready

## Modules

- `auth`
- `users`
- `restaurants`
- `orders`
- `drones`
- `deliveries`
- `health`

## Folder Structure

```text
.
├── docs/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   ├── smoke-test.mjs
│   └── verify-local.sh
├── src/
│   ├── auth/
│   ├── common/
│   ├── config/
│   ├── deliveries/
│   ├── drones/
│   ├── health/
│   ├── orders/
│   ├── prisma/
│   ├── restaurants/
│   ├── users/
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.build.json
├── tsconfig.json
└── vercel.json
```

## Neon + Vercel MVP Setup

This project is configured for a low-cost MVP workflow using **Neon serverless Postgres** and **Vercel**.

For Prisma:

- `DATABASE_URL` should use Neon’s **pooled** connection string
- `DATABASE_URL_UNPOOLED` should use Neon’s **direct** connection string for migrations

## Setup

1. Install dependencies:

```bash
nvm use 20
npm install
```

If you use `nodenv` or tools that read `.node-version`, the repo is also pinned there. If you use Volta, `package.json` includes a Node 20 pin as well.

2. Copy env values:

```bash
cp .env.example .env
```

3. Add your Neon connection strings to `.env`.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Apply the baseline migration:

```bash
npm run prisma:migrate:deploy
```

6. Seed the database:

```bash
npm run db:seed
```

7. Start the API:

```bash
npm run start:dev
```

The API base URL is:

```text
http://localhost:3000/api/v1
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-NEON-BRANCH-pooler.REGION.aws.neon.tech/skyserve?sslmode=require&pgbouncer=true&connect_timeout=15"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@YOUR-NEON-BRANCH.REGION.aws.neon.tech/skyserve?sslmode=require&connect_timeout=15"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="1d"
SEED_ADMIN_EMAIL="admin@skyserve.local"
SEED_ADMIN_PASSWORD="Admin12345!"
SEED_OPERATIONS_EMAIL="ops@skyserve.local"
SEED_OPERATIONS_PASSWORD="Ops12345!"
```

## Periodic Verification

Use this command whenever you want to verify the current backend still works against Neon:

```bash
npm run verify:local
```

It will:

1. Generate Prisma client
2. Apply migrations
3. Seed baseline data
4. Build the app
5. Boot the API locally
6. Run an end-to-end smoke test

## Automated Test Commands

Fast checks that do not require a live Neon database:

```bash
npm test
```

Controller integration tests:

```bash
npm run test:e2e
```

Full local quality gate:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Notes:

- `npm test` covers service-level business logic with mocked dependencies.
- `npm run test:e2e` covers controller boundaries and request validation without a live DB.
- `npm run verify:local` is the DB-backed check that uses your Neon connection strings.

For quick deployment-parity testing with Vercel’s local runtime:

```bash
npm run dev:vercel
```

## Vercel Deployment

The repo includes [vercel.json](/Volumes/T7/skyrunner_drone_delivery/vercel.json) with a custom build command:

```bash
npm run vercel-build
```

That command:

- generates Prisma client
- runs `prisma migrate deploy`
- builds the NestJS app

Preview deploy:

```bash
npm run deploy:preview
```

Production deploy:

```bash
npm run deploy:prod
```

Recommended Vercel setup:

1. Create a Vercel project from this repo
2. Add the Neon integration in Vercel
3. Confirm `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are available in `development`, `preview`, and `production`
4. Run a preview deploy after each major backend change

## API Routes

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Health

- `GET /api/v1/health`

### Users

- `POST /api/v1/users`
- `GET /api/v1/users`
- `GET /api/v1/users/me`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`

### Restaurants

- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/:id`
- `POST /api/v1/restaurants`
- `PATCH /api/v1/restaurants/:id`

### Orders

- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/status`

### Drones

- `POST /api/v1/drones`
- `GET /api/v1/drones`
- `GET /api/v1/drones/:id`
- `PATCH /api/v1/drones/:id`

### Deliveries

- `POST /api/v1/deliveries`
- `GET /api/v1/deliveries`
- `GET /api/v1/deliveries/:id`
- `PATCH /api/v1/deliveries/:id`

## Notes

- Authentication is JWT-based and applied globally.
- Public routes are explicitly marked with the `@Public()` decorator.
- Authorization uses role-based guards for admin and operations workflows.
- Prisma is the source of truth for users, restaurants, orders, drones, and deliveries.
- Prisma uses Neon pooled connections for runtime and unpooled connections for migrations.
- The seed script creates an admin user, an operations user, one restaurant, and one drone for smoke testing.
