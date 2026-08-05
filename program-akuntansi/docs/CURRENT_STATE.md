# Accounting Current State

As of: 2026-07-31  
Source version: 0.1.0  
Implementation status: RUNNABLE PRIVATE HOSTED FOUNDATION  
Production status: BLOCKED FOR FINANCIAL-SYSTEM USE

## Active facts

- A dependency-free browser application is hosted for private evaluation at https://maxi-accounting-foundation.cyoramadan.chatgpt.site.
- The Chart of Accounts is created explicitly by the user; the software seeds no accounts.
- Journal drafts can be created and updated.
- Posting accepts only balanced journals with positive totals and active accounts.
- Posted journals cannot be edited.
- Reversal creates a new balanced posted journal and preserves the original.
- General Ledger and Trial Balance include posted journals only.
- Values are integer IDR minor units.
- The application validates imported JSON against state invariants and rejects unsupported schemas.
- The active Accounting I/O naming baseline is version 1.0.0.
- No API, event, SDK, production database or external system integration exists.
- The root hosted route opens the static Accounting runtime without changing Accounting behavior or contracts.
- Browser state is isolated by website origin. Evaluation state from another origin must move through validated JSON Export/Import.

## Deployment truth

The Sites deployment and Google Drive source bundle are evaluation artifacts. The hosted URL improves access but does not provide a protected accounting database, accounting authorization, concurrency, financial-system audit controls, fiscal closing, backup or disaster recovery.
