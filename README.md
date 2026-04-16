# Skyrunner Backend (Reset Architecture)

Skyrunner backend has been reset to a modular-monolith-first architecture.

## Legacy Archive

Previous implementation is preserved at `legacy/backend-v1`.

## New Stack

- NestJS
- Drizzle ORM + PostgreSQL
- Clerk identity integration
- Provider-agnostic payments (Paystack + Flutterwave adapters)
- Vercel deployment workflow

## Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run start:dev
```

## Deployment

```bash
npm run dev:vercel
npm run deploy:preview
npm run deploy:prod
```
