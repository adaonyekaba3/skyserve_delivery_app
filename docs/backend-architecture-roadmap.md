# Backend Architecture Roadmap

This repository now uses a reset architecture strategy:

- Legacy backend is archived under `legacy/backend-v1`.
- New backend uses NestJS modular monolith boundaries in `src/modules`.
- Drizzle is the sole ORM and schema source in `drizzle/schema.ts`.
- Clerk identity integration is the default authentication boundary.
- Payment integrations are adapter-driven (`paystack`, `flutterwave`).
- Deployment targets Vercel with preview and production workflows.
