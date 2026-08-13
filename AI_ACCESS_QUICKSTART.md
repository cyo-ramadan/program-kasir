# MAXI AI Access Quickstart

Status: ACTIVE shortcut  
Authority: Bos Cyo  
Purpose: give AI sessions a fast, verified path to GitHub and Cloudflare tooling without asking Bos Cyo for plaintext credentials.

> SECURITY RULE: this file records credential NAMES, approved storage locations, workflows, request paths, and verification steps. It MUST NOT contain plaintext API tokens, passwords, private keys, secret values, or exported credentials.

## 1. Read this before asking Bos Cyo for access

1. Read the active MAXI protocol / onboarding manual first.
2. Check whether the required GitHub connector/tool is already available.
3. Check the repository-owned workflow or automation bridge below.
4. If a secret is missing, ask Bos Cyo only to provision it in the provider secret store. Never ask Bos Cyo to paste the secret into chat.

Canonical protocol repository: `cyo-ramadan/maxi-protocol`.

Relevant protocol docs:
- `manuals/MAXI_AI_ONBOARDING.md`
- `runbooks/GITHUB_AUTOMATION.md`
- `standards/PROTOTYPE_ENVIRONMENT_AND_DEPLOYMENT.md`

## 2. GitHub access

### Preferred path: connected GitHub tool

When the AI environment has the GitHub connector/tool, use it directly for repository reads/writes, branches, PRs, Actions status, and logs. Do not request a PAT merely because a raw terminal is unavailable.

### Automation repository

Shared automation / transport repository: `cyo-ramadan/program-kasir`.

This repository contains request/result bridges and GitHub Actions workflows. It is NOT the source of truth for Prototype Leker runtime code.

### GitHub credential names

Approved credential names used by the automation repository:

| Secret name | Purpose | Approved storage |
|---|---|---|
| `MAXI_REPO_CREATOR_TOKEN` | Create repositories, import/publish ordinary source | GitHub Actions secrets of `cyo-ramadan/program-kasir` |
| `MAXI_WIKI_TOKEN` | Privileged protocol publishing, including workflow files; legacy name retained | GitHub Actions secrets of `cyo-ramadan/program-kasir` |

Do not print, download, commit, echo, or request the values.

### Existing GitHub bridges

- Create repository: commit request JSON under `repo-requests/`; sanitized outcome appears in `repo-results/`.
- Import ordinary source: use the source request bridge documented by `runbooks/GITHUB_AUTOMATION.md`.
- Publish MAXI protocol: `protocol-requests/*.json` -> `protocol-results/*.json`.
- Prototype Leker publisher tooling: `prototype-leker-requests/*.json` -> `prototype-leker-results/*.json`.

Important: canonical Prototype Leker runtime source is `cyo-ramadan/prototype-leker`. `program-kasir/source-payloads/prototype-leker/` is tooling/snapshot material and must not be treated as runtime source of truth.

## 3. Cloudflare prototype boundary

MAXI prototype resources use Cloudflare account `Daily Napkin`.

Do NOT use Cloudflare account `Dwicahya` for prototypes. `Dwicahya` is reserved for official/production programs unless Bos Cyo explicitly reclassifies the program.

### Prototype Leker canonical resources

- GitHub repository: `cyo-ramadan/prototype-leker`
- Cloudflare account: `Daily Napkin`
- Worker: `prototype-leker-v2`
- D1 database: `prototype-leker-db`
- D1 database ID: `6977b54c-afce-4275-a0ad-d28e7d942e19`
- Wrangler binding: `DB`
- Migration directory: `migrations`
- Live URL: `https://prototype-leker-v2.daily-napkin.workers.dev`
- Worker config: `prototype-leker/wrangler.jsonc`

## 4. Cloudflare credentials

Credential names used by the repository workflows:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Canonical Prototype Leker deploy path

`cyo-ramadan/prototype-leker/.github/workflows/ci-deploy.yml`

The deploy job declares GitHub Environment `production`, then reads:

- `secrets.CLOUDFLARE_API_TOKEN`
- `secrets.CLOUDFLARE_ACCOUNT_ID`

Preferred provisioning location for this canonical path:

`cyo-ramadan/prototype-leker` -> GitHub Settings -> Environments -> `production` -> Environment secrets.

Repository-level Actions secrets can also be resolved by GitHub's `secrets` context, but the explicit `production` environment is the intended operational boundary for this deploy job.

If either credential is unavailable, report `BLOCKED: CLOUDFLARE_CREDENTIAL_NOT_PROVISIONED` and give Bos Cyo the shortest provider-side provisioning instruction. Never ask for the token value in chat.

### Recovery / bridge path

Fallback automation exists in:

`cyo-ramadan/program-kasir/.github/workflows/prototype-leker-cloudflare-recovery.yml`

Trigger path:

`cloudflare-requests/prototype-leker-*.json`

This recovery workflow expects the same two names as GitHub Actions secrets of `cyo-ramadan/program-kasir`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The recovery flow is:

1. validate credentials;
2. checkout `cyo-ramadan/prototype-leker` main;
3. run `npm run check && npm test`;
4. export a remote D1 backup;
5. preserve the backup as a GitHub Actions artifact;
6. apply remote D1 migrations;
7. deploy the Worker;
8. verify the live Accounting assets/API boundary.

Use the canonical Prototype Leker workflow first. Use the `program-kasir` recovery bridge when the canonical deploy path is unavailable or an explicit recovery operation is required.

## 5. Repository-owned Wrangler commands

When an AI environment already has authorized Cloudflare credentials, use the repository config and the same commands as the approved workflows:

```bash
# from cyo-ramadan/prototype-leker
npm run check
npm test

# backup before stateful deployment
npx --yes wrangler d1 export DB --remote --output prototype-leker-db-before-deploy.sql

# migrate the dedicated prototype D1
npx --yes wrangler d1 migrations apply DB --remote

# deploy the permanent Worker
npx --yes wrangler deploy
```

Do not manually substitute another database ID/account for convenience. `wrangler.jsonc` is the repository-owned resource configuration.

## 6. Live verification

Primary deployed endpoint:

`https://prototype-leker-v2.daily-napkin.workers.dev`

A reusable live diagnostic workflow exists at:

`cyo-ramadan/program-kasir/.github/workflows/prototype-leker-live-smoke.yml`

It checks customer, cashier, branch admin, selected assets, and `/api/menu`.

The Prototype Leker canonical deploy workflow additionally verifies Accounting assets and expects the unauthenticated Accounting settings API boundary to return `401`.

## 7. What to do when an AI says "I need the token"

Do this instead:

1. verify whether the GitHub connector can perform the task;
2. inspect the relevant existing workflow;
3. inspect Actions status/logs for a missing-secret gate;
4. identify the exact secret NAME and approved secret store;
5. if human provisioning is truly required, tell Bos Cyo exactly where to add it;
6. retry through the existing workflow.

Never solve access friction by committing a secret, pasting a secret into chat, echoing it in Actions, or creating an undocumented credential path.

## 8. Fast routing table

| Need | First place to go |
|---|---|
| Read/write GitHub repo | Connected GitHub tool |
| MAXI governance/manual | `cyo-ramadan/maxi-protocol` |
| Shared GitHub automation | `cyo-ramadan/program-kasir` |
| Prototype Leker source | `cyo-ramadan/prototype-leker` |
| Prototype Leker CI/deploy | `prototype-leker/.github/workflows/ci-deploy.yml` |
| Prototype Leker Cloudflare recovery | `program-kasir/.github/workflows/prototype-leker-cloudflare-recovery.yml` |
| Prototype Leker live smoke | `program-kasir/.github/workflows/prototype-leker-live-smoke.yml` |
| Cloudflare prototype account | `Daily Napkin` |
| Prototype Leker D1 | `prototype-leker-db`, binding `DB` |

## 9. Maintenance rule

This is a shortcut, not a replacement for the MAXI onboarding/manuals. When credential names, workflow paths, repository boundaries, or Cloudflare resources change, update this file in the same changeset. Secret VALUES remain outside Git forever.
