# MAXI Accounting AI Gate

Version: 1.0.0  
Status: ACTIVE  
Effective date: 2026-07-31

Before changing MAXI Accounting code, every AI session must:

1. Complete the active MAXI onboarding protocol from the canonical Manual Hub or repository-pinned fallback.
2. Read `MODULE_MANIFEST.md`, `CURRENT_STATE.md`, `DOMAIN_RULES.md`, `ACCOUNTING_IO_NAMING_BASELINE.md`, applicable ADRs, `KNOWN_ISSUES.md`, `KNOWN_PITFALLS.md`, `ERROR_CATALOG.md`, `RUNBOOK.md` and affected tests.
3. Identify the repository, requested behavior, affected Accounting boundary and affected systems.
4. Produce a preflight impact assessment before editing.
5. Stop if an active rule or required source is inaccessible, contradictory, outdated or materially ambiguous.
6. Run baseline checks and tests before editing.
7. Preserve posted-journal immutability, integer minor-unit money and posted-only reporting.
8. Never invent mappings, accounts, events, APIs, tax, timezone, currency behavior, branches, statuses or fallback values.
9. Never expose the private state schema as a public integration contract.
10. Declare `DOC-IMPACT: REQUIRED` or `DOC-IMPACT: NOT_REQUIRED` with an objective reason.
11. Run required checks and tests after editing and record evidence.
12. Obtain Elle's Accounting review before production adoption and Bos Cyo's decision for unresolved cross-domain matters.

Baseline commands:

```sh
npm run check
npm test
```

Completion is prohibited while a required test fails, compatibility is unknown, documentation is stale, production migration/recovery is missing, or material ambiguity remains.
