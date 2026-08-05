# ADR-003 — Garam header-detail persistence and transactional outbox

- Status: ACCEPTED_FOR_STAGED_IMPLEMENTATION
- Change ID: CHG-20260805-001
- Owner: Bos Cyo
- Production architecture review: Elle

Garam uses a dedicated D1 with `saleHeaders`, `saleDetails`, `salePayments`, and `integrationOutbox`. Integration Bridge uses a different D1 with `integrationEventHeaders`, `integrationEventDetails`, `integrationEventTargets`, and `externalMappings`.

A completed sale and outbox event are inserted in one D1 batch transaction. Queue delivery happens after persistence and is retryable. Bridge ingestion is idempotent and creates separate Accounting and Warehouse target rows beginning as `NEEDS_MAPPING`.

This preserves checkout independence, database ownership, auditability, and duplicate protection. Live target processing remains blocked until approved mappings and consumer interfaces exist.
