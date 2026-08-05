# Preflight — Garam POS Integration Foundation

```yaml
change_id: CHG-20260805-001
project: MAXI Garam POS + Integration Bridge
requested_change: Connect Garam POS to separate Accounting and Warehouse modules using separate databases and header-detail persistence.
affected_modules: [garam-pos, integration-bridge, accounting, warehouse]
affected_events: [sale.completed.v1_staged]
affected_apis: [POST_/api/v1/sales, GET_/api/v1/sales/{saleId}, POST_/internal/outbox/dispatch]
affected_database_objects:
  garam: [saleHeaders, saleDetails, salePayments, integrationOutbox]
  bridge: [integrationEventHeaders, integrationEventDetails, integrationEventTargets, externalMappings]
contract_change: additive_new_contract_staged
documentation_impact: required
security_impact: present
data_migration: required
backward_compatibility: Existing local POS remains available. Network delivery is fail-closed when configuration or approval is absent.
tests_required: [existing_POS_tests, contract_tests, idempotency_tests, SQL_migration_smoke_tests]
open_questions:
  - Garam Site origin and deployment route
  - production browser authentication
  - D1 and Queue resource identifiers
  - Warehouse source, manifest, API/event contract, and owner review
  - Accounting public contract, posting rule, and Elle review
  - approved product, UOM, payment, branch, warehouse, and accounting mappings
```

Implementation may stage Garam persistence, outbox, and Bridge ingestion. Live dispatch remains disabled with `INTEGRATION_CONTRACT_STATUS=STAGED`. Target writes remain prohibited until contracts, mappings, tests, and approvals exist.

DOC-IMPACT: REQUIRED.
