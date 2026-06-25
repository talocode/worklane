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

Exact remaining failure groups:

1. Dashboard route resolution errors still stop `next build`.

   Command:

   - `npm run build --workspace=@talocode/worklane-dashboard`

   Exact file and error excerpts:

   - `apps/dashboard/src/app/api/agent-protocol/runs/[id]/execute/route.ts`
     - `Module not found: Can't resolve '../../../../../../../../packages/data/src/agentProtocol'`
   - `apps/dashboard/src/app/api/agents/[id]/run/route.ts`
     - `Module not found: Can't resolve '../../../../../../../packages/data/src/storage'`
     - `Module not found: Can't resolve '../../../lib/api/response'`
     - `Module not found: Can't resolve '../../../lib/api/auth'`
   - `apps/dashboard/src/app/api/runs/[id]/approve/route.ts`
     - `Module not found: Can't resolve '../../../../../../lib/api/response'`

   Owner area:

   - dashboard

   Blocks current feature:

   - yes for production dashboard build

   Recommended fix:

   - correct the remaining nested route relative imports in the dashboard API tree

2. `packages/data` still fails TypeScript build.

   Command:

   - `npm run build --workspace=@talocode/worklane-data`

   Exact file and error excerpts:

   - `packages/data/src/approvals.ts(12,3)`
     - `Object literal may only specify known properties, and 'draft' does not exist in type 'Record<...>'`
   - `packages/data/src/tools/github.ts(174,52)`
     - `Argument of type 'GitHubCreateIssueInput' is not assignable to parameter of type 'Record<string, unknown>'`
   - `packages/data/src/tools/github.ts(210,54)`
     - `Argument of type 'GitHubCreateCommentInput' is not assignable to parameter of type 'Record<string, unknown>'`
   - `packages/data/src/tools/github.ts(285,51)`
     - `Argument of type 'GitHubListIssuesInput' is not assignable to parameter of type 'Record<string, unknown>'`
   - `packages/data/src/tools/github.ts(337,49)`
     - `Argument of type 'GitHubGetIssueInput' is not assignable to parameter of type 'Record<string, unknown>'`
   - `packages/data/src/tools/github.ts(412,58)`
     - `Argument of type 'GitHubListIssueCommentsInput' is not assignable to parameter of type 'Record<string, unknown>'`
   - `packages/data/src/tools/github.ts(524,53)`
     - `Argument of type 'GitHubSearchIssuesInput' is not assignable to parameter of type 'Record<string, unknown>'`
   - `packages/data/src/tools/github.ts(549,29)`
     - `Parameter 'i' implicitly has an 'any' type`

   Owner area:

   - packages/data

   Blocks current feature:

   - partly; targeted automation-stack behavior is usable, but package build is not clean

   Recommended fix:

   - align `TaskRun['status']` and `VALID_TRANSITIONS`
   - change the GitHub validator signatures to accept the typed inputs they are called with, or narrow inputs before calling the validators
   - add the missing callback type in `packages/data/src/tools/github.ts`

3. Older workspace packages still fail internal package typing.

   Command:

   - `npm run build`

   Exact file and error excerpts:

   - `apps/api-server/src/index.ts`
     - `Could not find a declaration file for module '@talocode/worklane-core'`
     - `Could not find a declaration file for module '@talocode/worklane-providers'`
     - `Could not find a declaration file for module '@talocode/worklane-agents'`
     - `Could not find a declaration file for module '@talocode/worklane-workflows'`
   - `apps/telegram-bot/src/index.ts`
     - same class of missing declaration errors for `@talocode/worklane-core`, `@talocode/worklane-providers`, `@talocode/worklane-agents`, `@talocode/worklane-workflows`, `@talocode/worklane-connectors`
   - `packages/agents/src/index.ts` and `packages/agents/src/__tests__/index.test.ts`
     - `Could not find a declaration file for module '@talocode/worklane-core'`
   - `packages/cli/src/cli.ts` and `packages/cli/src/index.ts`
     - missing declaration files for several internal packages
   - `packages/connectors/src/index.ts`
     - `Could not find a declaration file for module '@talocode/worklane-core'`
   - `packages/memory/src/index.ts`
     - missing declaration file for `@talocode/worklane-core`
   - `packages/providers/src/index.ts`
     - missing declaration file for `@talocode/worklane-core`
   - `packages/workflows/src/index.ts`
     - missing declaration file for `@talocode/worklane-core`

   Owner area:

   - workspace package wiring / older packages

   Blocks current feature:

   - no for the focused automation stack tests, yes for full workspace build health

   Recommended fix:

   - add proper declaration output/project references/path mappings for the older internal packages so workspace `tsc` builds can resolve each package cleanly

4. Older app packages also still contain implicit-type issues.

   Command:

   - `npm run build`

   Exact file and error excerpts:

   - `apps/api-server/src/index.ts`
     - `Parameter 'a' implicitly has an 'any' type`
     - `Parameter 'w' implicitly has an 'any' type`
   - `apps/telegram-bot/src/index.ts`
     - `Parameter 'request' implicitly has an 'any' type`
     - `Parameter 'a' implicitly has an 'any' type`
   - `packages/cli/src/cli.ts`
     - `'provider' is of type 'unknown'`

   Owner area:

   - older packages

   Blocks current feature:

   - no for targeted usage, yes for full workspace build

   Recommended fix:

   - type the older package callbacks and narrow unknown provider values before field access

Recommended next fix:

- First finish the dashboard nested-route import cleanup and the remaining `packages/data` type issues.
- After that, decide whether to add proper workspace project references or local path mappings so the older packages can resolve each other during `tsc` builds.

### `npm run lint`

- Result: failed
- Failure category: missing script and incomplete lint setup
- Blocks current feature: no

Exact remaining failure groups:

1. Root workspace lint fan-out hits many missing scripts.

   Command:

   - `npm run lint`

   Exact workspace errors:

   - `apps/api-server`: `Missing script: "lint"`
   - `apps/telegram-bot`: `Missing script: "lint"`
   - `packages/agents`: `Missing script: "lint"`
   - `packages/cli`: `Missing script: "lint"`
   - `packages/connectors`: `Missing script: "lint"`
   - `packages/core`: `Missing script: "lint"`
   - `packages/data`: `Missing script: "lint"`
   - `packages/memory`: `Missing script: "lint"`
   - `packages/providers`: `Missing script: "lint"`
   - `packages/workflows`: `Missing script: "lint"`

   Owner area:

   - workspace config

   Blocks current feature:

   - no

   Recommended fix:

   - either add `lint` scripts where intended, or stop using a blanket workspace `npm run lint --workspaces` command

2. Dashboard lint is not configured non-interactively yet.

   Commands:

   - `npm run lint`
   - `npm run lint --workspace=@talocode/worklane-dashboard`

   Exact error excerpt:

   - `? How would you like to configure ESLint?`
   - `Strict (recommended)` / `Base` / `Cancel`

   Owner area:

   - dashboard / ESLint setup

   Blocks current feature:

   - no for current automation behavior, yes for automated lint in CI

   Recommended fix:

   - add an explicit dashboard ESLint configuration so `next lint` does not stop on the bootstrap prompt

Recommended next fix:

- Add non-interactive lint scripts only where the repo intends to support them.
- Add an explicit dashboard ESLint configuration before relying on `next lint` in workspace-wide CI.

## Environment Notes

- Dependency installation succeeded with `npm install` on the second attempt after an initial timeout.
- The install surfaced npm audit warnings, but those did not block the targeted validation commands above.
- Stateful tests should continue to be run one-by-one because they share `.worklane` local files.
