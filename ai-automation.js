/* ProTrack OS Phase 2.8 - AI Automation Engine */
var PTAUTO = {
  version: "2.8.0",
  cache: null,
};

PTAUTO.t = function(en, fa) { return OS.lang === "fa" ? (fa || en) : en; };
PTAUTO.safe = value => osEsc(value === null || value === undefined || value === "" ? "—" : value);
PTAUTO.list = value => Array.isArray(value) ? value : [];
PTAUTO.canCoach = () => OS.user?.role === "head" || OS.user?.role === "assistant";

PTAUTO.fetchJson = async function(url, options = {}) {
  const res = await fetch(url, {cache: "no-store", ...options});
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || "Request failed.");
  return out;
};

PTAUTO.post = function(url, payload) {
  return PTAUTO.fetchJson(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})});
};

PTAUTO.install = function() {
  if (PTAUTO.installed) return;
  PTAUTO.installed = true;
  if (window.PTC && typeof PTC.navItems === "function") {
    PTAUTO.previousNavItems = PTC.navItems;
    PTC.navItems = function() {
      const items = PTAUTO.previousNavItems();
      if (PTAUTO.canCoach() && !items.some(([view]) => view === "automation")) {
        const analysisIndex = items.findIndex(([view]) => view === "analysis");
        items.splice(analysisIndex >= 0 ? analysisIndex + 1 : items.length, 0, ["automation", PTAUTO.t("Automation", "اتوماسیون"), "spark"]);
      }
      return items;
    };
  }
  PTAUTO.previousRender = osRender;
  osRender = function(view = OS.current) {
    if (view === "automation") {
      if (!PTAUTO.canCoach()) { toast(PTAUTO.t("Only coaches can open Automation Center.", "فقط مربیان می‌توانند مرکز اتوماسیون را باز کنند.")); view = "home"; }
      else {
        OS.current = "automation";
        if (typeof osSetNav === "function") osSetNav("automation");
        const root = document.getElementById("view");
        PTAUTO.render(root);
        PTAUTO.syncNav();
        root?.focus?.({preventScroll: true});
        window.scrollTo({top: 0, behavior: "smooth"});
        return;
      }
    }
    const result = PTAUTO.previousRender(view);
    setTimeout(() => PTAUTO.afterRender(view), 0);
    return result;
  };
};

PTAUTO.syncNav = function() {
  if (window.PTC?.syncNavigation) PTC.syncNavigation(OS.current);
};

PTAUTO.afterRender = function(view) {
  if (view === "home" && PTAUTO.canCoach()) PTAUTO.injectHomePanel();
  if (view === "analysis" && PTAUTO.canCoach()) PTAUTO.injectAnalysisPanel();
};

PTAUTO.render = function(root) {
  if (!root) return;
  root.innerHTML = `<div class="pta-screen">
    <section class="os-card pta-hero"><span class="eyebrow">AI AUTOMATION ENGINE · v${PTAUTO.version}</span><h1>${PTAUTO.t("Zero manual workflow.", "جریان کاری بدون کار دستی.")}</h1><p>${PTAUTO.t("Upload a video and ProTrack connects the rest: analysis, reports, player card, digital twin, prediction, tasks, session suggestions, achievements and notifications.", "ویدیو را آپلود کنید و ProTrack بقیه را وصل می‌کند: تحلیل، گزارش، کارت بازیکن، دوقلوی دیجیتال، پیش‌بینی، تسک‌ها، جلسه پیشنهادی، achievement و اعلان‌ها.")}</p><div class="pta-flow">${["Upload Video","AI Analysis","Knowledge Validation","Player Sync","Reports","Tasks","Next Session","Coach Review"].map(x=>`<span>${PTAUTO.safe(x)}</span>`).join("")}</div></section>
    <section class="pta-summary" id="ptaSummary">${[1,2,3,4,5].map(()=>`<article class="pta-metric"><small>—</small><strong>—</strong></article>`).join("")}</section>
    <div class="pta-layout">
      <main class="pta-list" id="ptaMain"><section class="os-card"><p>${PTAUTO.t("Loading automation engine…", "در حال بارگذاری موتور اتوماسیون…")}</p></section></main>
      <aside class="pta-list" id="ptaSide"></aside>
    </div>
  </div>`;
  PTAUTO.load();
};

PTAUTO.load = async function() {
  try {
    const out = await PTAUTO.fetchJson("/api/automation/dashboard");
    PTAUTO.cache = out;
    PTAUTO.renderDashboard(out);
  } catch (error) {
    const main = document.getElementById("ptaMain");
    if (main) main.innerHTML = `<section class="os-card"><h2>${PTAUTO.t("Automation sync pending", "همگام‌سازی اتوماسیون در انتظار است")}</h2><p>${PTAUTO.safe(error.message)}</p></section>`;
  }
};

PTAUTO.renderDashboard = function(out) {
  const s = out.summary || {};
  const summary = document.getElementById("ptaSummary");
  if (summary) summary.innerHTML = [
    [PTAUTO.t("Runs", "اجراها"), s.automationRuns],
    [PTAUTO.t("Active Tasks", "تسک فعال"), s.activeTasks],
    [PTAUTO.t("High Priority", "اولویت بالا"), s.highPriorityTasks],
    [PTAUTO.t("Failed Steps", "مرحله ناموفق"), s.failedSteps],
    [PTAUTO.t("Achievements", "دستاوردها"), s.achievements],
  ].map(([label,value])=>`<article class="pta-metric"><small>${PTAUTO.safe(label)}</small><strong>${PTAUTO.safe(value || 0)}</strong></article>`).join("");
  const main = document.getElementById("ptaMain");
  const side = document.getElementById("ptaSide");
  if (main) main.innerHTML = `${PTAUTO.morning(out.morningReminder)}${PTAUTO.tasks(out.tasks)}${PTAUTO.failed(out.failedSteps)}`;
  if (side) side.innerHTML = `${PTAUTO.runs(out.recentRuns)}${PTAUTO.achievements(out.recentAchievements)}${PTAUTO.events(out.recentEvents)}`;
};

PTAUTO.morning = function(m = {}) {
  return `<section class="os-card pta-morning"><div class="os-section-head"><div><span class="eyebrow">SMART REMINDER</span><h2>${PTAUTO.safe(m.title || PTAUTO.t("Morning automation summary", "خلاصه صبحگاهی اتوماسیون"))}</h2><p>${PTAUTO.t("Generated automatically from sessions, pending reviews, risks and tournaments.", "خودکار از جلسات، بازبینی‌ها، ریسک‌ها و مسابقات ساخته می‌شود.")}</p></div></div><div class="pta-morning-grid">
    ${[
      [PTAUTO.t("Today Sessions", "جلسات امروز"), m.todaysSessions],
      [PTAUTO.t("Pending Reviews", "بازبینی در انتظار"), m.pendingReviews],
      [PTAUTO.t("Players At Risk", "بازیکنان در ریسک"), m.playersAtRisk],
      [PTAUTO.t("Tournaments", "مسابقات"), m.upcomingTournaments],
      [PTAUTO.t("Due Today", "موعد امروز"), m.dueToday],
      [PTAUTO.t("Critical", "بحرانی"), m.critical],
    ].map(([k,v])=>`<div><small>${PTAUTO.safe(k)}</small><strong>${PTAUTO.safe(v || 0)}</strong></div>`).join("")}
  </div></section>`;
};

PTAUTO.tasks = function(tasks) {
  const rows = PTAUTO.list(tasks);
  return `<section class="os-card"><div class="os-section-head"><div><h2>${PTAUTO.t("Automation Task Queue", "صف تسک‌های اتوماسیون")}</h2><p>${PTAUTO.t("Coach only reviews, approves or overrides.", "مربی فقط بازبینی، تأیید یا override می‌کند.")}</p></div><button class="os-secondary-button" data-pta-action="refresh">${PTAUTO.t("Refresh", "به‌روزرسانی")}</button></div><div class="pta-list">${rows.map(PTAUTO.task).join("") || `<p class="pta-empty">${PTAUTO.t("No active automation tasks.", "تسک فعال وجود ندارد.")}</p>`}</div></section>`;
};

PTAUTO.task = function(task) {
  const player = task.playerId ? (typeof osPlayer === "function" ? osPlayer(task.playerId)?.name : task.playerId) : "Academy";
  return `<article class="pta-task" data-task="${PTAUTO.safe(task.id)}"><div><small>${PTAUTO.safe(player)} · ${PTAUTO.safe(task.sourceType)}</small><h3>${PTAUTO.safe(task.title)}</h3><p>${PTAUTO.safe((task.metadata || {}).reason || (task.metadata || {}).next || (task.metadata || {}).focus || "")}</p><div class="pta-pill-row"><span class="pta-pill ${PTAUTO.safe(task.priority)}">${PTAUTO.safe(task.priority)}</span><span class="pta-pill">${PTAUTO.t("Due", "موعد")}: ${PTAUTO.safe(task.deadline)}</span><span class="pta-pill">${PTAUTO.safe(task.estimatedTime)} min</span><span class="pta-pill">${PTAUTO.safe(task.status)}</span></div></div><div class="pta-actions"><button class="os-primary-button" data-pta-action="task" data-status="Completed" data-id="${PTAUTO.safe(task.id)}">${PTAUTO.t("Done", "انجام شد")}</button><button class="os-secondary-button" data-pta-action="task" data-status="Snoozed" data-id="${PTAUTO.safe(task.id)}">${PTAUTO.t("Snooze", "تعویق")}</button><button class="os-secondary-button" data-pta-action="task" data-status="Rejected" data-id="${PTAUTO.safe(task.id)}">${PTAUTO.t("Reject", "رد")}</button></div></article>`;
};

PTAUTO.failed = function(steps) {
  const rows = PTAUTO.list(steps);
  if (!rows.length) return "";
  return `<section class="os-card"><div class="os-section-head"><div><h2>${PTAUTO.t("Failsafe Retry Queue", "صف تلاش دوباره")}</h2><p>${PTAUTO.t("Failures do not stop the workflow. Retry safely when ready.", "خطا کل workflow را متوقف نمی‌کند. هر وقت آماده بودید دوباره تلاش کنید.")}</p></div></div><div class="pta-list">${rows.map(s=>`<article class="pta-run"><small>${PTAUTO.safe(s.eventType)}</small><h3>${PTAUTO.safe(s.stepName)}</h3><p>${PTAUTO.safe(s.error)}</p><div class="pta-actions"><button class="os-secondary-button" data-pta-action="retry" data-step="${PTAUTO.safe(s.id)}">${PTAUTO.t("Retry", "تلاش دوباره")}</button></div></article>`).join("")}</div></section>`;
};

PTAUTO.runs = function(runs) {
  return `<section class="os-card"><div class="os-section-head"><div><h2>${PTAUTO.t("Recent Automation Runs", "اجرای اخیر اتوماسیون")}</h2></div></div><div class="pta-list">${PTAUTO.list(runs).slice(0,8).map(r=>`<article class="pta-run"><small>${PTAUTO.safe(r.eventType)} · ${PTAUTO.safe(String(r.createdAt || "").slice(0,10))}</small><h3>${PTAUTO.safe(r.status)}</h3><p>${PTAUTO.safe(r.stepsCompleted)} / ${PTAUTO.safe(r.stepsTotal)} ${PTAUTO.t("steps completed", "مرحله کامل شد")}</p><div class="pta-pill-row"><span class="pta-pill ${PTAUTO.safe(r.status)}">${PTAUTO.safe(r.status)}</span><span class="pta-pill">${PTAUTO.t("Failed", "ناموفق")}: ${PTAUTO.safe(r.stepsFailed)}</span></div></article>`).join("") || `<p class="pta-empty">${PTAUTO.t("No automation runs yet.", "هنوز اجرایی ثبت نشده.")}</p>`}</div></section>`;
};

PTAUTO.achievements = function(items) {
  return `<section class="os-card"><div class="os-section-head"><div><h2>${PTAUTO.t("Achievement Engine", "موتور دستاورد")}</h2></div></div><div class="pta-list">${PTAUTO.list(items).slice(0,6).map(a=>`<article class="pta-achievement"><small>${PTAUTO.safe(a.achievementType)}</small><h3>${PTAUTO.safe(a.title)}</h3><p>${PTAUTO.safe(a.detail)}</p></article>`).join("") || `<p class="pta-empty">${PTAUTO.t("No achievements unlocked yet.", "هنوز دستاوردی فعال نشده.")}</p>`}</div></section>`;
};

PTAUTO.events = function(events) {
  return `<section class="os-card"><div class="os-section-head"><div><h2>${PTAUTO.t("Event Bus", "Event Bus")}</h2></div></div><div class="pta-list">${PTAUTO.list(events).slice(0,8).map(e=>`<article class="pta-run"><small>${PTAUTO.safe(String(e.createdAt || "").slice(0,16))}</small><h3>${PTAUTO.safe(e.eventType)}</h3><p>${PTAUTO.safe(e.status)} · ${PTAUTO.safe(e.source)}</p></article>`).join("") || `<p class="pta-empty">${PTAUTO.t("No events yet.", "هنوز event ثبت نشده.")}</p>`}</div></section>`;
};

PTAUTO.injectHomePanel = async function() {
  const root = document.getElementById("view");
  if (!root || document.getElementById("ptaHomePanel")) return;
  const anchor = root.querySelector(".ptc-today-layout") || root.querySelector(".ptc-hero") || root.firstElementChild;
  if (!anchor) return;
  anchor.insertAdjacentHTML("beforebegin", `<section class="os-card pta-card" id="ptaHomePanel"><div class="os-section-head"><div><span class="eyebrow">AI AUTOMATION ENGINE</span><h2>${PTAUTO.t("Invisible operations manager", "مدیر عملیات نامرئی")}</h2><p>${PTAUTO.t("Tasks, reminders and workflow status update automatically.", "تسک‌ها، یادآورها و وضعیت workflow خودکار به‌روزرسانی می‌شوند.")}</p></div><button class="os-primary-button" data-os-view="automation">${PTAUTO.t("Open Automation", "باز کردن اتوماسیون")}</button></div><p class="pta-empty">${PTAUTO.t("Loading automation summary…", "در حال بارگذاری خلاصه اتوماسیون…")}</p></section>`);
  try {
    const out = await PTAUTO.fetchJson("/api/automation/dashboard");
    const s = out.summary || {};
    const panel = document.getElementById("ptaHomePanel");
    if (panel) panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">AI AUTOMATION ENGINE · v${PTAUTO.version}</span><h2>${PTAUTO.t("Invisible operations manager", "مدیر عملیات نامرئی")}</h2><p>${PTAUTO.t("Coach reviews. ProTrack updates everything else.", "مربی بازبینی می‌کند؛ ProTrack بقیه چیزها را به‌روز می‌کند.")}</p></div><button class="os-primary-button" data-os-view="automation">${PTAUTO.t("Open Automation", "باز کردن اتوماسیون")}</button></div><div class="pta-summary">${[[PTAUTO.t("Active Tasks","تسک فعال"),s.activeTasks],[PTAUTO.t("High Priority","اولویت بالا"),s.highPriorityTasks],[PTAUTO.t("Failed Steps","مرحله ناموفق"),s.failedSteps]].map(([k,v])=>`<article class="pta-metric"><small>${PTAUTO.safe(k)}</small><strong>${PTAUTO.safe(v || 0)}</strong></article>`).join("")}</div>`;
  } catch (_) {}
};

PTAUTO.injectAnalysisPanel = function() {
  const root = document.getElementById("view");
  if (!root || document.getElementById("ptaAnalysisPanel")) return;
  const anchor = root.querySelector(".ptc-analysis-layout") || root.querySelector(".ptc-hero") || root.firstElementChild;
  if (!anchor) return;
  anchor.insertAdjacentHTML("afterend", `<section class="os-card pta-card" id="ptaAnalysisPanel"><div class="os-section-head"><div><span class="eyebrow">ZERO MANUAL WORKFLOW</span><h2>${PTAUTO.t("Upload video. Automation handles the chain.", "ویدیو را آپلود کن؛ اتوماسیون زنجیره را انجام می‌دهد.")}</h2><p>${PTAUTO.t("Session, video, analysis, reports, player card, digital twin, forecast, tasks and notifications are connected by the event bus.", "جلسه، ویدیو، تحلیل، گزارش‌ها، کارت بازیکن، دوقلو، پیش‌بینی، تسک‌ها و اعلان‌ها با Event Bus وصل شده‌اند.")}</p></div><button class="os-secondary-button" data-os-view="automation">${PTAUTO.t("View workflow", "مشاهده workflow")}</button></div></section>`);
};

document.addEventListener("click", async event => {
  const action = event.target.closest("[data-pta-action]");
  if (!action) return;
  event.preventDefault();
  try {
    action.disabled = true;
    if (action.dataset.ptaAction === "refresh") {
      await PTAUTO.load();
      return;
    }
    if (action.dataset.ptaAction === "task") {
      await PTAUTO.post("/api/automation/task", {taskId: action.dataset.id, status: action.dataset.status});
      toast(PTAUTO.t("Automation task updated.", "تسک اتوماسیون به‌روز شد."), "success");
      await PTAUTO.load();
      return;
    }
    if (action.dataset.ptaAction === "retry") {
      await PTAUTO.post("/api/automation/retry", {stepId: action.dataset.step});
      toast(PTAUTO.t("Automation retry started.", "تلاش دوباره شروع شد."), "success");
      await PTAUTO.load();
      return;
    }
  } catch (error) {
    toast(error.message || PTAUTO.t("Automation action failed.", "عملیات اتوماسیون ناموفق بود."));
  } finally {
    action.disabled = false;
  }
}, true);

PTAUTO.install();
