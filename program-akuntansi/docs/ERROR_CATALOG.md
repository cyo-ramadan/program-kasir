# Accounting Error Catalog

| Code | Meaning | Operator action |
|---|---|---|
| `ACCOUNT_CODE_REQUIRED` | Account code is empty | Enter an explicit code |
| `ACCOUNT_NAME_REQUIRED` | Account name is empty | Enter an approved account name |
| `ACCOUNT_TYPE_INVALID` | Account type is outside the active enum | Choose ASSET, LIABILITY, EQUITY, REVENUE or EXPENSE |
| `ACCOUNT_CODE_DUPLICATE` | Normalized account code already exists | Use the existing account or an approved unique code |
| `ACCOUNT_NOT_FOUND` | Requested account does not exist | Verify the selected account and imported state |
| `ACCOUNT_INACTIVE` | New posting references an inactive account | Activate only with authority or select an approved active account |
| `JOURNAL_DATE_REQUIRED` | Business date is missing or not `YYYY-MM-DD` | Enter the explicit business date |
| `JOURNAL_DATE_INVALID` | Date text is not a valid calendar date | Correct the date |
| `JOURNAL_DESCRIPTION_REQUIRED` | Journal description is empty | Describe the business fact |
| `JOURNAL_LINES_MINIMUM` | Journal has fewer than two lines | Add lines |
| `JOURNAL_LINE_INVALID` | A line has both sides or neither side | Enter debit or credit exclusively |
| `JOURNAL_NOT_FOUND` | Requested journal does not exist | Verify the journal ID |
| `JOURNAL_NOT_BALANCED` | Posting totals do not match or total is zero | Correct the draft; do not force posting |
| `JOURNAL_ALREADY_POSTED` | Posting was requested for an already posted journal | Do not repost |
| `JOURNAL_POSTED_IMMUTABLE` | Edit was requested for a posted journal | Use an approved reversal/correction flow |
| `JOURNAL_REVERSAL_NOT_ALLOWED` | Reversal target is ineligible | Review the target lifecycle |
| `JOURNAL_ALREADY_REVERSED` | A reversal already exists | Review the existing reversal |
| `AMOUNT_INVALID` | Amount is negative, fractional or outside safe integer input | Enter a non-negative integer minor-unit amount |
| `AMOUNT_TOTAL_OVERFLOW` | Journal totals exceed safe integer range | Split or reject the transaction and escalate design review |
| `STATE_INVALID` | State violates a structural or accounting invariant | Stop; preserve raw state and follow the runbook |
| `STATE_SCHEMA_UNSUPPORTED` | State schema version is incompatible | Use an approved migration; never coerce silently |
