/* ProTrack OS Phase 2.7 - ProTrack Knowledge Engine. */
var PTK = {
  version: "2.7.0",
  state: {q: "", module: "all", type: "all", language: localStorage.getItem("protrack-os-lang") || "en"},
  cache: {status: null, search: null},
};

PTK.t = function(en, fa) { return OS.lang === "fa" ? (fa || en) : en; };
PTK.safe = value => osEsc(value === null || value === undefined || value === "" ? "—" : value);
PTK.list = value => Array.isArray(value) ? value : [];
PTK.canEdit = () => OS.user?.role === "head";
PTK.canRead = () => !!OS.user?.loggedIn;

PTK.fetchJson = async function(url, options = {}) {
  const res = await fetch(url, {cache: "no-store", ...options});
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || "Request failed.");
  return out;
};

PTK.post = function(url, payload) {
  return PTK.fetchJson(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload || {})});
};

PTK.install = function() {
  if (PTK.installed) return;
  PTK.installed = true;
  if (window.PTC && typeof PTC.navItems === "function") {
    PTK.previousNavItems = PTC.navItems;
    PTC.navItems = function() {
      const items = PTK.previousNavItems();
      if (OS.user?.role !== "player" && !items.some(([view]) => view === "knowledge")) {
        const academyIndex = items.findIndex(([view]) => view === "academy");
        items.splice(academyIndex >= 0 ? academyIndex : items.length, 0, ["knowledge", PTK.t("Knowledge", "دانش"), "academy"]);
      }
      return items;
    };
  }
  PTK.previousRender = osRender;
  osRender = function(view = OS.current) {
    if (view === "knowledge") {
      if (!PTK.canRead()) { osOpenLogin(); return; }
      OS.current = "knowledge";
      if (typeof osSetNav === "function") osSetNav("knowledge");
      const root = document.getElementById("view");
      PTK.render(root);
      PTK.syncNav();
      root?.focus?.({preventScroll: true});
      window.scrollTo({top: 0, behavior: "smooth"});
      return;
    }
    const result = PTK.previousRender(view);
    setTimeout(() => PTK.afterRender(view), 0);
    return result;
  };
};

PTK.syncNav = function() {
  if (window.PTC?.syncNavigation) PTC.syncNavigation("knowledge");
};

PTK.afterRender = function(view) {
  if (view === "academy") PTK.injectAcademyLink();
};

PTK.render = function(root) {
  if (!root) return;
  root.innerHTML = `<div class="ptk-screen">
    <section class="os-card ptk-hero">
      <div class="ptk-hero-grid">
        <div><span class="eyebrow">PROTRACK KNOWLEDGE ENGINE · v${PTK.version}</span><h1>${PTK.t("The ProTrack Method, centralized.", "متد ProTrack، متمرکز و رسمی.")}</h1><p>${PTK.t("Every AI feature must consult this knowledge base before it gives coaching guidance, report language, forecast action or drill selection.", "هر قابلیت AI قبل از پیشنهاد مربیگری، متن گزارش، اقدام پیش‌بینی یا انتخاب تمرین باید از این پایگاه دانش عبور کند.")}</p></div>
        <aside class="ptk-engine-card"><small>${PTK.t("AI response priority", "اولویت پاسخ AI")}</small><strong>${PTK.t("ProTrack first", "اول ProTrack")}</strong><div class="ptk-priority" id="ptkPriority"><span>Loading…</span></div></aside>
      </div>
    </section>
    <section class="ptk-metrics" id="ptkMetrics">${[1,2,3,4].map(()=>`<article class="ptk-metric"><small>—</small><strong>—</strong></article>`).join("")}</section>
    <section class="os-card">
      <div class="os-section-head"><div><span class="eyebrow">SEARCHABLE KNOWLEDGE</span><h2>${PTK.t("Central Knowledge Base", "پایگاه دانش مرکزی")}</h2><p>${PTK.t("Rubrics, PDI/PTI, journey, promotion rules, drills, training and match standards.", "روبریک‌ها، PDI/PTI، مسیر بازیکن، قوانین ارتقا، تمرین‌ها و استانداردهای تمرین/مسابقه.")}</p></div>${PTK.canEdit() ? `<button class="os-primary-button" data-ptk-action="new-entry">${PTK.t("New Knowledge Entry", "دانش جدید")}</button><button class="os-secondary-button" data-ptk-action="new-drill">${PTK.t("New Drill", "تمرین جدید")}</button>` : ""}</div>
      <div class="ptk-toolbar">
        <input data-ptk-input="q" placeholder="${PTK.t("Search drills, rubrics, standards, rules…", "جستجوی تمرین، روبریک، استاندارد، قانون…")}" value="${PTK.safe(PTK.state.q)}">
        <select data-ptk-input="module" id="ptkModuleFilter"><option value="all">${PTK.t("All modules", "همه ماژول‌ها")}</option></select>
        <select data-ptk-input="type" id="ptkTypeFilter"><option value="all">${PTK.t("All types", "همه نوع‌ها")}</option></select>
        <button class="os-secondary-button" data-ptk-action="validate">${PTK.t("Validate Text", "اعتبارسنجی متن")}</button>
      </div>
    </section>
    <div class="ptk-layout">
      <aside class="os-card"><div class="os-section-head"><div><h2>${PTK.t("Knowledge Modules", "ماژول‌های دانش")}</h2><p>${PTK.t("Independent, versioned, searchable.", "مستقل، نسخه‌دار، قابل جستجو.")}</p></div></div><div class="ptk-modules" id="ptkModules"></div></aside>
      <main class="ptk-results" id="ptkResults"><section class="os-card"><p>${PTK.t("Loading ProTrack knowledge…", "در حال بارگذاری دانش ProTrack…")}</p></section></main>
    </div>
  </div>`;
  PTK.loadAll();
};

PTK.injectAcademyLink = function() {
  const root = document.getElementById("view");
  if (!root || document.getElementById("ptkAcademyLink") || OS.user?.role === "player") return;
  const anchor = root.querySelector(".ptc-hero") || root.querySelector(".os-page-head") || root.firstElementChild;
  if (!anchor) return;
  anchor.insertAdjacentHTML("afterend", `<section class="os-card ptk-entry" id="ptkAcademyLink"><small>PROTRACK KNOWLEDGE ENGINE</small><strong>${PTK.t("Central AI Knowledge System", "سیستم مرکزی دانش AI")}</strong><p>${PTK.t("Open rubrics, PDI/PTI methodology, promotion rules, drill library and validation logs.", "روبریک‌ها، متدولوژی PDI/PTI، قوانین ارتقا، کتابخانه تمرین و لاگ اعتبارسنجی را باز کنید.")}</p><div class="ptk-tags"><span>v${PTK.version}</span><span>${PTK.t("ProTrack Method", "متد ProTrack")}</span></div><button class="os-primary-button" data-os-view="knowledge" style="margin-top:14px">${PTK.t("Open Knowledge Center", "باز کردن مرکز دانش")}</button></section>`);
};

PTK.loadAll = async function() {
  try {
    const status = await PTK.fetchJson("/api/knowledge/status");
    PTK.cache.status = status;
    PTK.renderStatus(status);
    await PTK.loadSearch();
  } catch (error) {
    const root = document.getElementById("ptkResults");
    if (root) root.innerHTML = `<section class="os-card"><h2>${PTK.t("Knowledge sync pending", "همگام‌سازی دانش در انتظار است")}</h2><p>${PTK.safe(error.message)}</p></section>`;
  }
};

PTK.loadSearch = async function() {
  const params = new URLSearchParams(PTK.state);
  [...params.keys()].forEach(k => { if (!params.get(k)) params.delete(k); });
  const out = await PTK.fetchJson(`/api/knowledge/search?${params.toString()}`);
  PTK.cache.search = out;
  PTK.renderFilters(out);
  PTK.renderSearch(out);
};

PTK.renderStatus = function(out) {
  const counts = out.counts || {};
  const metrics = document.getElementById("ptkMetrics");
  if (metrics) metrics.innerHTML = [
    ["Modules", counts.modules],
    ["Rubrics", counts.rubrics],
    ["Drills", counts.drills],
    ["Validations", counts.validations],
  ].map(([label,value]) => `<article class="ptk-metric"><small>${PTK.safe(label)}</small><strong>${PTK.safe(value)}</strong></article>`).join("");
  const priority = document.getElementById("ptkPriority");
  if (priority) priority.innerHTML = PTK.list(out.priorityOrder).map((p,i)=>`<span><b>${i+1}</b>${PTK.safe(p)}</span>`).join("");
  const modules = document.getElementById("ptkModules");
  if (modules) modules.innerHTML = PTK.list(out.modules).map(m => `<button class="ptk-module" data-ptk-action="open-module" data-id="${PTK.safe(m.id)}"><strong>${PTK.safe(m.name)}</strong><small>${PTK.safe(m.category)} · v${PTK.safe(m.knowledgeVersion)} · ${PTK.safe(m.status)}</small></button>`).join("");
};

PTK.renderFilters = function(out) {
  const moduleSelect = document.getElementById("ptkModuleFilter");
  if (moduleSelect) {
    moduleSelect.innerHTML = `<option value="all">${PTK.t("All modules", "همه ماژول‌ها")}</option>${PTK.list(out.modules).map(m=>`<option value="${PTK.safe(m.id)}">${PTK.safe(m.name)}</option>`).join("")}`;
    moduleSelect.value = PTK.state.module;
  }
  const typeSelect = document.getElementById("ptkTypeFilter");
  if (typeSelect) {
    typeSelect.innerHTML = `<option value="all">${PTK.t("All types", "همه نوع‌ها")}</option>${PTK.list(out.types).map(t=>`<option value="${PTK.safe(t)}">${PTK.safe(t)}</option>`).join("")}`;
    typeSelect.value = PTK.state.type;
  }
};

PTK.renderSearch = function(out) {
  const root = document.getElementById("ptkResults");
  if (!root) return;
  const entries = PTK.list(out.entries);
  const drills = PTK.list(out.drills);
  root.innerHTML = `<section class="os-card">
    <div class="os-section-head"><div><h2>${PTK.t("Knowledge Entries", "ورودی‌های دانش")}</h2><p>${entries.length} ${PTK.t("active entries found", "ورودی فعال پیدا شد")}</p></div></div>
    <div class="ptk-results">${entries.map(PTK.entryHtml).join("") || `<p>${PTK.t("No matching knowledge entry.", "ورودی مطابق پیدا نشد.")}</p>`}</div>
  </section>
  <section class="os-card">
    <div class="os-section-head"><div><h2>${PTK.t("Structured Drill Library", "کتابخانه ساختاریافته تمرین")}</h2><p>${drills.length} ${PTK.t("approved drills", "تمرین تاییدشده")}</p></div></div>
    <div class="ptk-drill-grid">${drills.map(PTK.drillHtml).join("") || `<p>${PTK.t("No matching drill.", "تمرین مطابق پیدا نشد.")}</p>`}</div>
  </section>
  ${PTK.validationHtml(PTK.cache.status?.recentValidations || [])}`;
};

PTK.entryHtml = function(entry) {
  return `<article class="ptk-entry"><small>${PTK.safe(entry.moduleId)} · ${PTK.safe(entry.type)} · v${PTK.safe(entry.knowledgeVersion)}</small><strong>${PTK.safe(entry.name)}</strong><p>${PTK.safe(entry.content)}</p><div class="ptk-tags">${PTK.list(entry.tags).filter(Boolean).slice(0,6).map(t=>`<span>${PTK.safe(t)}</span>`).join("")}</div></article>`;
};

PTK.drillHtml = function(drill) {
  return `<article class="ptk-drill"><small>${PTK.safe(drill.difficulty)} · ${PTK.safe(drill.duration)} min · ${PTK.safe(drill.intensity)}</small><strong>${PTK.safe(drill.name)}</strong><p>${PTK.safe(drill.objective || drill.description)}</p><div class="ptk-tags"><span>${PTK.safe(drill.skill)}</span><span>${PTK.safe(drill.relatedKPI)}</span>${PTK.list(drill.track).slice(0,3).map(t=>`<span>${PTK.safe(t)}</span>`).join("")}</div></article>`;
};

PTK.validationHtml = function(rows) {
  return `<section class="os-card"><div class="os-section-head"><div><h2>${PTK.t("AI Validation Log", "لاگ اعتبارسنجی AI")}</h2><p>${PTK.t("Responses must pass ProTrack methodology before reaching coaches.", "پاسخ‌ها قبل از رسیدن به مربی باید متدولوژی ProTrack را پاس کنند.")}</p></div></div><div class="ptk-validation">${PTK.list(rows).map(v=>`<article><strong class="${v.accepted ? "accepted" : "rejected"}">${PTK.safe(v.status)}</strong><p>${PTK.safe(v.source)} · ${PTK.safe(v.engineVersion)}</p>${PTK.list(v.issues).length ? `<small>${PTK.list(v.issues).map(PTK.safe).join("<br>")}</small>` : `<small>${PTK.t("No contradictions detected.", "تناقضی تشخیص داده نشد.")}</small>`}</article>`).join("") || `<p>${PTK.t("No validation records yet.", "هنوز رکورد اعتبارسنجی وجود ندارد.")}</p>`}</div></section>`;
};

PTK.openModule = async function(moduleId) {
  const out = await PTK.fetchJson(`/api/knowledge/module?moduleId=${encodeURIComponent(moduleId)}`);
  const module = out.module || {};
  const body = `<section class="ptk-modal-card"><div class="os-section-head"><div><span class="eyebrow">KNOWLEDGE MODULE · v${PTK.safe(module.knowledgeVersion)}</span><h2>${PTK.safe(module.name)}</h2><p>${PTK.safe(module.description)}</p></div><button class="os-secondary-button" data-os-action="close-modal">×</button></div><div class="ptk-module-detail">${PTK.list(out.entries).map(PTK.entryHtml).join("")}</div></section>`;
  osOpenModal(body, "ptk-modal");
};

PTK.openEntryEditor = function() {
  if (!PTK.canEdit()) return;
  const modules = PTK.cache.status?.modules || PTK.cache.search?.modules || [];
  const body = `<section class="ptk-modal-card"><div class="os-section-head"><div><span class="eyebrow">HEAD COACH EDITOR</span><h2>${PTK.t("New Knowledge Entry", "ورودی دانش جدید")}</h2><p>${PTK.t("Updates become centrally available to all AI modules.", "به‌روزرسانی‌ها برای همه ماژول‌های AI مرکزی می‌شوند.")}</p></div><button class="os-secondary-button" data-os-action="close-modal">×</button></div><form class="ptk-form" id="ptkEntryForm"><div class="ptk-form-row"><label>${PTK.t("Module", "ماژول")}<select name="moduleId">${PTK.list(modules).map(m=>`<option value="${PTK.safe(m.id)}">${PTK.safe(m.name)}</option>`).join("")}</select></label><label>${PTK.t("Type", "نوع")}<input name="type" value="standard"></label></div><label>${PTK.t("Name", "نام")}<input name="name" required></label><label>${PTK.t("English content", "متن انگلیسی")}<textarea name="contentEn" rows="5" required></textarea></label><label>${PTK.t("Persian content", "متن فارسی")}<textarea name="contentFa" rows="4"></textarea></label><label>${PTK.t("Tags", "برچسب‌ها")}<input name="tags" placeholder="rubric, promotion, training"></label><button class="os-primary-button">${PTK.t("Save Knowledge", "ذخیره دانش")}</button></form></section>`;
  osOpenModal(body, "ptk-modal");
};

PTK.openDrillEditor = function() {
  if (!PTK.canEdit()) return;
  const tracks = ["Starter","Foundation","Development","Competition","Elite"];
  const body = `<section class="ptk-modal-card"><div class="os-section-head"><div><span class="eyebrow">HEAD COACH EDITOR</span><h2>${PTK.t("New Structured Drill", "تمرین ساختاریافته جدید")}</h2><p>${PTK.t("The AI Coach can only select drills stored here.", "AI Coach فقط تمرین‌های ذخیره‌شده در اینجا را انتخاب می‌کند.")}</p></div><button class="os-secondary-button" data-os-action="close-modal">×</button></div><form class="ptk-form" id="ptkDrillForm"><div class="ptk-form-row"><label>${PTK.t("Name", "نام")}<input name="name" required></label><label>${PTK.t("Skill", "مهارت")}<input name="skill" required></label></div><label>${PTK.t("Objective", "هدف")}<textarea name="objective" rows="3" required></textarea></label><div class="ptk-form-row"><label>${PTK.t("Difficulty", "سختی")}<select name="difficulty">${tracks.map(t=>`<option>${t}</option>`).join("")}</select></label><label>${PTK.t("Duration", "مدت")}<input name="duration" type="number" value="15" min="5" max="120"></label></div><div class="ptk-form-row"><label>${PTK.t("Equipment", "ابزار")}<input name="equipment" placeholder="cones, balls"></label><label>${PTK.t("Related KPI", "KPI مرتبط")}<input name="relatedKPI"></label></div><label>${PTK.t("Expected result", "نتیجه مورد انتظار")}<input name="expectedResult" required></label><label>${PTK.t("Coach tips", "نکته مربی")}<textarea name="coachTips" rows="3"></textarea></label><button class="os-primary-button">${PTK.t("Save Drill", "ذخیره تمرین")}</button></form></section>`;
  osOpenModal(body, "ptk-modal");
};

PTK.openValidate = function() {
  const body = `<section class="ptk-modal-card"><div class="os-section-head"><div><span class="eyebrow">KNOWLEDGE VALIDATION</span><h2>${PTK.t("Validate coach text", "اعتبارسنجی متن مربی")}</h2><p>${PTK.t("Checks whether the language contradicts ProTrack methodology.", "بررسی می‌کند که متن با متدولوژی ProTrack تناقض دارد یا نه.")}</p></div><button class="os-secondary-button" data-os-action="close-modal">×</button></div><form class="ptk-form" id="ptkValidateForm"><label>${PTK.t("Text", "متن")}<textarea name="text" rows="7" required></textarea></label><button class="os-primary-button">${PTK.t("Validate", "اعتبارسنجی")}</button><div id="ptkValidateResult"></div></form></section>`;
  osOpenModal(body, "ptk-modal");
};

document.addEventListener("input", event => {
  const input = event.target.closest("[data-ptk-input='q']");
  if (!input) return;
  clearTimeout(PTK.searchTimer);
  PTK.searchTimer = setTimeout(() => {
    PTK.state.q = input.value.trim();
    PTK.loadSearch().catch(error => toast(error.message || PTK.t("Search failed.", "جستجو ناموفق بود.")));
  }, 220);
}, true);

document.addEventListener("change", event => {
  const input = event.target.closest("[data-ptk-input]");
  if (!input || input.dataset.ptkInput === "q") return;
  PTK.state[input.dataset.ptkInput] = input.value;
  PTK.loadSearch().catch(error => toast(error.message || PTK.t("Filter failed.", "فیلتر ناموفق بود.")));
}, true);

document.addEventListener("submit", async event => {
  if (event.target.id === "ptkEntryForm") {
    event.preventDefault();
    const fd = Object.fromEntries(new FormData(event.target).entries());
    await PTK.post("/api/knowledge/entry", {moduleId: fd.moduleId, type: fd.type, name: fd.name, content: {en: fd.contentEn, fa: fd.contentFa}, tags: String(fd.tags || "").split(",").map(x=>x.trim()).filter(Boolean)});
    osCloseModal(); toast(PTK.t("Knowledge saved.", "دانش ذخیره شد.")); osRender("knowledge");
  }
  if (event.target.id === "ptkDrillForm") {
    event.preventDefault();
    const fd = Object.fromEntries(new FormData(event.target).entries());
    await PTK.post("/api/knowledge/drill", {name: fd.name, skill: fd.skill, objective: fd.objective, difficulty: fd.difficulty, duration: Number(fd.duration) || 15, equipment: String(fd.equipment || "").split(",").map(x=>x.trim()).filter(Boolean), relatedKPI: fd.relatedKPI, expectedResult: fd.expectedResult, coachTips: String(fd.coachTips || "").split("\n").filter(Boolean)});
    osCloseModal(); toast(PTK.t("Drill saved.", "تمرین ذخیره شد.")); osRender("knowledge");
  }
  if (event.target.id === "ptkValidateForm") {
    event.preventDefault();
    const fd = Object.fromEntries(new FormData(event.target).entries());
    const out = await PTK.post("/api/knowledge/validate", {text: fd.text});
    const box = document.getElementById("ptkValidateResult");
    if (box) box.innerHTML = `<article class="ptk-entry"><strong class="${out.accepted ? "accepted" : "rejected"}">${out.accepted ? PTK.t("Accepted", "تایید شد") : PTK.t("Needs review", "نیازمند بازبینی")}</strong><p>${PTK.list(out.issues).map(PTK.safe).join("<br>") || PTK.t("No contradictions detected.", "تناقضی تشخیص داده نشد.")}</p></article>`;
  }
}, true);

document.addEventListener("click", async event => {
  const action = event.target.closest("[data-ptk-action]");
  if (!action) return;
  event.preventDefault();
  try {
    if (action.dataset.ptkAction === "open-module") await PTK.openModule(action.dataset.id);
    if (action.dataset.ptkAction === "new-entry") PTK.openEntryEditor();
    if (action.dataset.ptkAction === "new-drill") PTK.openDrillEditor();
    if (action.dataset.ptkAction === "validate") PTK.openValidate();
  } catch (error) {
    toast(error.message || PTK.t("Knowledge action failed.", "عملیات دانش ناموفق بود."));
  }
}, true);

PTK.install();
