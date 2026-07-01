/* ProTrack OS Phase 1.1 — native design-system behavior.
   UI-only layer: does not change scoring, report formulas, auth rules or saved analysis data. */
var PTD = {
  version: "1.1.0",
  previousRender: typeof osRender === "function" ? osRender : null,
  icons: {
    home: '<path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
    today: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/>',
    players: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    player: '<path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    analysis: '<path d="M4 7V5a2 2 0 0 1 2-2h2"/><path d="M16 3h2a2 2 0 0 1 2 2v2"/><path d="M20 17v2a2 2 0 0 1-2 2h-2"/><path d="M8 21H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="M12 7v2"/><path d="M12 15v2"/><path d="M7 12h2"/><path d="M15 12h2"/>',
    sessions: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 11h18"/><path d="M8 15h5"/><path d="M8 18h8"/>',
    academy: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-8h6v8"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    settings: '<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 9c.16.38.38.72.6 1 .3.27.7.4 1.1.4H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.1.4c-.28.23-.49.56-.6 1Z"/>',
    promotion: '<path d="m7 17 5-5 5 5"/><path d="m7 11 5-5 5 5"/><path d="M12 6v16"/>',
    registrations: '<path d="M9 11h6"/><path d="M9 15h4"/><path d="M8 3h8l2 2v16H6V5l2-2Z"/><path d="M16 3v4h4"/>',
    coaches: '<path d="M8 21v-2a4 4 0 0 1 4-4h2"/><circle cx="10" cy="7" r="4"/><path d="m16 19 2 2 4-4"/><path d="M17 11h4"/><path d="M19 9v4"/>',
    users: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M9 12l2 2 4-4"/>',
    programs: '<path d="m12 2 8 4-8 4-8-4 8-4Z"/><path d="m4 10 8 4 8-4"/><path d="m4 15 8 4 8-4"/>',
    competitions: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 5H3v2a4 4 0 0 0 4 4"/><path d="M19 5h2v2a4 4 0 0 1-4 4"/>',
    leaderboards: '<path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16v-6"/>',
    stories: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z"/><path d="M8 6h8"/><path d="M8 10h8"/>',
    archived: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21h4"/>',
    collapse: '<path d="M3 5h18"/><path d="M3 12h12"/><path d="M3 19h18"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    chevronRtl: '<path d="m15 18-6-6 6-6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    warning: '<path d="m21.7 18.2-8.6-15a1.3 1.3 0 0 0-2.2 0l-8.6 15A1.3 1.3 0 0 0 3.4 20h17.2a1.3 1.3 0 0 0 1.1-1.8Z"/><path d="M12 8v5"/><path d="M12 17h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 5H3v2a4 4 0 0 0 4 4"/><path d="M19 5h2v2a4 4 0 0 1-4 4"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>'
  }
};

PTD.icon = function(name, label) {
  const path = PTD.icons[name] || PTD.icons.target;
  const aria = label ? ` role="img" aria-label="${osEsc(label)}"` : ' aria-hidden="true"';
  return `<svg class="ptd-icon" viewBox="0 0 24 24"${aria}>${path}</svg>`;
};

PTD.t = function(en, fa) {
  return OS?.lang === "fa" ? fa : en;
};

PTD.components = {
  icon: PTD.icon,
  button(label, variant = "primary", attrs = "") {
    return `<button class="${variant === "primary" ? "os-primary-button" : "os-secondary-button"}" ${attrs}>${label}</button>`;
  },
  badge(label, tone = "") {
    return `<span class="os-status ${tone}">${osEsc(label)}</span>`;
  },
  avatar(name, photo = "") {
    return `<span class="os-avatar">${photo ? `<img src="${osEsc(photo)}" alt="">` : osInitials(name)}</span>`;
  },
  progress(value) {
    const safe = Math.max(0, Math.min(100, Number(value) || 0));
    return `<div class="os-progress"><i style="--value:${safe}%"></i></div>`;
  },
  empty(title, body, icon = "target", action = "") {
    return `<section class="os-card ptd-empty"><div>${PTD.icon(icon)}<h3>${osEsc(title)}</h3><p>${osEsc(body)}</p>${action}</div></section>`;
  },
  loading() {
    return `<section class="ptd-skeleton" aria-label="${PTD.t("Loading", "در حال بارگذاری")}"></section>`;
  }
};

PTD.viewIcon = function(view) {
  return ({
    home: "home",
    players: "players",
    player: "player",
    analysis: "analysis",
    promotions: "promotion",
    settings: "settings",
    academy: "academy",
    coaches: "coaches",
    registrations: "registrations",
    bookings: "sessions",
    sessions: "sessions",
    programs: "programs",
    competitions: "competitions",
    leaderboards: "leaderboards",
    stories: "stories",
    archived: "archived",
    users: "users"
  })[view] || "target";
};

PTD.symbolIcon = function(text) {
  const key = String(text || "").trim();
  return ({
    "⌂": "home",
    "◎": "players",
    "◉": "target",
    "◇": "analysis",
    "♢": "competitions",
    "◷": "sessions",
    "▤": "programs",
    "▣": "file",
    "▱": "archived",
    "↳": "registrations",
    "♙": "coaches",
    "↗": "leaderboards",
    "⇧": "promotion",
    "⇩": "download",
    "↧": "download",
    "↥": "upload",
    "↪": "settings",
    "✓": "check",
    "✦": "spark",
    "✎": "edit",
    "＋": "plus",
    "+": "plus",
    "▶": "play",
    "文": "settings",
    "!": "warning",
    "↓": "warning",
    "›": document.documentElement.dir === "rtl" ? "chevronRtl" : "chevron"
  })[key] || null;
};

PTD.setIcon = function(el, name, label) {
  if (!el || el.dataset.ptdIconized === name) return;
  el.innerHTML = PTD.icon(name, label);
  el.dataset.ptdIconized = name;
};

PTD.normalizeBottomNav = function() {
  const nav = document.querySelector(".os-bottom-nav");
  if (!nav) return;
  const tabs = [
    ["home", "today", PTD.t("Today", "امروز")],
    ["players", "players", PTD.t("Players", "بازیکنان")],
    ["analysis", "analysis", PTD.t("Analysis", "آنالیز")],
    ["sessions", "sessions", PTD.t("Sessions", "جلسات")],
    ["academy", "academy", PTD.t("Academy", "آکادمی")]
  ];
  const buttons = [...nav.querySelectorAll(".os-nav")];
  tabs.forEach(([view, icon, label], i) => {
    const btn = buttons[i];
    if (!btn) return;
    btn.dataset.osView = view;
    btn.setAttribute("aria-label", label);
    const active = OS.current === view || (view === "sessions" && ["bookings"].includes(OS.current)) || (view === "academy" && ["academy"].includes(OS.current));
    btn.classList.toggle("active", active);
    const iconSlot = btn.querySelector(".os-nav-icon") || btn.prepend(document.createElement("span"));
    iconSlot.className = "os-nav-icon";
    PTD.setIcon(iconSlot, icon, label);
    const small = btn.querySelector("small");
    if (small) small.textContent = label;
  });
};

PTD.normalizeIcons = function(root = document) {
  root.querySelectorAll(".sidebar nav button").forEach(btn => {
    const slot = btn.querySelector("i");
    PTD.setIcon(slot, PTD.viewIcon(btn.dataset.osView), btn.textContent.trim());
  });

  root.querySelectorAll(".os-setting-icon,.os-analysis-icon,.os-quick-card > span:first-child,.empty-icon,.ptp-swipe-actions button,.ptp-cert-list > div > span,.pt2-awards article > span,.ptp-badge-wall article > span").forEach(el => {
    const icon = PTD.symbolIcon(el.textContent);
    if (icon) PTD.setIcon(el, icon);
  });

  root.querySelectorAll(".os-chevron").forEach(el => PTD.setIcon(el, document.documentElement.dir === "rtl" ? "chevronRtl" : "chevron"));

  root.querySelectorAll(".os-square-button").forEach(btn => {
    if (btn.textContent.trim() === "＋" || btn.textContent.trim() === "+") PTD.setIcon(btn, "plus", btn.getAttribute("aria-label") || "Add");
  });

  root.querySelectorAll(".pt2-head-action").forEach(btn => {
    if (btn.dataset.ptdActionIcon) return;
    const text = btn.textContent.replace(/[＋+]/g, "").trim();
    btn.innerHTML = `${PTD.icon("plus")}<span>${osEsc(text)}</span>`;
    btn.dataset.ptdActionIcon = "plus";
  });
};

PTD.enhanceSidebar = function() {
  const aside = document.querySelector(".sidebar");
  if (!aside || !OS?.user?.loggedIn) return;
  document.body.classList.toggle("ptd-sidebar-collapsed", localStorage.getItem("protrack-sidebar-collapsed") === "1");
  if (aside.querySelector(".ptd-side-tools")) return;
  const brand = aside.querySelector(".ptp-side-brand");
  const html = `<div class="ptd-side-tools">
    <button type="button" data-ptd-action="collapse-sidebar" aria-label="${PTD.t("Collapse sidebar", "جمع کردن منو")}">${PTD.icon("collapse")}</button>
    <label class="ptd-side-search">${PTD.icon("search")}<input data-ptd-search placeholder="${PTD.t("Quick search", "جستجوی سریع")}"></label>
    <button type="button" class="ptd-notify" data-ptd-action="notifications" aria-label="${PTD.t("Notifications", "اعلان‌ها")}">${PTD.icon("bell")}<i></i></button>
  </div>`;
  if (brand) brand.insertAdjacentHTML("afterend", html);
};

PTD.polishPersianCopy = function() {
  if (document.documentElement.lang !== "fa") return;
  const replacements = new Map([
    ["PROTRACK ACADEMY PASSPORT", "پاسپورت آکادمی ProTrack"],
    ["OFFICIAL ACADEMY PROFILE", "پروفایل رسمی آکادمی"],
    ["NIGHTLY MANAGEMENT DASHBOARD", "مرکز تصمیم امروز"],
    ["PROTRACK TODAY", "امروز در ProTrack"]
  ]);
  const root = document.getElementById("view");
  if (!root) return;
  const walker = document.createTreeWalker(root, 4);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const value = replacements.get(node.nodeValue.trim());
    if (value) node.nodeValue = value;
  });
};

PTD.enhanceCopy = function() {
  if (!OS?.dict) return;
  Object.assign(OS.dict.en, {
    nav_home: "Today",
    nav_promotions: "Sessions",
    nav_settings: "Academy",
    demo: "Live academy workspace",
    actions: "Decision queue",
    actions_sub: "What needs your attention next",
    alerts: "Signals",
    alerts_sub: "Only the player signals that change today's coaching decisions"
  });
  Object.assign(OS.dict.fa, {
    nav_home: "امروز",
    nav_promotions: "جلسات",
    nav_settings: "آکادمی",
    demo: "فضای کاری زنده آکادمی",
    actions: "صف تصمیم‌ها",
    actions_sub: "اقدام‌هایی که همین حالا به توجه مربی نیاز دارند",
    alerts: "سیگنال‌ها",
    alerts_sub: "فقط نشانه‌هایی که تصمیم امروز مربی را تغییر می‌دهند"
  });
};

PTD.renderSessions = function(root) {
  const players = osVisiblePlayers();
  const playerIds = new Set(players.map(p => p.id));
  const sessions = (OS.data.sessions || [])
    .filter(s => playerIds.has(s.playerId))
    .sort((a,b) => `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`));
  const today = osDateOffset(0);
  const tomorrow = osDateOffset(1);
  const upcoming = sessions.filter(s => s.date >= today);
  const completed = sessions.filter(s => s.status === "Completed").length;
  const rows = upcoming.slice(0, 14).map(s => {
    const p = osPlayer(s.playerId);
    return `<article class="os-card os-player-row" data-os-action="open-player" data-id="${osEsc(s.playerId)}">
      ${PTD.components.avatar(p?.name || "PT")}
      <div>
        <h3>${osEsc(s.type || PTD.t("Session", "جلسه"))} · ${osEsc(s.time || "—")}</h3>
        <p>${osEsc(p?.name || "—")} · ${osEsc(s.coach || "—")}</p>
        <div class="os-player-numbers"><span>${pt2Date ? pt2Date(s.date) : osDisplayDate(s.date)}</span><span>${osEsc(s.notes || "")}</span></div>
      </div>
      ${osStatus(s.status || "Scheduled")}
    </article>`;
  }).join("");
  root.innerHTML = `${osPageHead("PROTRACK TODAY", PTD.t("Sessions", "جلسات"), PTD.t("What is next on court, and who owns it.", "جلسه بعدی چیست و مسئولیت آن با چه کسی است."))}
    <div class="os-kpi-scroll">
      ${osKpi(PTD.t("Today", "امروز"), sessions.filter(s => s.date === today).length, PTD.t("scheduled sessions", "جلسه زمان‌بندی‌شده"))}
      ${osKpi(PTD.t("Tomorrow", "فردا"), sessions.filter(s => s.date === tomorrow).length, PTD.t("planning load", "بار برنامه‌ریزی"))}
      ${osKpi(PTD.t("Completed", "تکمیل‌شده"), completed, PTD.t("recorded sessions", "جلسه ثبت‌شده"), "#22c99a", "rgba(34,201,154,.12)")}
    </div>
    <section class="os-section">
      <div class="os-section-head"><div><h2>${PTD.t("Upcoming court work", "کارهای پیشِ‌رو در زمین")}</h2><p>${PTD.t("A focused timeline of the next sessions only.", "یک خط زمانی ساده فقط برای جلسه‌های بعدی.")}</p></div></div>
      <div class="os-player-list">${rows || PTD.components.empty(PTD.t("No sessions scheduled", "جلسه‌ای زمان‌بندی نشده"), PTD.t("Create a booking or session note when the next court block is confirmed.", "وقتی بلوک بعدی تمرین قطعی شد، رزرو یا یادداشت جلسه را ثبت کنید."), "sessions")}</div>
    </section>`;
};

PTD.applyStructure = function() {
  document.body.classList.add("ptd-native");
  PTD.normalizeBottomNav();
  PTD.normalizeIcons(document);
  PTD.enhanceSidebar();
  PTD.polishPersianCopy();
};

PTD.refreshInitialRender = function() {
  if (PTD.initialRenderRefreshed) return;
  if (!OS?.user?.loggedIn || document.querySelector(".os-modal.open")) return;
  PTD.initialRenderRefreshed = true;
  osRender(OS.current || "home");
};

PTD.haptic = function(kind) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(kind === "error" ? [14, 22, 14] : 8);
  } catch (_) {}
};

PTD.patchRender = function() {
  if (!PTD.previousRender || PTD.renderPatched) return;
  osRender = function(view = OS.current) {
    if (view === "sessions") {
      if (!PT2.authReady || !OS.user.loggedIn) { osOpenLogin(); return; }
      if (!pt2Allowed("bookings") && !pt2Allowed("programs") && OS.user.role !== "head") {
        view = "programs";
      } else {
        OS.current = "sessions";
        osSetNav("sessions");
        const root = document.getElementById("view");
        PTD.renderSessions(root);
        document.documentElement.lang = OS.lang === "fa" ? "fa" : "en";
        document.documentElement.dir = OS.lang === "fa" ? "rtl" : "ltr";
        requestAnimationFrame(PTD.applyStructure);
        setTimeout(PTD.applyStructure, 80);
        root.focus({preventScroll:true});
        window.scrollTo({top:0, behavior:"smooth"});
        return;
      }
    }
    const result = PTD.previousRender(view);
    requestAnimationFrame(PTD.applyStructure);
    setTimeout(PTD.applyStructure, 80);
    return result;
  };
  PTD.renderPatched = true;
};

document.addEventListener("click", event => {
  const ptdAction = event.target.closest("[data-ptd-action]");
  if (ptdAction) {
    event.preventDefault();
    const action = ptdAction.dataset.ptdAction;
    if (action === "collapse-sidebar") {
      const next = localStorage.getItem("protrack-sidebar-collapsed") === "1" ? "0" : "1";
      localStorage.setItem("protrack-sidebar-collapsed", next);
      document.body.classList.toggle("ptd-sidebar-collapsed", next === "1");
      PTD.haptic();
    }
    if (action === "notifications") {
      toast(PTD.t("No critical notifications right now.", "فعلاً اعلان بحرانی وجود ندارد."));
      PTD.haptic();
    }
    return;
  }
  if (event.target.closest("button,[data-os-view],[data-os-action],.os-player-row")) PTD.haptic();
}, true);

document.addEventListener("keydown", event => {
  const input = event.target.closest("[data-ptd-search]");
  if (!input || event.key !== "Enter") return;
  OS.search = input.value.trim();
  osRender("players");
});

window.addEventListener("load", () => {
  PTD.enhanceCopy();
  PTD.patchRender();
  requestAnimationFrame(PTD.applyStructure);
  requestAnimationFrame(PTD.refreshInitialRender);
});

PTD.enhanceCopy();
PTD.patchRender();
queueMicrotask(() => {
  PTD.applyStructure();
  PTD.refreshInitialRender();
});
