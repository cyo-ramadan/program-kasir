# MAXI Accounting Foundation

Hosted private evaluation URL: https://maxi-accounting-foundation.cyoramadan.chatgpt.site

Version 0.1.0 is a runnable, dependency-free Accounting foundation for MAXI. It establishes the first canonical Accounting input/output vocabulary while keeping all unapproved integration behavior out of the implementation.

## Included

- User-defined Chart of Accounts; no guessed or seeded account mappings.
- Double-entry journal drafts.
- Balanced-only posting using integer IDR minor units.
- Immutable posted journals.
- Explicit reversal journals; the original posting remains unchanged.
- Posted-only General Ledger and Trial Balance projections.
- Local audit entries and validated JSON export/import.
- Node-based accounting-core tests.

## Run

Serve the `src` directory through any static HTTP server. For example:

```sh
cd src
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Opening `index.html` directly may work in some browsers, but an HTTP server is the supported local run path.

## Verify

```sh
npm run check
npm test
```

No package installation is required.

## Data and deployment boundary

This version stores state in the current browser's `localStorage`, isolated by website origin, device and browser profile. It is a hosted foundation prototype, not a production accounting system. It has no backend, user authentication, authorization, fiscal-period closing, tax engine, multi-entity support, production audit immutability, API, event, SDK, or cross-program database access.

Do not use it as the financial system of record. See `docs/KNOWN_ISSUES.md`, `docs/RUNBOOK.md`, and `docs/CURRENT_STATE.md` before evaluation.

Future AI or developer work must begin with `docs/AI_GATE.md`.

## Canonical I/O baseline

The active field names are documented in `contracts/ACCOUNTING_IO_NAMING_BASELINE.md`. Other programs may align vocabulary to those names, but they must not send accounting interpretations, invent endpoints or events, or treat the browser state schema as a cross-program contract.

## DOC-IMPACT

`DOC-IMPACT: REQUIRED` — this changes the Accounting module from absent to a runnable foundation and introduces the first active Accounting I/O naming baseline. Code, state contract, tests, module documentation, ADR, runbook, error catalog, known issues, known pitfalls, and changelog are included in the same bundle.
