/* ProTrack OS Phase 2.4 — AI Coach Intelligence Engine. */
var PTCOACH = {
  version: "2.4.0",
  cache: new Map(),
};

PTCOACH.t = function(en, fa) { return OS.lang === "fa" ? fa : en; };
PTCOACH.canCoach = function() { return OS.user?.role === "head" || OS.user?.role === "assistant"; };
PTCOACH.safe = value => osEsc(value === null || value === undefined || value === "" ? "—" : value);
PTCOACH.list = value => Array.isArray(value) ? value : [];

PTCOACH.fetchJson = async function(url, options = {}) {
  const res = await fetch(url, {cache: "no-store", ...options});
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || "Request failed.");
  return out;
};

PTCOACH.post = function(url, payload) {
  return PTCOACH.fetchJson(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})});
};

PTCOACH.install = function() {
  if (PTCOACH.installed) return;
  PTCOACH.installed = true;
  if (window.PTC && typeof PTC.playerTab === "function") {
    PTCOACH.previousPlayerTab = PTC.playerTab;
    PTC.playerTab = function(p, analyses) {
      if (PTC.profileTab === "coach") return PTCOACH.playerShell(p);
      return PTCOACH.previousPlayerTab(p, analyses);
    };
  }
  PTCOACH.previousRender = osRender;
  osRender = function(view = OS.current) {
    PTCOACH.previousRender(view);
    setTimeout(() => PTCOACH.afterRender(view), 0);
  };
  PTCOACH.previousOpenReport = osOpenReport;
  osOpenReport = function(id) {
    PTCOACH.previousOpenReport(id);
    setTimeout(() => PTCOACH.injectReportPlan(id), 0);
  };
};

PTCOACH.afterRender = function(view) {
  if (view === "home" && PTCOACH.canCoach()) PTCOACH.injectDashboard();
  if (view === "player") PTCOACH.afterPlayerRender();
};

PTCOACH.injectDashboard = async function() {
  const root = document.getElementById("view");
  if (!root || document.getElementById("ptcoachDashboard")) return;
  const anchor = root.querySelector(".ptc-hero") || root.querySelector(".os-page-head") || root.firstElementChild;
  if (!anchor) return;
  anchor.insertAdjacentHTML("afterend", `<section class="os-card ptcoach-dashboard" id="ptcoachDashboard"><div class="os-section-head"><div><span class="eyebrow">AI ASSISTANT COACH</span><h2>${PTCOACH.t("AI Coach Recommendations", "پیشنهادهای مربی AI")}</h2><p>${PTCOACH.t("Action plan, reminders and next-session decisions.", "برنامه عملی، یادآوری‌ها و تصمیم‌های جلسه بعد.")}</p></div></div><p class="ptcoach-empty">${PTCOACH.t("Loading coach intelligence…", "در حال بارگذاری هوش مربی…")}</p></section>`);
  try {
    const out = await PTCOACH.fetchJson("/api/coach/dashboard");
    PTCOACH.renderDashboard(document.getElementById("ptcoachDashboard"), out);
  } catch (error) {
    const panel = document.getElementById("ptcoachDashboard");
    if (panel) panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">AI ASSISTANT COACH</span><h2>${PTCOACH.t("AI Coach sync pending", "همگام‌سازی مربی AI در انتظار است")}</h2><p>${PTCOACH.safe(error.message)}</p></div></div>`;
  }
};

PTCOACH.renderDashboard = function(panel, out) {
  if (!panel) return;
  panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">AI ASSISTANT COACH</span><h2>${PTCOACH.t("AI Coach Recommendations", "پیشنهادهای مربی AI")}</h2><p>${PTCOACH.t("The next best coaching actions are generated from approved analysis and player memory.", "اقدام‌های بعدی مربی از تحلیل تأییدشده و حافظه بازیکن ساخته می‌شوند.")}</p></div></div>
  <div class="ptcoach-board-grid">
    ${PTCOACH.dashboardColumn(PTCOACH.t("Today's Priorities", "اولویت‌های امروز"), out.todaysPriorities, item => `<strong>${PTCOACH.safe(item.playerName)} · ${PTCOACH.safe(item.skill)}</strong><small>${PTCOACH.safe(item.level)} · ${PTCOACH.safe(item.status)}</small>`)}
    ${PTCOACH.dashboardColumn(PTCOACH.t("Upcoming Reviews", "بازبینی‌های آینده"), out.upcomingReviews, item => `<strong>${PTCOACH.safe(PTCOACH.playerName(item.playerId))}</strong><small>${PTCOACH.safe(item.followUp?.nextReviewDate)} · ${PTCOACH.safe(item.objective)}</small>`)}
    ${PTCOACH.dashboardColumn(PTCOACH.t("Players Requiring Intervention", "بازیکنان نیازمند مداخله"), out.playersRequiringIntervention, item => `<strong>${PTCOACH.safe(PTCOACH.playerName(item.playerId))}</strong><small>${PTCOACH.safe(item.loadControl?.message || item.approvalStatus)}</small>`)}
    ${PTCOACH.dashboardColumn(PTCOACH.t("Suggested Sessions", "جلسات پیشنهادی"), out.suggestedSessions, item => `<strong>${PTCOACH.safe(PTCOACH.playerName(item.playerId))}</strong><small>${PTCOACH.safe(item.sessionDuration)} min · ${PTCOACH.safe(item.objective)}</small>`)}
  </div>
  <div class="ptcoach-reminders">
    <h3>${PTCOACH.t("Smart Reminders", "یادآوری‌های هوشمند")}</h3>
    ${PTCOACH.list(out.smartReminders).length ? PTCOACH.list(out.smartReminders).map(r=>`<article><strong>${PTCOACH.safe(r.title)}</strong><p>${PTCOACH.safe(r.message)}</p></article>`).join("") : `<p class="ptcoach-empty">${PTCOACH.t("No reminders for today.", "برای امروز یادآوری‌ای نیست.")}</p>`}
  </div>
  <div class="ptcoach-dashboard-strip">
    <section><h3>${PTCOACH.t("Recent AI Coach Recommendations", "پیشنهادهای اخیر مربی AI")}</h3>${PTCOACH.list(out.aiCoachRecommendations).slice(0,3).map(p=>`<article><strong>${PTCOACH.safe(PTCOACH.playerName(p.playerId))}</strong><p>${PTCOACH.safe(p.objective)}</p><small>${PTCOACH.safe(p.approvalStatus)}</small></article>`).join("") || `<p class="ptcoach-empty">${PTCOACH.t("No recommendations yet.", "هنوز پیشنهادی نیست.")}</p>`}</section>
    <section><h3>${PTCOACH.t("Recently Completed Goals", "هدف‌های اخیراً تکمیل‌شده")}</h3>${PTCOACH.list(out.recentlyCompletedGoals).slice(0,5).map(goal=>`<article><p>${PTCOACH.safe(goal)}</p></article>`).join("") || `<p class="ptcoach-empty">${PTCOACH.t("No completed goals yet.", "هنوز هدف تکمیل‌شده‌ای نیست.")}</p>`}</section>
  </div>`;
};

PTCOACH.dashboardColumn = function(title, items, render) {
  const list = PTCOACH.list(items).slice(0, 4);
  return `<section><h3>${title}</h3>${list.length ? list.map(item=>`<article>${render(item)}</article>`).join("") : `<p class="ptcoach-empty">${PTCOACH.t("Clear.", "خالی.")}</p>`}</section>`;
};

PTCOACH.playerName = function(playerId) {
  return osPlayer(playerId)?.name || playerId || "—";
};

PTCOACH.afterPlayerRender = function() {
  const root = document.getElementById("view");
  if (!root) return;
  const player = osPlayer(OS.profileId) || osVisiblePlayers()[0];
  const sideTabs = root.querySelector(".ptc-side-tabs");
  if (sideTabs && !sideTabs.querySelector("[data-tab='coach']")) {
    const twin = sideTabs.querySelector("[data-tab='twin']");
    const btn = document.createElement("button");
    btn.className = PTC.profileTab === "coach" ? "active" : "";
    btn.dataset.ptcAction = "profile-tab";
    btn.dataset.tab = "coach";
    btn.textContent = PTCOACH.t("AI Coach", "مربی AI");
    (twin || sideTabs.firstElementChild)?.insertAdjacentElement(twin ? "afterend" : "afterend", btn);
  }
  const legacyTabs = root.querySelector(".os-profile-tabs");
  if (legacyTabs && !legacyTabs.querySelector("[data-tab='coach']")) {
    legacyTabs.insertAdjacentHTML("beforeend", `<button class="os-profile-tab ${OS.profileTab==="coach"?"active":""}" data-os-action="profile-tab" data-tab="coach">${PTCOACH.t("AI Coach", "مربی AI")}</button>`);
  }
  if (window.PTC && PTC.profileTab === "coach") {
    const content = root.querySelector(".ptc-detail-content");
    if (content && !content.querySelector("#ptcoachPlayerPanel")) content.innerHTML = PTCOACH.playerShell(player);
    PTCOACH.loadPlayer(player?.id);
  }
  if (!window.PTC && OS.profileTab === "coach") {
    const content = root.querySelector("#osProfileContent");
    if (content && !content.querySelector("#ptcoachPlayerPanel")) content.innerHTML = PTCOACH.playerShell(player);
    PTCOACH.loadPlayer(player?.id);
  }
};

PTCOACH.playerShell = function(player) {
  return `<section class="os-card ptcoach-player" id="ptcoachPlayerPanel" data-player="${PTCOACH.safe(player?.id || "")}"><div class="os-section-head"><div><span class="eyebrow">YOUR SECOND COACH</span><h2>${PTCOACH.t("AI Coach Plan", "برنامه مربی AI")}</h2><p>${PTCOACH.t("Next session, checklist, homework and follow-up.", "جلسه بعد، چک‌لیست، تکلیف و پیگیری.")}</p></div></div><p class="ptcoach-empty">${PTCOACH.t("Loading coach plan…", "در حال بارگذاری برنامه مربی…")}</p></section>`;
};

PTCOACH.loadPlayer = async function(playerId) {
  const panel = document.getElementById("ptcoachPlayerPanel");
  if (!panel || !playerId) return;
  try {
    const out = await PTCOACH.fetchJson(`/api/coach/intelligence?playerId=${encodeURIComponent(playerId)}`);
    PTCOACH.cache.set(playerId, out);
    PTCOACH.renderPlayerPlan(panel, out.activePlan, out);
  } catch (error) {
    panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">YOUR SECOND COACH</span><h2>${PTCOACH.t("AI Coach sync pending", "همگام‌سازی مربی AI در انتظار است")}</h2><p>${PTCOACH.safe(error.message)}</p></div></div>`;
  }
};

PTCOACH.renderPlayerPlan = function(panel, plan, out = {}) {
  if (!panel) return;
  if (!plan) {
    panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">YOUR SECOND COACH</span><h2>${PTCOACH.t("No AI coach plan yet", "هنوز برنامه مربی AI وجود ندارد")}</h2><p>${PTCOACH.t("Complete and approve an analysis to generate the next session plan.", "یک تحلیل را تکمیل و تأیید کنید تا برنامه جلسه بعد ساخته شود.")}</p></div></div>`;
    return;
  }
  panel.innerHTML = `${PTCOACH.planHtml(plan, true)}
  ${PTCOACH.list(out.smartReminders).length ? `<section class="os-card ptcoach-block"><h3>${PTCOACH.t("Smart reminders", "یادآوری‌های هوشمند")}</h3>${PTCOACH.list(out.smartReminders).slice(0,4).map(r=>`<p>${PTCOACH.safe(r.message)}</p>`).join("")}</section>` : ""}`;
};

PTCOACH.planHtml = function(plan, withActions = false) {
  return `<section class="ptcoach-plan" data-plan="${PTCOACH.safe(plan.id)}">
    <div class="os-section-head"><div><span class="eyebrow">AI COACH · ${PTCOACH.safe(plan.approvalStatus)}</span><h2>${PTCOACH.safe(plan.objective)}</h2><p>${PTCOACH.safe(plan.sessionDuration)} ${PTCOACH.t("minutes", "دقیقه")} · ${PTCOACH.safe(plan.recommendationConfidence?.label)} ${PTCOACH.t("confidence", "اطمینان")}</p></div>${withActions && PTCOACH.canCoach() ? PTCOACH.actions(plan) : ""}</div>
    <div class="ptcoach-grid three">
      <section class="os-card ptcoach-block"><h3>${PTCOACH.t("Training Priorities", "اولویت‌های تمرین")}</h3>${PTCOACH.priorities(plan.priorities)}</section>
      <section class="os-card ptcoach-block"><h3>${PTCOACH.t("Coach Checklist", "چک‌لیست مربی")}</h3>${PTCOACH.checklist(plan.coachChecklist)}</section>
      <section class="os-card ptcoach-block"><h3>${PTCOACH.t("Follow-up", "پیگیری")}</h3>${PTCOACH.followUp(plan.followUp)}</section>
    </div>
    <section class="os-card ptcoach-block"><h3>${PTCOACH.t("Next Session Planner", "برنامه جلسه بعد")}</h3>${PTCOACH.blocks(plan.sessionBlocks)}</section>
    <div class="ptcoach-grid two">
      <section class="os-card ptcoach-block"><h3>${PTCOACH.t("Personalized Drills", "تمرین‌های شخصی‌سازی‌شده")}</h3>${PTCOACH.drills(plan.recommendedDrills)}</section>
      <section class="os-card ptcoach-block"><h3>${PTCOACH.t("Homework & Motivation", "تکلیف و انگیزه")}</h3>${PTCOACH.homework(plan.homework)}<p class="ptcoach-motivation">${PTCOACH.safe(plan.motivationMessage)}</p></section>
    </div>
    <section class="os-card ptcoach-block"><h3>${PTCOACH.t("Session Success Metrics", "معیارهای موفقیت جلسه")}</h3>${PTCOACH.metrics(plan.successMetrics)}</section>
  </section>`;
};

PTCOACH.actions = function(plan) {
  if (["Accepted", "Edited", "Rejected", "Replaced"].includes(plan.approvalStatus)) return `<span class="os-status active">${PTCOACH.safe(plan.approvalStatus)}</span>`;
  return `<div class="ptcoach-actions"><button class="os-primary-button" data-ptcoach-action="review" data-review="Accept" data-id="${PTCOACH.safe(plan.id)}">${PTCOACH.t("Accept", "تأیید")}</button><button class="os-secondary-button" data-ptcoach-action="edit" data-id="${PTCOACH.safe(plan.id)}">${PTCOACH.t("Edit", "ویرایش")}</button><button class="os-secondary-button" data-ptcoach-action="review" data-review="Reject" data-id="${PTCOACH.safe(plan.id)}">${PTCOACH.t("Reject", "رد")}</button><button class="os-secondary-button" data-ptcoach-action="edit" data-replace="true" data-id="${PTCOACH.safe(plan.id)}">${PTCOACH.t("Replace", "جایگزینی")}</button></div>`;
};

PTCOACH.priorities = items => `<ol class="ptcoach-priorities">${PTCOACH.list(items).map(p=>`<li><strong>${PTCOACH.safe(p.level)} · ${PTCOACH.safe(p.skill)}</strong><p>${PTCOACH.safe(p.why)}</p><small>${PTCOACH.safe(p.estimatedSessions)} ${PTCOACH.t("sessions", "جلسه")}</small></li>`).join("")}</ol>`;

PTCOACH.checklist = function(c = {}) {
  return `<div class="ptcoach-checklist"><p><b>${PTCOACH.t("Focus", "تمرکز")}:</b> ${PTCOACH.safe(c.todaysFocus)}</p><p><b>${PTCOACH.t("Risk", "ریسک")}:</b> ${PTCOACH.safe(c.mainRisk)}</p><p><b>${PTCOACH.t("Opportunity", "فرصت")}:</b> ${PTCOACH.safe(c.mainOpportunity)}</p>${PTCOACH.list(c.keyCoachingPoints).map(x=>`<span>${PTCOACH.safe(x)}</span>`).join("")}<p><b>${PTCOACH.t("Reminder", "یادآوری")}:</b> ${PTCOACH.safe(c.coachReminder)}</p></div>`;
};

PTCOACH.followUp = function(f = {}) {
  return `<div class="ptcoach-list"><p><b>${PTCOACH.t("Review", "بازبینی")}:</b> ${PTCOACH.safe(f.nextReviewDate)}</p><p><b>${PTCOACH.t("Video", "ویدیو")}:</b> ${PTCOACH.safe(f.nextVideoSuggestion)}</p><p><b>${PTCOACH.t("Assessment", "ارزیابی")}:</b> ${PTCOACH.safe(f.nextAssessmentSuggestion)}</p><p><b>${PTCOACH.t("Match", "مسابقه")}:</b> ${PTCOACH.safe(f.nextMatchRecommendation)}</p></div>`;
};

PTCOACH.blocks = items => `<div class="ptcoach-blocks">${PTCOACH.list(items).map(b=>`<article><strong>${PTCOACH.safe(b.name)}</strong><small>${PTCOACH.safe(b.minutes)} min · ${PTCOACH.safe(b.priority)} · ${PTCOACH.safe(b.intensity)}</small><p>${PTCOACH.safe(b.drill)}</p><em>${PTCOACH.safe(b.successCriteria)}</em></article>`).join("")}</div>`;

PTCOACH.drills = items => `<div class="ptcoach-drills">${PTCOACH.list(items).map(d=>`<article><strong>${PTCOACH.safe(d.name)}</strong><small>${PTCOACH.safe(d.category)} · ${PTCOACH.safe(d.estimatedDuration)} min · ${PTCOACH.safe(d.intensity)}</small><p>${PTCOACH.safe(d.purpose)}</p><em>${PTCOACH.safe(d.successTarget)}</em></article>`).join("")}</div>`;

PTCOACH.homework = items => `<div class="ptcoach-list">${PTCOACH.list(items).map(h=>`<p><b>${PTCOACH.safe(h.type)}:</b> ${PTCOACH.safe(h.task)} <small>${PTCOACH.safe(h.duration)} · ${PTCOACH.safe(h.frequency)}</small></p>`).join("")}</div>`;

PTCOACH.metrics = items => `<div class="ptcoach-metrics">${PTCOACH.list(items).map(m=>`<article><small>${PTCOACH.safe(m.metric)}</small><strong>${PTCOACH.safe(m.target)}</strong><p>${PTCOACH.safe(m.measurementMethod)}</p></article>`).join("")}</div>`;

PTCOACH.injectReportPlan = async function(localAnalysisId) {
  const report = state.analyses.find(a => a.id === localAnalysisId);
  const backendId = report?.backendAnalysisId || report?.backendReportId;
  const content = document.getElementById("reportContent");
  if (!backendId || !content || document.getElementById("ptcoachReportPlan")) return;
  try {
    const out = await PTCOACH.fetchJson(`/api/coach/intelligence?analysisId=${encodeURIComponent(backendId)}`);
    if (!out.coachPlan) return;
    content.insertAdjacentHTML("beforeend", `<section id="ptcoachReportPlan" class="report-section">${PTCOACH.planHtml(out.coachPlan, false)}</section>`);
  } catch (_) {}
};

PTCOACH.openEdit = function(planId, replace = false) {
  const current = document.querySelector(`[data-plan="${CSS.escape(planId)}"]`);
  const title = replace ? PTCOACH.t("Replace AI recommendation", "جایگزینی پیشنهاد AI") : PTCOACH.t("Edit AI coach plan", "ویرایش برنامه مربی AI");
  const currentObjective = current?.querySelector("h2")?.textContent || "";
  osOpenModal(osModalFrame(title, PTCOACH.t("Coach authority stays final.", "تصمیم نهایی همیشه با مربی است."), `<form class="os-form" id="ptcoachEditForm"><div class="os-field"><label>${PTCOACH.t("Objective", "هدف")}</label><textarea name="objective">${PTCOACH.safe(currentObjective)}</textarea></div><div class="os-field"><label>${PTCOACH.t("Feedback", "بازخورد")}</label><textarea name="feedback" required></textarea></div><button class="os-primary-button">${replace ? PTCOACH.t("Replace plan", "جایگزین کن") : PTCOACH.t("Save edits", "ذخیره ویرایش")}</button></form>`));
  document.getElementById("ptcoachEditForm").addEventListener("submit", async event => {
    event.preventDefault();
    const fd = new FormData(event.target);
    await PTCOACH.submitReview(planId, replace ? "Replace" : "Edit", {feedback: fd.get("feedback"), planPatch: {objective: fd.get("objective")}});
    osCloseModal();
  });
};

PTCOACH.submitReview = async function(planId, action, extra = {}) {
  const out = await PTCOACH.post("/api/coach/intelligence/review", {coachPlanId: planId, action, ...extra});
  toast(PTCOACH.t("AI coach plan updated.", "برنامه مربی AI به‌روز شد."), "success");
  if (OS.current === "player") PTCOACH.loadPlayer(out.coachPlan.playerId);
  if (OS.current === "home") osRender("home");
  return out;
};

document.addEventListener("click", async event => {
  const action = event.target.closest("[data-ptcoach-action]");
  if (!action) return;
  event.preventDefault();
  try {
    if (action.dataset.ptcoachAction === "edit") {
      PTCOACH.openEdit(action.dataset.id, action.dataset.replace === "true");
      return;
    }
    const review = action.dataset.review;
    const payload = {};
    if (review === "Reject") {
      payload.feedback = prompt(PTCOACH.t("Why reject this recommendation?", "دلیل رد این پیشنهاد چیست؟")) || "";
    }
    action.disabled = true;
    await PTCOACH.submitReview(action.dataset.id, review, payload);
  } catch (error) {
    toast(error.message || PTCOACH.t("Coach action failed.", "عملیات مربی ناموفق بود."), "error");
    action.disabled = false;
  }
}, true);

PTCOACH.install();
