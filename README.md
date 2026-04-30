# Queen by Atelier Élevé — Backend (modular monolith)

Queen by Atelier Élevé is a premium drone-delivery logistics platform for affluent Lagos neighborhoods (Ikoyi, Banana Island, Victoria Island, Lekki). This repository hosts the modular-monolith-first backend that powers the Queen consumer app, the Queen Vendor Console, and Queen Operations.

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
