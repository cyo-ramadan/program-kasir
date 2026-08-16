# Test Results — 0.1.0

Date: 2026-07-31  
Environment: Node.js built-in parser and test runner  
Result: PASS

## Commands

```sh
npm run check
npm test
node -e "JSON.parse(require('node:fs').readFileSync('contracts/accounting-state.schema.json', 'utf8')); JSON.parse(require('node:fs').readFileSync('package.json', 'utf8'));"
```

## Evidence summary

- JavaScript syntax checks: PASS (`accounting-core.js`, `app.js`).
- JSON parse checks: PASS (`accounting-state.schema.json`, `package.json`).
- Automated tests: 13 passed, 0 failed.
- Test duration reported by Node: approximately 77 ms.
- Static HTTP smoke check: PASS; `index.html`, `styles.css`, `accounting-core.js` and `app.js` each returned HTTP 200.

## Covered behavior

- Empty initial state without invented accounts.
- Account-code normalization and uniqueness.
- Unbalanced draft acceptance and posting rejection.
- Balanced posting and posted immutability.
- Reversal correctness and original preservation.
- Reversal after account deactivation.
- Duplicate reversal rejection.
- Inactive-account rejection for ordinary posting.
- Draft exclusion from ledger totals.
- Closing debit/credit trial-balance reconciliation.
- Calendar-date and line-side validation.
- State serialization and schema-version rejection.
- Detection of corrupted posted financial data.

## Not covered in this foundation

Production browser matrix, accessibility audit, authentication/authorization, server persistence, concurrency, database migration, API contract, event contract, integration, load, security penetration and disaster-recovery tests. These remain production blockers, not silent passes.

## Hosted foundation verification

- Hosted checkout test suite: PASS; 16 passed, 0 failed (13 domain-core, 2 hosted-delivery, 1 rendered-output).
- Original Accounting syntax and core baseline: PASS; 13/13 tests.
- Static runtime copy comparison: PASS; four hosted runtime files matched Drive-source bytes before deployment packaging.
- Agent preview root redirect: PASS; reached `/accounting/index.html` with the correct title.
- Dashboard visual rendering: PASS at desktop preview.
- Account UI interaction: PASS; two test accounts were created and displayed.
- Journal draft UI interaction: PASS; balanced test lines were accepted as a draft.
- Posting and reconciliation behavior: covered by the 13 automated domain-core tests.
- Sites production build and artifact validation: PASS.
- Deployment status: SUCCEEDED at https://maxi-accounting-foundation.cyoramadan.chatgpt.site.
