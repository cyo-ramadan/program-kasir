# MAXI Garam POS v0.2.0-staged

Garam is the MAXI POS application. The browser prototype remains runnable locally, while this branch contains a staged Cloudflare architecture for separate-database integration.

```text
Garam Site/browser
  -> Garam Worker API
  -> Garam D1: saleHeaders + saleDetails + salePayments + integrationOutbox
  -> Cloudflare Queue
  -> Integration Bridge Worker
  -> Bridge D1: integrationEventHeaders + integrationEventDetails + integrationEventTargets
  -> Accounting target: NEEDS_MAPPING
  -> Warehouse target: NEEDS_MAPPING
```

Garam never writes Accounting or Warehouse databases directly.

## Validation

```sh
npm run check
npm test
npm run validate:sql
```

## Deployment status

The source foundation is implemented. Cloudflare resources, secrets, migrations, Garam Site runtime configuration, mappings, consumer adapters, and production approvals are still required. Live target processing remains fail-closed.
