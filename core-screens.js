/* ProTrack OS Phase 1.2 — redesigned core screens.
   UI/workflow only. Locked ProTrack scoring and report formulas are untouched. */
var PTC = {
  version: "1.2.6",
  previousRender: typeof osRender === "function" ? osRender : null,
  previousLogin: typeof osOpenLogin === "function" ? osOpenLogin : null,
  playerView: localStorage.getItem("protrack-player-view") || "cards",
  playerFilters: JSON.parse(localStorage.getItem("protrack-player-filters") || "null") || { status:"all", ready:"all", track:"all", coach:"all", search:"" },
  expandedPlayers: new Set(JSON.parse(localStorage.getItem("protrack-expanded-players") || "[]")),
  profileTab: localStorage.getItem("protrack-profile-tab") || "overview",
  recentSearches: JSON.parse(localStorage.getItem("protrack-recent-searches") || "[]"),
  searchTimer: null,
  wizardStep: 1,
  wizardDraft: JSON.parse(localStorage.getItem("protrack-registration-draft") || "null") || {},
};

PTC.t = (en, fa) => OS.lang === "fa" ? fa : en;
PTC.date = value => typeof pt2Date === "function" ? pt2Date(value) : osDisplayDate(value);
PTC.icon = name => (window.PTD?.icon ? PTD.icon(name) : "");
PTC.saveFilters = () => localStorage.setItem("protrack-player-filters", JSON.stringify(PTC.playerFilters));
PTC.saveExpanded = () => localStorage.setItem("protrack-expanded-players", JSON.stringify([...PTC.expandedPlayers]));
PTC.saveWizard = () => localStorage.setItem("protrack-registration-draft", JSON.stringify(PTC.wizardDraft));
PTC.saveRecentSearches = () => localStorage.setItem("protrack-recent-searches", JSON.stringify(PTC.recentSearches.slice(0,5)));
PTC.canManage = () => typeof pt2CanManage === "function" ? pt2CanManage() : OS.user.role === "head";
PTC.canCoach = () => typeof pt2CanCoach === "function" ? pt2CanCoach() : OS.user.role !== "player";

PTC.ensureData = function() {
  OS.data.analysisQueue ||= [];
  OS.data.tasks ||= [
    {id:"tk1", title:"Review attendance risk", titleFa:"بررسی ریسک حضور", playerId:"p3", type:"attendance", done:false},
    {id:"tk2", title:"Confirm next assessment", titleFa:"هماهنگی ارزیابی بعدی", playerId:"p4", type:"assessment", done:false}
  ];
  OS.data.notes ||= [];
  pt2Save?.();
};

PTC.sessionRemaining = p => Math.max(0, Number(p.sessionsPurchased || 0) - Number(p.sessionsUsed || 0));
PTC.attendanceRate = p => {
  const total = Number(p.attendance?.attended || 0) + Number(p.attendance?.missed || 0);
  return total ? Math.round(Number(p.attendance.attended || 0) / total * 100) : 0;
};
PTC.trend = p => {
  const h = p.ptiHistory || [];
  if (h.length < 2) return {label: PTC.t("Stable", "پایدار"), tone:"", sign:""};
  const d = h.at(-1) - h.at(-2);
  if (d > .15) return {label: PTC.t("Improving", "رو به رشد"), tone:"active", sign:`+${d.toFixed(1)}`};
  if (d < -.15) return {label: PTC.t("Declining", "افت"), tone:"inactive", sign:d.toFixed(1)};
  return {label: PTC.t("Stable", "پایدار"), tone:"", sign:"0.0"};
};
PTC.needsAttention = p => p.status === "At Risk" || PTC.attendanceRate(p) < 75 || PTC.sessionRemaining(p) <= 3 || PTC.trend(p).tone === "inactive";
PTC.readyForPromotion = p => osPromotion(p).status === "Ready";
PTC.lastSession = p => (OS.data.sessions || []).filter(s => s.playerId === p.id).sort((a,b)=>`${b.date}${b.time||""}`.localeCompare(`${a.date}${a.time||""}`))[0];
PTC.lastAnalysis = p => state.analyses.filter(a => a.playerName?.toLowerCase() === p.name.toLowerCase()).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
PTC.queueItems = () => OS.data.analysisQueue || [];

PTC.metric = function(title, value, sub, icon="target", tone="") {
  return `<article class="os-card ptc-focus-card ${tone}"><span>${PTC.icon(icon)}</span><small>${title}</small><strong>${value}</strong><small>${sub}</small></article>`;
};

PTC.hero = function(kicker, title, sub, actions="") {
  return `<section class="ptc-hero"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${sub}</p>${actions?`<div class="ptc-hero-actions">${actions}</div>`:""}</section>`;
};

PTC.empty = function(title, body, icon="target") {
  return PTD?.components?.empty ? PTD.components.empty(title, body, icon) : `<section class="os-card pt2-empty"><h3>${title}</h3><p>${body}</p></section>`;
};

PTC.highlight = function(value) {
  const text = String(value || "");
  const q = String(PTC.playerFilters.search || "").trim();
  if (!q) return osEsc(text);
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return osEsc(text).replace(new RegExp(`(${safe})`, "ig"), `<mark class="ptq-search-hit">$1</mark>`);
};

PTC.navItems = () => [
  ["home", PTC.t("Today", "امروز"), "today"],
  ["players", PTC.t("Players", "بازیکنان"), "players"],
  ["analysis", PTC.t("Analysis", "تحلیل"), "analysis"],
  ["sessions", PTC.t("Sessions", "جلسات"), "sessions"],
  ["academy", PTC.t("Academy", "آکادمی"), "academy"]
];

PTC.syncNavigation = function(view = OS.current) {
  const items = PTC.navItems();
  document.querySelectorAll(".os-bottom-nav [data-os-view]").forEach(btn => {
    const item = items.find(([target]) => target === btn.dataset.osView);
    if (!item) return;
    btn.querySelector("small").textContent = item[1];
  });
  const aside = document.querySelector(".sidebar");
  if (!aside || !OS?.user?.loggedIn) return;
  aside.hidden = false;
  aside.innerHTML = `<div class="ptp-side-brand"><img src="assets/icon-192.png" alt=""><span><strong>PROTRACK</strong><small>ACADEMY OS</small></span></div><nav>${items.map(([target,label,icon])=>`<button class="${view===target || (view==="player"&&target==="players") || (view==="analysis-form"&&target==="analysis") || (view==="report"&&target==="analysis") ? "active" : ""}" data-os-view="${target}"><i>${PTC.icon(icon)}</i><span>${label}</span></button>`).join("")}</nav><div class="ptp-side-user"><span class="os-avatar">${osInitials(OS.user.name)}</span><div><strong>${osEsc(OS.user.name || PTC.t("Coach","مربی"))}</strong><small>${osRoleLabel()}</small></div></div>`;
  PTD?.applyIcons?.(aside);
};

PTC.renderToday = function(root) {
  PTC.ensureData();
  const players = osVisiblePlayers();
  const today = osDateOffset(0), tomorrow = osDateOffset(1);
  const todaySessions = OS.data.sessions.filter(s => s.date === today && players.some(p => p.id === s.playerId)).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const pending = PTC.queueItems().filter(x => x.status === "Pending").length;
  const attention = players.filter(PTC.needsAttention);
  const ready = players.filter(PTC.readyForPromotion);
  const lowBalance = players.filter(p => PTC.sessionRemaining(p) <= 3);
  const tasks = (OS.data.tasks || []).filter(t => !t.done).slice(0,5);
  const timeline = todaySessions.map(s => {
    const p = osPlayer(s.playerId);
    return `<article class="ptc-timeline-item"><strong class="ptc-time">${osEsc(s.time || "—")}</strong><div><h3>${osEsc(p?.name || "—")}</h3><p>${osEsc(s.type)} · ${osEsc(s.coach)} · ${osEsc(s.notes || "")}</p></div>${PTC.statusPill(s.status || "Scheduled")}</article>`;
  }).join("") || PTC.empty(PTC.t("No sessions today", "امروز جلسه‌ای ثبت نشده"), PTC.t("Use Sessions to plan the next court block.", "برای برنامه‌ریزی بلوک بعدی به بخش جلسات بروید."), "sessions");
  const actionCards = [
    ...attention.slice(0,2).map(p => [PTC.t("Needs attention", "نیازمند توجه"), p.name, p.primaryFocus, "warning"]),
    ...ready.slice(0,2).map(p => [PTC.t("Promotion review", "بررسی ارتقا"), p.name, osPromotion(p).target, "promotion"]),
    ...lowBalance.slice(0,1).map(p => [PTC.t("Low session balance", "باقی‌مانده کم جلسات"), p.name, `${PTC.sessionRemaining(p)} ${PTC.t("left", "باقی‌مانده")}`, "sessions"])
  ];
  root.innerHTML = `<div class="ptc-screen">${PTC.hero(
    PTC.t("PROTRACK TODAY", "امروز در ProTrack"),
    PTC.t("What should the coach focus on today?", "امروز تمرکز مربی روی چیست؟"),
    PTC.t("The few decisions that actually change today's coaching work.", "فقط تصمیم‌هایی که برنامه امروز مربی را تغییر می‌دهند."),
    `<button class="os-primary-button" data-os-view="sessions">${PTC.t("Open sessions", "مشاهده جلسات")}</button><button class="os-secondary-button" data-os-action="quick-note">${PTC.t("Quick note", "یادداشت سریع")}</button>`
  )}
  <div class="ptc-grid four">
    ${PTC.metric(PTC.t("Today's sessions", "جلسات امروز"), todaySessions.length, `${OS.data.sessions.filter(s=>s.date===tomorrow).length} ${PTC.t("tomorrow", "فردا")}`, "today")}
    ${PTC.metric(PTC.t("Pending analysis", "در انتظار تحلیل"), pending, PTC.t("backend not connected", "بک‌اند تحلیل متصل نیست"), "analysis", "ptc-backend-note")}
    ${PTC.metric(PTC.t("Needs attention", "نیازمند توجه"), attention.length, PTC.t("attendance, trend or balance", "حضور، روند یا اعتبار جلسات"), "warning")}
    ${PTC.metric(PTC.t("Ready for review", "آماده بررسی ارتقا"), ready.length, PTC.t("promotion candidates", "نامزد بررسی ارتقا"), "promotion")}
  </div>
  <div class="ptc-today-layout">
    <section class="os-card ptc-panel"><h2>${PTC.t("Today timeline", "برنامه امروز")}</h2><div class="ptc-timeline">${timeline}</div></section>
    <aside class="ptc-grid">
      <section class="os-card ptc-panel"><h2>${PTC.t("Decision queue", "صف تصمیم‌ها")}</h2><div class="ptc-task-list">${actionCards.map(([k,n,m,i])=>`<article class="ptc-task"><span>${PTC.icon(i)}</span><div><strong>${k}</strong><p>${osEsc(n)} · ${osEsc(m)}</p></div></article>`).join("") || PTC.empty(PTC.t("No urgent signals", "سیگنال فوری نداریم"), PTC.t("The academy is clear for today.", "امروز وضعیت آکادمی آرام است."), "check")}</div></section>
      <section class="os-card ptc-panel"><h2>${PTC.t("Tasks", "کارها")}</h2><div class="ptc-task-list">${tasks.map(t=>`<article class="ptc-task"><span>${PTC.icon(t.type==="attendance"?"warning":"sessions")}</span><div><strong>${osEsc(OS.lang==="fa"?(t.titleFa||t.title):t.title)}</strong><p>${osEsc(pt2PlayerName?.(t.playerId)||"")}</p></div></article>`).join("") || PTC.empty(PTC.t("No open tasks", "کاری باز نیست"), PTC.t("Add tasks from player or session actions.", "از صفحه بازیکن یا جلسات کار جدید اضافه کنید."), "check")}</div></section>
    </aside>
  </div></div>`;
};

PTC.filteredPlayers = function() {
  let players = osVisiblePlayers();
  const f = PTC.playerFilters;
  if (f.search) {
    const q = f.search.toLowerCase();
    players = players.filter(p => [p.name, p.track, p.primaryFocus, p.coach].some(v => String(v || "").toLowerCase().includes(q)));
  }
  if (f.status !== "all") players = players.filter(p => f.status === "ready" ? PTC.readyForPromotion(p) : osSlug(p.status) === f.status);
  if (f.ready !== "all") players = players.filter(p => (f.ready === "yes") === PTC.readyForPromotion(p));
  if (f.track !== "all") players = players.filter(p => p.track === f.track);
  if (f.coach !== "all") players = players.filter(p => p.coachId === f.coach || p.coach === f.coach);
  return players;
};

PTC.renderPlayers = function(root) {
  const players = PTC.filteredPlayers();
  const tracks = [...new Set(osVisiblePlayers().map(p => p.track).filter(Boolean))];
  const coaches = OS.data.coaches.filter(c => c.active);
  const cards = players.map(p => PTC.playerCard(p)).join("");
  root.innerHTML = `<div class="ptc-screen">${PTC.hero(PTC.t("PLAYER WORKSPACE", "پرونده بازیکنان"), PTC.t("Players", "بازیکنان"), PTC.t("Find the player, understand the next action, move on.", "بازیکن را پیدا کن، اقدام بعدی را بفهم، ادامه بده."), PTC.canManage()?`<button class="os-primary-button" data-ptc-action="open-registration">${PTC.t("Register player", "ثبت‌نام بازیکن")}</button>`:"")}
  <section class="ptc-toolbar">
    <label class="ptq-search-wrap"><input class="os-search" data-ptc-player-search value="${osEsc(PTC.playerFilters.search)}" placeholder="${PTC.t("Search players", "جستجوی بازیکن")}">${PTC.playerFilters.search?`<button type="button" data-ptc-action="clear-search" aria-label="${PTC.t("Clear search","پاک کردن جستجو")}">×</button>`:""}</label>
    <select data-ptc-filter="status"><option value="all">${PTC.t("All status", "همه وضعیت‌ها")}</option><option value="active">${PTC.t("Active", "فعال")}</option><option value="at-risk">${PTC.t("At Risk", "در معرض خطر")}</option><option value="ready">${PTC.t("Ready for Promotion", "آماده بررسی ارتقا")}</option></select>
    <select data-ptc-filter="track"><option value="all">${PTC.t("All tracks", "همه مسیرها")}</option>${tracks.map(x=>`<option value="${osEsc(x)}">${osEsc(x)}</option>`).join("")}</select>
    <select data-ptc-filter="coach"><option value="all">${PTC.t("All coaches", "همه مربیان")}</option>${coaches.map(c=>`<option value="${c.id}">${osEsc(c.name)}</option>`).join("")}</select>
    <select data-ptc-filter="ready"><option value="all">${PTC.t("Promotion", "ارتقا")}</option><option value="yes">${PTC.t("Ready", "آماده")}</option><option value="no">${PTC.t("Not ready", "آماده نیست")}</option></select>
    <div class="ptc-toggle"><button data-ptc-action="player-view" data-view="cards" class="${PTC.playerView==="cards"?"active":""}">${PTC.t("Cards", "کارت")}</button><button data-ptc-action="player-view" data-view="list" class="${PTC.playerView==="list"?"active":""}">${PTC.t("List", "لیست")}</button></div>
  </section>
  ${PTC.recentSearches.length?`<div class="ptq-recent-searches"><span>${PTC.t("Recent searches","جستجوهای اخیر")}</span>${PTC.recentSearches.slice(0,5).map(q=>`<button data-ptc-action="recent-search" data-query="${osEsc(q)}">${osEsc(q)}</button>`).join("")}</div>`:""}
  <section class="ptc-player-list ${PTC.playerView==="cards"?"grid":"list"}">${cards || PTC.empty(PTC.playerFilters.search?PTC.t("No search results", "نتیجه‌ای پیدا نشد"):PTC.t("No players yet", "هنوز بازیکنی ثبت نشده است."), PTC.playerFilters.search?PTC.t("Try another name, track or focus area.", "نام، مسیر یا تمرکز دیگری را جستجو کن."):PTC.t("Create the first player profile to start tracking progress.", "برای شروع، اولین پروفایل بازیکن را ثبت کن."), "players")}</section></div>`;
  root.querySelectorAll("[data-ptc-filter]").forEach(el => { el.value = PTC.playerFilters[el.dataset.ptcFilter] || "all"; });
};

PTC.playerCard = function(p) {
  const promo = osPromotion(p), trend = PTC.trend(p), last = PTC.lastSession(p), analysis = PTC.lastAnalysis(p), expanded = PTC.expandedPlayers.has(p.id);
  return `<article class="os-card ptc-player-card ${expanded?"expanded":""}" data-player-id="${p.id}">
    <div class="ptc-player-main" data-ptc-action="toggle-player" data-id="${p.id}">
      ${PTD.components.avatar(p.name)}
      <div><h3>${PTC.highlight(p.name)}</h3><p>${PTC.highlight(p.track)} · ${PTC.highlight(p.primaryFocus || "—")}</p><div class="ptc-player-stats"><span class="ptc-chip">PDI <b>${osScore(p.pdi)}</b></span><span class="ptc-chip">PTI <b>${osScore(p.pti)}</b></span><span class="ptc-chip">${osEsc(trend.label)} <b>${trend.sign}</b></span></div></div>
      ${osStatus(promo.status)}
    </div>
    <div class="ptc-swipe-actions" aria-label="${PTC.t("Mobile quick actions", "اقدام‌های سریع موبایل")}"><button data-os-action="quick-note" data-id="${p.id}">${PTC.t("Add session", "ثبت جلسه")}</button><button data-os-action="start-analysis" data-player="${p.id}">${PTC.t("Upload video", "آپلود ویدیو")}</button>${PTC.canManage()?`<button data-os-action="v2-archive-player" data-id="${p.id}">${PTC.t("Archive", "بایگانی")}</button>`:""}</div>
    <div class="ptc-player-expanded">
      <div class="ptc-expanded-grid">
        <div class="ptc-mini"><small>${PTC.t("Attendance", "حضور")}</small><strong>${PTC.attendanceRate(p)}%</strong></div>
        <div class="ptc-mini"><small>${PTC.t("Sessions left", "جلسات باقی‌مانده")}</small><strong>${PTC.sessionRemaining(p)}</strong></div>
        <div class="ptc-mini"><small>${PTC.t("Coach", "مربی")}</small><strong>${osEsc(pt2Coach?.(p.coachId)?.name || p.coach || "—")}</strong></div>
        <div class="ptc-mini"><small>${PTC.t("Last session", "آخرین جلسه")}</small><strong>${last ? PTC.date(last.date) : "—"}</strong></div>
      </div>
      <div class="ptc-row-actions"><button class="os-primary-button" data-os-action="open-player" data-id="${p.id}">${PTC.t("View", "مشاهده")}</button><button class="os-secondary-button" data-os-action="quick-note" data-id="${p.id}">${PTC.t("Add session", "ثبت جلسه")}</button><button class="os-secondary-button" data-os-action="start-analysis" data-player="${p.id}">${PTC.t("Upload video", "آپلود ویدیو")}</button><button class="os-secondary-button" data-os-action="quick-note" data-id="${p.id}">${PTC.t("Add note", "یادداشت")}</button>${PTC.canManage()?`<button class="os-secondary-button" data-os-action="v2-archive-player" data-id="${p.id}">${PTC.t("Archive", "بایگانی")}</button>`:""}</div>
      <p>${PTC.t("Last analysis", "آخرین تحلیل")}: ${analysis ? `${PTC.date(analysis.date.slice(0,10))} · PDI ${osScore(calculatePDI(analysis))} · PTI ${osScore(calculatePTI(analysis))}` : PTC.t("No analysis yet", "هنوز تحلیلی ثبت نشده")}</p>
    </div>
  </article>`;
};

PTC.renderPlayerDetail = function(root) {
  const p = osPlayer(OS.profileId) || osVisiblePlayers()[0];
  if (!p) { PTC.renderPlayers(root); return; }
  OS.profileId = p.id;
  const promo = osPromotion(p), analyses = state.analyses.filter(a => a.playerName?.toLowerCase() === p.name.toLowerCase()).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const tabs = [["overview",PTC.t("Overview","نمای کلی")],["timeline",PTC.t("Timeline","مسیر")],["videos",PTC.t("Videos","ویدیوها")],["reports",PTC.t("Reports","گزارش‌ها")],["sessions",PTC.t("Sessions","جلسات")],["notes",PTC.t("Notes","یادداشت‌ها")],["tournaments",PTC.t("Tournaments","مسابقات")],["rankings",PTC.t("Rankings","رتبه‌بندی")]];
  root.innerHTML = `<div class="ptc-screen"><button class="os-back" data-os-view="players">${PTC.t("Back to players", "بازگشت به بازیکنان")}</button>
  <section class="os-card ptc-hero ptc-profile-hero">${PTD.components.avatar(p.name)}<div><span class="eyebrow">PT-${osEsc(p.id).toUpperCase()}</span><h1>${osEsc(p.name)}</h1><p>${osEsc(p.track)} · ${osEsc(p.primaryFocus || "—")}</p><div class="ptc-detail-metrics"><span class="ptc-chip">PDI <b>${osScore(p.pdi)}</b></span><span class="ptc-chip">PTI <b>${osScore(p.pti)}</b></span><span class="ptc-chip">${PTC.t("Confidence", "اطمینان")} <b>${osEsc(p.confidence || "LOW")}</b></span>${osStatus(promo.status)}</div></div><div class="ptc-qr"><span>QR</span></div></section>
  <div class="ptc-detail-layout"><nav class="ptc-side-tabs ptc-segments">${tabs.map(([id,label])=>`<button class="${PTC.profileTab===id?"active":""}" data-ptc-action="profile-tab" data-tab="${id}">${label}</button>`).join("")}</nav><section class="ptc-detail-content">${PTC.playerTab(p, analyses)}</section></div></div>`;
};

PTC.playerTab = function(p, analyses) {
  const tab = PTC.profileTab;
  if (tab === "overview") return `<div class="ptc-grid two"><section class="os-card ptc-panel"><h2>${PTC.t("Development focus", "تمرکز رشد")}</h2><p>${osEsc(p.coachNotes || p.primaryFocus || "—")}</p><div class="ptc-expanded-grid"><div class="ptc-mini"><small>${PTC.t("Attendance", "حضور")}</small><strong>${PTC.attendanceRate(p)}%</strong></div><div class="ptc-mini"><small>${PTC.t("Sessions left", "جلسات باقی‌مانده")}</small><strong>${PTC.sessionRemaining(p)}</strong></div><div class="ptc-mini"><small>${PTC.t("Track", "مسیر")}</small><strong>${osEsc(p.track)}</strong></div><div class="ptc-mini"><small>${PTC.t("Coach", "مربی")}</small><strong>${osEsc(pt2Coach?.(p.coachId)?.name || p.coach || "—")}</strong></div></div></section><section class="os-card ptc-panel"><h2>${PTC.t("Quick actions", "اقدام‌های سریع")}</h2><div class="ptc-row-actions"><button class="os-primary-button" data-os-action="quick-note" data-id="${p.id}">${PTC.t("Add session", "ثبت جلسه")}</button><button class="os-secondary-button" data-os-action="start-analysis" data-player="${p.id}">${PTC.t("Upload video", "آپلود ویدیو")}</button></div></section></div>`;
  if (tab === "timeline") return `<div class="ptc-timeline">${PTC.playerEvents(p, analyses).map(e=>`<article class="ptc-event"><span class="ptc-event-icon">${PTC.icon(e.icon)}</span><div><h3>${osEsc(e.title)}</h3><p>${osEsc(e.detail)}</p></div><span class="ptc-chip">${e.date}</span></article>`).join("") || PTC.empty(PTC.t("No timeline yet", "هنوز مسیری ثبت نشده"), PTC.t("Sessions, videos and tournaments will appear here.", "جلسات، ویدیوها و مسابقات اینجا دیده می‌شوند."), "today")}</div>`;
  if (tab === "videos") return `<div class="ptc-queue-section">${analyses.map(a=>`<article class="os-card ptc-analysis-card"><span>${PTC.icon("play")}</span><div><h3>${osEsc(a.videoName || a.analysisType)}</h3><p>${PTC.date(a.date.slice(0,10))} · ${osEsc(a.footageContext || "video")}</p></div>${PTC.metricBadge("Completed")}</article>`).join("") || PTC.empty(PTC.t("No videos", "ویدیویی ثبت نشده"), PTC.t("Upload video from Analysis when backend is ready.", "از بخش تحلیل ویدیو آپلود کن؛ بک‌اند تحلیل هنوز متصل نیست."), "analysis")}</div>`;
  if (tab === "reports") return `<div class="ptc-queue-section">${analyses.map(a=>`<article class="os-card ptc-analysis-card" data-os-action="open-report" data-id="${a.id}"><span>${PTC.icon("file")}</span><div><h3>${PTC.t("Session report", "گزارش جلسه")} ${osEsc(a.sessionNumber)}</h3><p>PDI ${osScore(calculatePDI(a))} · PTI ${osScore(calculatePTI(a))}</p></div><span class="os-chevron">${PTC.icon("chevron")}</span></article>`).join("") || PTC.empty(PTC.t("No reports", "گزارشی نیست"), PTC.t("Completed analyses will appear here.", "تحلیل‌های تکمیل‌شده اینجا قرار می‌گیرند."), "file")}</div>`;
  if (tab === "sessions") return `<div class="ptc-queue-section">${OS.data.sessions.filter(s=>s.playerId===p.id).map(s=>PTC.sessionCard(s)).join("") || PTC.empty(PTC.t("No sessions", "جلسه‌ای نیست"), PTC.t("Session history appears after scheduling or notes.", "بعد از برنامه‌ریزی یا یادداشت، تاریخچه جلسات دیده می‌شود."), "sessions")}</div>`;
  if (tab === "notes") return `<div class="ptc-queue-section">${(OS.data.quickNotes||[]).filter(n=>n.playerId===p.id).map(n=>`<article class="os-card ptc-panel"><h3>${PTC.date(n.date)}</h3><p>${osEsc(n.focus || n.priorities || n.wins || "—")}</p></article>`).join("") || PTC.empty(PTC.t("No notes", "یادداشتی نیست"), PTC.t("Use Add Note after training.", "بعد از تمرین از یادداشت استفاده کن."), "edit")}</div>`;
  if (tab === "tournaments") return `<div class="ptc-queue-section">${OS.data.tournaments.filter(t=>t.playerIds?.includes(p.id)).map(t=>`<article class="ptc-event"><span class="ptc-event-icon">${PTC.icon("trophy")}</span><div><h3>${osEsc(t.name)}</h3><p>${PTC.date(t.date)} · ${osEsc(t.location || "")} · ${osEsc(t.result || t.status || "")}</p></div><span class="ptc-chip">${osEsc(t.position || "—")}</span></article>`).join("") || PTC.empty(PTC.t("No tournaments", "مسابقه‌ای ثبت نشده"), PTC.t("Tournament results will build the competition history.", "نتایج مسابقه مسیر رقابتی بازیکن را می‌سازد."), "trophy")}</div>`;
  return `<div class="ptc-grid four">${Object.entries(p.rankings || {club:null,city:null,national:null,international:null}).map(([k,v])=>`<article class="os-card ptc-focus-card"><span>${PTC.icon("leaderboards")}</span><small>${osEsc(k)}</small><strong>${v?`#${v}`:"—"}</strong><small>${PTC.t("ranking", "رتبه")}</small></article>`).join("")}</div>`;
};

PTC.playerEvents = function(p, analyses) {
  const sessions = OS.data.sessions.filter(s=>s.playerId===p.id).map(s=>({date:s.date,title:s.type,detail:s.notes || s.status,icon:"sessions"}));
  const reports = analyses.map(a=>({date:a.date.slice(0,10),title:`${a.analysisType} · PDI ${osScore(calculatePDI(a))}`,detail:`PTI ${osScore(calculatePTI(a))} · ${confidenceOf(a)}`,icon:"analysis"}));
  const tournaments = OS.data.tournaments.filter(t=>t.playerIds?.includes(p.id)).map(t=>({date:t.date,title:t.name,detail:t.result || t.status || "",icon:"trophy"}));
  const journey = (OS.data.journey||[]).filter(j=>j.playerId===p.id).map(j=>({date:j.date,title:j.title,detail:j.detail,icon:j.type==="milestone"?"promotion":"today"}));
  return [...sessions, ...reports, ...tournaments, ...journey].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14).map(e=>({...e,date:PTC.date(e.date)}));
};

PTC.metricBadge = label => `<span class="os-status active">${PTC.t(label, label==="Completed"?"تکمیل‌شده":label)}</span>`;

PTC.renderAnalysis = function(root) {
  PTC.ensureData();
  const completed = state.analyses.map(a => ({id:a.id, player:a.playerName, type:a.analysisType, date:a.date.slice(0,10), status:"Completed", confidence:confidenceOf(a), pdi:calculatePDI(a), pti:calculatePTI(a)}));
  const queued = PTC.queueItems();
  const groups = ["Pending Analysis","Queued","Processing","Analyzing","Updating","Completed","Failed","Cancelled"];
  const items = [...queued, ...completed];
  root.innerHTML = `<div class="ptc-screen">${PTC.hero(PTC.t("ANALYSIS QUEUE", "صف تحلیل"), PTC.t("Analysis", "تحلیل"), PTC.t("All videos and analysis states in one clean queue.", "همه ویدیوها و وضعیت تحلیل‌ها در یک صف شفاف."))}
  <section class="os-card ptc-panel ptc-backend-note"><h2>${PTC.t("AI video engine is connected.", "موتور ویدیویی AI متصل است.")}</h2><p>${PTC.t("Upload a player video to create a session, extract keyframes, queue AI analysis, and preserve history.", "ویدیوی بازیکن را بارگذاری کن تا جلسه ساخته شود، keyframeها استخراج شوند، تحلیل AI در صف قرار گیرد و تاریخچه حفظ شود.")}</p></section>
  <div class="ptc-analysis-layout"><section><div class="ptc-upload-zone"><div>${PTC.icon("upload")}<h2>${PTC.t("Upload Video", "آپلود ویدیو")}</h2><p>${PTC.t("Match, training or assessment video.", "ویدیوی مسابقه، تمرین یا ارزیابی.")}</p><button class="os-primary-button" data-os-action="start-analysis">${PTC.t("Choose video", "انتخاب ویدیو")}</button></div></div>${groups.map(g=>`<section class="ptc-queue-section"><div class="os-section-head"><div><h2>${PTC.statusLabel(g)}</h2><p>${items.filter(x=>x.status===g).length} ${PTC.t("items", "مورد")}</p></div></div>${items.filter(x=>x.status===g).map(PTC.analysisCard).join("") || PTC.empty(PTC.t(`No ${g.toLowerCase()} items`, `موردی در وضعیت ${PTC.statusLabel(g)} نیست`), PTC.t("This lane is clear.", "این بخش خالی است."), "analysis")}</section>`).join("")}</section><aside class="os-card ptc-panel"><h2>${PTC.t("Preview", "پیش‌نمایش")}</h2><p>${PTC.t("Completed AI reports open from the queue. Pending items remain retryable without losing the video.", "گزارش‌های تکمیل‌شده از صف باز می‌شوند. موارد در انتظار بدون از دست رفتن ویدیو قابل تلاش دوباره هستند.")}</p></aside></div></div>`;
};

PTC.statusLabel = s => ({
  Pending:PTC.t("Pending Analysis","در انتظار تحلیل"),"Pending Analysis":PTC.t("Pending Analysis","در انتظار تحلیل"),Queued:PTC.t("Queued","در صف"),Processing:PTC.t("Processing","در حال پردازش"),Analyzing:PTC.t("Analyzing","در حال آنالیز"),Updating:PTC.t("Updating","در حال به‌روزرسانی"),Completed:PTC.t("Completed","تکمیل‌شده"),Failed:PTC.t("Failed","ناموفق"),
  Scheduled:PTC.t("Scheduled","برنامه‌ریزی‌شده"),Present:PTC.t("Present","حاضر"),Absent:PTC.t("Absent","غایب"),Late:PTC.t("Late","تأخیر"),Cancelled:PTC.t("Cancelled","لغوشده"),
  Active:PTC.t("Active","فعال"),Paused:PTC.t("Paused","متوقف"),Ready:PTC.t("Ready","آماده"),"Not Ready":PTC.t("Not Ready","آماده نیست"),"Insufficient Data":PTC.t("Insufficient Data","داده ناکافی")
})[s] || s;
PTC.statusPill = s => `<span class="os-status ${osSlug(s || "Scheduled")}">${osEsc(PTC.statusLabel(s || "Scheduled"))}</span>`;
PTC.analysisCard = function(x) {
  return `<article class="os-card ptc-analysis-card" ${x.id&&x.status==="Completed"?`data-os-action="open-report" data-id="${x.id}"`:""}><span>${PTC.icon(x.status==="Failed"?"warning":x.status==="Completed"?"check":"analysis")}</span><div><h3>${osEsc(x.player || x.playerName || PTC.t("Unassigned video", "ویدیوی بدون بازیکن"))}</h3><p>${osEsc(x.type || x.sessionType || "Video")} · ${PTC.date(x.date || osDateOffset(0))}</p><div class="ptc-player-stats">${x.confidence?`<span class="ptc-chip">${PTC.t("Confidence","اطمینان")} <b>${osEsc(x.confidence)}</b></span>`:""}${x.pdi?`<span class="ptc-chip">PDI <b>${osScore(x.pdi)}</b></span><span class="ptc-chip">PTI <b>${osScore(x.pti)}</b></span>`:""}</div></div><span class="os-status ${x.status==="Failed"?"inactive":x.status==="Completed"?"active":"monitor"}">${PTC.statusLabel(x.status)}</span>${x.status==="Failed"?`<button class="os-secondary-button" data-ptc-action="retry-analysis" data-id="${x.id}">${PTC.t("Retry","تلاش دوباره")}</button>`:""}</article>`;
};

PTC.renderSessions = function(root) {
  const players = osVisiblePlayers(), ids = new Set(players.map(p=>p.id)), today=osDateOffset(0), tomorrow=osDateOffset(1);
  const sessions = OS.data.sessions.filter(s=>ids.has(s.playerId)).sort((a,b)=>`${a.date}${a.time||""}`.localeCompare(`${b.date}${b.time||""}`));
  const groups = [
    [PTC.t("Today","امروز"), sessions.filter(s=>s.date===today)],
    [PTC.t("Tomorrow","فردا"), sessions.filter(s=>s.date===tomorrow)],
    [PTC.t("Upcoming","پیشِ‌رو"), sessions.filter(s=>s.date>tomorrow)],
    [PTC.t("Completed","تکمیل‌شده"), sessions.filter(s=>s.status==="Completed" || ["Present","Absent","Late","Cancelled"].includes(s.attendance))]
  ];
  root.innerHTML = `<div class="ptc-screen">${PTC.hero(PTC.t("SESSION CONTROL", "مدیریت جلسات"), PTC.t("Sessions", "جلسات"), PTC.t("Who is on court, when, and what happened?", "چه کسی، چه زمانی روی زمین است و نتیجه حضور چه بود؟"))}<div class="ptc-sessions-layout"><aside class="os-card ptc-panel"><h2>${PTC.t("Calendar", "تقویم")}</h2><div class="ptc-calendar"><div class="ptc-day"><small>${PTC.t("Today", "امروز")}</small><strong>${groups[0][1].length}</strong></div><div class="ptc-day"><small>${PTC.t("Tomorrow", "فردا")}</small><strong>${groups[1][1].length}</strong></div><div class="ptc-day"><small>${PTC.t("Upcoming", "پیش‌رو")}</small><strong>${groups[2][1].length}</strong></div></div></aside><section class="ptc-session-groups">${groups.map(([label,list])=>`<section><div class="os-section-head"><div><h2>${label}</h2><p>${list.length} ${PTC.t("sessions", "جلسه")}</p></div></div><div class="ptc-queue-section">${list.map(PTC.sessionCard).join("") || PTC.empty(PTC.t("No sessions", "جلسه‌ای نیست"), PTC.t("This lane is clear.", "این بخش خالی است."), "sessions")}</div></section>`).join("")}</section></div></div>`;
};

PTC.sessionCard = function(s) {
  const p = osPlayer(s.playerId), actions=["Present","Absent","Late","Cancelled"];
  return `<article class="os-card ptc-session-card"><span class="ptc-time">${osEsc(s.time || "—")}</span><div><h3>${osEsc(p?.name || "—")}</h3><p>${osEsc(s.type)} · ${osEsc(s.coach)} · ${PTC.date(s.date)}</p><div class="ptc-attendance">${actions.map(a=>`<button class="${s.attendance===a?"active":""}" data-ptc-action="attendance" data-id="${s.id}" data-value="${a}">${PTC.attendanceLabel(a)}</button>`).join("")}</div></div>${PTC.statusPill(s.attendance || s.status || "Scheduled")}</article>`;
};
PTC.attendanceLabel = a => ({Present:PTC.t("Present","حاضر"),Absent:PTC.t("Absent","غایب"),Late:PTC.t("Late","دیرکرد"),Cancelled:PTC.t("Cancelled","لغوشده")})[a] || a;

PTC.renderAcademy = function(root) {
  const a = OS.data.academy, head = PTC.canManage();
  const cards = [
    ["academy", PTC.t("Academy Profile","پروفایل آکادمی"), a.name, "academy"],
    ["coaches", PTC.t("Coaches","مربیان"), `${OS.data.coaches.filter(c=>c.active).length} ${PTC.t("active", "فعال")}`, "coaches"],
    ["programs", PTC.t("Programs","برنامه‌ها"), `${OS.data.programs?.length || 0} ${PTC.t("programs", "برنامه")}`, "programs"],
    ["standards", PTC.t("Professional Standards","استانداردهای حرفه‌ای"), PTC.t("Methodology locked", "متدولوژی قفل‌شده"), "lock"],
    ["backup", PTC.t("Backup","پشتیبان‌گیری"), PTC.t("Academy-owned data", "داده متعلق به آکادمی"), "download"],
    ["settings", PTC.t("Settings","تنظیمات"), head ? PTC.t("Full controls","کنترل کامل") : PTC.t("Limited access","دسترسی محدود"), "settings"]
  ];
  root.innerHTML = `<div class="ptc-screen">${PTC.hero(PTC.t("PROTRACK ACADEMY", "آکادمی ProTrack"), PTC.t("Academy", "آکادمی"), PTC.t("Profile, people, programs and professional standards without admin clutter.", "پروفایل، تیم، برنامه‌ها و استانداردها بدون شلوغی پنل مدیریتی."))}
  <section class="os-card ptp-academy-hero"><div class="ptp-academy-logo"><img src="${a.logoDataUrl||"assets/protrack-official.png"}" alt="ProTrack"></div><div><span class="eyebrow">${PTC.t("OFFICIAL PROFILE","پروفایل رسمی")}</span><h1>${osEsc(a.name)}</h1><p>${osEsc(OS.lang==="fa"?a.aboutFa:a.aboutEn)}</p><div class="pt2-pills"><span>${osEsc(a.location)}</span><span>${osEsc(a.founded)}</span></div></div></section>
  <section class="ptc-academy-grid">${cards.map(([view,title,sub,icon])=>`<article class="os-card ptc-academy-card"><header><span>${PTC.icon(icon)}</span><div><h2>${title}</h2><p>${osEsc(sub)}</p></div></header><div class="ptc-row-actions">${view==="backup"&&head?`<button class="os-secondary-button" data-os-action="backup">${PTC.t("Export backup","خروجی پشتیبان")}</button>`:view==="standards"?`<span class="os-status active">LOCKED</span>`:view==="settings"?`<button class="os-secondary-button" data-os-view="settings">${PTC.t("Open","باز کردن")}</button>`:`<button class="os-secondary-button" data-os-view="${view}">${PTC.t("Open","باز کردن")}</button>`}</div></article>`).join("")}</section></div>`;
};

PTC.patchRender = function() {
  if (!PTC.previousRender || PTC.renderPatched) return;
  const map = {home:PTC.renderToday, players:PTC.renderPlayers, player:PTC.renderPlayerDetail, analysis:PTC.renderAnalysis, sessions:PTC.renderSessions, academy:PTC.renderAcademy};
  osRender = function(view = OS.current) {
    if (map[view]) {
      if (!PT2.authReady || !OS.user.loggedIn) { osOpenLogin(); return; }
      const allowedView = view === "sessions" ? "bookings" : view;
      if (typeof pt2Allowed === "function" && !pt2Allowed(allowedView) && !["home","academy","sessions"].includes(view)) { toast(PTC.t("You do not have access to that area.", "شما به این بخش دسترسی ندارید.")); view = "home"; }
      OS.current = view; osSetNav(view);
      const root = document.getElementById("view");
      map[view](root);
      document.documentElement.lang = OS.lang === "fa" ? "fa" : "en";
      document.documentElement.dir = OS.lang === "fa" ? "rtl" : "ltr";
      requestAnimationFrame(() => { PTD?.applyStructure?.(); PTC.afterRender(root); });
      setTimeout(() => { PTD?.applyStructure?.(); PTC.afterRender(root); }, 80);
      root.focus({preventScroll:true});
      window.scrollTo({top:0, behavior:"smooth"});
      return;
    }
    const result = PTC.previousRender(view);
    requestAnimationFrame(() => PTC.afterRender(document.getElementById("view")));
    return result;
  };
  PTC.renderPatched = true;
};

PTC.afterRender = function(root=document.getElementById("view")) {
  root?.querySelectorAll("[data-ptc-filter]").forEach(el => { el.value = PTC.playerFilters[el.dataset.ptcFilter] || "all"; });
  PTC.syncNavigation(OS.current);
};

PTC.patchLogin = function() {
  if (PTC.loginPatched) return;
  osOpenLogin = function() {
    if (document.querySelector("#ptpSetupForm")) return;
    if (document.querySelector("#osLoginForm")) {
      if (document.querySelector(".ptc-login-shell")) return;
      osCloseModal();
    }
    const remembered = localStorage.getItem("protrack-remembered-username") || PTP?.setup?.head?.username || "";
    const fa = OS.lang === "fa";
    const html = `<section class="ptc-login-shell"><div class="ptc-login-brand"><img src="assets/protrack-official.png" alt="ProTrack"><div><span class="eyebrow">PROTRACK OS</span><h1>${PTC.t("Your coaching day, focused.", "روز مربیگری، متمرکز و روشن.")}</h1><p>${PTC.t("A premium operating system for academy decisions, player progress and court work.", "سیستم عامل حرفه‌ای برای تصمیم‌های آکادمی، رشد بازیکن و کار روی زمین.")}</p></div></div><div class="ptc-login-panel"><img class="ptc-login-logo" src="assets/protrack-official.png" alt="ProTrack"><div><span class="eyebrow">${PTC.t("SECURE ACCESS","ورود امن")}</span><h1>${PTC.t("Welcome back", "ورود به آکادمی")}</h1><p>${PTC.t("Your role is assigned after sign-in.", "نقش شما بعد از ورود از حساب آکادمی خوانده می‌شود.")}</p></div><div class="ptc-role-chips"><span>${PTC.t("Head Coach","سرمربی")}</span><span>${PTC.t("Assistant","مربی دستیار")}</span><span>${PTC.t("Player","بازیکن")}</span></div><form class="ptc-login-form os-form" id="osLoginForm"><div class="os-field"><label>${PTC.t("Username", "نام کاربری")}</label><input name="username" autocomplete="username" value="${osEsc(remembered)}" required></div><div class="os-field"><label>${PTC.t("Password", "رمز عبور")}</label><input name="password" type="password" autocomplete="current-password" required></div><div class="ptc-login-options"><label><input type="checkbox" name="remember" ${remembered?"checked":""}>${PTC.t("Remember me", "مرا به خاطر بسپار")}</label><button type="button" class="ptp-registration-link" data-ptc-action="forgot-password">${PTC.t("Forgot password?", "رمز را فراموش کرده‌اید؟")}</button></div><p class="pt2-form-error" id="pt2LoginError" role="alert"></p><button class="os-primary-button" type="submit">${PTC.t("Sign in", "ورود")}</button><button type="button" class="os-secondary-button ptc-biometric" data-ptc-action="biometric">${PTC.t("Use Face ID / Touch ID", "ورود سریع با Face ID / Touch ID")}</button><button class="ptp-registration-link" type="button" data-os-action="ptp-start-setup">${PTP?.setupRequired?PTC.t("Create your academy", "ساخت آکادمی جدید"):PTC.t("Registration & account setup", "راهنمای ثبت‌نام و ساخت حساب")}</button></form></div></section>`;
    osOpenModal(html, "ptc-login-modal");
    document.getElementById("osLoginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type=submit]"), fd = new FormData(e.target);
      btn.disabled = true;
      try {
        const res = await fetch("/api/auth/login", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username:fd.get("username"), password:fd.get("password")})});
        const out = await res.json();
        if (!res.ok) throw new Error(out.message);
        if (fd.get("remember")) localStorage.setItem("protrack-remembered-username", String(fd.get("username"))); else localStorage.removeItem("protrack-remembered-username");
        OS.user = {...out.user, loggedIn:true}; osSave(); PT2.authReady = true; window.PTQ?.haptic?.("success"); osCloseModal(); osRender("home");
      } catch (_) {
        document.getElementById("pt2LoginError").textContent = PTC.t("The username or password is incorrect.", "نام کاربری یا رمز عبور نادرست است.");
        btn.disabled = false;
      }
    });
  };
  PTC.loginPatched = true;
};

PTC.ensurePremiumLogin = function() {
  if (typeof OS !== "undefined" && OS?.user?.loggedIn) return;
  if (document.querySelector("#ptpSetupForm")) return;
  const form = document.querySelector("#osLoginForm");
  if (form && !document.querySelector(".ptc-login-shell")) { osCloseModal(); osOpenLogin(); return; }
  if (!form && !document.querySelector(".os-modal.open")) osOpenLogin();
};

PTC.openRegistrationWizard = function(step=1) {
  PTC.wizardStep = step;
  const d = PTC.wizardDraft, fa = OS.lang === "fa";
  const steps = [PTC.t("Registrant","ثبت‌نام"),PTC.t("Basic info","اطلاعات پایه"),PTC.t("Background","پیشینه"),PTC.t("Goal","هدف"),PTC.t("Program","برنامه"),PTC.t("Standards","استانداردها"),PTC.t("Success","تکمیل")];
  const progress = `<div class="ptc-wizard-progress"><span>${step}/7 · ${steps[step-1]}</span><div class="ptc-wizard-bars">${steps.map((_,i)=>`<i class="${i<step?"done":""}"></i>`).join("")}</div></div>`;
  const choices = (name, items) => `<div class="ptc-choice-grid">${items.map(([value,label,icon])=>`<button type="button" class="ptc-choice ${d[name]===value?"active":""}" data-ptc-action="wizard-choice" data-name="${name}" data-value="${value}"><span>${PTC.icon(icon)}</span><strong>${label}</strong></button>`).join("")}</div>`;
  let body = "";
  if (step===1) body = `<h1>${PTC.t("Who are you registering?", "چه کسی را ثبت‌نام می‌کنید؟")}</h1>${choices("persona",[["player",PTC.t("Player","بازیکن"),"player"],["parent",PTC.t("Parent","والدین"),"users"],["coach",PTC.t("Coach","مربی"),"coaches"],["assistant",PTC.t("Assistant Coach","مربی دستیار"),"coaches"]])}`;
  if (step===2) body = `<h1>${PTC.t("Basic info", "اطلاعات پایه")}</h1><div class="os-form"><div class="os-field"><label>${PTC.t("Full name","نام کامل")}</label><input data-ptc-wizard-field="name" value="${osEsc(d.name||"")}" required></div><div class="pt2-field-pair"><div class="os-field"><label>${PTC.t("Age","سن")}</label><input type="number" data-ptc-wizard-field="age" value="${osEsc(d.age||"")}"></div><div class="os-field"><label>${PTC.t("Phone","شماره تماس")}</label><input data-ptc-wizard-field="phone" inputmode="tel" value="${osEsc(d.phone||"")}"></div></div><div class="os-field"><label>${PTC.t("Gender","جنسیت")}</label><select data-ptc-wizard-field="gender"><option></option><option value="Female" ${d.gender==="Female"?"selected":""}>${PTC.t("Female","زن")}</option><option value="Male" ${d.gender==="Male"?"selected":""}>${PTC.t("Male","مرد")}</option></select></div></div>`;
  if (step===3) body = `<h1>${PTC.t("Sport background", "پیشینه ورزشی")}</h1>${choices("background",[["first",PTC.t("First time","اولین تجربه"),"spark"],["beginner",PTC.t("Beginner","مبتدی"),"target"],["intermediate",PTC.t("Intermediate","متوسط"),"analysis"],["competitive",PTC.t("Competitive","رقابتی"),"trophy"]])}`;
  if (step===4) body = `<h1>${PTC.t("What is the goal?", "هدف اصلی چیست؟")}</h1>${choices("goal",[["learn",PTC.t("Learn padel","یادگیری پدل"),"target"],["fitness",PTC.t("Improve fitness","بهبود آمادگی بدنی"),"today"],["compete",PTC.t("Compete","شرکت در مسابقه"),"trophy"],["academy",PTC.t("Join academy program","ورود به برنامه آکادمی"),"academy"]])}`;
  if (step===5) body = `<h1>${PTC.t("Choose program", "انتخاب برنامه")}</h1>${choices("program",[["assessment",PTC.t("Assessment","ارزیابی"),"analysis"],["summer",PTC.t("Summer Camp","کمپ تابستانی"),"today"],["private",PTC.t("Private Training","تمرین خصوصی"),"player"],["group",PTC.t("Group Training","تمرین گروهی"),"players"],["performance",PTC.t("Performance Training","تمرین عملکردی"),"promotion"]])}<button class="ptp-registration-link" data-ptc-action="wizard-skip">${PTC.t("Skip for now","فعلاً رد شود")}</button>`;
  if (step===6) body = `<h1>${PTC.t("Professional Standards", "استانداردهای حرفه‌ای")}</h1><p>${PTC.t("The player and academy agree to respectful conduct, punctuality, coach-led development and ProTrack methodology standards.", "بازیکن و آکادمی به رفتار حرفه‌ای، وقت‌شناسی، رشد زیر نظر مربی و استانداردهای متدولوژی ProTrack پایبند هستند.")}</p><label class="ptc-choice ${d.standards?"active":""}"><span>${PTC.icon("check")}</span><strong>${PTC.t("I accept ProTrack Professional Standards", "استانداردهای حرفه‌ای ProTrack را می‌پذیرم")}</strong><input type="checkbox" data-ptc-wizard-field="standards" ${d.standards?"checked":""} hidden></label>`;
  if (step===7) body = `<div style="text-align:center">${PTC.icon("check")}<h1>${PTC.t("Registration saved", "ثبت‌نام ذخیره شد")}</h1><p>${PTC.t("The registration is now in the academy pipeline.", "این ثبت‌نام اکنون در مسیر پیگیری آکادمی قرار گرفت.")}</p><button class="os-primary-button" data-ptc-action="wizard-finish">${PTC.t("Back to Today", "بازگشت به امروز")}</button></div>`;
  const actions = step<7 ? `<div class="ptc-wizard-actions">${step>1?`<button class="os-secondary-button" data-ptc-action="wizard-back">${PTC.t("Back","بازگشت")}</button>`:""}<button class="os-primary-button" data-ptc-action="wizard-next">${step===6?PTC.t("Save registration","ذخیره ثبت‌نام"):PTC.t("Continue","ادامه")}</button></div>` : "";
  osOpenModal(`<section class="os-modal-card ptc-wizard">${progress}<div>${body}</div>${actions}<p class="pt2-form-error" id="ptcWizardError"></p></section>`, "ptc-wizard-modal");
};

PTC.completeRegistration = function() {
  const d = PTC.wizardDraft;
  OS.data.registrations ||= [];
  OS.data.registrations.push({id:pt2Id("r"), name:d.name||PTC.t("Unnamed registration","ثبت‌نام بدون نام"), phone:d.phone||"", source:"ProTrack OS", goal:d.goal||"", status:"Assessment", created:osDateOffset(0), persona:d.persona, age:d.age, gender:d.gender, background:d.background, program:d.program});
  pt2Save?.();
  localStorage.removeItem("protrack-registration-draft");
  PTC.wizardDraft = {};
  PTC.openRegistrationWizard(7);
};

osOpenAddPlayer = function(){ PTC.openRegistrationWizard(1); };

document.addEventListener("input", event => {
  const search = event.target.closest("[data-ptc-player-search]");
  if (search) {
    clearTimeout(PTC.searchTimer);
    const value = search.value.trim();
    PTC.searchTimer = setTimeout(() => {
      PTC.playerFilters.search = value;
      if (value) {
        PTC.recentSearches = [value, ...PTC.recentSearches.filter(q => q.toLowerCase() !== value.toLowerCase())].slice(0,5);
        PTC.saveRecentSearches();
      }
      PTC.saveFilters();
      osRender("players");
    }, 180);
  }
  const field = event.target.closest("[data-ptc-wizard-field]");
  if (field) { PTC.wizardDraft[field.dataset.ptcWizardField] = field.type === "checkbox" ? field.checked : field.value; PTC.saveWizard(); }
});

document.addEventListener("change", event => {
  const filter = event.target.closest("[data-ptc-filter]");
  if (filter) { PTC.playerFilters[filter.dataset.ptcFilter] = filter.value; PTC.saveFilters(); osRender("players"); }
  if (event.target.id === "ptcVideoInput") {
    const file = event.target.files?.[0]; if (!file) return;
    PTC.ensureData();
    OS.data.analysisQueue.push({id:pt2Id("q"), player:PTC.t("Unassigned video","ویدیوی بدون بازیکن"), type:"Video Upload", fileName:file.name, date:osDateOffset(0), status:"Pending"});
    pt2Save?.(); toast(PTC.t("Video added to pending queue.", "ویدیو به صف انتظار اضافه شد.")); osRender("analysis");
  }
});

document.addEventListener("click", event => {
  const el = event.target.closest("[data-ptc-action]");
  if (!el) return;
  const action = el.dataset.ptcAction;
  if (["toggle-player","player-view","profile-tab","open-registration","upload-video","attendance","wizard-choice","wizard-next","wizard-back","wizard-skip","wizard-finish","forgot-password","biometric","retry-analysis","clear-search","recent-search"].includes(action)) {
    event.preventDefault(); event.stopPropagation();
  }
  if (action === "toggle-player") { PTC.expandedPlayers.has(el.dataset.id) ? PTC.expandedPlayers.delete(el.dataset.id) : PTC.expandedPlayers.add(el.dataset.id); PTC.saveExpanded(); osRender("players"); }
  if (action === "player-view") { PTC.playerView = el.dataset.view; localStorage.setItem("protrack-player-view", PTC.playerView); osRender("players"); }
  if (action === "clear-search") { PTC.playerFilters.search = ""; PTC.saveFilters(); osRender("players"); }
  if (action === "recent-search") { PTC.playerFilters.search = el.dataset.query || ""; PTC.saveFilters(); osRender("players"); }
  if (action === "profile-tab") { PTC.profileTab = el.dataset.tab; localStorage.setItem("protrack-profile-tab", PTC.profileTab); osRender("player"); }
  if (action === "open-registration") PTC.openRegistrationWizard(1);
  if (action === "upload-video") document.getElementById("ptcVideoInput")?.click();
  if (action === "attendance") { const s=OS.data.sessions.find(x=>x.id===el.dataset.id); if(s){s.attendance=el.dataset.value;s.status=el.dataset.value==="Cancelled"?"Cancelled":"Completed";pt2Save?.();toast(PTC.t("Attendance updated.","حضور ثبت شد."));osRender("sessions");} }
  if (action === "wizard-choice") { PTC.wizardDraft[el.dataset.name] = el.dataset.value; PTC.saveWizard(); PTC.openRegistrationWizard(PTC.wizardStep); }
  if (action === "wizard-skip") { PTC.openRegistrationWizard(Math.min(6, PTC.wizardStep+1)); }
  if (action === "wizard-back") PTC.openRegistrationWizard(Math.max(1, PTC.wizardStep-1));
  if (action === "wizard-next") {
    document.querySelectorAll("[data-ptc-wizard-field]").forEach(field => PTC.wizardDraft[field.dataset.ptcWizardField] = field.type === "checkbox" ? field.checked : field.value);
    PTC.saveWizard();
    if (PTC.wizardStep === 6 && !PTC.wizardDraft.standards) { document.getElementById("ptcWizardError").textContent = PTC.t("Please accept the professional standards.", "لطفاً استانداردهای حرفه‌ای را بپذیرید."); return; }
    if (PTC.wizardStep === 6) PTC.completeRegistration(); else PTC.openRegistrationWizard(Math.min(6, PTC.wizardStep+1));
  }
  if (action === "wizard-finish") { osCloseModal(); osRender("home"); }
  if (action === "forgot-password") toast(PTC.t("Ask the Head Coach to reset your password.", "برای بازیابی رمز با سرمربی هماهنگ کنید."));
  if (action === "biometric") toast(PTC.t("Fast sign-in will be available after native device pairing.", "ورود سریع پس از اتصال امن دستگاه فعال می‌شود."));
  if (action === "retry-analysis") {
    if (window.PTAI) PTAI.api("/api/analysis/retry", {analysisId: el.dataset.id}).then(out => { toast(PTC.t("Retry queued.", "تلاش دوباره در صف قرار گرفت.")); PTAI.poll(out.analysisId, out.analysisId, ""); }).catch(error => toast(error.message || PTC.t("Retry failed.", "تلاش دوباره ناموفق بود.")));
    else toast(PTC.t("AI engine is not ready yet.", "موتور AI هنوز آماده نیست."));
  }
}, true);

PTC.patchLogin();
PTC.patchRender();
queueMicrotask(() => {
  PTC.ensurePremiumLogin();
  if (OS?.user?.loggedIn && PT2?.authReady && !document.querySelector(".os-modal.open")) osRender(OS.current || "home");
});
[50,250,750].forEach(ms => setTimeout(PTC.ensurePremiumLogin, ms));
