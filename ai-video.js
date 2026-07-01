/* ProTrack OS Phase 2.2 — backend-powered AI video analysis workflow. */
var PTAI = {
  polls: new Map(),
  selectedFiles: [],
};

PTAI.t = function(en, fa) { return OS.lang === "fa" ? fa : en; };
PTAI.toast = function(message, kind) { try { toast(message, kind); } catch (_) { console.log(message); } };

PTAI.playerSnapshot = function(player) {
  return {
    id: player.id,
    name: player.name,
    age: player.age,
    gender: player.gender,
    track: player.track,
    stage: player.stage,
    pdi: player.pdi,
    pti: player.pti,
    coachId: player.coachId,
    coach: player.coach,
    coachNotes: player.coachNotes,
    goals: player.goals,
    primaryFocus: player.primaryFocus,
    ranking: player.ranking,
    injuryHistory: player.injuryHistory || [],
    pdiHistory: player.pdiHistory || [],
    ptiHistory: player.ptiHistory || [],
    confidence: player.confidence
  };
};

PTAI.open = function(playerId = "") {
  if (!pt2CanCoach?.()) {
    PTAI.toast(PTAI.t("Only coaches can start an analysis.", "فقط مربیان می‌توانند آنالیز شروع کنند."));
    return;
  }
  const players = osVisiblePlayers().filter(p => !p.archived);
  const selected = playerId && players.some(p => p.id === playerId) ? playerId : players[0]?.id || "";
  if (!selected) {
    PTAI.toast(PTAI.t("Create a player before uploading video.", "قبل از بارگذاری ویدیو باید بازیکن ساخته شود."), "error");
    return;
  }
  PTAI.selectedFiles = [];
  const options = players.map(p => `<option value="${osEsc(p.id)}" ${p.id === selected ? "selected" : ""}>${osEsc(p.name)}</option>`).join("");
  const body = `<form class="os-form" id="ptaiUploadForm">
    <div class="os-field"><label>${PTAI.t("Player", "بازیکن")}</label><select name="playerId" required>${options}</select></div>
    <div class="pt2-field-pair">
      <div class="os-field"><label>${PTAI.t("Session type", "نوع جلسه")}</label><select name="sessionType"><option>Training</option><option>Match</option><option>Assessment</option><option>Video Review</option></select></div>
      <div class="os-field"><label>${PTAI.t("Video type", "نوع ویدیو")}</label><select name="videoType"><option>Training</option><option>Match</option><option>Assessment</option><option>Video Review</option></select></div>
    </div>
    <div class="os-field"><label>${PTAI.t("Upload match or training video", "بارگذاری ویدیوی مسابقه یا تمرین")}</label><input id="ptaiVideoInput" name="file" type="file" accept="video/mp4,video/quicktime,.mp4,.mov,.m4v,.webm" multiple required></div>
    <div id="ptaiFileList" class="ptc-queue-section"></div>
    <div class="os-field"><label>${PTAI.t("Coach notes", "یادداشت مربی")}</label><textarea name="notes" placeholder="${PTAI.t("What should the AI pay attention to?", "AI به چه نکاتی توجه کند؟")}"></textarea></div>
    <div class="os-field"><label>${PTAI.t("Optional match notes / statistics", "یادداشت یا آمار اختیاری مسابقه")}</label><textarea name="matchStats" placeholder="Unforced errors, winners, lobs, net points…"></textarea></div>
    <div class="ptc-queue-section" id="ptaiProgress"></div>
    <button class="os-primary-button" type="submit">${PTAI.t("Upload & start AI analysis", "بارگذاری و شروع آنالیز AI")}</button>
  </form>`;
  osOpenModal(osModalFrame(PTAI.t("AI Video Analysis", "آنالیز ویدیویی AI"), PTAI.t("Player-first upload. No orphan videos.", "بارگذاری بازیکن‌محور؛ هیچ ویدیوی بدون بازیکن ساخته نمی‌شود."), body));
  document.getElementById("ptaiVideoInput").addEventListener("change", event => {
    PTAI.selectedFiles = [...event.target.files];
    PTAI.renderFileList();
  });
  document.getElementById("ptaiUploadForm").addEventListener("submit", PTAI.submit);
};

PTAI.renderFileList = function() {
  const box = document.getElementById("ptaiFileList");
  if (!box) return;
  box.innerHTML = PTAI.selectedFiles.map(file => `<article class="os-card ptc-analysis-card"><span>▶</span><div><h3>${osEsc(file.name)}</h3><p>${(file.size / 1048576).toFixed(1)} MB · ${osEsc(file.type || "video")}</p></div><span class="os-status monitor">${PTAI.t("Ready", "آماده")}</span></article>`).join("");
};

PTAI.submit = async function(event) {
  event.preventDefault();
  if (!navigator.onLine) {
    PTAI.toast(PTAI.t("Connect to the internet before AI upload.", "برای آپلود AI به اینترنت وصل شوید."), "error");
    return;
  }
  const form = event.target;
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  const files = PTAI.selectedFiles.length ? PTAI.selectedFiles : [...form.querySelector("#ptaiVideoInput").files];
  for (const file of files) {
    try {
      await PTAI.uploadOne(form, file);
    } catch (error) {
      PTAI.addProgress(file.name, "Failed", error.message || PTAI.t("Upload failed.", "آپلود ناموفق بود."));
    }
  }
  button.disabled = false;
};

PTAI.uploadOne = async function(form, file) {
  const fd = new FormData(form);
  const player = osPlayer(fd.get("playerId"));
  if (!player) throw new Error(PTAI.t("Player is required.", "انتخاب بازیکن ضروری است."));
  const metadata = await PTAI.videoMetadata(file);
  const keyframes = await PTAI.extractKeyframes(file, metadata);
  fd.set("playerId", player.id);
  fd.set("playerSnapshot", JSON.stringify(PTAI.playerSnapshot(player)));
  fd.set("sessionNumber", String((player.sessionsCompleted || 0) + 1));
  fd.set("clientVideoMetadata", JSON.stringify(metadata));
  fd.set("clientKeyframes", JSON.stringify(keyframes));
  fd.set("file", file, file.name);
  PTAI.addProgress(file.name, "Uploading", "0%");
  const upload = await PTAI.xhrUpload("/api/video/upload", fd, percent => PTAI.addProgress(file.name, "Uploading", `${percent}%`));
  PTAI.queueLocal(upload.video, player, "Uploaded");
  PTAI.addProgress(file.name, "Queued", PTAI.t("Starting AI analysis…", "شروع آنالیز AI…"));
  const started = upload.automation?.analysisId
    ? {analysisId: upload.automation.analysisId, jobId: upload.automation.jobId, status: upload.automation.analysisStatus || "Queued", automationRunId: upload.automation.runId}
    : await PTAI.api("/api/analysis/start", {videoId: upload.video.id});
  PTAI.queueLocal({...upload.video, analysisId: started.analysisId, jobId: started.jobId}, player, started.status);
  PTAI.poll(started.analysisId, file.name, player.id);
};

PTAI.xhrUpload = function(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    };
    xhr.onload = () => {
      try {
        const out = JSON.parse(xhr.responseText || "{}");
        if (xhr.status < 200 || xhr.status >= 300) reject(new Error(out.message || "Upload failed."));
        else resolve(out);
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(formData);
  });
};

PTAI.api = async function(url, payload) {
  const res = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})});
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || "Request failed.");
  return out;
};

PTAI.poll = function(analysisId, label, playerId) {
  if (PTAI.polls.has(analysisId)) clearInterval(PTAI.polls.get(analysisId));
  const tick = async () => {
    try {
      const res = await fetch(`/api/analysis/status?analysisId=${encodeURIComponent(analysisId)}`, {cache: "no-store"});
      const out = await res.json();
      if (!res.ok) throw new Error(out.message || "Status failed.");
      PTAI.addProgress(label, out.status, out.job?.lastError || out.analysis?.reviewStatus || "");
      PTAI.queueLocal({analysisId, id: out.analysis.videoId}, osPlayer(playerId), out.status);
      if (["Completed", "Failed", "Pending Analysis", "Cancelled"].includes(out.status)) {
        clearInterval(PTAI.polls.get(analysisId));
        PTAI.polls.delete(analysisId);
        if (out.status === "Completed") await PTAI.fetchReport(analysisId, playerId);
      }
    } catch (error) {
      PTAI.addProgress(label, "Failed", error.message || "Status failed.");
    }
  };
  tick();
  PTAI.polls.set(analysisId, setInterval(tick, 2200));
};

PTAI.fetchReport = async function(analysisId, playerId) {
  const res = await fetch(`/api/analysis/report?analysisId=${encodeURIComponent(analysisId)}`, {cache: "no-store"});
  const out = await res.json();
  if (!res.ok || !out.ready) return;
  const legacy = out.report?.legacyAnalysis;
  const existingLegacy = legacy ? state.analyses.find(a => a.id === legacy.id) : null;
  if (legacy && !existingLegacy) {
    legacy.backendAnalysisId = analysisId;
    legacy.reviewStatus = out.analysis.reviewStatus;
    state.analyses.push(legacy);
    saveAnalyses();
  } else if (existingLegacy) {
    existingLegacy.reviewStatus = out.analysis.reviewStatus;
    existingLegacy.backendAnalysisId ||= analysisId;
    saveAnalyses();
  }
  PTAI.applyPlayerUpdate(out.report, out.analysis, playerId);
  osCloseModal();
  PTAI.toast(out.analysis.reviewStatus === "PendingCoachReview" ? PTAI.t("AI report is ready for coach review.", "گزارش AI آماده بازبینی مربی است.") : PTAI.t("AI report completed and player card updated.", "گزارش AI تکمیل شد و کارت بازیکن به‌روز شد."), "success");
  if (legacy) osOpenReport(legacy.id);
  else osRender("analysis");
};

PTAI.applyPlayerUpdate = function(report, analysis, playerId) {
  const result = report?.result;
  if (!result) return;
  const player = osPlayer(playerId);
  if (!player) return;
  const approved = analysis?.reviewStatus === "Approved" && result.confidenceScore >= 70;
  if (!approved) return;
  player.pdi = Number(result.pdi);
  player.pti = Number(result.pti);
  player.track = result.track;
  player.stage = result.journey;
  player.confidence = result.confidenceLabel;
  player.primaryFocus = result.developmentPriorities?.[0]?.skill || player.primaryFocus;
  player.pdiHistory = [...(player.pdiHistory || []), player.pdi].slice(-12);
  player.ptiHistory = [...(player.ptiHistory || []), player.pti].slice(-12);
  player.latestAnalysisDate = new Date().toISOString();
  OS.data.journey ||= [];
  OS.data.journey.unshift({id: `ai${Date.now()}`, playerId: player.id, date: osDateOffset(0), title: "AI Analysis Completed", detail: `${result.track} · PDI ${result.pdi} · PTI ${result.pti}`, type: "analysis"});
  pt2Save?.();
};

PTAI.queueLocal = function(video, player, status) {
  if (!player) return;
  OS.data.analysisQueue ||= [];
  const id = video.analysisId || video.id;
  const item = {id, player: player.name, playerId: player.id, type: video.videoType || "Video", fileName: video.fileName, date: osDateOffset(0), status};
  const index = OS.data.analysisQueue.findIndex(x => x.id === id);
  if (index >= 0) OS.data.analysisQueue[index] = {...OS.data.analysisQueue[index], ...item};
  else OS.data.analysisQueue.unshift(item);
  pt2Save?.();
  if (OS.current === "analysis") osRender("analysis");
};

PTAI.addProgress = function(name, status, detail) {
  const box = document.getElementById("ptaiProgress");
  if (!box) return;
  const id = `ptai-${btoa(unescape(encodeURIComponent(name))).replace(/=+/g, "")}`;
  let row = document.getElementById(id);
  if (!row) {
    row = document.createElement("article");
    row.className = "os-card ptc-analysis-card";
    row.id = id;
    row.innerHTML = `<span>◇</span><div><h3></h3><p></p></div><span class="os-status monitor"></span>`;
    box.prepend(row);
  }
  row.querySelector("h3").textContent = name;
  row.querySelector("p").textContent = detail || "";
  row.querySelector(".os-status").textContent = status;
  row.querySelector(".os-status").className = `os-status ${status === "Completed" ? "active" : status === "Failed" ? "inactive" : "monitor"}`;
};

PTAI.videoMetadata = function(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      const width = video.videoWidth, height = video.videoHeight;
      resolve({duration: video.duration || null, width, height, resolution: width && height ? `${width}x${height}` : null, orientation: height > width ? "portrait" : "landscape", source: "browser"});
      URL.revokeObjectURL(url);
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error(PTAI.t("Video metadata could not be read.", "متادیتای ویدیو قابل خواندن نیست."))); };
    video.src = url;
  });
};

PTAI.extractKeyframes = async function(file, metadata) {
  const duration = Number(metadata.duration || 0);
  if (!duration) return [];
  const times = [...new Set([0.5, duration * 0.2, duration * 0.4, duration * 0.6, duration * 0.8, Math.max(duration - 0.5, 0.5)].map(x => Math.max(0.1, Math.min(duration - 0.1, x))))].slice(0, 8);
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
  const canvas = document.createElement("canvas");
  const width = Math.min(video.videoWidth || 960, 960);
  const height = Math.round(width * ((video.videoHeight || 540) / (video.videoWidth || 960)));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const frames = [];
  for (let i = 0; i < times.length; i++) {
    await new Promise(resolve => {
      video.currentTime = times[i];
      video.onseeked = resolve;
    });
    ctx.drawImage(video, 0, 0, width, height);
    frames.push({label: i === 0 ? "Beginning" : i === times.length - 1 ? "End" : `Representative ${i}`, timestamp: Number(times[i].toFixed(2)), dataUrl: canvas.toDataURL("image/jpeg", 0.74)});
  }
  URL.revokeObjectURL(url);
  return frames;
};

PTAI.previousStartAnalysis = osStartAnalysis;
osStartAnalysis = function(playerId = "") { PTAI.open(playerId); };

PTAI.previousRender = osRender;
osRender = function(view = OS.current) {
  PTAI.previousRender(view);
  if (view === "settings" && OS.user?.role === "head") setTimeout(PTAI.injectReviewSetting, 0);
};

PTAI.injectReviewSetting = async function() {
  const root = document.getElementById("view");
  if (!root || document.getElementById("ptaiReviewSetting")) return;
  let mode = "manual";
  try {
    const res = await fetch("/api/analysis/settings", {cache: "no-store"});
    const out = await res.json();
    if (out.ok && out.reviewMode) mode = out.reviewMode;
  } catch (_) {}
  root.insertAdjacentHTML("afterbegin", `<section class="os-card os-settings-group" id="ptaiReviewSetting"><button class="os-setting" data-ptai-action="toggle-review-mode" data-mode="${osEsc(mode)}"><span class="os-setting-icon">AI</span><span><strong>${PTAI.t("AI report review", "بازبینی گزارش AI")}</strong><small>${PTAI.t("Current mode", "حالت فعلی")}: ${mode === "auto" ? "Auto Approve" : "Manual Review"}</small></span><span class="os-chevron">↻</span></button></section>`);
};

PTAI.previousOpenReport = osOpenReport;
osOpenReport = function(id) {
  PTAI.previousOpenReport(id);
  setTimeout(() => PTAI.decorateReport(id), 0);
};

PTAI.decorateReport = function(id) {
  const analysis = state.analyses.find(x => x.id === id);
  const toolbar = document.querySelector(".report-toolbar .button-group");
  if (!analysis || !toolbar || analysis.reviewStatus !== "PendingCoachReview" || !analysis.backendAnalysisId || toolbar.querySelector("[data-ptai-action='approve-report']")) return;
  toolbar.insertAdjacentHTML("afterbegin", `<button class="button primary" data-ptai-action="approve-report" data-id="${osEsc(analysis.backendAnalysisId)}">${PTAI.t("Approve AI report", "تأیید گزارش AI")}</button>`);
};

document.addEventListener("click", async event => {
  const action = event.target.closest("[data-ptai-action]");
  if (!action) return;
  if (!["approve-report", "toggle-review-mode"].includes(action.dataset.ptaiAction)) return;
  event.preventDefault();
  action.disabled = true;
  if (action.dataset.ptaiAction === "toggle-review-mode") {
    try {
      const next = action.dataset.mode === "auto" ? "manual" : "auto";
      await PTAI.api("/api/analysis/settings", {reviewMode: next});
      PTAI.toast(next === "auto" ? PTAI.t("Auto approval enabled.", "تأیید خودکار فعال شد.") : PTAI.t("Manual review enabled.", "بازبینی دستی فعال شد."), "success");
      osRender("settings");
    } catch (error) {
      PTAI.toast(error.message || PTAI.t("Setting update failed.", "به‌روزرسانی تنظیمات ناموفق بود."), "error");
      action.disabled = false;
    }
    return;
  }
  try {
    const out = await PTAI.api("/api/analysis/approve", {analysisId: action.dataset.id});
    const local = state.analyses.find(a => a.backendAnalysisId === action.dataset.id);
    if (local) {
      local.reviewStatus = out.reviewStatus;
      saveAnalyses();
      const reportRes = await fetch(`/api/analysis/report?analysisId=${encodeURIComponent(action.dataset.id)}`, {cache: "no-store"});
      const reportOut = await reportRes.json();
      if (reportOut.ok && reportOut.ready) PTAI.applyPlayerUpdate(reportOut.report, reportOut.analysis, local.playerId);
    }
    PTAI.toast(PTAI.t("Report approved and player card updated.", "گزارش تأیید شد و کارت بازیکن به‌روز شد."), "success");
    if (local?.playerId) OS.profileId = local.playerId;
    osRender("player");
  } catch (error) {
    PTAI.toast(error.message || PTAI.t("Approval failed.", "تأیید ناموفق بود."), "error");
    action.disabled = false;
  }
}, true);
