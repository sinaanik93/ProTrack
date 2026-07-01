/* ProTrack OS Phase 2.3 — AI Digital Twin player memory. */
var PTM = {
  version: "2.3.0",
  cache: new Map(),
};

PTM.t = function(en, fa) { return OS.lang === "fa" ? fa : en; };
PTM.canCoach = function() { return OS.user?.role === "head" || OS.user?.role === "assistant"; };
PTM.canLock = function() { return OS.user?.role === "head"; };
PTM.safe = value => osEsc(value === null || value === undefined || value === "" ? "—" : value);
PTM.list = value => Array.isArray(value) ? value : [];

PTM.shell = function(player) {
  return `<section class="os-card ptm-twin-panel" id="ptmTwinPanel" data-player="${PTM.safe(player?.id || "")}">
    <div class="os-section-head">
      <div><span class="eyebrow">AI DIGITAL TWIN</span><h2>${PTM.t("Player Memory System", "سیستم حافظه بازیکن")}</h2><p>${PTM.t("Long-term coaching context built from approved history.", "زمینه بلندمدت مربیگری بر اساس تاریخچه تأییدشده.")}</p></div>
      <button class="os-secondary-button" data-ptm-action="refresh" data-player="${PTM.safe(player?.id || "")}">${PTM.t("Refresh memory", "به‌روزرسانی حافظه")}</button>
    </div>
    <div class="ptm-loading">${PTM.t("Loading full player memory…", "در حال بارگذاری حافظه کامل بازیکن…")}</div>
  </section>`;
};

PTM.install = function() {
  if (PTM.installed) return;
  PTM.installed = true;
  if (window.PTC && typeof PTC.playerTab === "function") {
    PTM.previousPlayerTab = PTC.playerTab;
    PTC.playerTab = function(p, analyses) {
      if (PTC.profileTab === "twin") return PTM.shell(p);
      return PTM.previousPlayerTab(p, analyses);
    };
  }
  PTM.previousRender = osRender;
  osRender = function(view = OS.current) {
    PTM.previousRender(view);
    if (view === "player") setTimeout(PTM.afterPlayerRender, 0);
  };
};

PTM.afterPlayerRender = function() {
  const root = document.getElementById("view");
  if (!root) return;
  const player = osPlayer(OS.profileId) || osVisiblePlayers()[0];
  const sideTabs = root.querySelector(".ptc-side-tabs");
  if (sideTabs && !sideTabs.querySelector("[data-tab='twin']")) {
    const reports = sideTabs.querySelector("[data-tab='reports']");
    const btn = document.createElement("button");
    btn.className = PTC.profileTab === "twin" ? "active" : "";
    btn.dataset.ptcAction = "profile-tab";
    btn.dataset.tab = "twin";
    btn.textContent = PTM.t("AI Twin", "دوقلوی AI");
    (reports || sideTabs.firstElementChild)?.insertAdjacentElement(reports ? "beforebegin" : "afterend", btn);
  }
  const legacyTabs = root.querySelector(".os-profile-tabs");
  if (legacyTabs && !legacyTabs.querySelector("[data-tab='twin']")) {
    legacyTabs.insertAdjacentHTML("beforeend", `<button class="os-profile-tab ${OS.profileTab==="twin"?"active":""}" data-os-action="profile-tab" data-tab="twin">${PTM.t("AI Twin", "دوقلوی AI")}</button>`);
  }
  if (window.PTC && PTC.profileTab === "twin") {
    const content = root.querySelector(".ptc-detail-content");
    if (content && !content.querySelector("#ptmTwinPanel")) content.innerHTML = PTM.shell(player);
    PTM.load(player?.id);
  }
  if (!window.PTC && OS.profileTab === "twin") {
    const content = root.querySelector("#osProfileContent");
    if (content && !content.querySelector("#ptmTwinPanel")) content.innerHTML = PTM.shell(player);
    PTM.load(player?.id);
  }
};

PTM.fetchJson = async function(url, options = {}) {
  const res = await fetch(url, {cache: "no-store", ...options});
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || "Request failed.");
  return out;
};

PTM.post = function(url, payload) {
  return PTM.fetchJson(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})});
};

PTM.load = async function(playerId) {
  const panel = document.getElementById("ptmTwinPanel");
  if (!panel || !playerId) return;
  panel.querySelector(".ptm-loading")?.classList.add("active");
  try {
    const out = await PTM.fetchJson(`/api/player/digital-twin?playerId=${encodeURIComponent(playerId)}`);
    PTM.cache.set(playerId, out);
    PTM.render(panel, out);
  } catch (error) {
    panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">AI DIGITAL TWIN</span><h2>${PTM.t("Memory sync pending", "همگام‌سازی حافظه در انتظار است")}</h2><p>${PTM.safe(error.message || PTM.t("Backend memory is not available yet.", "حافظه backend هنوز در دسترس نیست."))}</p></div></div>`;
  }
};

PTM.render = function(panel, out) {
  const playerId = panel.dataset.player;
  const twin = out.twin || {};
  const dash = out.dashboard || {};
  const cards = [
    [PTM.t("Current Form", "فرم فعلی"), dash.currentForm],
    [PTM.t("Improvement Trend", "روند پیشرفت"), dash.improvementTrend],
    [PTM.t("Learning Speed", "سرعت یادگیری"), dash.learningSpeed],
    [PTM.t("Confidence Trend", "روند اعتمادبه‌نفس"), dash.confidenceTrend],
    [PTM.t("Biggest Strength", "بزرگ‌ترین نقطه قوت"), dash.biggestStrength],
    [PTM.t("Biggest Weakness", "مهم‌ترین ضعف"), dash.biggestWeakness],
    [PTM.t("Promotion Readiness", "آمادگی ارتقا"), dash.promotionReadiness],
    [PTM.t("Memory Confidence", "اعتماد حافظه"), out.memoryConfidence || dash.memoryConfidence],
  ];
  panel.innerHTML = `<div class="os-section-head">
    <div><span class="eyebrow">AI DIGITAL TWIN · ${PTM.safe(out.memoryConfidence || "Low")}</span><h2>${PTM.t("Player Memory System", "سیستم حافظه بازیکن")}</h2><p>${PTM.t("This view uses accumulated approved history. It does not change ProTrack scoring.", "این نما از تاریخچه تأییدشده استفاده می‌کند و قوانین امتیازدهی ProTrack را تغییر نمی‌دهد.")}</p></div>
    <button class="os-secondary-button" data-ptm-action="refresh" data-player="${PTM.safe(playerId)}">${PTM.t("Refresh memory", "به‌روزرسانی حافظه")}</button>
  </div>
  <div class="ptm-grid">${cards.map(([label,value])=>`<article class="ptm-card"><small>${label}</small><strong>${PTM.safe(value)}</strong></article>`).join("")}</div>
  <div class="ptm-layout">
    <section class="os-card ptm-block"><h3>${PTM.t("Coach Insights", "بینش‌های مربی")}</h3>${PTM.renderInsights(out.coachInsight)}</section>
    <section class="os-card ptm-block"><h3>${PTM.t("Risk Indicators", "شاخص‌های ریسک")}</h3>${PTM.renderPills(dash.riskIndicators || twin.riskIndicators)}</section>
  </div>
  <div class="ptm-layout">
    <section class="os-card ptm-block"><h3>${PTM.t("Coaching DNA Summary", "خلاصه DNA مربیگری")}</h3>${PTM.renderInsights(twin.playerDnaSummary)}</section>
    <section class="os-card ptm-block"><h3>${PTM.t("Comparison Engine", "موتور مقایسه")}</h3>${PTM.renderComparison(out.comparisonEngine)}</section>
  </div>
  <section class="os-card ptm-block"><h3>${PTM.t("Intelligent Timeline", "تایم‌لاین هوشمند")}</h3>${PTM.renderTimeline(out.intelligentTimeline)}</section>
  ${PTM.canCoach() ? PTM.renderCoachTools(playerId, out) : ""}
  <section class="os-card ptm-block"><h3>${PTM.t("Previous AI Recommendations", "پیشنهادهای قبلی AI")}</h3>${PTM.renderRecommendations(out.recommendations)}</section>`;
};

PTM.renderInsights = function(items) {
  const list = PTM.list(items);
  return list.length ? `<ul class="ptm-insights">${list.map(x=>`<li>${PTM.safe(x)}</li>`).join("")}</ul>` : `<p class="ptm-empty">${PTM.t("Insufficient history.", "تاریخچه کافی نیست.")}</p>`;
};

PTM.renderPills = function(items) {
  const list = PTM.list(items);
  return `<div class="ptm-pills">${(list.length ? list : [PTM.t("No major long-term risk detected", "ریسک بلندمدت مهمی دیده نشد")]).map(x=>`<span>${PTM.safe(x)}</span>`).join("")}</div>`;
};

PTM.renderComparison = function(engine = {}) {
  const avg = engine.careerAverage || {};
  const last = engine.lastSession || {};
  const month = engine.lastMonth || {};
  return `<div class="ptm-compare">
    <div><small>${PTM.t("Last session delta", "تغییر نسبت به جلسه قبل")}</small><strong>PDI ${PTM.safe(last.pdiDelta)} · PTI ${PTM.safe(last.ptiDelta)}</strong></div>
    <div><small>${PTM.t("Last month", "ماه اخیر")}</small><strong>${PTM.safe(month.approvedAnalyses)} ${PTM.t("analyses", "تحلیل")} · ${PTM.safe(month.pdiTrend)}</strong></div>
    <div><small>${PTM.t("Career average", "میانگین مسیر")}</small><strong>PDI ${PTM.safe(avg.pdi)} · PTI ${PTM.safe(avg.pti)}</strong></div>
  </div>`;
};

PTM.renderTimeline = function(items) {
  const list = PTM.list(items).slice(0, 12);
  return list.length ? `<div class="ptm-timeline">${list.map(x=>`<article><i></i><div><small>${PTM.safe(String(x.date || "").slice(0,10))} · ${PTM.safe(x.type)}</small><strong>${PTM.safe(x.title)}</strong><p>${PTM.safe(typeof x.detail === "string" ? x.detail : JSON.stringify(x.detail || {}))}</p></div></article>`).join("")}</div>` : `<p class="ptm-empty">${PTM.t("No memory events yet.", "رویداد حافظه‌ای هنوز ثبت نشده است.")}</p>`;
};

PTM.renderCoachTools = function(playerId) {
  return `<div class="ptm-layout">
    <form class="os-card ptm-block ptm-form" data-ptm-form="note" data-player="${PTM.safe(playerId)}">
      <h3>${PTM.t("Add Coach Memory Note", "افزودن یادداشت حافظه مربی")}</h3>
      <div class="os-field"><label>${PTM.t("Category", "دسته‌بندی")}</label><input name="category" value="Coach Note"></div>
      <div class="os-field"><label>${PTM.t("Note", "یادداشت")}</label><textarea name="note" required></textarea></div>
      ${PTM.canLock() ? `<label class="ptm-check"><input type="checkbox" name="locked"> ${PTM.t("Lock as head-coach knowledge", "قفل به عنوان دانش سرمربی")}</label>` : ""}
      <button class="os-primary-button">${PTM.t("Save note", "ذخیره یادداشت")}</button>
    </form>
    <form class="os-card ptm-block ptm-form" data-ptm-form="correction" data-player="${PTM.safe(playerId)}">
      <h3>${PTM.t("Correct AI Observation", "اصلاح مشاهده AI")}</h3>
      <div class="os-field"><label>${PTM.t("Original observation", "مشاهده اولیه")}</label><textarea name="originalObservation"></textarea></div>
      <div class="os-field"><label>${PTM.t("Corrected observation", "مشاهده اصلاح‌شده")}</label><textarea name="correctedObservation" required></textarea></div>
      <div class="os-field"><label>${PTM.t("Reason", "دلیل")}</label><input name="reason"></div>
      <button class="os-secondary-button">${PTM.t("Save correction", "ذخیره اصلاح")}</button>
    </form>
  </div>`;
};

PTM.renderRecommendations = function(items) {
  const list = PTM.list(items).slice().reverse();
  if (!list.length) return `<p class="ptm-empty">${PTM.t("No AI recommendations yet.", "پیشنهاد AI هنوز ثبت نشده است.")}</p>`;
  return `<div class="ptm-recs">${list.map(r=>`<article>
    <div><strong>${PTM.safe(PTM.list(r.priorities)[0]?.skill || PTM.t("AI recommendation", "پیشنهاد AI"))}</strong><small>${PTM.safe(r.status || "Open")}</small></div>
    ${PTM.canCoach() && r.status !== "Completed" ? `<button class="os-secondary-button" data-ptm-action="complete-rec" data-id="${PTM.safe(r.id)}">${PTM.t("Mark completed", "انجام شد")}</button>` : ""}
  </article>`).join("")}</div>`;
};

document.addEventListener("submit", async event => {
  const form = event.target.closest("[data-ptm-form]");
  if (!form) return;
  event.preventDefault();
  const playerId = form.dataset.player;
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());
  payload.playerId = playerId;
  if (form.dataset.ptmForm === "note") payload.locked = Boolean(fd.get("locked"));
  const url = form.dataset.ptmForm === "note" ? "/api/player/memory/note" : "/api/player/memory/correction";
  try {
    await PTM.post(url, payload);
    toast(PTM.t("Player memory updated.", "حافظه بازیکن به‌روز شد."), "success");
    PTM.load(playerId);
  } catch (error) {
    toast(error.message || PTM.t("Memory update failed.", "به‌روزرسانی حافظه ناموفق بود."), "error");
  }
}, true);

document.addEventListener("click", async event => {
  const action = event.target.closest("[data-ptm-action]");
  if (!action) return;
  event.preventDefault();
  const playerId = action.dataset.player || document.getElementById("ptmTwinPanel")?.dataset.player;
  try {
    action.disabled = true;
    if (action.dataset.ptmAction === "refresh") await PTM.post("/api/player/memory/refresh", {playerId});
    if (action.dataset.ptmAction === "complete-rec") await PTM.post("/api/player/memory/recommendation/complete", {recommendationId: action.dataset.id});
    toast(PTM.t("Memory refreshed.", "حافظه به‌روز شد."), "success");
    PTM.load(playerId);
  } catch (error) {
    toast(error.message || PTM.t("Memory action failed.", "عملیات حافظه ناموفق بود."), "error");
    action.disabled = false;
  }
}, true);

PTM.install();
