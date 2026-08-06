# Changelog

## Unreleased — MAXI-POS-D1-001

- Added the Cloudflare D1 `DB` binding for `maxi-db`.
- Added the proposed `products` schema and database-level non-empty barcode uniqueness.
- Added immutable product validation/upsert coverage and completed state-driven product UI wiring from the canonical source bundle.
- Preserved the local snapshot as the active runtime boundary; no Worker/API adapter or remote migration is active.

DOC-IMPACT: REQUIRED — database configuration, schema, migration/recovery guidance, and the persistence boundary changed.


## 0.1.0 — 2026-08-01


- Created local-first MAXI Program Kasir prototype.
- Added deterministic cart, payment, barcode lookup, snapshot, receipt, product, history, and dashboard capabilities.
- Added disabled barcode and Accounting integration ports.
- Added module governance documents and automated core tests.


DOC-IMPACT: REQUIRED — a new module, lifecycle, local state, and explicit integration boundaries were introduced.
