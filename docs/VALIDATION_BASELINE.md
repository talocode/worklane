# Validation Baseline

This document captures the current full-validation status on `main` after installing dependencies and re-running the merged automation-stack checks.

## Commands That Pass

### `npm run test:tool-gateway`

- Result: pass
- Category: validation
- Blocks current feature: no

### `npm run test:automation`

- Result: pass
- Category: validation
- Blocks current feature: no

### `npx tsx scripts/test-automation-approvals-v010.mjs`

- Result: pass
- Category: validation
- Blocks current feature: no

### `npm run test:execution`

- Result: pass
- Category: validation
- Blocks current feature: no

### `npx tsx scripts/test-worklane-hardening.mts`

- Result: pass
- Category: validation
- Blocks current feature: no

### `npx tsx scripts/test-worklane-mvp.mts`

- Result: pass
- Category: validation
- Blocks current feature: no

## Commands That Do Not Pass Cleanly

### `npm run typecheck`

- Result: failed
- Failure category: missing script
- Detail: root `package.json` does not define a `typecheck` script
- Blocks current feature: no
- Recommended next fix: add an explicit workspace typecheck strategy instead of relying on an undeclared root command

### `npm run build`

- Result: failed
- Failure category: mixed code issue and workspace packaging issue
- Blocks current feature: partially

Current failure groups:

1. Dashboard API route import paths still contain unresolved relative imports in some nested routes.
2. `packages/data` still has TypeScript issues outside the targeted queue fix:
   - `src/approvals.ts` uses a `draft` transition that is not represented in the `TaskRun['status']` union.
   - `src/tools/github.ts` passes typed inputs into validators that currently expect `Record<string, unknown>`.
   - `src/tools/github.ts` still contains an implicit-`any` callback parameter.
3. Older workspace packages outside the merged automation stack still fail type resolution against internal package names such as `@talocode/worklane-core`, `@talocode/worklane-providers`, `@talocode/worklane-agents`, `@talocode/worklane-memory`, `@talocode/worklane-workflows`, and `@talocode/worklane-connectors`.
4. `apps/api-server` and `apps/telegram-bot` also have existing implicit-`any` errors.

Recommended next fix:

- First finish the dashboard nested-route import cleanup and the remaining `packages/data` type issues.
- After that, decide whether to add proper workspace project references or local path mappings so the older packages can resolve each other during `tsc` builds.

### `npm run lint`

- Result: failed
- Failure category: missing script and incomplete lint setup
- Blocks current feature: no

Current failure groups:

1. Several workspaces do not define a `lint` script at all, so the root workspace fan-out fails immediately.
2. `apps/dashboard` runs `next lint`, but the repo does not yet have a completed ESLint setup for that app, so the command stops at the interactive bootstrap prompt.

Recommended next fix:

- Add non-interactive lint scripts only where the repo intends to support them.
- Add an explicit dashboard ESLint configuration before relying on `next lint` in workspace-wide CI.

## Environment Notes

- Dependency installation succeeded with `npm install` on the second attempt after an initial timeout.
- The install surfaced npm audit warnings, but those did not block the targeted validation commands above.
- Stateful tests should continue to be run one-by-one because they share `.worklane` local files.
