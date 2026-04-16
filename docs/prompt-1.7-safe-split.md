# Prompt 1.7 Safe Split (Vercel Deployment)

## Prompt 1.7-A - Local `vercel dev` + Config Correctness

```md
You are implementing Prompt 1.7-A for SKYRUNNER.

Objective:
Make local Vercel emulation reliable and deterministic before any cloud deployment changes. Validate that project settings, build commands, routes/functions, and local environment handling are correct.

Scope (Do):
- Inspect and normalize Vercel-related project configuration (`vercel.json` if present, framework/build settings, output directories, routes/rewrites/headers).
- Ensure local startup scripts and package scripts are consistent with Vercel expectations.
- Verify local env loading strategy (`.env.local`, `.env.development.local`, and app-specific env usage).
- Run `vercel dev` locally and fix configuration mismatches causing startup/runtime issues.
- Add lightweight docs for local Vercel workflow and troubleshooting.

Scope (Do Not):
- Do not provision or modify remote Vercel environments.
- Do not deploy to preview or production in this prompt.
- Do not rotate secrets or alter production-only settings.

Required Checks:
- `vercel --version` works and CLI auth status is confirmed.
- `vercel dev` starts successfully with no fatal config/runtime errors.
- Core app routes load locally via Vercel dev proxy.
- Any server/API handlers resolve with expected status codes locally.
- Documented command sequence is reproducible from a fresh terminal.

Implementation Guardrails:
- Keep fixes minimal and config-focused; avoid unrelated refactors.
- If framework auto-detection conflicts with explicit config, choose one source of truth and document why.
- If monorepo, ensure correct project root and build output path are explicitly set.
- Preserve existing app behavior; only correct deployment/runtime plumbing.

Deliverables:
- Updated deployment config files (only those necessary).
- Updated scripts/docs for local Vercel workflow.
- Short validation report (what failed before, what passes now).

Validation Commands:
- `pnpm install` (or project package manager equivalent)
- `vercel whoami`
- `vercel dev`
- App/framework checks (e.g. `pnpm lint`, `pnpm test` if quick and relevant)

Acceptance Criteria:
- Local Vercel emulation starts cleanly.
- No unresolved config ambiguity (root/build/output/routes clearly defined).
- Team can reproduce local run using documented commands only.

Suggested Commit Message:
`chore(deploy): align local vercel dev config and startup workflow`
```

---

## Prompt 1.7-B - Environment Provisioning + Preview/Prod Workflow

```md
You are implementing Prompt 1.7-B for SKYRUNNER.

Objective:
Establish a safe, repeatable deployment pipeline on Vercel with correctly scoped environment variables and a clear preview -> production promotion flow.

Scope (Do):
- Link project to the correct Vercel project/team.
- Define required env var matrix by environment (`development`, `preview`, `production`) and verify each variable presence.
- Provision missing env vars via Vercel CLI and/or dashboard process documentation.
- Validate preview deployment from branch commits.
- Validate production deployment/promotion workflow (without unsafe shortcuts).
- Document rollback and verification procedures.

Scope (Do Not):
- Do not hardcode secrets in repo files.
- Do not use forceful/destructive deployment actions without explicit approval.
- Do not change application business logic unless required for env compatibility.

Required Checks:
- `vercel link` points to the intended project.
- `vercel env ls` confirms required keys exist in each environment.
- Preview deploy succeeds and URL health checks pass.
- Production deploy/promotion path is documented and tested with a controlled change.
- Post-deploy smoke checks pass (critical pages/APIs).

Environment Matrix (minimum structure):
- Public client vars (safe to expose) separated from server secrets.
- Database/API/payment/auth keys explicitly scoped to preview vs production.
- Optional integrations (monitoring, analytics, webhooks) listed with fallback behavior.

Workflow Requirements:
- Branch push => preview deploy
- Validate preview (smoke tests + manual checks)
- Promote/deploy to production only after preview validation
- Record deployment metadata and rollback steps

Deliverables:
- Environment variable checklist + provisioning commands.
- Deployment runbook for preview and production.
- Smoke-test checklist with pass/fail outcomes.

Validation Commands:
- `vercel link`
- `vercel env ls`
- `vercel env pull .env.local` (when needed for local parity)
- `vercel --prod` (only when approved and after preview validation)
- Optional: `vercel inspect <deployment-url>`

Acceptance Criteria:
- Preview and production workflows are documented, tested, and repeatable.
- Environment variables are complete and correctly scoped.
- Deployment risk is reduced via explicit validation + rollback instructions.

Suggested Commit Message:
`docs(deploy): add vercel env provisioning and preview-prod release workflow`
```

---

## Recommended Execution Order

1. Run Prompt 1.7-A completely first.
2. Only after local parity is stable, run Prompt 1.7-B.

## Dependency Notes

- 1.7-B depends on 1.7-A output (stable local config prevents false deployment failures).
- If auth/payments/webhooks exist, ensure provider callback URLs are separately set for preview and production during 1.7-B.
