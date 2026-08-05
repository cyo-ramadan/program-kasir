# ADR-001 — Dependency-Free Browser Foundation

Status: ACCEPTED FOR FOUNDATION  
Date: 2026-07-31  
Decision authority: Bos Cyo request  
Production applicability: NONE

## Context

MAXI Accounting had no accessible module repository, manifest, current state, domain rules or contracts in the Manual Hub. Bos Cyo requested a basic Accounting program with source code in Google Drive and designated this program as the naming reference for later program I/O alignment. Concrete prior MAXI prototypes found in project context used browser-based HTML/JavaScript artifacts.

## Decision

Create a dependency-free HTML/CSS/JavaScript foundation with a separately testable domain core. Persist evaluation state in browser `localStorage`, validate portable JSON through schema-versioned invariants, and upload source plus module documentation to Drive.

Use this architecture only to validate domain behavior and naming. Introduce no API, event, backend, database, account mapping, tax behavior, timezone default or cross-program write.

## Consequences

- The program can be evaluated immediately without package installation.
- Domain logic can be tested with Node's built-in test runner.
- Source and documentation can be handed off together in Drive.
- Browser storage, missing access controls and non-tamper-evident audit block production use.
- Production architecture remains an unresolved decision requiring repository, stack, security, persistence, migration, recovery and owner review.
