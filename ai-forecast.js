/* ProTrack OS Phase 2.5 — Predictive Performance Engine. */
var PTF = {
  version: "2.5.0",
  cache: new Map(),
};

PTF.t = function(en, fa) { return OS.lang === "fa" ? (fa || en) : en; };
PTF.canCoach = function() { return OS.user?.role === "head" || OS.user?.role === "assistant"; };
PTF.safe = value => osEsc(value === null || value === undefined || value === "" ? "—" : value);
PTF.list = value => Array.isArray(value) ? value : [];
PTF.conf = c => c?.score ? `${c.score}% · ${c.label}` : "—";

PTF.fetchJson = async function(url, options = {}) {
  const res = await fetch(url, {cache: "no-store", ...options});
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || "Request failed.");
  return out;
};

PTF.post = function(url, payload) {
  return PTF.fetchJson(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})});
};

PTF.install = function() {
  if (PTF.installed) return;
  PTF.installed = true;
  if (window.PTC && typeof PTC.playerTab === "function") {
    PTF.previousPlayerTab = PTC.playerTab;
    PTC.playerTab = function(p, analyses) {
      if (PTC.profileTab === "forecast") return PTF.playerShell(p);
      return PTF.previousPlayerTab(p, analyses);
    };
  }
  PTF.previousRender = osRender;
  osRender = function(view = OS.current) {
    PTF.previousRender(view);
    setTimeout(() => PTF.afterRender(view), 0);
  };
};

PTF.afterRender = function(view) {
  if (view === "home" && PTF.canCoach()) PTF.injectDashboard();
  if (view === "player") PTF.afterPlayerRender();
};

PTF.injectDashboard = async function() {
  const root = document.getElementById("view");
  if (!root || document.getElementById("ptfDashboard")) return;
  const anchor = root.querySelector("#ptcoachDashboard") || root.querySelector(".ptc-hero") || root.querySelector(".os-page-head") || root.firstElementChild;
  if (!anchor) return;
  anchor.insertAdjacentHTML("afterend", `<section class="os-card ptf-dashboard" id="ptfDashboard"><div class="os-section-head"><div><span class="eyebrow">PREDICTIVE PERFORMANCE</span><h2>${PTF.t("AI Forecast Dashboard")}</h2><p>${PTF.t("Where each player is heading, why, and the next best action.")}</p></div></div><p class="ptf-empty">${PTF.t("Loading live forecasts…")}</p></section>`);
  try {
    const out = await PTF.fetchJson("/api/predictive/dashboard");
    PTF.renderDashboard(document.getElementById("ptfDashboard"), out);
  } catch (error) {
    const panel = document.getElementById("ptfDashboard");
    if (panel) panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">PREDICTIVE PERFORMANCE</span><h2>${PTF.t("Forecast sync pending")}</h2><p>${PTF.safe(error.message)}</p></div></div>`;
  }
};

PTF.renderDashboard = function(panel, out) {
  if (!panel) return;
  const dash = out.predictiveDashboard || {};
  panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">PREDICTIVE PERFORMANCE</span><h2>${PTF.t("AI Forecast Dashboard")}</h2><p>${PTF.t("Dynamic forecasts generated from approved history, Digital Twin memory and AI Coach plans.")}</p></div></div>
  <div class="ptf-board-grid">
    ${PTF.widget("Most Likely Promotion", dash.mostLikelyPromotion)}
    ${PTF.widget("Highest Improvement Probability", dash.highestImprovementProbability)}
    ${PTF.widget("Players Losing Momentum", dash.playersLosingMomentum)}
    ${PTF.widget("Plateau Alerts", dash.plateauAlerts)}
    ${PTF.widget("Competition Ready Players", dash.competitionReadyPlayers)}
    ${PTF.widget("High Injury Risk", dash.highInjuryRisk)}
    ${PTF.widget("Attendance Risk", dash.attendanceRisk)}
    ${PTF.widget("Coach Attention Queue", dash.coachAttentionQueue)}
  </div>`;
};

PTF.widget = function(title, items) {
  const list = PTF.list(items).slice(0, 4);
  return `<section class="ptf-widget"><h3>${PTF.safe(title)}</h3>${list.length ? list.map(item => `<article><strong>${PTF.safe(item.playerName)} · ${PTF.safe(item.value || item.priority)}</strong><small>${PTF.safe(item.detail || item.momentum || item.recommendedAction)}</small></article>`).join("") : `<p class="ptf-empty">${PTF.t("Clear.")}</p>`}</section>`;
};

PTF.afterPlayerRender = function() {
  const root = document.getElementById("view");
  if (!root) return;
  const player = osPlayer(OS.profileId) || osVisiblePlayers()[0];
  const sideTabs = root.querySelector(".ptc-side-tabs");
  if (sideTabs && !sideTabs.querySelector("[data-tab='forecast']")) {
    const coach = sideTabs.querySelector("[data-tab='coach']");
    const twin = sideTabs.querySelector("[data-tab='twin']");
    const btn = document.createElement("button");
    btn.className = PTC.profileTab === "forecast" ? "active" : "";
    btn.dataset.ptcAction = "profile-tab";
    btn.dataset.tab = "forecast";
    btn.textContent = PTF.t("Forecast");
    (coach || twin || sideTabs.firstElementChild)?.insertAdjacentElement(coach || twin ? "afterend" : "afterend", btn);
  }
  const legacyTabs = root.querySelector(".os-profile-tabs");
  if (legacyTabs && !legacyTabs.querySelector("[data-tab='forecast']")) {
    legacyTabs.insertAdjacentHTML("beforeend", `<button class="os-profile-tab ${OS.profileTab==="forecast"?"active":""}" data-os-action="profile-tab" data-tab="forecast">${PTF.t("Forecast")}</button>`);
  }
  if (window.PTC && PTC.profileTab === "forecast") {
    const content = root.querySelector(".ptc-detail-content");
    if (content && !content.querySelector("#ptfPlayerPanel")) content.innerHTML = PTF.playerShell(player);
    PTF.loadPlayer(player?.id);
  }
  if (!window.PTC && OS.profileTab === "forecast") {
    const content = root.querySelector("#osProfileContent");
    if (content && !content.querySelector("#ptfPlayerPanel")) content.innerHTML = PTF.playerShell(player);
    PTF.loadPlayer(player?.id);
  }
};

PTF.playerShell = function(player) {
  return `<section class="os-card ptf-player" id="ptfPlayerPanel" data-player="${PTF.safe(player?.id || "")}"><div class="os-section-head"><div><span class="eyebrow">HIGH PERFORMANCE DIRECTOR</span><h2>${PTF.t("Live Player Forecast")}</h2><p>${PTF.t("Prediction uses full player history, not one video.")}</p></div></div><p class="ptf-empty">${PTF.t("Loading forecast…")}</p></section>`;
};

PTF.loadPlayer = async function(playerId) {
  const panel = document.getElementById("ptfPlayerPanel");
  if (!panel || !playerId) return;
  try {
    const out = await PTF.fetchJson(`/api/predictive/player?playerId=${encodeURIComponent(playerId)}`);
    PTF.cache.set(playerId, out);
    PTF.renderPlayer(panel, out.activeForecast, out);
  } catch (error) {
    panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">HIGH PERFORMANCE DIRECTOR</span><h2>${PTF.t("Forecast sync pending")}</h2><p>${PTF.safe(error.message)}</p></div></div>`;
  }
};

PTF.renderPlayer = function(panel, forecast, out = {}) {
  if (!panel) return;
  const playerId = panel.dataset.player;
  if (!forecast) {
    panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">HIGH PERFORMANCE DIRECTOR</span><h2>${PTF.t("No forecast yet")}</h2><p>${PTF.t("Complete and approve an analysis to start the live forecast.")}</p></div></div>`;
    return;
  }
  const promo = forecast.promotionPrediction || {};
  const trend = forecast.currentTrend || {};
  const accel = forecast.acceleration || {};
  const momentum = forecast.performanceMomentum || {};
  const confidence = forecast.overallConfidence || {};
  const match = forecast.matchReadiness || {};
  const attendance = forecast.attendancePrediction || {};
  const training = forecast.trainingEffectiveness || {};
  const learning = forecast.learningSpeed || {};
  const plateau = forecast.plateauDetection || {};
  const improvement = forecast.improvementForecast || {};
  const intervention = forecast.coachIntervention || {};
  panel.innerHTML = `<div class="os-section-head"><div><span class="eyebrow">AI FORECAST · ${PTF.safe(confidence.label)}</span><h2>${PTF.t("Live Player Forecast")}</h2><p>${PTF.safe(forecast.recommendedAction)}</p></div>${PTF.canCoach() ? `<button class="os-secondary-button" data-ptf-action="refresh" data-player="${PTF.safe(playerId)}">${PTF.t("Refresh forecast")}</button>` : ""}</div>
  ${confidence.forecastUncertain ? `<p class="ptf-uncertain">${PTF.safe(confidence.message)} ${PTF.safe(forecast.dataRequired)}</p>` : ""}
  <div class="ptf-hero">
    <section class="ptf-momentum"><small>${PTF.t("Promotion Probability")}</small><div class="ptf-score"><strong>${PTF.safe(promo.promotionProbability)}%</strong><span>${PTF.safe(momentum.label)}</span></div><p>${PTF.safe(promo.currentTrack)} → ${PTF.safe(promo.predictedNextTrack)} · ${PTF.safe(promo.estimatedTime)}</p><div class="ptf-pill-row">${PTF.list(promo.requiredImprovements).map(x=>`<span class="ptf-pill">${PTF.safe(x)}</span>`).join("")}</div></section>
    <section class="ptf-metric-list">
      ${PTF.metric("Current Trend", trend.label, accel.label)}
      ${PTF.metric("Match Readiness", match.label, `Score ${match.score || "—"}`)}
      ${PTF.metric("Training Effectiveness", training.label, PTF.conf(training.confidence))}
      ${PTF.metric("Coach Intervention", intervention.label, PTF.conf(intervention.confidence))}
    </section>
  </div>
  <div class="ptf-grid three" style="margin-top:12px">
    <section class="ptf-block"><h3>${PTF.t("Promotion Prediction")}</h3>${PTF.evidence(promo)}<p><b>${PTF.t("Coach recommendation")}:</b> ${PTF.safe(promo.coachRecommendation)}</p></section>
    <section class="ptf-block"><h3>${PTF.t("Attendance Prediction")}</h3>${PTF.metricLine("Miss risk", `${attendance.riskOfMissingFutureSessions || 0}%`)}${PTF.metricLine("Attendance", attendance.attendanceRate === null || attendance.attendanceRate === undefined ? "—" : `${attendance.attendanceRate}%`)}${PTF.evidence(attendance)}</section>
    <section class="ptf-block"><h3>${PTF.t("Learning Speed")}</h3>${PTF.metricLine("Label", learning.label)}${PTF.evidence(learning)}</section>
  </div>
  <div class="ptf-grid two" style="margin-top:12px">
    <section class="ptf-block"><h3>${PTF.t("Risk Engine")}</h3>${PTF.risks(forecast.riskEngine)}</section>
    <section class="ptf-block"><h3>${PTF.t("Improvement Forecast")}</h3>${PTF.metricLine("Expected PDI after 4 sessions", improvement.expectedPdiAfter4Sessions)}${PTF.metricLine("Expected PTI after 1 month", improvement.expectedPtiAfter1Month)}${PTF.metricLine("Improvement probability", `${improvement.improvementProbability || 0}%`)}${PTF.evidence(improvement)}</section>
  </div>
  <div class="ptf-grid two" style="margin-top:12px">
    <section class="ptf-block"><h3>${PTF.t("Plateau Detection")}</h3>${PTF.metricLine("Status", plateau.label)}${PTF.metricLine("Severity", plateau.severity)}${PTF.evidence(plateau)}</section>
    <section class="ptf-block"><h3>${PTF.t("AI Alerts")}</h3>${PTF.alerts(out.activeAlerts || forecast.activeAlerts)}</section>
  </div>
  <section class="ptf-block" style="margin-top:12px"><h3>${PTF.t("Scenario Simulation")}</h3><div class="ptf-actions"><button class="os-secondary-button" data-ptf-action="simulate" data-scenario="attendance90" data-player="${PTF.safe(playerId)}">${PTF.t("If attendance reaches 90%")}</button><button class="os-secondary-button" data-ptf-action="simulate" data-scenario="twoVideoReviews" data-player="${PTF.safe(playerId)}">${PTF.t("If 2 video reviews happen")}</button><button class="os-secondary-button" data-ptf-action="simulate" data-scenario="currentTrendContinues" data-player="${PTF.safe(playerId)}">${PTF.t("If trend continues")}</button></div><div id="ptfScenarioResult"></div></section>`;
};

PTF.metric = function(title, value, sub) {
  return `<article class="ptf-metric"><small>${PTF.safe(title)}</small><strong>${PTF.safe(value)}</strong><small>${PTF.safe(sub)}</small></article>`;
};

PTF.metricLine = function(label, value) {
  return `<p><b>${PTF.safe(label)}:</b> ${PTF.safe(value)}</p>`;
};

PTF.evidence = function(item = {}) {
  const evidence = PTF.list(item.evidence);
  const action = item.recommendedAction || item.coachRecommendation;
  return `<small>${PTF.t("Confidence")}: ${PTF.safe(PTF.conf(item.confidence))}</small>${evidence.length ? `<ul>${evidence.slice(0,4).map(x=>`<li>${PTF.safe(x)}</li>`).join("")}</ul>` : `<p class="ptf-empty">${PTF.t("No evidence yet.")}</p>`}${action ? `<p><b>${PTF.t("Next action")}:</b> ${PTF.safe(action)}</p>` : ""}`;
};

PTF.risks = function(items) {
  const list = PTF.list(items);
  return list.length ? list.map(r => `<article class="ptf-risk"><div><strong>${PTF.safe(r.name)}</strong><small>${PTF.safe(PTF.conf(r.confidence))}</small><p>${PTF.safe(PTF.list(r.evidence)[0])}</p></div><span class="ptf-level ${PTF.safe(r.level)}">${PTF.safe(r.level)}</span></article>`).join("") : `<p class="ptf-empty">${PTF.t("No risk data.")}</p>`;
};

PTF.alerts = function(items) {
  const list = PTF.list(items);
  return list.length ? list.map(a => `<article class="ptf-alert"><strong>${PTF.safe(a.title)} · ${PTF.safe(a.severity)}</strong><p>${PTF.safe(a.message)}</p><small>${PTF.safe(a.recommendedAction)}</small></article>`).join("") : `<p class="ptf-empty">${PTF.t("No proactive alerts.")}</p>`;
};

PTF.showScenario = function(saved) {
  const box = document.getElementById("ptfScenarioResult");
  const guidance = saved?.guidance || saved || {};
  if (!box) return;
  box.innerHTML = `<article class="ptf-scenario-result"><strong>${PTF.t("Simulation guidance")}: ${PTF.safe(guidance.estimatedPromotionProbability)}%</strong><p>${PTF.safe(guidance.guidance)}</p><small>${PTF.t("Confidence")}: ${PTF.safe(PTF.conf(guidance.confidence))} · ${PTF.t("Guidance, not certainty.")}</small><p><b>${PTF.t("Next action")}:</b> ${PTF.safe(guidance.recommendedAction)}</p></article>`;
};

document.addEventListener("click", async event => {
  const action = event.target.closest("[data-ptf-action]");
  if (!action) return;
  event.preventDefault();
  const playerId = action.dataset.player || document.getElementById("ptfPlayerPanel")?.dataset.player;
  try {
    action.disabled = true;
    if (action.dataset.ptfAction === "refresh") {
      await PTF.post("/api/predictive/refresh", {playerId});
      toast(PTF.t("Forecast refreshed."), "success");
      PTF.loadPlayer(playerId);
      return;
    }
    if (action.dataset.ptfAction === "simulate") {
      const out = await PTF.post("/api/predictive/simulate", {playerId, scenarioType: action.dataset.scenario});
      PTF.showScenario(out.scenario);
      return;
    }
  } catch (error) {
    toast(error.message || PTF.t("Forecast action failed."), "error");
  } finally {
    action.disabled = false;
  }
}, true);

PTF.install();
