# MAXI Accounting Module Manifest

Document version: 1.1.0  
Status: ACTIVE  
Effective date: 2026-07-31  
Activated by: Bos Cyo directive  
Technical owner/reviewer: Elle  
Code executor: Karen

## Module identity

- Program: MAXI Accounting
- Module: Journal Core Foundation
- Source version: 0.1.0
- State schema: 1.0.0
- I/O naming baseline: 1.0.0
- Runtime status: PRIVATE HOSTED FOUNDATION; NOT A PRODUCTION FINANCIAL SYSTEM
- Hosted URL: https://maxi-accounting-foundation.cyoramadan.chatgpt.site

## Ownership and authority

- Accounting owns journal interpretation, ledger projection and trial balance.
- Business applications report business facts and must not choose debit or credit accounts.
- Inventory owns stock, costing and valuation.
- Integration Bridge owns validation, deduplication, mapping, routing, retries and processing status.
- Bos Cyo decides unresolved ownership, business, architecture and cross-domain questions.
- Elle is the required Accounting technical reviewer before production adoption.
- Karen implements code within approved rules and contracts.

## Owned data

Accounts, journals, journal lines, journal lifecycle status, reversal relationships, ledger projections, trial balance projections and Accounting audit entries.

The browser state object in this foundation is private Accounting storage. It is not a shared database contract.

## Interfaces

No API, event or SDK is active in version 0.1.0. No other program may write Accounting state directly. A future shared interface requires a versioned contract, RFC where applicable, compatibility and migration plans, tests, affected-owner approvals and an updated manifest.

Sites provides the private evaluation delivery surface only. It does not change Accounting ownership, contracts, storage boundaries or production approval requirements.

## Active rules

The coding and I/O naming rules are active now. Technical identifiers use clear English domain terms. Canonical examples include `accountId`, `accountCode`, `journalId`, `journalStatus`, `businessDate`, `journalLines`, `debitAmountMinor`, `creditAmountMinor`, `reversalOfJournalId` and `buildAccountingSnapshot`.

The first approved Accounting naming baseline is the reference for later MAXI program I/O alignment. Alignment does not transfer Accounting ownership or authorize direct database access.
