# Current State


Status: PROPOSED — local prototype.


Active capabilities: product search and category filters; cart add/update/remove; manual barcode entry simulation; discount; cash/non-cash selection; payment and change; printable receipt; local sales history; product maintenance; dashboard; versioned local persistence; responsive device UI.


Prepared infrastructure: `wrangler.toml` binds `DB` to `maxi-db`, and `schema.sql` defines the proposed D1 `products` table. No Worker/API adapter or remote migration is active yet.

Known limitations: no authentication, active server persistence, multi-device sync, real barcode hardware, Inventory integration, Accounting integration, tax contract, refunds, offline outbox, or approved shared event.


Supported runtime: current evergreen browsers with JavaScript modules and `localStorage`; Node.js 20+ for tests.


Pending integrations remain disabled and must not be described as active.
