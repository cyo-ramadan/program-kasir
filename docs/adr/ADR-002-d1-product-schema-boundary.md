# ADR-002 — D1 product schema boundary

- Status: PROPOSED
- Owner: Bos Cyo
- Architecture reviewer: Elle
- Change ID: MAXI-POS-D1-001

Decision: configure the `DB` binding for the existing Cloudflare D1 database `maxi-db` and define the additive `products` table schema. The browser product object remains limited to `productId`, `productName`, `categoryName`, `barcodeValue`, `unitPriceAmount`, and `emoji`. `createdAt` is database metadata and is not added to the domain snapshot.

The current browser runtime continues to use its versioned local snapshot. No direct browser-to-D1 access, HTTP endpoint, synchronization policy, authentication rule, conflict resolution, or cross-program database write is introduced by this change.

Reason: D1 bindings are available only inside the Cloudflare Worker/Pages server runtime. An adapter can be introduced later after its API, authentication, authorization, synchronization, and recovery behavior are approved.

Compatibility: additive configuration and schema. Existing cart, checkout, payment, sales history, and local snapshots are unchanged.

Migration: validate locally with `npx wrangler d1 execute maxi-db --local --file=./schema.sql`. Applying to the remote database is a separate production operation using `--remote` and requires approval plus a backup/export.

Recovery: before remote execution, export or rely on the D1 backup captured for the operation. If the new empty table must be removed, use an approved forward recovery migration; do not delete an existing table containing data without an explicit data-retention decision.

Approval bureaucracy: INACTIVE by Bos Cyo directive. Elle architecture review is advisory and non-blocking; Bos Cyo decides unresolved architecture or data-ownership conflicts.
