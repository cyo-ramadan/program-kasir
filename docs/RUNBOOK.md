# Runbook

## Validation

```sh
npm run check
npm test
npm run validate:sql
```

## Staging preparation

1. Create separate D1 databases for Garam and Integration Bridge.
2. Create `maxi-integration-events` and `maxi-integration-events-dlq`.
3. Replace placeholder IDs and Garam Site origin in each `wrangler.jsonc`.
4. Add API tokens with Wrangler secrets. Never commit them.
5. Apply migrations locally, then staging after backup/export verification.
6. Deploy Garam API and Bridge independently.
7. Keep `INTEGRATION_CONTRACT_STATUS=STAGED` until approvals, mappings, adapters, and tests pass.

`BLOCKED_CONTRACT` means the contract is not accepted. `QUEUE_SEND_FAILED` requires Queue/binding/log inspection. Bridge `NEEDS_MAPPING` may only be resolved with owner-approved mappings.

Never delete completed sales, outbox records, Bridge event headers, or target history. Retry delivery after fixing configuration and use forward recovery migrations.

Emergency stop: set contract status to `STAGED` or disable the Queue producer. Garam sale persistence remains available.
