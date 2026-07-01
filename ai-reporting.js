/* ProTrack OS Phase 2.6 - AI Reporting & Automatic Document Generation. */
var PTR = {
  version: "2.6.0",
  state: {q: "", type: "all", status: "all", archiveStatus: "Active", playerId: ""},
  cache: new Map(),
};

PTR.t = function(en, fa) { return OS.lang === "fa" ? (fa || en) : en; };
PTR.safe = value => osEsc(value === null || value === undefined || value === "" ? "—" : value);
PTR.list = value => Array.isArray(value) ? value : [];
PTR.canCoach = () => OS.user?.role === "head" || OS.user?.role === "assistant";
PTR.canApprove = () => PTR.canCoach();

PTR.fetchJson = async function(url, options = {}) {
  const res = await fetch(url, {cache: "no-store", ...options});
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || "Request failed.");
  return out;
};

PTR.post = function(url, payload) {
  return PTR.fetchJson(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})});
};

PTR.install = function() {
  if (PTR.installed) return;
  PTR.installed = true;
  if (window.PTC && typeof PTC.playerTab === "function") {
    PTR.previousPlayerTab = PTC.playerTab;
    PTC.playerTab = function(p, analyses) {
      if (PTC.profileTab === "reports") return PTR.playerShell(p);
      return PTR.previousPlayerTab(p, analyses);
    };
  }
  PTR.previousRender = osRender;
  osRender = function(view = OS.current) {
    PTR.previousRender(view);
    setTimeout(() => PTR.afterRender(view), 0);
  };
};

PTR.afterRender = function(view) {
  if (view === "analysis") PTR.injectReportCenter();
  if (view === "player") PTR.afterPlayerRender();
};

PTR.query = function(extra = {}) {
  const params = new URLSearchParams({...PTR.state, ...extra});
  [...params.keys()].forEach(k => { if (!params.get(k)) params.delete(k); });
  return params.toString();
};

PTR.injectReportCenter = async function() {
  const root = document.getElementById("view");
  if (!root || document.getElementById("ptrDashboard")) return;
  const anchor = root.querySelector(".ptc-analysis-layout") || root.querySelector(".ptc-hero") || root.firstElementChild;
  if (!anchor) return;
  anchor.insertAdjacentHTML("beforebegin", `<section class="os-card ptr-dashboard" id="ptrDashboard"><div class="os-section-head"><div><span class="eyebrow">AI REPORTING</span><h2>${PTR.t("Automatic Report Center")}</h2><p>${PTR.t("Generated coaching documents, versioning, approval, archive and export.")}</p></div>${PTR.canCoach() ? `<button class="os-secondary-button" data-ptr-action="generate-executive">${PTR.t("Generate Executive Summary")}</button>` : ""}</div><p class="ptr-empty">${PTR.t("Loading reports…")}</p></section>`);
  PTR.loadDashboard();
};

PTR.loadDashboard = async function() {
  const panel = document.getElementById("ptrDashboard");
  if (!panel) return;
  try {
    const out = await PTR.fetchJson(`/api/reports/library?${PTR.query()}`);
    PTR.renderDashboard(panel, out);
  } catch (error) {
    panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">AI REPORTING</span><h2>${PTR.t("Report sync pending")}</h2><p>${PTR.safe(error.message)}</p></div></div>`;
  }
};

PTR.renderDashboard = function(panel, out) {
  const reports = PTR.list(out.reports);
  const counts = out.counts || {};
  panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">AI REPORTING · ${PTR.safe(counts.total || 0)} REPORTS</span><h2>${PTR.t("Automatic Report Center")}</h2><p>${PTR.t("Every report is generated from AI analysis and preserved in player history.")}</p></div>${PTR.canCoach() ? `<button class="os-secondary-button" data-ptr-action="generate-executive">${PTR.t("Generate Executive Summary")}</button>` : ""}</div>
  <div class="ptr-toolbar">
    <label class="ptr-search"><input data-ptr-input="search" value="${PTR.safe(PTR.state.q)}" placeholder="${PTR.t("Search by player, coach, date, type or keyword")}"></label>
    <div class="ptr-filter-row">
      <select data-ptr-input="type"><option value="all">${PTR.t("All report types")}</option>${PTR.list(out.reportTypes).map(t=>`<option value="${PTR.safe(t.id)}" ${PTR.state.type===t.id?"selected":""}>${PTR.safe(t.label)}</option>`).join("")}</select>
      <select data-ptr-input="status"><option value="all">${PTR.t("All status")}</option><option value="Pending Coach Review" ${PTR.state.status==="Pending Coach Review"?"selected":""}>${PTR.t("Draft")}</option><option value="Approved" ${PTR.state.status==="Approved"?"selected":""}>${PTR.t("Approved")}</option></select>
      <select data-ptr-input="archiveStatus"><option value="Active" ${PTR.state.archiveStatus==="Active"?"selected":""}>${PTR.t("Active")}</option><option value="Archived" ${PTR.state.archiveStatus==="Archived"?"selected":""}>${PTR.t("Archived")}</option><option value="all" ${PTR.state.archiveStatus==="all"?"selected":""}>${PTR.t("All archive")}</option></select>
    </div>
  </div>
  <div class="ptr-pill-row"><span class="ptr-pill">${PTR.t("Draft")}: ${PTR.safe(counts.draft || 0)}</span><span class="ptr-pill approved">${PTR.t("Approved")}: ${PTR.safe(counts.approved || 0)}</span><span class="ptr-pill">${PTR.t("Archived")}: ${PTR.safe(counts.archived || 0)}</span></div>
  <div class="ptr-grid" style="margin-top:12px">${reports.map(PTR.reportCard).join("") || `<p class="ptr-empty">${PTR.t("No generated reports yet.")}</p>`}</div>`;
};

PTR.reportCard = function(report) {
  const h = report.smartHighlights || {};
  const m = report.metrics || {};
  const status = report.approvalStatus === "Approved" ? "approved" : "draft";
  return `<article class="ptr-card" data-ptr-action="open-report" data-id="${PTR.safe(report.id)}"><small>${PTR.safe(report.reportTypeLabel)} · v${PTR.safe(report.version)}</small><h3>${PTR.safe(report.playerName || report.title)}</h3><p>${PTR.safe(h.mainPriority || h.coachAction || report.subtitle)}</p><div class="ptr-pill-row"><span class="ptr-pill ${status}">${PTR.safe(report.approvalStatus)}</span><span class="ptr-pill">PDI ${PTR.safe(m.pdi)}</span><span class="ptr-pill">PTI ${PTR.safe(m.pti)}</span></div></article>`;
};

PTR.afterPlayerRender = function() {
  const root = document.getElementById("view");
  if (!root) return;
  const player = osPlayer(OS.profileId) || osVisiblePlayers()[0];
  if (window.PTC && PTC.profileTab === "reports") {
    const content = root.querySelector(".ptc-detail-content");
    if (content && !content.querySelector("#ptrPlayerPanel")) content.innerHTML = PTR.playerShell(player);
    PTR.loadPlayer(player?.id);
  }
  if (!window.PTC && OS.profileTab === "reports") {
    const content = root.querySelector("#osProfileContent");
    if (content && !content.querySelector("#ptrPlayerPanel")) content.innerHTML = PTR.playerShell(player);
    PTR.loadPlayer(player?.id);
  }
};

PTR.playerShell = function(player) {
  return `<section class="os-card ptr-player" id="ptrPlayerPanel" data-player="${PTR.safe(player?.id || "")}"><div class="os-section-head"><div><span class="eyebrow">REPORT HISTORY</span><h2>${PTR.t("Professional Reports")}</h2><p>${PTR.t("Chronological, searchable, archived player report history.")}</p></div>${PTR.canCoach() ? `<button class="os-secondary-button" data-ptr-action="generate-monthly" data-player="${PTR.safe(player?.id || "")}">${PTR.t("Generate Monthly Report")}</button>` : ""}</div><p class="ptr-empty">${PTR.t("Loading player reports…")}</p></section>`;
};

PTR.loadPlayer = async function(playerId) {
  const panel = document.getElementById("ptrPlayerPanel");
  if (!panel || !playerId) return;
  try {
    const out = await PTR.fetchJson(`/api/reports/library?${PTR.query({playerId, archiveStatus:"all"})}`);
    PTR.renderPlayer(panel, out, playerId);
  } catch (error) {
    panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">REPORT HISTORY</span><h2>${PTR.t("Report sync pending")}</h2><p>${PTR.safe(error.message)}</p></div></div>`;
  }
};

PTR.renderPlayer = function(panel, out, playerId) {
  const reports = PTR.list(out.reports);
  panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">REPORT HISTORY · ${reports.length}</span><h2>${PTR.t("Professional Reports")}</h2><p>${PTR.t("Open, compare, approve, export or archive generated reports.")}</p></div>${PTR.canCoach() ? `<button class="os-secondary-button" data-ptr-action="generate-monthly" data-player="${PTR.safe(playerId)}">${PTR.t("Generate Monthly Report")}</button>` : ""}</div>
  <div class="ptr-grid">${reports.map(PTR.reportCard).join("") || `<p class="ptr-empty">${PTR.t("No generated reports yet. Complete an AI analysis first.")}</p>`}</div>`;
};

PTR.openReport = async function(reportId) {
  try {
    const out = await PTR.fetchJson(`/api/reports/detail?reportId=${encodeURIComponent(reportId)}`);
    PTR.cache.set(reportId, out.report);
    osOpenModal(PTR.detailHtml(out.report, out.versions || []), "ptr-report-modal");
  } catch (error) {
    toast(error.message || PTR.t("Report could not be opened."), "error");
  }
};

PTR.detailHtml = function(report, versions) {
  const h = report.smartHighlights || {};
  const m = report.metrics || {};
  const editable = report.coachEditable || {};
  return `<section class="ptr-modal-card" data-report="${PTR.safe(report.id)}">
    <div class="ptr-cover"><span class="eyebrow">PROTRACK REPORT · ${PTR.safe(report.reportTypeLabel)} · v${PTR.safe(report.version)}</span><h2>${PTR.safe(report.title)}</h2><p>${PTR.safe(report.subtitle)}</p><div class="ptr-actions">${PTR.actions(report)}</div></div>
    <div class="ptr-highlights">${Object.entries(h).map(([k,v])=>`<article class="ptr-highlight"><small>${PTR.safe(PTR.label(k))}</small><strong>${PTR.safe(v)}</strong></article>`).join("")}</div>
    <div class="ptr-metrics">${Object.entries(m).map(([k,v])=>`<article class="ptr-metric"><small>${PTR.safe(PTR.label(k))}</small><strong>${PTR.safe(v)}</strong></article>`).join("")}</div>
    ${PTR.canCoach() && !report.locked ? `<section class="ptr-block ptr-editor"><h3>${PTR.t("Coach Edit Mode")}</h3><textarea data-ptr-field="summary" rows="3" placeholder="${PTR.t("Edit summary")}">${PTR.safe(editable.summary || "")}</textarea><textarea data-ptr-field="coachNotes" rows="3" placeholder="${PTR.t("Add coach notes")}">${PTR.safe(editable.coachNotes || "")}</textarea><button class="os-secondary-button" data-ptr-action="save-edit" data-id="${PTR.safe(report.id)}">${PTR.t("Save Draft Version")}</button></section>` : ""}
    <div class="ptr-section-list">${PTR.list(report.sections).map(PTR.sectionHtml).join("")}</div>
    <section class="ptr-block"><h3>${PTR.t("Report Versioning")}</h3><p>${versions.length ? versions.map(v=>`v${PTR.safe(v.versionNumber)} · ${PTR.safe(v.reason)} · ${PTR.safe(String(v.createdAt||"").slice(0,10))}`).join("<br>") : PTR.t("Initial generated version.")}</p><div id="ptrCompareBox"></div></section>
  </section>`;
};

PTR.actions = function(report) {
  const buttons = [
    `<button class="os-secondary-button" data-ptr-action="compare" data-id="${PTR.safe(report.id)}">${PTR.t("Compare")}</button>`,
    `<button class="os-secondary-button" data-ptr-action="export" data-format="docx" data-id="${PTR.safe(report.id)}">DOCX</button>`,
    `<button class="os-primary-button" data-ptr-action="export" data-format="pdf" data-id="${PTR.safe(report.id)}">PDF</button>`,
  ];
  if (PTR.canApprove() && report.approvalStatus !== "Approved") buttons.unshift(`<button class="os-primary-button" data-ptr-action="approve" data-id="${PTR.safe(report.id)}">${PTR.t("Approve & Lock")}</button>`);
  if (PTR.canCoach()) buttons.push(`<button class="os-secondary-button" data-ptr-action="archive" data-id="${PTR.safe(report.id)}" data-archive="${report.archiveStatus === "Archived" ? "restore" : "archive"}">${report.archiveStatus === "Archived" ? PTR.t("Restore") : PTR.t("Archive")}</button>`);
  return buttons.join("");
};

PTR.sectionHtml = function(section) {
  return `<section class="ptr-block"><h3>${PTR.safe(section.title)}</h3>${section.body ? `<p>${PTR.safe(section.body)}</p>` : ""}${section.confidence !== null && section.confidence !== undefined ? `<small>${PTR.t("Confidence")}: ${PTR.safe(section.confidence)}%</small>` : ""}${PTR.list(section.items).length ? `<ul>${PTR.list(section.items).map(i=>`<li>${PTR.safe(i)}</li>`).join("")}</ul>` : ""}</section>`;
};

PTR.label = function(key) {
  return String(key || "").replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
};

PTR.exportReport = async function(reportId, format) {
  const res = await fetch(`/api/reports/export/${format}`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({reportId})});
  if (!res.ok) {
    const out = await res.json().catch(() => ({}));
    throw new Error(out.message || "Export failed.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ProTrack_Report_${reportId}.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

PTR.showCompare = function(out) {
  const box = document.getElementById("ptrCompareBox");
  if (!box) return;
  box.innerHTML = `<div class="ptr-compare">${PTR.list(out.comparison).map(row=>`<article class="ptr-metric"><small>${PTR.safe(row.label)}</small><strong>${PTR.safe(row.status)}</strong><small>${PTR.safe(row.delta || "—")}</small></article>`).join("")}</div>`;
};

PTR.refresh = function() {
  if (OS.current === "analysis") PTR.loadDashboard();
  if (OS.current === "player") PTR.loadPlayer((osPlayer(OS.profileId) || osVisiblePlayers()[0])?.id);
};

document.addEventListener("input", event => {
  const input = event.target.closest("[data-ptr-input='search']");
  if (!input) return;
  clearTimeout(PTR.searchTimer);
  PTR.searchTimer = setTimeout(() => { PTR.state.q = input.value.trim(); PTR.loadDashboard(); }, 220);
}, true);

document.addEventListener("change", event => {
  const input = event.target.closest("[data-ptr-input]");
  if (!input || input.dataset.ptrInput === "search") return;
  PTR.state[input.dataset.ptrInput] = input.value;
  PTR.loadDashboard();
}, true);

document.addEventListener("click", async event => {
  const action = event.target.closest("[data-ptr-action]");
  if (!action) return;
  event.preventDefault();
  const type = action.dataset.ptrAction;
  try {
    action.disabled = true;
    if (type === "open-report") { await PTR.openReport(action.dataset.id); return; }
    if (type === "save-edit") {
      const card = action.closest("[data-report]");
      const summary = card.querySelector("[data-ptr-field='summary']")?.value || "";
      const coachNotes = card.querySelector("[data-ptr-field='coachNotes']")?.value || "";
      const out = await PTR.post("/api/reports/update", {reportId: action.dataset.id, summary, coachNotes});
      toast(PTR.t("Report draft saved."), "success");
      osCloseModal();
      await PTR.openReport(out.report.id);
      PTR.refresh();
      return;
    }
    if (type === "approve") {
      const out = await PTR.post("/api/reports/approve", {reportId: action.dataset.id, lock: true});
      toast(PTR.t("Report approved and locked."), "success");
      osCloseModal();
      await PTR.openReport(out.report.id);
      PTR.refresh();
      return;
    }
    if (type === "archive") {
      await PTR.post("/api/reports/archive", {reportId: action.dataset.id, action: action.dataset.archive});
      toast(action.dataset.archive === "restore" ? PTR.t("Report restored.") : PTR.t("Report archived."), "success");
      osCloseModal();
      PTR.refresh();
      return;
    }
    if (type === "compare") {
      const out = await PTR.fetchJson(`/api/reports/compare?reportId=${encodeURIComponent(action.dataset.id)}`);
      PTR.showCompare(out);
      return;
    }
    if (type === "export") {
      await PTR.exportReport(action.dataset.id, action.dataset.format);
      toast(`${action.dataset.format.toUpperCase()} ${PTR.t("export created.")}`, "success");
      return;
    }
    if (type === "generate-monthly") {
      await PTR.post("/api/reports/generate", {reportType: "monthly_progress", playerId: action.dataset.player});
      toast(PTR.t("Monthly report generated."), "success");
      PTR.loadPlayer(action.dataset.player);
      return;
    }
    if (type === "generate-executive") {
      await PTR.post("/api/reports/generate", {reportType: "executive_summary"});
      toast(PTR.t("Executive summary generated."), "success");
      PTR.loadDashboard();
      return;
    }
  } catch (error) {
    toast(error.message || PTR.t("Report action failed."), "error");
  } finally {
    action.disabled = false;
  }
}, true);

PTR.install();
