# Changelog

## 0.1.0-hosted.1 — 2026-07-31

- Added a private Sites deployment at https://maxi-accounting-foundation.cyoramadan.chatgpt.site.
- Added a root delivery route that opens the static Accounting application.
- Copied runtime HTML, CSS and JavaScript byte-for-byte from foundation 0.1.0.
- Added hosted-asset and Sites-rendered output tests in the Sites checkout.
- Added hosted deployment preflight and ADR-002.
- Updated Module Manifest, Current State, Known Issues, Runbook and test evidence.
- Changed no Accounting domain logic, state schema, API, event, mapping or database object.
- Required no state migration; JSON Export/Import is the optional origin-transfer path.

## 0.1.0 — 2026-07-31

- Activated the first MAXI Accounting foundation.
- Added explicit Chart of Accounts management.
- Added double-entry draft, post and reversal lifecycle.
- Enforced integer minor-unit money, balanced posting and posted immutability.
- Added posted-only General Ledger and Trial Balance projections.
- Added validated local state export/import and audit entries.
- Activated Accounting I/O Naming Baseline 1.0.0.
- Added state schema, tests, manifest, current state, domain rules, known issues, known pitfalls, error catalog, runbook and ADR.
- Declared no APIs, events, SDKs, production database or cross-program integrations.
