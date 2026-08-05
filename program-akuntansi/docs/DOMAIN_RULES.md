# Accounting Domain Rules

Status: ACTIVE  
Version: 1.0.0  
Effective date: 2026-07-31

1. Accounting owns journal interpretation.
2. A journal contains at least two lines.
3. Each line contains a positive debit or positive credit, exclusively.
4. Amounts are non-negative safe integers named with the `AmountMinor` suffix.
5. Foundation currency presentation is IDR; no foreign-exchange behavior is defined.
6. A draft may be unbalanced and does not affect the ledger.
7. Posting requires total debit to equal total credit and both totals to be greater than zero.
8. An ordinary posting cannot use an inactive account.
9. A posted journal is immutable.
10. Correction of a posted journal creates a separate posted reversal with debit and credit swapped.
11. Reversal remains allowed when an original account has since been deactivated, because deactivation must not prevent correction.
12. A foundation journal can be reversed at most once, and a reversal cannot itself be reversed.
13. General Ledger and Trial Balance are projections of posted journals only.
14. Business date is explicitly entered as a valid `YYYY-MM-DD` calendar date. No timezone or default business date is inferred.
15. Account mappings, tax behavior, item mappings, branches, fiscal periods and fallback values are never invented.
16. Other programs may communicate with Accounting only through future approved APIs, events or SDKs; direct database writes are prohibited.
17. The browser state schema is private Accounting storage, not a shared integration contract.
