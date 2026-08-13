# Prototype Leker Session Handoff — Accounting & Deployment

Status: TEMPORARY PROJECT HANDOFF — DELETE OR REPLACE WHEN SUPERSEDED  
Date: 2026-08-13  
Authority: Bos Cyo

This document is a session-continuity aid, not the architecture source of truth. Active MAXI protocol, repository documentation, contracts, ADRs, source code, tests, and current GitHub state remain authoritative.

Google Drive mirror created during the originating session:
`HANDOFF - Prototype Leker - Accounting & Deployment - 2026-08-13`

## 1. New-session start sequence

Before changing code:

1. Read `cyo-ramadan/maxi-protocol/manuals/MAXI_AI_ONBOARDING.md`.
2. Read the active MAXI Quick Gate and Engineering Constitution.
3. Read `cyo-ramadan/program-kasir/AI_ACCESS_QUICKSTART.md` for GitHub/Cloudflare access routing.
4. Verify `cyo-ramadan/prototype-leker` current `main` HEAD and GitHub Actions status; do not assume the SHA below is still current.
5. Read Prototype Leker active README, relevant contracts, ADRs, Known Issues, Known Pitfalls, migrations, and tests.
6. Check concurrent AI/PR/commit activity. If another AI is touching the same area, report the overlap before editing it.

## 2. Repository / environment identity

Canonical runtime repository:
`cyo-ramadan/prototype-leker`

Do not treat `program-kasir/source-payloads/prototype-leker/` as runtime source of truth.

Cloudflare prototype environment:

- account: `Daily Napkin`
- Worker: `prototype-leker-v2`
- D1: `prototype-leker-db`
- D1 ID: `6977b54c-afce-4275-a0ad-d28e7d942e19`
- binding: `DB`
- migrations: `migrations`
- live URL: `https://prototype-leker-v2.daily-napkin.workers.dev`

Never use the `Dwicahya` Cloudflare database/account for Prototype Leker unless Bos Cyo explicitly reclassifies the program.

## 3. Git history produced in the originating Accounting session

The previously stacked work was promoted to `main` in this order:

- PR #4 — Product Master / Purchase / Exact Costing
  - merge commit: `e45eb580af4971ca7f7e468fd432d53f6c564ccd`
  - main CI #161: PASS
- PR #5 — Accounting Settings / Warehouse Settings
  - merge commit: `282537479535afb5f1ec57e35ced60c0ef6d8f52`
  - main CI #162: PASS
- PR #6 — Accounting Workspace / Financial Reports / POS Accounting Bridge
  - merge commit: `c623078dd74351f64ec5540a10641b84e62772d1`
  - main CI #163: PASS

PR #3 was intentionally not merged wholesale because it overlaps Accounting integration with an older/stale architecture. Audit it before taking any concept from it.

## 4. Important concurrent update after the Accounting merge

After the session-level PRs above were merged, another AI advanced Prototype Leker `main` to:

`f50aa22c83204f04d8540f3964252c4f77ded87b`

Commit message:
`ci: restore canonical Cloudflare migration deploy`

This commit restored a canonical deploy job in:

`.github/workflows/ci-deploy.yml`

The workflow now performs:

`quality -> D1 backup -> remote migration -> Worker deploy -> Accounting live verification`

Do not overwrite this workflow from the older session snapshot without first auditing current `main`.

## 5. Deployment status at handoff update

GitHub Actions run #167 for `f50aa22...`:

- `Check & Test`: PASS
- `Backup, Migrate & Deploy Cloudflare`: FAIL at `Validate Cloudflare credentials`
- remote D1 backup: NOT RUN
- remote migrations: NOT RUN
- Worker deploy: NOT RUN
- live Accounting verification: NOT RUN

The deploy job received empty values for:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Therefore production deployment is currently BLOCKED by Cloudflare credential provisioning in GitHub Actions. Do not report the Accounting deployment as live until a later run proves backup, migration, deploy, and live verification all passed.

Canonical deploy job declares GitHub Environment `production`; preferred secret provisioning is therefore the `production` environment of `cyo-ramadan/prototype-leker`.

There is also a recovery workflow in `cyo-ramadan/program-kasir/.github/workflows/prototype-leker-cloudflare-recovery.yml`, triggered by `cloudflare-requests/prototype-leker-*.json`. Its first run also failed at credential validation because the Cloudflare secrets were not provisioned there.

Never ask Bos Cyo to paste these values into chat. See `AI_ACCESS_QUICKSTART.md` for the approved access path.

## 6. Accounting vs Accounting Settings boundary

Bos Cyo explicitly separated the two concepts.

### Accounting

Accounting is the working module and owns:

- account creation / maintenance;
- automatic unique account-code generation;
- manual journal creation;
- posted journal data;
- General Ledger / Buku Besar;
- Profit & Loss / Rugi Laba;
- Balance Sheet / Neraca;
- journal posting integrity;
- reversal / correction of posted history.

### Accounting Settings

Accounting Settings is configuration only. It determines how business transaction components map to Accounting accounts.

Examples:

- Uang Laci -> Kas
- QRIS -> Bank or QRIS receivable/clearing account
- EDC -> bank/receivable account
- Jenis Barang Pentol -> relevant Revenue / Inventory / COGS accounts
- Operasional component -> selected Expense account

Accounting Settings must not become a second journal workspace or a second Chart of Accounts owner.

## 7. Accounting Settings UX direction

Bos Cyo rejected the earlier rule-editor UX as too technical/confusing.

Desired transaction-centric visual model:

- dark left navigation/sidebar;
- transaction categories listed on the left;
- selected transaction editor on the right;
- explicit side-by-side `DEBIT | KREDIT` columns;
- multiple components allowed on either side;
- simple journal preview;
- technical source types hidden behind operational wording;
- account list read-only in Settings because accounts are maintained in Accounting;
- on narrow/mobile screens, retain Debit/Kredit side-by-side and allow horizontal scroll instead of stacking them vertically.

For Penjualan, user mental model is approximately:

```text
DEBIT                         KREDIT
Uang Laci -> Kas              Jenis Barang Pentol -> Pendapatan Pentol
QRIS -> Bank/Piutang QRIS     Jenis Barang Leker -> Pendapatan Leker
EDC -> Piutang EDC            Jenis Barang Minuman -> Pendapatan Minuman
+ tambah komponen             + tambah komponen
```

For Operasional:

```text
DEBIT                         KREDIT
Beban Listrik -> akun         Uang Laci -> Kas
Beban Gas -> akun             Transfer -> Bank
Beban Sewa -> akun            Hutang -> Utang Usaha
+ tambah komponen             + tambah komponen
```

## 8. Accounting Workspace already implemented

The Accounting workspace built in PR #6 includes:

- Data Akun;
- create account with server-generated unique code;
- Buat Jurnal manual multi-line Debit/Kredit;
- Data Jurnal;
- Buku Besar;
- Rugi Laba;
- Neraca;
- Sync Transaksi POS / Accounting bridge visibility.

Newly created account code format at this prototype layer is currently similar to `ACC-000001`.

Manual journal and system/POS journal use the same Accounting posting entry point and journal store.

Posted journals are immutable; corrections must use reversal/adjustment behavior rather than editing posted history.

## 9. POS -> Accounting architecture

Boundary:

```text
POS committed business fact
        -> Integration Bridge
        -> Accounting Settings resolver
        -> Accounting postJournal()
        -> Data Jurnal
        -> General Ledger / P&L / Balance Sheet
```

POS owns business facts only. POS must not insert journal rows directly or own account/debit-credit interpretation.

Bridge contract introduced:
`MAXI_ACCOUNTING_POS_BRIDGE_V1`

Supported fact types at this stage:

- SALE -> `sale`
- PURCHASE -> `purchase_material`
- EXPENSE -> `operational`

Bridge delivery/reconciliation state is stored separately. Expected statuses include:

- `POSTED`
- `NEEDS_CONFIGURATION`
- `FAILED`
- `NOT_ATTEMPTED`

If a valid POS transaction commits but Accounting configuration is incomplete, the POS fact remains successful and Accounting delivery becomes `NEEDS_CONFIGURATION`. This prevents cashier/customer duplicate transactions caused by retrying an already-committed sale.

## 10. Payment-method follow-up

Some legacy cashier flows still expose generic choices such as `CASH` / `NON_CASH`.

Target behavior:

- cashier payment options should load active `payment_methods` from Accounting Settings;
- examples may include Uang Laci, QRIS, EDC, aggregator settlement methods, etc.;
- only physical cash/Uang Laci contributes to drawer expected cash;
- non-cash codes must remain non-cash.

Do not add a POS-owned account mapping table to solve this.

## 11. Product Master / purchase / costing state

Product Master work from PR #4 includes:

- Tipe Barang;
- Jenis Barang;
- Satuan Dasar;
- Poin;
- Recipe Linked;
- stock tracking;
- Average Cost / HPP read-only;
- Harga Beli Terakhir read-only.

Purchase Material flow:

- product is selected from Product Master DB rows;
- Qty is explicit;
- multiple lines supported;
- supplier/payment supported;
- purchase updates stock/cost snapshots and moving Average Cost.

Operational Expense has Qty default `1` as behavioral metadata. Operational Qty does not create inventory movement by itself.

New authoritative cost writers use exact scaled INTEGER:

`1 rupiah = 1,000,000 cost units`

Do not reintroduce REAL/FLOAT as financial/costing source of truth.

## 12. HPP fractional precision blocker

Sale HPP/COGS can contain sub-rupiah precision because costing uses scaled integers, while the current Accounting journal amount representation is integer rupiah/minor amount.

The sale bridge currently fails closed for COGS/inventory journal rules that require a conversion policy:

`NEEDS_COST_ROUNDING_POLICY`

No silent floor/ceil/truncate/round policy was approved in the originating implementation.

One considered solution was residual carry: round/post whole-rupiah journal amount while preserving the fractional remainder and carrying it into later transactions. This was NOT implemented.

Before implementing residual carry, reassess the cleaner architectural option: use an exact scaled-integer Accounting journal representation too, then round only for presentation/reporting. This requires explicit compatibility/migration analysis because the current journal schema uses integer journal amounts.

Do not unlock automated HPP posting until the precision policy is explicitly decided and tested.

## 13. Physical inventory quantity follow-up

Canonical direction is fractional-capable exact quantity with unit-level decimal-scale validation.

Example intent:

- PCS -> decimal scale 0
- KG -> fractional scale as configured

Legacy Prototype Leker physical stock tables still use integer quantities in parts of the engine. A separate compatibility migration is required. Do not silently reinterpret historical stock quantities and do not introduce binary floating point.

## 14. Useful files / migrations from the Accounting work

Relevant migration layer reached through:

- `0021_exact_production_costing.sql`
- `0022_accounting_warehouse_settings.sql`
- `0023_accounting_snapshot_settings_compat.sql`
- `0024_accounting_workspace.sql`
- `0025_accounting_pos_bridge.sql`

Relevant docs include Accounting Settings / Warehouse Settings contracts, Accounting workspace/bridge contracts, and the corresponding ADRs / Known Issues / Known Pitfalls in `cyo-ramadan/prototype-leker`.

Always read current repository versions; this handoff may age.

## 15. Copy-ready prompt for the next session

```text
Ren, lanjutkan proyek Prototype Leker dari handoff repository.

Pertama lakukan full MAXI onboarding. Baca `cyo-ramadan/maxi-protocol/manuals/MAXI_AI_ONBOARDING.md`, Quick Gate, Engineering Constitution, dan dokumentasi mandatory sesuai manual. Baca juga `cyo-ramadan/program-kasir/AI_ACCESS_QUICKSTART.md` agar tidak meminta token/API credential plaintext ke bos.

Setelah itu baca `cyo-ramadan/program-kasir/handoffs/prototype-leker/2026-08-13-accounting-deployment.md`, lalu VERIFIKASI ulang `cyo-ramadan/prototype-leker` current main HEAD, CI/deploy status, contracts, ADR, Known Issues, Known Pitfalls, migrations, tests, dan current source. Handoff hanya context transfer, bukan source of truth.

Last-known handoff state: Prototype Leker main sudah bergerak setelah PR #4/#5/#6 dan last-known HEAD saat handoff diperbarui adalah `f50aa22c83204f04d8540f3964252c4f77ded87b`. Commit itu memulihkan canonical Cloudflare deploy workflow. Quality PASS tetapi deploy run #167 gagal pada Cloudflare credential validation, jadi remote D1 migration dan Worker deploy belum terbukti selesai. Jangan menganggap SHA/status ini masih current; verify dulu.

Jangan sentuh/overwrite area yang sedang dikerjakan AI lain. Kalau ada overlap, report ke bos terlebih dahulu.

Prioritas berikutnya: selesaikan akses/deployment Cloudflare melalui jalur existing tanpa meminta plaintext token; verifikasi remote D1 + Worker live; smoke test Akuntansi dan Setting Akuntansi; kemudian review UX Setting Akuntansi terhadap mental model Debit/Kredit kanan-kiri bos. Jangan membuka automatic HPP/COGS journal posting sebelum exact precision/rounding policy diputuskan dan diuji.
```

## 16. Cleanup rule

When this handoff is no longer useful:

- delete it, or
- replace it with a newer dated handoff;
- do not let multiple stale handoffs compete as active project state.

The newest verified repository state always wins over this file.
