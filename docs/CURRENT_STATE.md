# Current State

As of: 2026-08-05
Version: 0.2.0-staged
Status: RUNNABLE LOCAL POS; SERVER INTEGRATION IN SOURCE BUT NOT DEPLOYED

Active browser capabilities remain product, cart, payment, receipt, history, dashboard, and local snapshots. The Garam adapter is fail-closed without runtime API configuration.

Staged source includes an authenticated Garam Worker, dedicated Garam D1 header-detail storage, transactional outbox, Queue delivery, Integration Bridge ingestion, separate Bridge D1, duplicate protection, and per-target `NEEDS_MAPPING` status.

No Cloudflare resource or migration was created by this changeset. Placeholder IDs remain and `INTEGRATION_CONTRACT_STATUS` defaults to `STAGED`.

Accounting has no active public API/event/production database. Warehouse source, manifest, contract, and API were not accessible through connected GitHub and Drive sources. No journal or stock movement is created by this version.
