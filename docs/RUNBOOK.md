# Runbook


Health check: open `index.html`, add a product, complete a cash sale, and confirm it appears in History and Dashboard.


Diagnosis: browser console errors indicate runtime problems; a blank product list may indicate an incompatible or damaged local snapshot.


Recovery: use Settings → Reset demo data. This replaces only the Program Kasir local snapshot. It does not affect Program Ikan or another MAXI program.


Reconciliation: v0.1.0 has no external consumers and therefore no cross-system reconciliation.


Emergency stop: close the page. No background worker or network delivery runs in this version.

D1 schema validation: run `npx wrangler d1 execute maxi-db --local --file=./schema.sql`, then inspect with `npx wrangler d1 execute maxi-db --local --command="SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'"`.

Remote migration: Elle review is advisory and non-blocking. Execute `schema.sql` remotely only under an explicit Bos Cyo task instruction, after capturing/exporting a recoverable database state.
