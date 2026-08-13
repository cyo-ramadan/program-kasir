# MAXI AI Access Quickstart

Status: ACTIVE shortcut  
Authority: Bos Cyo  
Purpose: give AI sessions a fast, verified path to GitHub and Cloudflare tooling without asking Bos Cyo for plaintext credentials.

> SECURITY RULE: this file records credential NAMES, approved storage locations, workflows, request paths, and verification steps. It MUST NOT contain plaintext API tokens, passwords, private keys, secret values, or exported credentials.

## 1. Read this before asking Bos Cyo for access

1. Read the active MAXI protocol / onboarding manual first.
2. Check whether the required GitHub connector/tool is already available.
3. For Prototype Leker, check the **Cloudflare Git Integration check on current `main` before asking for Cloudflare API credentials**.
4. Check repository-owned workflows or automation bridges only after the canonical Git Integration path is understood.
5. If a credential is genuinely required and missing, ask Bos Cyo only to provision it in the provider secret store. Never ask Bos Cyo to paste the secret into chat.

Canonical protocol repository: `cyo-ramadan/maxi-protocol`.

Relevant protocol docs:
- `manuals/MAXI_AI_ONBOARDING.md`
- `runbooks/GITHUB_AUTOMATION.md`
- `standards/PROTOTYPE_ENVIRONMENT_AND_DEPLOYMENT.md`

## 2. GitHub access

### Preferred path: connected GitHub tool

When the AI environment has the GitHub connector/tool, use it directly for repository reads/writes, branches, PRs, commit/check status, and logs. Do not request a PAT merely because a raw terminal is unavailable.

### Automation repository

Shared automation / transport repository: `cyo-ramadan/program-kasir`.

This repository contains request/result bridges and live/recovery workflows. It is NOT the source of truth for Prototype Leker runtime code.

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
- production branch: `main`
- Cloudflare account: `Daily Napkin`
- Worker: `prototype-leker-v2`
- D1 database: `prototype-leker-db`
- D1 database ID: `6977b54c-afce-4275-a0ad-d28e7d942e19`
- Wrangler binding: `DB`
- Migration directory: `migrations`
- Live URL: `https://prototype-leker-v2.daily-napkin.workers.dev`
- Worker config: `prototype-leker/wrangler.jsonc`

## 4. Prototype Leker canonical Cloudflare path — use this first

Prototype Leker has an active **Cloudflare Workers Git Integration** connected to `cyo-ramadan/prototype-leker` `main`.

Normal path:

`AI edit/test → merge/push main → Cloudflare GitHub App check → repository npm run deploy → D1 migrations → Worker deploy → live smoke`.

The repository-owned deploy command is:

```bash
npm run db:migrations:apply && npx wrangler deploy
```

The deployment check visible from GitHub is named:

`Workers Builds: prototype-leker-v2`

and is owned by the **Cloudflare Workers and Pages** GitHub App.

### Critical shortcut for AI sessions

If current `prototype-leker/main` has `Workers Builds: prototype-leker-v2` and that check is `SUCCESS`, Cloudflare-side credentials are already functioning through Git Integration. **Do not ask Bos Cyo for `CLOUDFLARE_API_TOKEN` merely because a separate GitHub Actions deploy job is red.**

A GitHub Actions secret-based deployment check can fail independently while the canonical Cloudflare Git App deployment succeeds. Evaluate the checks by owner/name, not by one combined red/green impression.

To trigger the canonical route when a deployment is needed, make the approved code/docs change on `main` through the normal merge flow and monitor the Cloudflare App check. Do not create meaningless temp files just to trigger a build unless performing an explicitly documented recovery operation.

## 5. Cloudflare credential names — fallback only

Credential names used by secret-based fallback workflows:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

These are not required to be readable by the AI when the canonical Cloudflare Git Integration is healthy.

### Prototype Leker GitHub Actions fallback

`cyo-ramadan/prototype-leker/.github/workflows/ci-deploy.yml`

The production job declares GitHub Environment `production` and may read:

- `secrets.CLOUDFLARE_API_TOKEN`
- `secrets.CLOUDFLARE_ACCOUNT_ID`

Intended provisioning location for that fallback path:

`cyo-ramadan/prototype-leker` -> GitHub Settings -> Environments -> `production` -> Environment secrets.

If this job fails only because those secrets are missing while `Workers Builds: prototype-leker-v2` is SUCCESS, canonical deployment is not blocked. Report the fallback job separately rather than asking Bos Cyo for a token unnecessarily.

If Git Integration itself is unavailable and the fallback is actually required, report `BLOCKED: CLOUDFLARE_CREDENTIAL_NOT_PROVISIONED` and give Bos Cyo the shortest provider-side provisioning instruction. Never ask for the token value in chat.

### Recovery / bridge path

Fallback automation also exists in:

`cyo-ramadan/program-kasir/.github/workflows/prototype-leker-cloudflare-recovery.yml`

Trigger path:

`cloudflare-requests/prototype-leker-*.json`

This recovery workflow expects the same two secret names in `cyo-ramadan/program-kasir`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Use this only when the canonical Git Integration is unavailable or an explicit recovery operation requires the bridge. Do not treat it as the normal deploy path.

## 6. D1 migration and recovery shortcut

Do not equate D1 migration ledger rows with guaranteed schema completeness.

During the 2026-08-13 Accounting deployment incident, remote D1 reported migrations through `0022` as applied while `transaction_accounting_mappings` and `transaction_accounting_snapshots` were absent. The canonical Cloudflare build therefore failed at `0023`.

Approved diagnostic/recovery pattern:

1. inspect `wrangler d1 migrations list DB --remote`;
2. inspect exact affected objects via `sqlite_schema` / `PRAGMA table_info(...)`;
3. capture D1 Time Travel checkpoint or approved backup before mutation;
4. never rewrite an already-applied migration to hide remote drift;
5. recreate only objects proven missing using the authoritative versioned migration definition;
6. resume `wrangler d1 migrations apply DB --remote`;
7. restore the normal repo deploy command;
8. verify a subsequent normal Cloudflare Git Build is green;
9. remove any temporary diagnostic/recovery asset and prove it is no longer public.

The 2026-08-13 incident is resolved and remote Prototype Leker D1 is migrated through `0026_accounting_six_decimal_precision.sql`.

## 7. Repository-owned Wrangler commands

When an AI environment already has authorized Cloudflare credentials, or when commands execute inside the authorized Cloudflare Git Build, use repository config:

```bash
# from cyo-ramadan/prototype-leker
npm run check
npm test

# inspect pending migrations
npx --yes wrangler d1 migrations list DB --remote

# optional approved recovery checkpoint
npx --yes wrangler d1 time-travel info DB --json

# migrate dedicated prototype D1
npx --yes wrangler d1 migrations apply DB --remote

# deploy permanent Worker
npx --yes wrangler deploy
```

Do not substitute another database/account for convenience. `wrangler.jsonc` is the repository-owned resource configuration.

## 8. Live verification

Primary endpoint:

`https://prototype-leker-v2.daily-napkin.workers.dev`

Reusable live smoke:

`cyo-ramadan/program-kasir/.github/workflows/prototype-leker-live-smoke.yml`

Current smoke verifies:

- customer, cashier, and branch admin surfaces are served;
- Accounting workspace asset is served and contains Data Akun, Buat Jurnal, Data Jurnal, Buku Besar, Rugi Laba, and Neraca;
- Setting Akuntansi comfort asset is served and contains Aturan Transaksi / two-column journal mapping layout;
- unauthenticated Accounting/Setting APIs return `401` instead of schema/runtime `5xx`;
- temporary D1 diagnostic assets are absent (`404`).

## 9. What to do when an AI says "I need the token"

Do this instead:

1. verify connected GitHub tool access;
2. inspect current `prototype-leker/main` check runs;
3. look specifically for `Workers Builds: prototype-leker-v2` from the Cloudflare GitHub App;
4. if it is healthy, use/monitor Git Integration and do not ask for a token;
5. inspect secret-based GitHub Actions only as a separate fallback path;
6. if both canonical Git Integration and all authorized alternatives are unavailable, identify the exact secret NAME + approved secret store and request provider-side provisioning only;
7. retry through the approved existing route.

Never solve access friction by committing a secret, pasting a secret into chat, echoing it in Actions, or creating an undocumented credential path.

## 10. Fast routing table

| Need | First place to go |
|---|---|
| Read/write GitHub repo | Connected GitHub tool |
| MAXI governance/manual | `cyo-ramadan/maxi-protocol` |
| Shared GitHub automation | `cyo-ramadan/program-kasir` |
| Prototype Leker source | `cyo-ramadan/prototype-leker` |
| Prototype Leker normal deploy | Cloudflare Git App check `Workers Builds: prototype-leker-v2` on `main` |
| Repository deploy command | `npm run deploy` |
| Prototype Leker secret-based fallback | `prototype-leker/.github/workflows/ci-deploy.yml` |
| Prototype Leker Cloudflare recovery bridge | `program-kasir/.github/workflows/prototype-leker-cloudflare-recovery.yml` |
| Prototype Leker live smoke | `program-kasir/.github/workflows/prototype-leker-live-smoke.yml` |
| Cloudflare prototype account | `Daily Napkin` |
| Prototype Leker D1 | `prototype-leker-db`, binding `DB` |

## 11. Maintenance rule

This is a shortcut, not a replacement for the MAXI onboarding/manuals. When credential names, workflow paths, repository boundaries, Cloudflare resources, or canonical deploy route change, update this file in the same changeset. Secret VALUES remain outside Git forever.
