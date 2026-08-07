# Accounting Known Issues

## KI-ACC-001 — Browser-only persistence

Severity: BLOCKS PRODUCTION  
State is stored in browser `localStorage`. It is website-origin-, device- and browser-profile-specific, not concurrent, not server-backed and can be cleared by the user or browser. Data from local files or another host does not automatically appear at the Sites URL.

## KI-ACC-002 — No authentication or authorization

Severity: BLOCKS PRODUCTION  
The foundation has no identity, roles, approval workflow or segregation of duties.

## KI-ACC-003 — Audit is not tamper-evident

Severity: BLOCKS PRODUCTION  
Audit entries are append-only through normal app actions but remain editable by anyone with browser storage access.

## KI-ACC-004 — Operational accounting policy is undefined

Severity: BLOCKS PRODUCTION  
Approved Chart of Accounts, account mappings, fiscal calendar, closing rules, tax, entity/branch behavior and currency policy are not supplied. The implementation deliberately does not invent them.

## KI-ACC-005 — No public integration contract

Severity: BLOCKS CROSS-PROGRAM USE  
There is no approved API, event or SDK. The active naming baseline standardizes vocabulary only.

## KI-ACC-006 — Source bundle is not a production repository

Severity: BLOCKS PRODUCTION  
The Sites checkout provides version history for this hosted foundation, while production work still requires an approved MAXI repository policy, CI gates and protected review workflow.

## KI-ACC-007 — Hosted availability can be mistaken for production readiness

Severity: BLOCKS PRODUCTION  
The Sites URL makes the foundation easy to open but does not add a backend, protected database, identity, accounting authorization, concurrency, closing controls, durable audit or recovery. Operators must not enter live financial records.
