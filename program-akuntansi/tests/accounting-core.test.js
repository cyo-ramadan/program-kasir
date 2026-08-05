"use strict";


const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../src/accounting-core.js");


const occurredAt = "2026-07-31T10:00:00.000Z";


function addTestAccount(state, accountCode, accountName, accountType) {
  return core.addAccount(state, { accountCode, accountName, accountType }, occurredAt).state;
}


function createStateWithAccounts() {
  let state = core.createInitialState();
  state = addTestAccount(state, "1001", "Test Cash", "ASSET");
  state = addTestAccount(state, "3001", "Test Equity", "EQUITY");
  return state;
}


function validJournalInput(state, amountMinor = 125000) {
  return {
    businessDate: "2026-07-31",
    description: "Owner capital test fact",
    sourceReference: "TEST-001",
    lines: [
      { accountId: state.accounts[0].accountId, debitAmountMinor: amountMinor, creditAmountMinor: 0 },
      { accountId: state.accounts[1].accountId, debitAmountMinor: 0, creditAmountMinor: amountMinor }
    ]
  };
}


test("initial state uses active schema and contains no invented accounts", () => {
  const state = core.createInitialState();
  assert.equal(state.schemaVersion, "1.0.0");
  assert.equal(state.moduleVersion, "0.1.0");
  assert.deepEqual(state.accounts, []);
  assert.deepEqual(state.journals, []);
});


test("account codes are normalized and unique", () => {
  let state = core.createInitialState();
  state = addTestAccount(state, " cash-01 ", "Test Cash", "asset");
  assert.equal(state.accounts[0].accountCode, "CASH-01");
  assert.equal(state.accounts[0].accountType, "ASSET");
  assert.throws(
    () => core.addAccount(state, { accountCode: "cash-01", accountName: "Duplicate", accountType: "ASSET" }, occurredAt),
    (error) => error.code === "ACCOUNT_CODE_DUPLICATE"
  );
});


test("draft may be unbalanced but posting rejects it", () => {
  const state = createStateWithAccounts();
  const input = validJournalInput(state);
  input.lines[1].creditAmountMinor = 120000;
  const saved = core.saveJournalDraft(state, input, occurredAt);
  assert.equal(saved.state.journals[0].journalStatus, "DRAFT");
  assert.throws(
    () => core.postJournal(saved.state, saved.journalId, occurredAt),
    (error) => error.code === "JOURNAL_NOT_BALANCED"
  );
});


test("posting a balanced journal is immutable and included in snapshot", () => {
  const state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state), occurredAt);
  const posted = core.postJournal(saved.state, saved.journalId, "2026-07-31T10:05:00.000Z");
  assert.equal(posted.journals[0].journalStatus, "POSTED");
  assert.equal(core.buildAccountingSnapshot(posted).postedDebitAmountMinor, 125000);
  assert.throws(
    () => core.updateJournalDraft(posted, saved.journalId, validJournalInput(posted), occurredAt),
    (error) => error.code === "JOURNAL_POSTED_IMMUTABLE"
  );
});


test("reversal swaps debit and credit without mutating original", () => {
  const state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state, 50000), occurredAt);
  const posted = core.postJournal(saved.state, saved.journalId, occurredAt);
  const originalBefore = JSON.stringify(posted.journals[0]);
  const reversed = core.reverseJournal(posted, saved.journalId, {
    businessDate: "2026-08-01",
    description: "Correction test"
  }, "2026-08-01T08:00:00.000Z");
  const reversal = reversed.state.journals.find((journal) => journal.journalId === reversed.reversalJournalId);
  assert.equal(JSON.stringify(reversed.state.journals[0]), originalBefore);
  assert.equal(reversal.reversalOfJournalId, saved.journalId);
  assert.equal(reversal.lines[0].creditAmountMinor, 50000);
  assert.equal(reversal.lines[1].debitAmountMinor, 50000);
  assert.equal(core.buildAccountingSnapshot(reversed.state).trialBalance[0].netDebitAmountMinor, 0);
});


test("reversal remains possible after an original account is deactivated", () => {
  let state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state), occurredAt);
  state = core.postJournal(saved.state, saved.journalId, occurredAt);
  state = core.updateAccount(state, state.accounts[0].accountId, { isActive: false }, occurredAt);
  const reversed = core.reverseJournal(state, saved.journalId, { businessDate: "2026-08-02" }, occurredAt);
  assert.equal(reversed.state.journals[1].journalStatus, "POSTED");
});


test("a journal can only be reversed once", () => {
  const state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state), occurredAt);
  const posted = core.postJournal(saved.state, saved.journalId, occurredAt);
  const reversed = core.reverseJournal(posted, saved.journalId, { businessDate: "2026-08-01" }, occurredAt);
  assert.throws(
    () => core.reverseJournal(reversed.state, saved.journalId, { businessDate: "2026-08-02" }, occurredAt),
    (error) => error.code === "JOURNAL_ALREADY_REVERSED"
  );
});


test("inactive account rejects an ordinary new posting", () => {
  let state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state), occurredAt);
  state = core.updateAccount(saved.state, state.accounts[0].accountId, { isActive: false }, occurredAt);
  assert.throws(
    () => core.postJournal(state, saved.journalId, occurredAt),
    (error) => error.code === "ACCOUNT_INACTIVE"
  );
});


test("snapshot excludes draft journals from ledger totals", () => {
  const state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state), occurredAt);
  const snapshot = core.buildAccountingSnapshot(saved.state);
  assert.equal(snapshot.draftJournalCount, 1);
  assert.equal(snapshot.postedJournalCount, 0);
  assert.equal(snapshot.postedDebitAmountMinor, 0);
});


test("trial balance reports closing debit and credit balances that reconcile", () => {
  const state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state, 87500), occurredAt);
  const posted = core.postJournal(saved.state, saved.journalId, occurredAt);
  const snapshot = core.buildAccountingSnapshot(posted);
  assert.equal(snapshot.trialDebitBalanceAmountMinor, 87500);
  assert.equal(snapshot.trialCreditBalanceAmountMinor, 87500);
  assert.equal(snapshot.trialBalance[0].debitBalanceAmountMinor, 87500);
  assert.equal(snapshot.trialBalance[1].creditBalanceAmountMinor, 87500);
  assert.equal(snapshot.isTrialBalanceBalanced, true);
});


test("invalid calendar date and dual-sided line are rejected", () => {
  const state = createStateWithAccounts();
  const invalidDate = validJournalInput(state);
  invalidDate.businessDate = "2026-02-30";
  assert.throws(() => core.saveJournalDraft(state, invalidDate, occurredAt), (error) => error.code === "JOURNAL_DATE_INVALID");
  const invalidLine = validJournalInput(state);
  invalidLine.lines[0].creditAmountMinor = 1;
  assert.throws(() => core.saveJournalDraft(state, invalidLine, occurredAt), (error) => error.code === "JOURNAL_LINE_INVALID");
});


test("serialized state round-trips and unsupported schemas are blocked", () => {
  const state = createStateWithAccounts();
  assert.deepEqual(core.parseState(core.serializeState(state)), state);
  const incompatibleState = { ...state, schemaVersion: "2.0.0" };
  assert.throws(
    () => core.parseState(JSON.stringify(incompatibleState)),
    (error) => error.code === "STATE_SCHEMA_UNSUPPORTED"
  );
});


test("assertState blocks corrupted posted financial data", () => {
  const state = createStateWithAccounts();
  const saved = core.saveJournalDraft(state, validJournalInput(state), occurredAt);
  const posted = core.postJournal(saved.state, saved.journalId, occurredAt);
  posted.journals[0].lines[1].creditAmountMinor = 1;
  assert.throws(() => core.assertState(posted), (error) => error.code === "STATE_INVALID");
});
