# Accounting Known Pitfalls

## KP-ACC-001 — Treating drafts as financial truth

Drafts can be unbalanced and are intentionally excluded from ledger and trial-balance calculations. Reports must use posted journals only.

## KP-ACC-002 — Editing a posted record

Never add an “unlock” shortcut that mutates a posted journal. Use a reversal or a separately approved adjustment design.

## KP-ACC-003 — Reusing the private state schema as an API

The JSON state export is for foundation portability. External programs must not couple to it. Create an approved versioned integration contract first.

## KP-ACC-004 — Sending account decisions from business applications

Sales, POS and other business systems report business facts. They must not send guessed debit/credit mappings. Accounting owns the interpretation.

## KP-ACC-005 — Using floating-point money

Do not convert financial calculations to decimal floating-point values. Keep integer `AmountMinor` fields end-to-end.

## KP-ACC-006 — Silently resetting invalid state

If stored state cannot be validated, stop and recover it. Silent reset can hide financial data loss.
