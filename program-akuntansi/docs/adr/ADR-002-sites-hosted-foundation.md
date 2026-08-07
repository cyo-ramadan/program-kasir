# ADR-002 — Sites-Hosted Accounting Foundation

Status: ACCEPTED FOR FOUNDATION  
Date: 2026-07-31  
Decision authority: Bos Cyo request  
Production applicability: NONE

## Context

The Accounting foundation existed as raw HTML, CSS and JavaScript in Google Drive. Google Drive and Google Docs display source but do not execute it as a hosted web application. Bos Cyo requested a browser link that opens the running program.

## Decision

Deploy the unchanged static Accounting application through Sites. The Sites root route directs the browser to `/accounting/index.html`. Preserve browser `localStorage`, state schema 1.0.0, module behavior and the active Accounting I/O naming baseline.

Keep the deployment private under the current Sites access policy. Introduce no backend, database, API, event, authentication, mapping or accounting-policy behavior.

## Consequences

- The application opens through a normal browser URL.
- Runtime source is versioned with the Sites checkout.
- State remains device-, browser-profile- and origin-specific.
- Evaluation data from another origin requires explicit JSON Export/Import.
- Hosting availability does not satisfy production accounting controls.
- Production use remains blocked pending Elle review and resolution of the active Known Issues.
