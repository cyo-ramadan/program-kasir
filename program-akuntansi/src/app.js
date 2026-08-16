(function startMaxiAccountingApp() {
  "use strict";


  const core = globalThis.MaxiAccountingCore;
  if (!core) throw new Error("MaxiAccountingCore failed to load.");


  const STORAGE_KEY = "maxi.accounting.foundation.state.v1";
  const BACKUP_KEY = "maxi.accounting.foundation.backup.v1";
  const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });


  let state;
  let activeView = "dashboard";
  let editingJournalId = null;
  let journalEditorLines = [createEditorLine(), createEditorLine()];
  let selectedLedgerAccountId = "";


  function $(id) {
    return document.getElementById(id);
  }


  function createEditorLine() {
    return {
      editorLineId: `EDITOR-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`,
      accountId: "",
      debitAmountMinor: "",
      creditAmountMinor: ""
    };
  }


  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function nowUtc() {
    return new Date().toISOString();
  }


  function loadState() {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    return serializedState ? core.parseState(serializedState) : core.createInitialState();
  }


  function persistState(nextState) {
    core.assertState(nextState);
    localStorage.setItem(STORAGE_KEY, core.serializeState(nextState));
    state = nextState;
  }


  function showNotice(message, tone = "success") {
    const notice = $("notice");
    notice.textContent = message;
    notice.dataset.tone = tone;
    notice.classList.add("show");
    window.clearTimeout(showNotice.timeoutId);
    showNotice.timeoutId = window.setTimeout(() => notice.classList.remove("show"), 3500);
  }


  function handleError(error) {
    const message = error?.code ? `${error.code}: ${error.message}` : error?.message || "Unexpected error.";
    console.error(error);
    showNotice(message, "error");
  }


  function accountOptions(selectedAccountId = "") {
    return [
      '<option value="">Pilih akun</option>',
      ...state.accounts
        .filter((account) => account.isActive || account.accountId === selectedAccountId)
        .sort((left, right) => left.accountCode.localeCompare(right.accountCode))
        .map((account) => `<option value="${escapeHtml(account.accountId)}" ${account.accountId === selectedAccountId ? "selected" : ""}>${escapeHtml(account.accountCode)} · ${escapeHtml(account.accountName)}${account.isActive ? "" : " (inactive)"}</option>`)
    ].join("");
  }


  function renderNavigation() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === activeView);
    });
  }


  function renderDashboard(snapshot) {
    const trialRows = snapshot.trialBalance.filter((row) => row.totalDebitAmountMinor || row.totalCreditAmountMinor);
    return `
      <section class="page-heading">
        <div><span class="eyebrow">Foundation snapshot</span><h2>Dashboard</h2></div>
        <span class="status-pill ${snapshot.isPostedLedgerBalanced ? "ok" : "danger"}">${snapshot.isPostedLedgerBalanced ? "Ledger balanced" : "Ledger mismatch"}</span>
      </section>
      <div class="metric-grid">
        <article class="metric"><span>Active accounts</span><strong>${snapshot.activeAccountCount}</strong><small>Chart is user-defined</small></article>
        <article class="metric"><span>Draft journals</span><strong>${snapshot.draftJournalCount}</strong><small>Excluded from ledger</small></article>
        <article class="metric"><span>Posted journals</span><strong>${snapshot.postedJournalCount}</strong><small>Immutable records</small></article>
        <article class="metric"><span>Posted debit</span><strong>${rupiah.format(snapshot.postedDebitAmountMinor)}</strong><small>Credit ${rupiah.format(snapshot.postedCreditAmountMinor)}</small></article>
      </div>
      <article class="panel">
        <div class="panel-title"><div><span class="eyebrow">Posted only</span><h3>Trial-balance pulse</h3></div><button class="ghost-button" data-go-view="trial">Open trial balance</button></div>
        ${trialRows.length ? `
          <div class="table-wrap"><table><thead><tr><th>Account</th><th>Debit balance</th><th>Credit balance</th><th>Net D−C</th></tr></thead><tbody>
          ${trialRows.slice(0, 8).map((row) => `<tr><td><b>${escapeHtml(row.accountCode)}</b><br><small>${escapeHtml(row.accountName)}</small></td><td>${rupiah.format(row.debitBalanceAmountMinor)}</td><td>${rupiah.format(row.creditBalanceAmountMinor)}</td><td>${rupiah.format(row.netDebitAmountMinor)}</td></tr>`).join("")}
          </tbody></table></div>` : '<div class="empty-state">Belum ada posted journal. Dashboard masih zen banget, bos.</div>'}
      </article>`;
  }


  function renderAccounts() {
    const accounts = [...state.accounts].sort((left, right) => left.accountCode.localeCompare(right.accountCode));
    return `
      <section class="page-heading"><div><span class="eyebrow">Owned master data</span><h2>Chart of Accounts</h2></div><span class="status-pill">${accounts.length} accounts</span></section>
      <div class="two-column">
        <form class="panel form-stack" id="accountForm">
          <div class="panel-title"><div><span class="eyebrow">No seeded mapping</span><h3>Add account</h3></div></div>
          <label>Account code<input id="accountCode" autocomplete="off" placeholder="Example: 1001" required></label>
          <label>Account name<input id="accountName" autocomplete="off" placeholder="Name decided by owner" required></label>
          <label>Account type<select id="accountType">${core.ACCOUNT_TYPES.map((type) => `<option value="${type}">${type}</option>`).join("")}</select></label>
          <button class="primary-button" type="submit">Create account</button>
          <p class="helper">The app never auto-assigns account mappings. This avoids a confident-looking financial fanfiction.</p>
        </form>
        <article class="panel">
          <div class="panel-title"><div><span class="eyebrow">Explicit master</span><h3>Accounts</h3></div></div>
          ${accounts.length ? `<div class="account-list">${accounts.map((account) => `
            <div class="account-row">
              <div><b>${escapeHtml(account.accountCode)} · ${escapeHtml(account.accountName)}</b><small>${account.accountType} · ${account.accountId}</small></div>
              <button class="${account.isActive ? "ghost-button" : "muted-button"}" data-toggle-account="${account.accountId}">${account.isActive ? "Deactivate" : "Activate"}</button>
            </div>`).join("")}</div>` : '<div class="empty-state">Create the first account to unlock journal entry.</div>'}
        </article>
      </div>`;
  }


  function renderEditorLines() {
    return journalEditorLines.map((line, index) => `
      <tr data-editor-line="${line.editorLineId}">
        <td><select data-line-field="accountId">${accountOptions(line.accountId)}</select></td>
        <td><input inputmode="numeric" data-line-field="debitAmountMinor" value="${escapeHtml(line.debitAmountMinor)}" placeholder="0"></td>
        <td><input inputmode="numeric" data-line-field="creditAmountMinor" value="${escapeHtml(line.creditAmountMinor)}" placeholder="0"></td>
        <td><button type="button" class="icon-button" data-remove-line="${line.editorLineId}" aria-label="Remove line">×</button></td>
      </tr>`).join("");
  }


  function renderJournals() {
    const journals = [...state.journals].sort((left, right) => right.businessDate.localeCompare(left.businessDate) || right.journalId.localeCompare(left.journalId));
    return `
      <section class="page-heading"><div><span class="eyebrow">Double-entry core</span><h2>Journal</h2></div><span class="status-pill">Draft → Post → Reverse</span></section>
      <article class="panel journal-editor">
        <div class="panel-title"><div><span class="eyebrow">${editingJournalId ? `Editing ${escapeHtml(editingJournalId)}` : "New journal"}</span><h3>${editingJournalId ? "Update draft" : "Create draft"}</h3></div>${editingJournalId ? '<button class="ghost-button" type="button" id="cancelEditJournal">Cancel edit</button>' : ""}</div>
        <form id="journalForm" class="form-stack">
          <div class="form-grid"><label>Business date<input id="businessDate" type="date" required></label><label>Source reference<input id="sourceReference" autocomplete="off" placeholder="Optional manual reference"></label></div>
          <label>Description<input id="journalDescription" autocomplete="off" placeholder="Explain the business fact" required></label>
          <div class="table-wrap"><table class="journal-lines"><thead><tr><th>Account</th><th>Debit (rupiah)</th><th>Credit (rupiah)</th><th></th></tr></thead><tbody id="journalLineBody">${renderEditorLines()}</tbody></table></div>
          <div class="editor-actions"><button class="ghost-button" type="button" id="addJournalLine">+ Add line</button><button class="primary-button" type="submit">${editingJournalId ? "Update draft" : "Save draft"}</button></div>
        </form>
      </article>
      <article class="panel">
        <div class="panel-title"><div><span class="eyebrow">Audit-safe lifecycle</span><h3>Journal register</h3></div></div>
        ${journals.length ? `<div class="journal-list">${journals.map((journal) => {
          const balance = core.calculateJournalBalance(journal);
          return `<div class="journal-card">
            <div class="journal-card-main"><span class="status-pill ${journal.journalStatus === "POSTED" ? "ok" : ""}">${journal.journalStatus}</span><div><b>${journal.journalId} · ${escapeHtml(journal.description)}</b><small>${journal.businessDate} · Debit ${rupiah.format(balance.totalDebitAmountMinor)} · Credit ${rupiah.format(balance.totalCreditAmountMinor)}${journal.reversalOfJournalId ? ` · Reversal of ${journal.reversalOfJournalId}` : ""}</small></div></div>
            <div class="journal-actions">
              ${journal.journalStatus === "DRAFT" ? `<button class="ghost-button" data-edit-journal="${journal.journalId}">Edit</button><button class="primary-button" data-post-journal="${journal.journalId}">Post</button>` : ""}
              ${journal.journalStatus === "POSTED" && !journal.reversalOfJournalId ? `<button class="danger-button" data-reverse-journal="${journal.journalId}">Reverse</button>` : ""}
            </div>
          </div>`;
        }).join("")}</div>` : '<div class="empty-state">No journal yet. Drafts can be unbalanced; posting cannot.</div>'}
      </article>`;
  }


  function renderLedger(snapshot) {
    if (!state.accounts.some((account) => account.accountId === selectedLedgerAccountId) && state.accounts.length) {
      selectedLedgerAccountId = state.accounts[0].accountId;
    }
    const account = snapshot.accountById.get(selectedLedgerAccountId);
    const entries = snapshot.ledgerByAccountId.get(selectedLedgerAccountId) || [];
    let runningNetDebitAmountMinor = 0;
    return `
      <section class="page-heading"><div><span class="eyebrow">Posted journal projection</span><h2>General Ledger</h2></div></section>
      <article class="panel">
        <label class="ledger-selector">Account<select id="ledgerAccountSelect">${[...state.accounts].sort((a, b) => a.accountCode.localeCompare(b.accountCode)).map((candidate) => `<option value="${candidate.accountId}" ${candidate.accountId === selectedLedgerAccountId ? "selected" : ""}>${escapeHtml(candidate.accountCode)} · ${escapeHtml(candidate.accountName)}</option>`).join("")}</select></label>
        ${account ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Journal</th><th>Description</th><th>Debit</th><th>Credit</th><th>Running D−C</th></tr></thead><tbody>
          ${entries.map((entry) => {
            runningNetDebitAmountMinor += entry.debitAmountMinor - entry.creditAmountMinor;
            return `<tr><td>${entry.businessDate}</td><td>${entry.journalId}</td><td>${escapeHtml(entry.description)}</td><td>${rupiah.format(entry.debitAmountMinor)}</td><td>${rupiah.format(entry.creditAmountMinor)}</td><td>${rupiah.format(runningNetDebitAmountMinor)}</td></tr>`;
          }).join("") || '<tr><td colspan="6">No posted activity for this account.</td></tr>'}
        </tbody></table></div>` : '<div class="empty-state">Create an account first.</div>'}
      </article>`;
  }


  function renderTrialBalance(snapshot) {
    const totalDebitAmountMinor = snapshot.trialDebitBalanceAmountMinor;
    const totalCreditAmountMinor = snapshot.trialCreditBalanceAmountMinor;
    return `
      <section class="page-heading"><div><span class="eyebrow">Posted journals only</span><h2>Trial Balance</h2></div><span class="status-pill ${totalDebitAmountMinor === totalCreditAmountMinor ? "ok" : "danger"}">${totalDebitAmountMinor === totalCreditAmountMinor ? "Balanced" : "Mismatch"}</span></section>
      <article class="panel"><div class="table-wrap"><table><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Debit</th><th>Credit</th><th>Net D−C</th></tr></thead><tbody>
        ${snapshot.trialBalance.map((row) => `<tr><td><b>${escapeHtml(row.accountCode)}</b></td><td>${escapeHtml(row.accountName)}</td><td>${row.accountType}</td><td>${rupiah.format(row.debitBalanceAmountMinor)}</td><td>${rupiah.format(row.creditBalanceAmountMinor)}</td><td>${rupiah.format(row.netDebitAmountMinor)}</td></tr>`).join("") || '<tr><td colspan="6">No accounts yet.</td></tr>'}
        <tr class="total-row"><td colspan="3">TOTAL</td><td>${rupiah.format(totalDebitAmountMinor)}</td><td>${rupiah.format(totalCreditAmountMinor)}</td><td>${rupiah.format(totalDebitAmountMinor - totalCreditAmountMinor)}</td></tr>
      </tbody></table></div></article>`;
  }


  function renderAudit() {
    const entries = [...state.auditEntries].reverse();
    return `
      <section class="page-heading"><div><span class="eyebrow">Local audit trail</span><h2>Audit & Data</h2></div><span class="status-pill">Not tamper-evident</span></section>
      <div class="two-column">
        <article class="panel form-stack"><div class="panel-title"><div><span class="eyebrow">Portable state</span><h3>Export / Import</h3></div></div><button class="primary-button" id="exportState">Export JSON</button><label class="file-button">Import JSON<input type="file" id="importState" accept="application/json"></label><p class="helper">Import replaces the active browser state after confirmation. A local backup is stored before replacement.</p></article>
        <article class="panel"><div class="panel-title"><div><span class="eyebrow">Append-only by app flow</span><h3>Audit entries</h3></div></div>${entries.length ? `<div class="audit-list">${entries.map((entry) => `<div class="audit-row"><b>${entry.action}</b><span>${entry.entityType} · ${entry.entityId}</span><small>${escapeHtml(entry.occurredAt)} · ${entry.auditEntryId}</small></div>`).join("")}</div>` : '<div class="empty-state">No audit activity yet.</div>'}</article>
      </div>`;
  }


  function render() {
    const snapshot = core.buildAccountingSnapshot(state);
    renderNavigation();
    const views = {
      dashboard: () => renderDashboard(snapshot),
      accounts: renderAccounts,
      journals: renderJournals,
      ledger: () => renderLedger(snapshot),
      trial: () => renderTrialBalance(snapshot),
      audit: renderAudit
    };
    $("appView").innerHTML = (views[activeView] || views.dashboard)();
    bindViewEvents();
    if (activeView === "journals") hydrateJournalForm();
  }


  function readEditorLinesFromDom() {
    journalEditorLines = [...document.querySelectorAll("[data-editor-line]")].map((row) => ({
      editorLineId: row.dataset.editorLine,
      accountId: row.querySelector('[data-line-field="accountId"]').value,
      debitAmountMinor: row.querySelector('[data-line-field="debitAmountMinor"]').value,
      creditAmountMinor: row.querySelector('[data-line-field="creditAmountMinor"]').value
    }));
  }


  function hydrateJournalForm() {
    const journal = editingJournalId ? state.journals.find((candidate) => candidate.journalId === editingJournalId) : null;
    if (!journal) return;
    $("businessDate").value = journal.businessDate;
    $("journalDescription").value = journal.description;
    $("sourceReference").value = journal.sourceReference;
  }


  function journalInputFromDom() {
    readEditorLinesFromDom();
    return {
      businessDate: $("businessDate").value,
      description: $("journalDescription").value,
      sourceReference: $("sourceReference").value,
      lines: journalEditorLines.map((line) => ({
        accountId: line.accountId,
        debitAmountMinor: line.debitAmountMinor || 0,
        creditAmountMinor: line.creditAmountMinor || 0
      }))
    };
  }


  function resetJournalEditor() {
    editingJournalId = null;
    journalEditorLines = [createEditorLine(), createEditorLine()];
  }


  function bindJournalLineEvents() {
    document.querySelectorAll("[data-remove-line]").forEach((button) => button.addEventListener("click", () => {
      readEditorLinesFromDom();
      if (journalEditorLines.length <= 2) return handleError(new Error("A journal requires at least two lines."));
      journalEditorLines = journalEditorLines.filter((line) => line.editorLineId !== button.dataset.removeLine);
      $("journalLineBody").innerHTML = renderEditorLines();
      bindJournalLineEvents();
    }));
  }


  function bindViewEvents() {
    document.querySelectorAll("[data-go-view]").forEach((button) => button.addEventListener("click", () => {
      activeView = button.dataset.goView;
      render();
    }));


    $("accountForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const result = core.addAccount(state, {
          accountCode: $("accountCode").value,
          accountName: $("accountName").value,
          accountType: $("accountType").value
        }, nowUtc());
        persistState(result.state);
        showNotice(`Account ${result.accountId} created.`);
        render();
      } catch (error) { handleError(error); }
    });


    document.querySelectorAll("[data-toggle-account]").forEach((button) => button.addEventListener("click", () => {
      try {
        const account = state.accounts.find((candidate) => candidate.accountId === button.dataset.toggleAccount);
        persistState(core.updateAccount(state, account.accountId, { isActive: !account.isActive }, nowUtc()));
        showNotice(`${account.accountCode} is now ${account.isActive ? "inactive" : "active"}.`);
        render();
      } catch (error) { handleError(error); }
    }));


    $("addJournalLine")?.addEventListener("click", () => {
      readEditorLinesFromDom();
      journalEditorLines.push(createEditorLine());
      $("journalLineBody").innerHTML = renderEditorLines();
      bindJournalLineEvents();
    });


    bindJournalLineEvents();


    $("journalForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const input = journalInputFromDom();
        if (editingJournalId) {
          persistState(core.updateJournalDraft(state, editingJournalId, input, nowUtc()));
          showNotice(`${editingJournalId} updated.`);
        } else {
          const result = core.saveJournalDraft(state, input, nowUtc());
          persistState(result.state);
          showNotice(`${result.journalId} saved as draft.`);
        }
        resetJournalEditor();
        render();
      } catch (error) { handleError(error); }
    });


    $("cancelEditJournal")?.addEventListener("click", () => { resetJournalEditor(); render(); });


    document.querySelectorAll("[data-edit-journal]").forEach((button) => button.addEventListener("click", () => {
      const journal = state.journals.find((candidate) => candidate.journalId === button.dataset.editJournal);
      editingJournalId = journal.journalId;
      journalEditorLines = journal.lines.map((line) => ({ editorLineId: createEditorLine().editorLineId, ...line }));
      render();
    }));


    document.querySelectorAll("[data-post-journal]").forEach((button) => button.addEventListener("click", () => {
      if (!window.confirm(`Post ${button.dataset.postJournal}? Posted journals are immutable.`)) return;
      try {
        persistState(core.postJournal(state, button.dataset.postJournal, nowUtc()));
        showNotice(`${button.dataset.postJournal} posted.`);
        render();
      } catch (error) { handleError(error); }
    }));


    document.querySelectorAll("[data-reverse-journal]").forEach((button) => button.addEventListener("click", () => {
      const businessDate = window.prompt("Business date for reversal (YYYY-MM-DD):", "");
      if (!businessDate) return;
      const description = window.prompt("Reversal description:", `Reversal of ${button.dataset.reverseJournal}`) || "";
      try {
        const result = core.reverseJournal(state, button.dataset.reverseJournal, { businessDate, description }, nowUtc());
        persistState(result.state);
        showNotice(`${result.reversalJournalId} posted as reversal.`);
        render();
      } catch (error) { handleError(error); }
    }));


    $("ledgerAccountSelect")?.addEventListener("change", (event) => {
      selectedLedgerAccountId = event.target.value;
      render();
    });


    $("exportState")?.addEventListener("click", () => {
      const blob = new Blob([core.serializeState(state)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `maxi-accounting-backup-${new Date().toISOString().replaceAll(":", "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    });


    $("importState")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file || !window.confirm("Import will replace the active browser state. Continue?")) return;
      try {
        const importedState = core.parseState(await file.text());
        localStorage.setItem(BACKUP_KEY, core.serializeState(state));
        persistState(importedState);
        resetJournalEditor();
        showNotice("State imported. Previous state saved to the local backup key.");
        render();
      } catch (error) { handleError(error); }
    });
  }


  function bindShellEvents() {
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
      activeView = button.dataset.view;
      render();
    }));
  }


  try {
    state = loadState();
    bindShellEvents();
    render();
  } catch (error) {
    console.error(error);
    $("appView").innerHTML = `<article class="fatal panel"><span class="eyebrow">State blocked</span><h2>Local accounting state cannot be loaded</h2><p>${escapeHtml(error.code || "ERROR")}: ${escapeHtml(error.message)}</p><p>Export the raw localStorage value manually before clearing anything. The app will not silently reset financial data.</p></article>`;
  }
})();
