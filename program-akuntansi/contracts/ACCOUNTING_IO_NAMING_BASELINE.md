# MAXI Accounting I/O Naming Baseline

Contract version: 1.0.0  
Status: ACTIVE  
Effective date: 2026-07-31  
Activated by: Bos Cyo directive  
Accounting technical reviewer: Elle  
Scope: Vocabulary and naming baseline; not a public API/event contract

## Purpose

This is the first active MAXI Accounting vocabulary baseline. New MAXI programs should align equivalent financial-fact I/O names to this vocabulary instead of inventing local synonyms. Alignment must preserve domain ownership and does not authorize new fields, mappings, endpoints, events or direct database access.

## Canonical identifiers

| Concept | Canonical name | Type/shape | Rule |
|---|---|---|---|
| Account identifier | `accountId` | string | Opaque Accounting identifier |
| Account code | `accountCode` | string | Explicit, normalized uppercase, unique |
| Account name | `accountName` | string | Human-readable approved name |
| Account type | `accountType` | enum | `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE` |
| Active flag | `isActive` | boolean | Controls ordinary new posting eligibility |
| Journal identifier | `journalId` | string | Opaque Accounting identifier |
| Journal status | `journalStatus` | enum | `DRAFT`, `POSTED` |
| Business date | `businessDate` | `YYYY-MM-DD` string | Explicit calendar date; no inferred timezone |
| Journal description | `description` | string | Explains the business fact |
| Source reference | `sourceReference` | string | Optional trace reference; not an account mapping |
| Journal lines | `journalLines` | array | Public conceptual collection name |
| Journal line identifier | `journalLineId` | string | Opaque within the journal |
| Debit amount | `debitAmountMinor` | non-negative integer | Minor units; mutually exclusive with credit per line |
| Credit amount | `creditAmountMinor` | non-negative integer | Minor units; mutually exclusive with debit per line |
| Reversal reference | `reversalOfJournalId` | string or null | Links a correction to its original journal |
| Occurrence timestamp | `occurredAt` | timestamp string | Technical occurrence time when an approved contract defines transport semantics |
| Posting timestamp | `postedAt` | timestamp string or null | Accounting lifecycle timestamp |
| Debit closing balance | `debitBalanceAmountMinor` | non-negative integer | Debit side of an account's net trial-balance position |
| Credit closing balance | `creditBalanceAmountMinor` | non-negative integer | Credit side of an account's net trial-balance position |

The private state implementation uses the property `lines` inside stored journal objects. A future public contract must use the clearer collection name `journalLines` unless an approved versioned contract explicitly decides otherwise. This known translation prevents private storage shape from silently becoming a shared contract.

## Function and event vocabulary

Approved internal function names include `addAccount`, `saveJournalDraft`, `updateJournalDraft`, `postJournal`, `reverseJournal`, `calculateJournalBalance` and `buildAccountingSnapshot`.

No event names are active. Do not infer names such as `JournalPosted`, `SaleCompleted` or similar from this document. Event activation requires its own versioned contract and affected-owner approval.

## Forbidden vague names

Do not use `data`, `data1`, `abc`, `tmp`, `hasil`, `finalData`, `processData`, `amount`, `date`, `status`, or locally invented synonyms when the canonical domain name applies.

## Compatibility

The baseline is additive and backward-compatible by default. Renaming or removing an active canonical name is a breaking shared change and requires RFC, compatibility plan, migration plan, tests and approvals from affected owners.
