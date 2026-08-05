# ACC-DEPLOY-001 — Hosted Foundation Preflight

Status: COMPLETED  
Date: 2026-07-31  
Requested by: Bos Cyo  
Implementation: Karen  
Required Accounting reviewer: Elle  
DOC-IMPACT: REQUIRED

## Identification

| Area | Decision |
|---|---|
| Repository | Sites checkout for `maxi-accounting-foundation` |
| Program | MAXI Accounting |
| Module | Journal Core Foundation delivery layer |
| Requested behavior | Open the existing HTML application directly through a browser link |
| Affected systems | Accounting foundation and Sites hosting only |

## Impact

| Dimension | Assessment |
|---|---|
| Modules | Delivery shell and static runtime assets |
| APIs | None introduced |
| Events | None introduced |
| SDKs | None introduced |
| Database objects | None introduced |
| Owners | Accounting reviewer Elle; final unresolved decisions Bos Cyo; implementation Karen |
| Contract | No naming or state-contract change |
| Documentation | Required because runtime status changes to hosted foundation |
| Security | Private Sites deployment; application still has no accounting authentication/authorization model |
| Migration | No schema migration; optional JSON Export/Import transfers evaluation state between origins |
| Backward compatibility | Accounting source copied byte-for-byte; state schema remains 1.0.0 |
| Tests | Core, hosted-asset, rendered-output, syntax, visual and interaction checks |

## Scope decisions

- Root route opens the static Accounting application at `/accounting/index.html`.
- Runtime HTML, CSS and JavaScript remain behavior-compatible with Drive source version 0.1.0.
- Browser `localStorage` remains the only state store.
- No accounts, mappings, tax rules, timezones, APIs, events or external integrations were added.
- Deployment does not authorize production financial use.

## Open production questions

Production repository policy, backend stack, database, identity, roles, segregation of duties, fiscal closing, tax, approved Chart of Accounts, mappings, backup, recovery, retention, audit immutability and shared integration contracts remain unresolved.
