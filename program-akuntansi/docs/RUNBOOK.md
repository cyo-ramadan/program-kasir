# Accounting Foundation Runbook

## Hosted start

1. Open https://maxi-accounting-foundation.cyoramadan.chatgpt.site.
2. Confirm the browser reaches the MAXI Accounting dashboard.
3. Confirm the header displays `LOCAL FOUNDATION`; this label describes the local browser-state model, not hosting availability.
4. Use test-only data. The hosted foundation is not the financial system of record.

## Local start

1. Keep the entire `src` folder together.
2. Start a static HTTP server in that folder.
3. Open the local URL in a modern browser.
4. Confirm the header displays `LOCAL FOUNDATION`.

## Safe evaluation sequence

1. Create two or more test-only accounts. Do not enter live financial data.
2. Create a balanced journal draft.
3. Confirm the draft does not affect the ledger or trial balance.
4. Post the journal and confirm debit equals credit.
5. Reverse the posted journal with an explicit business date.
6. Confirm the original remains unchanged and the net trial balance returns as expected.
7. Export JSON for an evaluation backup.

## Invalid-state recovery

1. Stop using the app. Do not clear browser data.
2. In browser developer tools, preserve the raw value for key `maxi.accounting.foundation.state.v1`.
3. Copy the raw value to a protected diagnostic file.
4. Record the displayed error code and the action immediately before failure.
5. Escalate to the Accounting owner/reviewer and implementation owner.
6. Repair only through an approved migration or recovery procedure. Never hand-edit live production financial state.

## Import recovery

Before an accepted import replaces state, the app writes the prior validated state to `maxi.accounting.foundation.backup.v1`. This is a convenience backup in the same browser storage, not a durable backup system.

## Move evaluation state to the hosted origin

1. Open the source environment that currently contains the evaluation data.
2. Use `Audit & Data` → `Export JSON`.
3. Open the hosted URL in the target browser profile.
4. Use `Import JSON` and confirm replacement only after checking the file and destination.
5. Reconcile account count, posted-journal count and Trial Balance after import.

## Rollback

Because the foundation has no database migration, rollback means redeploy the previous immutable Sites checkpoint or stop using the hosted link. Preserve exported state before changing versions. Never import a newer schema into an older version without an approved reverse migration.

## Production gate

Production remains blocked until the open items in `KNOWN_ISSUES.md` are resolved, tests are rerun in the production repository, documentation is updated, migration and recovery are approved, and Elle completes Accounting review.
