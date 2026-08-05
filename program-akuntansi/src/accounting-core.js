(function attachMaxiAccountingCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MaxiAccountingCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMaxiAccountingCore() {
  "use strict";


  const SCHEMA_VERSION = "1.0.0";
  const MODULE_VERSION = "0.1.0";
  const ACCOUNT_TYPES = Object.freeze(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
  const JOURNAL_STATUSES = Object.freeze(["DRAFT", "POSTED"]);


  class AccountingError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "AccountingError";
      this.code = code;
      this.details = details;
    }
  }


  function fail(code, message, details) {
    throw new AccountingError(code, message, details);
  }


  function createInitialState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      moduleVersion: MODULE_VERSION,
      nextAccountNumber: 1,
      nextJournalNumber: 1,
      nextAuditNumber: 1,
      accounts: [],
      journals: [],
      auditEntries: []
    };
  }


  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }


  function normalizeText(value) {
    return String(value ?? "").trim();
  }


  function normalizeCode(value) {
    return normalizeText(value).toUpperCase();
  }


  function assertIntegerAmount(value, fieldName) {
    const numberValue = Number(value);
    if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
      fail("AMOUNT_INVALID", `${fieldName} must be a non-negative safe integer.`, { fieldName, value });
    }
    return numberValue;
  }


  function assertBusinessDate(value) {
    const businessDate = normalizeText(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(businessDate);
    if (!match) {
      fail("JOURNAL_DATE_REQUIRED", "Business date is required in YYYY-MM-DD format.");
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      fail("JOURNAL_DATE_INVALID", "Business date must be a valid calendar date.", { businessDate });
    }
    return businessDate;
  }


  function formatSequence(prefix, numberValue) {
    return `${prefix}-${String(numberValue).padStart(6, "0")}`;
  }


  function appendAudit(state, action, entityType, entityId, details, occurredAt) {
    const auditEntryId = formatSequence("AUD", state.nextAuditNumber);
    state.nextAuditNumber += 1;
    state.auditEntries.push({
      auditEntryId,
      action,
      entityType,
      entityId,
      occurredAt,
      details
    });
  }


  function assertState(state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      fail("STATE_INVALID", "Accounting state must be an object.");
    }
    if (state.schemaVersion !== SCHEMA_VERSION) {
      fail("STATE_SCHEMA_UNSUPPORTED", `Expected schema ${SCHEMA_VERSION}.`, {
        actualSchemaVersion: state.schemaVersion
      });
    }
    for (const fieldName of ["accounts", "journals", "auditEntries"]) {
      if (!Array.isArray(state[fieldName])) fail("STATE_INVALID", `${fieldName} must be an array.`);
    }
    for (const fieldName of ["nextAccountNumber", "nextJournalNumber", "nextAuditNumber"]) {
      if (!Number.isSafeInteger(state[fieldName]) || state[fieldName] < 1) {
        fail("STATE_INVALID", `${fieldName} must be a positive safe integer.`);
      }
    }


    const accountIdSet = new Set();
    const accountCodeSet = new Set();
    for (const account of state.accounts) {
      if (!account.accountId || accountIdSet.has(account.accountId)) {
        fail("STATE_INVALID", "Account IDs must be present and unique.");
      }
      const accountCode = normalizeCode(account.accountCode);
      if (!accountCode || accountCodeSet.has(accountCode)) {
        fail("STATE_INVALID", "Account codes must be present and unique.");
      }
      if (!ACCOUNT_TYPES.includes(account.accountType)) {
        fail("STATE_INVALID", `Unsupported account type: ${account.accountType}`);
      }
      if (!normalizeText(account.accountName) || typeof account.isActive !== "boolean") {
        fail("STATE_INVALID", "Every account requires a name and boolean isActive value.");
      }
      accountIdSet.add(account.accountId);
      accountCodeSet.add(accountCode);
    }


    const journalIdSet = new Set();
    const journalById = new Map();
    for (const journal of state.journals) {
      if (!journal.journalId || journalIdSet.has(journal.journalId)) {
        fail("STATE_INVALID", "Journal IDs must be present and unique.");
      }
      journalIdSet.add(journal.journalId);
      journalById.set(journal.journalId, journal);
    }


    const reversedJournalIdSet = new Set();
    for (const journal of state.journals) {
      if (!JOURNAL_STATUSES.includes(journal.journalStatus)) {
        fail("STATE_INVALID", `Unsupported journal status: ${journal.journalStatus}`);
      }
      assertBusinessDate(journal.businessDate);
      if (!normalizeText(journal.description)) fail("STATE_INVALID", "Journal description is required.");
      if (!Array.isArray(journal.lines) || journal.lines.length < 2) {
        fail("STATE_INVALID", "Journal lines must contain at least two entries.");
      }
      const journalLineIdSet = new Set();
      for (const line of journal.lines) {
        if (!line.journalLineId || journalLineIdSet.has(line.journalLineId)) {
          fail("STATE_INVALID", "Journal line IDs must be present and unique within a journal.");
        }
        if (!accountIdSet.has(line.accountId)) {
          fail("STATE_INVALID", `Journal references unknown account ${line.accountId}.`);
        }
        const debitAmountMinor = assertIntegerAmount(line.debitAmountMinor, "debitAmountMinor");
        const creditAmountMinor = assertIntegerAmount(line.creditAmountMinor, "creditAmountMinor");
        if ((debitAmountMinor > 0) === (creditAmountMinor > 0)) {
          fail("STATE_INVALID", "Every journal line must contain debit or credit, exclusively.");
        }
        journalLineIdSet.add(line.journalLineId);
      }
      if (journal.journalStatus === "POSTED" && !calculateJournalBalance(journal).isBalanced) {
        fail("STATE_INVALID", `Posted journal ${journal.journalId} is not balanced.`);
      }
      if (journal.reversalOfJournalId !== null) {
        if (!journalIdSet.has(journal.reversalOfJournalId) || journal.reversalOfJournalId === journal.journalId) {
          fail("STATE_INVALID", `Journal ${journal.journalId} has an invalid reversal reference.`);
        }
        if (
          journal.journalStatus !== "POSTED" ||
          journalById.get(journal.reversalOfJournalId)?.journalStatus !== "POSTED" ||
          reversedJournalIdSet.has(journal.reversalOfJournalId)
        ) {
          fail("STATE_INVALID", "Reversal references must be unique and belong to posted journals.");
        }
        reversedJournalIdSet.add(journal.reversalOfJournalId);
      }
    }


    const auditEntryIdSet = new Set();
    for (const auditEntry of state.auditEntries) {
      if (!auditEntry.auditEntryId || auditEntryIdSet.has(auditEntry.auditEntryId)) {
        fail("STATE_INVALID", "Audit entry IDs must be present and unique.");
      }
      auditEntryIdSet.add(auditEntry.auditEntryId);
    }
    return state;
  }


  function addAccount(state, input, occurredAt) {
    assertState(state);
    const accountCode = normalizeCode(input.accountCode);
    const accountName = normalizeText(input.accountName);
    const accountType = normalizeCode(input.accountType);
    if (!accountCode) fail("ACCOUNT_CODE_REQUIRED", "Account code is required.");
    if (!accountName) fail("ACCOUNT_NAME_REQUIRED", "Account name is required.");
    if (!ACCOUNT_TYPES.includes(accountType)) {
      fail("ACCOUNT_TYPE_INVALID", "Account type is not supported.", { accountType });
    }
    if (state.accounts.some((account) => normalizeCode(account.accountCode) === accountCode)) {
      fail("ACCOUNT_CODE_DUPLICATE", `Account code ${accountCode} already exists.`);
    }


    const nextState = cloneState(state);
    const accountId = formatSequence("ACC", nextState.nextAccountNumber);
    nextState.nextAccountNumber += 1;
    nextState.accounts.push({
      accountId,
      accountCode,
      accountName,
      accountType,
      isActive: true,
      createdAt: occurredAt,
      updatedAt: occurredAt
    });
    appendAudit(nextState, "ACCOUNT_CREATED", "ACCOUNT", accountId, { accountCode }, occurredAt);
    return { state: nextState, accountId };
  }


  function updateAccount(state, accountId, input, occurredAt) {
    assertState(state);
    const account = state.accounts.find((candidate) => candidate.accountId === accountId);
    if (!account) fail("ACCOUNT_NOT_FOUND", `Account ${accountId} was not found.`);
    const accountName = normalizeText(input.accountName ?? account.accountName);
    if (!accountName) fail("ACCOUNT_NAME_REQUIRED", "Account name is required.");


    const nextState = cloneState(state);
    const accountIndex = nextState.accounts.findIndex((candidate) => candidate.accountId === accountId);
    nextState.accounts[accountIndex] = {
      ...nextState.accounts[accountIndex],
      accountName,
      isActive: input.isActive === undefined ? account.isActive : Boolean(input.isActive),
      updatedAt: occurredAt
    };
    appendAudit(nextState, "ACCOUNT_UPDATED", "ACCOUNT", accountId, {
      accountName,
      isActive: nextState.accounts[accountIndex].isActive
    }, occurredAt);
    return nextState;
  }


  function normalizeJournalInput(state, input, journalId) {
    const businessDate = assertBusinessDate(input.businessDate);
    const description = normalizeText(input.description);
    const sourceReference = normalizeText(input.sourceReference);
    if (!description) fail("JOURNAL_DESCRIPTION_REQUIRED", "Journal description is required.");
    if (!Array.isArray(input.lines) || input.lines.length < 2) {
      fail("JOURNAL_LINES_MINIMUM", "A journal requires at least two lines.");
    }


    const accountMap = new Map(state.accounts.map((account) => [account.accountId, account]));
    const lines = input.lines.map((inputLine, index) => {
      const account = accountMap.get(inputLine.accountId);
      if (!account) fail("ACCOUNT_NOT_FOUND", `Line ${index + 1} references an unknown account.`);
      const debitAmountMinor = assertIntegerAmount(inputLine.debitAmountMinor ?? 0, "debitAmountMinor");
      const creditAmountMinor = assertIntegerAmount(inputLine.creditAmountMinor ?? 0, "creditAmountMinor");
      const hasDebit = debitAmountMinor > 0;
      const hasCredit = creditAmountMinor > 0;
      if (hasDebit === hasCredit) {
        fail("JOURNAL_LINE_INVALID", `Line ${index + 1} must contain debit or credit, exclusively.`);
      }
      return {
        journalLineId: `${journalId}-L${String(index + 1).padStart(3, "0")}`,
        accountId: account.accountId,
        debitAmountMinor,
        creditAmountMinor
      };
    });
    return { businessDate, description, sourceReference, lines };
  }


  function calculateJournalBalance(journal) {
    let totalDebitAmountMinor = 0;
    let totalCreditAmountMinor = 0;
    for (const line of journal.lines) {
      totalDebitAmountMinor += line.debitAmountMinor;
      totalCreditAmountMinor += line.creditAmountMinor;
      if (!Number.isSafeInteger(totalDebitAmountMinor) || !Number.isSafeInteger(totalCreditAmountMinor)) {
        fail("AMOUNT_TOTAL_OVERFLOW", "Journal total exceeds the safe integer range.");
      }
    }
    return {
      totalDebitAmountMinor,
      totalCreditAmountMinor,
      isBalanced: totalDebitAmountMinor > 0 && totalDebitAmountMinor === totalCreditAmountMinor
    };
  }


  function saveJournalDraft(state, input, occurredAt) {
    assertState(state);
    const nextState = cloneState(state);
    const journalId = formatSequence("JRN", nextState.nextJournalNumber);
    const normalized = normalizeJournalInput(nextState, input, journalId);
    nextState.nextJournalNumber += 1;
    nextState.journals.push({
      journalId,
      journalStatus: "DRAFT",
      ...normalized,
      reversalOfJournalId: null,
      createdAt: occurredAt,
      updatedAt: occurredAt,
      postedAt: null
    });
    appendAudit(nextState, "JOURNAL_DRAFT_CREATED", "JOURNAL", journalId, {
      businessDate: normalized.businessDate
    }, occurredAt);
    return { state: nextState, journalId };
  }


  function updateJournalDraft(state, journalId, input, occurredAt) {
    assertState(state);
    const journal = state.journals.find((candidate) => candidate.journalId === journalId);
    if (!journal) fail("JOURNAL_NOT_FOUND", `Journal ${journalId} was not found.`);
    if (journal.journalStatus !== "DRAFT") {
      fail("JOURNAL_POSTED_IMMUTABLE", "Posted journals cannot be edited.", { journalId });
    }
    const nextState = cloneState(state);
    const normalized = normalizeJournalInput(nextState, input, journalId);
    const journalIndex = nextState.journals.findIndex((candidate) => candidate.journalId === journalId);
    nextState.journals[journalIndex] = {
      ...nextState.journals[journalIndex],
      ...normalized,
      updatedAt: occurredAt
    };
    appendAudit(nextState, "JOURNAL_DRAFT_UPDATED", "JOURNAL", journalId, {
      businessDate: normalized.businessDate
    }, occurredAt);
    return nextState;
  }


  function postJournalInternal(state, journalId, occurredAt, allowInactiveAccounts) {
    assertState(state);
    const journal = state.journals.find((candidate) => candidate.journalId === journalId);
    if (!journal) fail("JOURNAL_NOT_FOUND", `Journal ${journalId} was not found.`);
    if (journal.journalStatus !== "DRAFT") fail("JOURNAL_ALREADY_POSTED", "Journal is already posted.");


    const accountMap = new Map(state.accounts.map((account) => [account.accountId, account]));
    for (const line of journal.lines) {
      const account = accountMap.get(line.accountId);
      if (!account?.isActive && !allowInactiveAccounts) {
        fail("ACCOUNT_INACTIVE", `Account ${line.accountId} is inactive and cannot receive a new posting.`);
      }
    }
    const balance = calculateJournalBalance(journal);
    if (!balance.isBalanced) {
      fail("JOURNAL_NOT_BALANCED", "Journal debit and credit totals must be equal and greater than zero.", balance);
    }


    const nextState = cloneState(state);
    const journalIndex = nextState.journals.findIndex((candidate) => candidate.journalId === journalId);
    nextState.journals[journalIndex] = {
      ...nextState.journals[journalIndex],
      journalStatus: "POSTED",
      postedAt: occurredAt,
      updatedAt: occurredAt
    };
    appendAudit(nextState, "JOURNAL_POSTED", "JOURNAL", journalId, balance, occurredAt);
    return nextState;
  }


  function postJournal(state, journalId, occurredAt) {
    return postJournalInternal(state, journalId, occurredAt, false);
  }


  function reverseJournal(state, journalId, input, occurredAt) {
    assertState(state);
    const journal = state.journals.find((candidate) => candidate.journalId === journalId);
    if (!journal) fail("JOURNAL_NOT_FOUND", `Journal ${journalId} was not found.`);
    if (journal.journalStatus !== "POSTED") {
      fail("JOURNAL_REVERSAL_NOT_ALLOWED", "Only posted journals may be reversed.");
    }
    if (journal.reversalOfJournalId) {
      fail("JOURNAL_REVERSAL_NOT_ALLOWED", "A reversal journal cannot be reversed in the foundation version.");
    }
    if (state.journals.some((candidate) => candidate.reversalOfJournalId === journalId)) {
      fail("JOURNAL_ALREADY_REVERSED", "A reversal already exists for this journal.");
    }


    const draftInput = {
      businessDate: input.businessDate,
      description: normalizeText(input.description) || `Reversal of ${journalId}`,
      sourceReference: journal.sourceReference,
      lines: journal.lines.map((line) => ({
        accountId: line.accountId,
        debitAmountMinor: line.creditAmountMinor,
        creditAmountMinor: line.debitAmountMinor
      }))
    };
    const saved = saveJournalDraft(state, draftInput, occurredAt);
    const postedState = postJournalInternal(saved.state, saved.journalId, occurredAt, true);
    const reversalIndex = postedState.journals.findIndex((candidate) => candidate.journalId === saved.journalId);
    postedState.journals[reversalIndex].reversalOfJournalId = journalId;
    appendAudit(postedState, "JOURNAL_REVERSAL_CREATED", "JOURNAL", saved.journalId, {
      reversalOfJournalId: journalId
    }, occurredAt);
    assertState(postedState);
    return { state: postedState, reversalJournalId: saved.journalId };
  }


  function buildAccountingSnapshot(state) {
    assertState(state);
    const accountById = new Map();
    const trialByAccountId = new Map();
    const ledgerByAccountId = new Map();
    for (const account of state.accounts) {
      accountById.set(account.accountId, account);
      trialByAccountId.set(account.accountId, {
        accountId: account.accountId,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        totalDebitAmountMinor: 0,
        totalCreditAmountMinor: 0,
        netDebitAmountMinor: 0,
        debitBalanceAmountMinor: 0,
        creditBalanceAmountMinor: 0
      });
      ledgerByAccountId.set(account.accountId, []);
    }


    let draftJournalCount = 0;
    let postedJournalCount = 0;
    let postedDebitAmountMinor = 0;
    let postedCreditAmountMinor = 0;
    const orderedJournals = [...state.journals].sort((left, right) =>
      left.businessDate.localeCompare(right.businessDate) || left.journalId.localeCompare(right.journalId)
    );


    for (const journal of orderedJournals) {
      if (journal.journalStatus === "DRAFT") {
        draftJournalCount += 1;
        continue;
      }
      postedJournalCount += 1;
      for (const line of journal.lines) {
        postedDebitAmountMinor += line.debitAmountMinor;
        postedCreditAmountMinor += line.creditAmountMinor;
        const trial = trialByAccountId.get(line.accountId);
        trial.totalDebitAmountMinor += line.debitAmountMinor;
        trial.totalCreditAmountMinor += line.creditAmountMinor;
        ledgerByAccountId.get(line.accountId).push({
          businessDate: journal.businessDate,
          journalId: journal.journalId,
          description: journal.description,
          debitAmountMinor: line.debitAmountMinor,
          creditAmountMinor: line.creditAmountMinor,
          reversalOfJournalId: journal.reversalOfJournalId
        });
      }
    }


    const trialBalance = [...trialByAccountId.values()]
      .map((row) => {
        const netDebitAmountMinor = row.totalDebitAmountMinor - row.totalCreditAmountMinor;
        return {
          ...row,
          netDebitAmountMinor,
          debitBalanceAmountMinor: Math.max(netDebitAmountMinor, 0),
          creditBalanceAmountMinor: Math.max(-netDebitAmountMinor, 0)
        };
      })
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode));


    let trialDebitBalanceAmountMinor = 0;
    let trialCreditBalanceAmountMinor = 0;
    for (const row of trialBalance) {
      trialDebitBalanceAmountMinor += row.debitBalanceAmountMinor;
      trialCreditBalanceAmountMinor += row.creditBalanceAmountMinor;
    }


    return {
      accountById,
      ledgerByAccountId,
      trialBalance,
      activeAccountCount: state.accounts.filter((account) => account.isActive).length,
      draftJournalCount,
      postedJournalCount,
      postedDebitAmountMinor,
      postedCreditAmountMinor,
      trialDebitBalanceAmountMinor,
      trialCreditBalanceAmountMinor,
      isPostedLedgerBalanced: postedDebitAmountMinor === postedCreditAmountMinor,
      isTrialBalanceBalanced: trialDebitBalanceAmountMinor === trialCreditBalanceAmountMinor
    };
  }


  function serializeState(state) {
    assertState(state);
    return JSON.stringify(state, null, 2);
  }


  function parseState(serializedState) {
    let parsed;
    try {
      parsed = JSON.parse(serializedState);
    } catch (error) {
      fail("STATE_INVALID", "Imported state is not valid JSON.", { cause: error.message });
    }
    assertState(parsed);
    return cloneState(parsed);
  }


  return Object.freeze({
    SCHEMA_VERSION,
    MODULE_VERSION,
    ACCOUNT_TYPES,
    JOURNAL_STATUSES,
    AccountingError,
    createInitialState,
    assertState,
    addAccount,
    updateAccount,
    saveJournalDraft,
    updateJournalDraft,
    postJournal,
    reverseJournal,
    calculateJournalBalance,
    buildAccountingSnapshot,
    serializeState,
    parseState
  });
});
