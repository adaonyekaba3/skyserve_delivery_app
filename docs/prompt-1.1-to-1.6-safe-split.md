# Prompt 1.1-1.6 Safe Split (Current Backend Repo)

This adapts the earlier split-prompt approach to the current backend-first structure (`src/modules`, `src/shared`, `drizzle`), while preserving the original intent and guardrails.

## Prompt 1.1-A - Backend Scaffold and Module Topology

```md
You are implementing Prompt 1.1-A for SKYRUNNER.

Objective:
Stabilize backend scaffold and modular topology only.

Scope (Do):
- Confirm Nest app bootstrap and module registration in `src/main.ts` and `src/app.module.ts`.
- Ensure domain modules exist and are wired under `src/modules/*`.
- Keep route prefixes/versioning and global pipes/interceptors coherent.

Scope (Do Not):
- No business logic refactors.
- No deployment changes.
- No database schema edits.

Validation:
- `npm run build`
- `npm run test -- --runInBand`

Acceptance:
- App compiles cleanly.
- Module graph is explicit and maintainable.
```

## Prompt 1.1-B - Shared Boundaries and Workspace Wiring

```md
You are implementing Prompt 1.1-B for SKYRUNNER.

Objective:
Harden shared boundary layout between `src/modules` and `src/shared`.

Scope (Do):
- Normalize reusable contracts/types in `src/shared`.
- Ensure module imports use shared abstractions where appropriate.
- Remove duplicate cross-cutting helpers left in old paths when safe.

Scope (Do Not):
- No feature expansion.
- No auth/payment provider behavior changes.

Validation:
- `npm run build`
- `npm run test`

Acceptance:
- Shared concerns are centralized.
- No cyclic/fragile dependency paths introduced.
```

## Prompt 1.1-C - Environment Templates, Hygiene, and Onboarding Docs

```md
You are implementing Prompt 1.1-C for SKYRUNNER.

Objective:
Finalize local onboarding and secret-safe repository hygiene.

Scope (Do):
- Update `.env.example` placeholders for required integrations.
- Ensure `.gitignore` and docs prevent accidental secret commits.
- Update root documentation for first-run and local checks.

Scope (Do Not):
- No real secret provisioning.
- No preview/production deployment actions.

Validation:
- Verify no real `.env` files are tracked.
- `npm run build`

Acceptance:
- New developer can boot backend from docs only.
```

## Prompt 1.2-A - Drizzle Schema Surface

```md
Objective:
Define/normalize Drizzle schema and exports in `drizzle/schema.ts` and related files.

Scope:
- Schema definitions, enums, relations, indexes only.
- No migration execution in this step.

Validation:
- `npm run db:generate`
- `npm run build`
```

## Prompt 1.2-B - Migration and Seed Workflow

```md
Objective:
Establish deterministic migration and seed workflow.

Scope:
- `drizzle/migrations/*`, migration scripts, seed execution path.
- Idempotent seed strategy and safe defaults.

Validation:
- `npm run db:migrate`
- seed command (project-specific)
```

## Prompt 1.2-C - Database Verification and Documentation

```md
Objective:
Document and verify database operational workflow.

Scope:
- Add/refresh DB runbook and troubleshooting.
- Verify schema/migration flow is reproducible.

Validation:
- `npm run db:push` (if local-safe)
- `npm run build`
```

## Prompt 1.3-A - Web/Server Auth Boundary

```md
Objective:
Complete server-side Clerk auth integration boundary for backend endpoints.

Scope:
- Guards/decorators/services under `src/modules/identity`.
- Protected route expectations and public-route escape hatches.

Validation:
- auth-related unit/e2e tests
- `npm run test`
```

## Prompt 1.3-B - Mobile Auth Contract Compatibility

```md
Objective:
Ensure backend auth contracts are mobile-compatible (token/session verification paths).

Scope:
- Backend API auth contract and claims handling only.
- No mobile UI implementation in this repo.

Validation:
- integration tests covering JWT/claims parsing
```

## Prompt 1.3-C - Webhook User Sync and Role Gates

```md
Objective:
Implement webhook verification, idempotent user sync, and role gates.

Scope:
- Webhook endpoint + signature verification.
- User upsert/update/deactivate behavior.
- Role guard consistency for operator routes.

Validation:
- webhook tests + duplicate delivery checks
- RBAC access matrix checks
```

## Prompt 1.4-A - Mobile Navigation/Auth Shell (Backend Contract Companion)

```md
Objective:
Provide backend contract support required for mobile auth-shell flows.

Scope:
- Stable identity/profile endpoints.
- Session-aware access checks used by mobile clients.

Validation:
- `npm run smoke`
```

## Prompt 1.4-B - Vendor/Cart Backend Flows

```md
Objective:
Support vendor listing and cart/order-init backend contracts for mobile clients.

Scope:
- Catalog/order read/write APIs and DTO validation.
- Pagination/filter consistency.

Validation:
- unit/e2e tests for vendors/orders contract shape
```

## Prompt 1.4-C - Address Verification and Orders Views Contract

```md
Objective:
Implement address verification policy and order-list/detail contract stability.

Scope:
- Address verify endpoint + policy messaging.
- Orders history/detail data contract for mobile surfaces.

Validation:
- negative/positive verification tests
- orders list/detail tests
```

## Prompt 1.5-A - Payments Abstraction Layer

```md
Objective:
Define stable payment provider abstraction with adapter boundaries.

Scope:
- provider ports, typed payloads, normalized errors.
- no UI/client flow in this backend repo.

Validation:
- adapter unit tests
```

## Prompt 1.5-B - Payment APIs and Webhooks

```md
Objective:
Implement initialize/verify APIs and idempotent provider webhook handling.

Scope:
- backend routes only.
- transactional order/payment state updates.

Validation:
- initialize/verify tests
- webhook signature + dedupe tests
```

## Prompt 1.5-C - Checkout Handoff Verification Contract

```md
Objective:
Expose deterministic backend verify/retry states for mobile checkout handoff.

Scope:
- consistent response states for success/failure/pending.
- recovery-safe verification endpoints.

Validation:
- end-to-end payment-state transition tests
```

## Prompt 1.6-A - Operator Dashboard RBAC API Foundation

```md
Objective:
Provide backend RBAC and summary APIs needed by operator dashboard shell.

Scope:
- role-guarded operator endpoints under `src/modules/operator`.
- summary payload contracts.

Validation:
- RBAC tests for allowed/denied roles
```

## Prompt 1.6-B - Orders Queue and Dispatch Actions

```md
Objective:
Implement backend queue/dispatch operations with lifecycle enforcement.

Scope:
- order queue filters/search contract.
- dispatch mutation with workflow orchestration checks.

Validation:
- queue and dispatch tests
- invalid transition rejection tests
```

## Prompt 1.6-C - Fleet/Shifts/Transactions Backend Contracts

```md
Objective:
Support fleet, pilot/shift operations, and transaction export APIs.

Scope:
- fleet status updates, shift CRUD constraints, transaction query/export payloads.

Validation:
- domain tests + export contract checks
```

## Prompt 1.7

Use existing document: `docs/prompt-1.7-safe-split.md`.
