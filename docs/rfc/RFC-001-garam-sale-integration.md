# RFC-001 — Garam Sale Integration

- Status: PROPOSED_IMPLEMENTATION_STAGED
- Change ID: CHG-20260805-001
- Owner: Bos Cyo
- Architecture reviewer: Elle
- Producer: `garam-pos`
- Intermediary: `maxi-integration-bridge`
- Consumers: MAXI Accounting and MAXI Warehouse
- Contract: `sale.completed.v1` / `1.0.0`

## Proposed flow

```text
Garam browser -> Garam Worker -> Garam D1 header/detail + outbox
-> Cloudflare Queue -> Bridge Worker -> Bridge D1 header/detail
-> ACCOUNTING: NEEDS_MAPPING
-> WAREHOUSE: NEEDS_MAPPING
```

Garam owns sales. Bridge owns validation, deduplication, target status, retry, and mappings. Accounting owns journal interpretation. Warehouse owns stock movement, costing, and valuation.

Money uses integer IDR minor units. Every delivery carries event, transaction, correlation, and idempotency identifiers. Missing mappings remain visible. No program writes another program's database.

Rejected: one shared D1, direct target writes, synchronous checkout fan-out, and silent default mappings.

The foundation is additive and local POS behavior remains compatible. Live consumer processing requires active contracts, mappings, migration/recovery evidence, tests, and affected-owner approval.
