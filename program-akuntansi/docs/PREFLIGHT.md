# ACC-FOUNDATION-001 — Preflight Impact Assessment

Status: COMPLETED FOR FOUNDATION  
Date: 2026-07-31  
Requested by: Bos Cyo  
Implementation: Karen  
Required Accounting reviewer: Elle  
DOC-IMPACT: REQUIRED

## Identification

| Area | Decision |
|---|---|
| Repository | No MAXI Accounting repository was supplied or found; delivered as a versioned Drive source bundle |
| Program | MAXI Accounting |
| Module | Accounting journal core foundation |
| Requested behavior | Runnable base program that establishes canonical Accounting I/O naming |
| Affected systems | Accounting only; no cross-program runtime integration |

## Impact

| Dimension | Assessment |
|---|---|
| Modules | Chart of Accounts, journal lifecycle, ledger projection, trial balance, local audit and state portability |
| APIs | None introduced |
| Events | None introduced |
| SDKs | None introduced |
| Database objects | None; browser `localStorage` only |
| Owners | Accounting owner/reviewer: Elle; final unresolved decision maker: Bos Cyo; implementation: Karen |
| Contract | Adds internal state schema v1.0.0 and active Accounting I/O naming baseline v1.0.0 |
| Documentation | Required; module manual set included |
| Security | No authentication or authorization; therefore local evaluation only |
| Migration | None from an earlier Accounting system; incompatible future state requires explicit migration |
| Backward compatibility | First version; JSON import rejects unsupported `schemaVersion` values |
| Tests | Core unit, validation, failure, regression and reconciliation assertions |

## Scope decisions

- Dependency-free HTML, CSS and JavaScript follows the concrete single-file browser prototype pattern previously used in MAXI artifacts, split here for testability.
- Money values use integer IDR minor units.
- Business dates are entered explicitly as `YYYY-MM-DD`; no timezone default is invented.
- Chart of Accounts is user-defined; no account, tax, item, branch or business mapping is seeded.
- Drafts may be unbalanced. Posting requires equal, positive debit and credit totals.
- Posted journals are immutable. Correction creates a posted reversal.
- Accounting state is private to Accounting. Other programs must not write it directly.

## Open questions outside this foundation

- Production repository and approved server-side technology stack.
- Authentication, roles, segregation of duties and approval workflow.
- Legal entities, branches, fiscal calendar, period closing and reopening authority.
- Approved Chart of Accounts and business-fact-to-account mapping.
- Tax behavior, currency policy and foreign exchange.
- Public Accounting API/event/RFC and affected-owner approvals.
- Production database, backup, recovery, retention and tamper-evident audit controls.

These questions block production use, not local evaluation of the foundation behavior.
