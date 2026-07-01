/* ProTrack OS Phase 1.3 — production-quality interaction layer.
   No scoring, report, PDI/PTI or promotion formulas are changed. */
var PTQ = {
  version: "1.3.4",
  prevToast: typeof toast === "function" ? toast : null,
  standalone: window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true,
  ios: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
  offlineQueueKey: "protrack-offline-queue",
  installDismissKey: "protrack-install-tip-dismissed",
  persianDigits: "۰۱۲۳۴۵۶۷۸۹"
};

PTQ.t = (en, fa) => document.documentElement.lang === "fa" || OS?.lang === "fa" ? fa : en;

PTQ.haptic = function(kind = "selection") {
  if (!PTQ.ios) return;
  try {
    if ("vibrate" in navigator) {
      const patterns = {success: 10, save: 8, selection: 6, navigation: 5, error: [12, 24, 12], delete: [16, 22, 8], upload: 10};
      navigator.vibrate(patterns[kind] || 6);
    }
  } catch (_) {}
};

PTQ.cleanMessage = function(message) {
  const raw = String(message || "");
  const fa = OS?.lang === "fa";
  if (/stack|trace|failed to fetch|networkerror|typeerror|api|server|undefined|null|error/i.test(raw)) {
    return fa ? "ارتباط با سرور برقرار نشد. دوباره تلاش کنید." : "Could not connect. Please try again.";
  }
  const mapFa = new Map([
    ["AI backend is not connected yet.", "موتور تحلیل هنوز متصل نیست."],
    ["AI analysis backend is not connected yet.", "موتور تحلیل هنوز متصل نیست."],
    ["Video added to pending queue.", "ویدیو در صف بررسی ذخیره شد."],
    ["Attendance updated.", "حضور ثبت شد."],
    ["Saved.", "ذخیره شد."],
    ["Password updated.", "رمز عبور به‌روزرسانی شد."],
    ["No critical notifications right now.", "فعلاً اعلان مهمی وجود ندارد."]
  ]);
  return fa ? (mapFa.get(raw) || raw) : raw;
};

PTQ.patchToast = function() {
  if (!PTQ.prevToast || PTQ.toastPatched) return;
  window.toast = function(message, kind = "info") {
    const clean = PTQ.cleanMessage(message);
    PTQ.prevToast(clean);
    const node = document.getElementById("toast");
    if (node) {
      node.classList.toggle("ptq-error", kind === "error" || /نشد|خطا|try again|could not/i.test(clean));
      node.classList.toggle("ptq-success", kind === "success" || /ذخیره|ثبت|saved|updated|added/i.test(clean));
    }
    PTQ.haptic(kind === "error" ? "error" : kind === "success" ? "success" : "selection");
  };
  try { toast = window.toast; } catch (_) {}
  PTQ.toastPatched = true;
};

PTQ.toPersianDigits = function(text) {
  return String(text)
    .replace(/([0-9])\.([0-9])/g, "$1٫$2")
    .replace(/[0-9]/g, d => PTQ.persianDigits[Number(d)]);
};

PTQ.polishPersian = function(root = document.getElementById("view") || document.body) {
  if (!root || OS?.lang !== "fa") return;
  const replacements = [
    ["HIGH", "بالا"], ["MEDIUM", "متوسط"], ["LOW", "پایین"],
    ["LOCKED", "قفل‌شده"], ["Scheduled", "برنامه‌ریزی‌شده"],
    ["Pending", "در انتظار بررسی"], ["Processing", "در حال پردازش"],
    ["Completed", "تکمیل‌شده"], ["Failed", "ناموفق"],
    ["Head Coach", "سرمربی"], ["Assistant Coach", "مربی دستیار"],
    ["AI Analyst", "تحلیل عملکرد"], ["AI analysis backend", "موتور تحلیل"],
    ["Starter", "شروع"], ["Foundation", "پایه"], ["Development", "توسعه"], ["Competition", "مسابقه"], ["Elite", "نخبه"],
    ["Wall play", "بازی با دیوار"], ["Groundstroke", "ضربه زمینی"], ["Volley", "والی"], ["Positioning", "جای‌گیری"], ["Decision making", "تصمیم‌گیری"],
    ["Movement structure", "ساختار حرکت"], ["Performance review", "بازبینی عملکرد"], ["Match review", "بازبینی مسابقه"], ["Promotion block", "بلوک ارتقا"],
    ["Training", "تمرین"], ["Assessment", "ارزیابی"], ["Video Analysis", "تحلیل ویدیو"], ["Match Analysis", "تحلیل مسابقه"],
    ["Match", "مسابقه"], ["Competitive evidence", "شواهد رقابتی"], ["Decision reset", "بازتنظیم تصمیم‌گیری"],
    ["Development review", "بازبینی توسعه"], ["pressure block", "بلوک فشار"], ["patterns", "الگوها"], ["review", "بازبینی"],
    ["Active", "فعال"], ["At Risk", "نیازمند توجه"], ["Paused", "متوقف"],
    ["بک‌اند تحلیل هوشمند هنوز متصل نیست.", "موتور تحلیل هوشمند هنوز متصل نیست."],
    ["بک‌اند تحلیل هنوز متصل نیست.", "موتور تحلیل هنوز متصل نیست."],
    ["بک‌اند تحلیل متصل نیست", "موتور تحلیل متصل نیست"],
    ["دیرکرد", "با تأخیر"], ["پیشِ‌رو", "پیش‌رو"],
    ["همه مسیرها", "همه مسیرها"], ["آماده بررسی ارتقا", "آماده ارتقا"],
    ["جلسات باقی‌مانده", "جلسه باقی‌مانده"],
    ["تمرکز جلسه بعد", "تمرکز جلسه بعدی"]
  ];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT","STYLE","TEXTAREA","INPUT","OPTION"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-ptq-no-polish]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    let value = node.nodeValue;
    replacements.forEach(([from, to]) => value = value.replaceAll(from, to));
    value = PTQ.toPersianDigits(value);
    node.nodeValue = value;
  });
};

PTQ.enhanceImages = function(root = document) {
  root.querySelectorAll("img").forEach(img => {
    if (!img.hasAttribute("loading") && !img.closest(".ptc-login-shell,.splash-logo,.os-brand")) img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;
  });
};

PTQ.skeleton = function(view = "home") {
  const count = view === "players" ? 6 : view === "sessions" ? 4 : 3;
  return `<div class="ptq-skeleton-grid ${view === "players" ? "players" : ""}" aria-label="${PTQ.t("Loading content", "در حال آماده‌سازی")}">${Array.from({length:count},()=>`<article class="ptq-skeleton-card"></article>`).join("")}</div>`;
};

PTQ.flashSkeleton = function(view) {
  const root = document.getElementById("view");
  if (!root || document.querySelector(".os-modal.open")) return;
  root.setAttribute("aria-busy", "true");
  if (!root.children.length) root.innerHTML = PTQ.skeleton(view);
  setTimeout(() => root.removeAttribute("aria-busy"), 280);
};

PTQ.getOfflineQueue = () => JSON.parse(localStorage.getItem(PTQ.offlineQueueKey) || "[]");
PTQ.setOfflineQueue = queue => localStorage.setItem(PTQ.offlineQueueKey, JSON.stringify(queue));

PTQ.queueOfflineUpload = function(item) {
  const queue = PTQ.getOfflineQueue();
  queue.unshift({...item, queuedAt: new Date().toISOString(), status: "Pending"});
  PTQ.setOfflineQueue(queue.slice(0,30));
  window.dispatchEvent(new CustomEvent("ptq:queue"));
};

PTQ.syncOfflineQueue = function() {
  const queue = PTQ.getOfflineQueue();
  if (!navigator.onLine || !queue.length) return;
  const pending = queue.map(item => ({...item, syncedAt: new Date().toISOString(), status: "Pending"}));
  PTQ.setOfflineQueue([]);
  try {
    OS.data.analysisQueue ||= [];
    pending.forEach(item => {
      if (!OS.data.analysisQueue.some(x => x.id === item.id)) OS.data.analysisQueue.unshift(item);
    });
    pt2Save?.();
  } catch (_) {}
  toast(PTQ.t("Offline changes synced.", "تغییرات آفلاین همگام شد."), "success");
};

PTQ.updateConnectionBanner = function() {
  let banner = document.getElementById("ptqOfflineBanner");
  const queue = PTQ.getOfflineQueue();
  const shouldShow = !navigator.onLine || queue.length;
  if (!shouldShow) {
    banner?.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "ptqOfflineBanner";
    banner.className = "ptq-offline-banner";
    banner.innerHTML = `<div><strong></strong><small></small></div><button type="button" data-ptq-action="dismiss-offline">×</button>`;
    document.body.appendChild(banner);
  }
  banner.dataset.state = navigator.onLine ? "online" : "offline";
  banner.querySelector("strong").textContent = navigator.onLine ? PTQ.t("Ready to sync", "آماده همگام‌سازی") : PTQ.t("Offline mode", "حالت آفلاین");
  banner.querySelector("small").textContent = navigator.onLine
    ? PTQ.t(`${queue.length} item(s) waiting`, `${queue.length} مورد در صف همگام‌سازی`)
    : PTQ.t("Your work is saved on this device.", "کار شما روی همین دستگاه ذخیره می‌شود.");
  PTQ.polishPersian(banner);
};

PTQ.showInstallTip = function() {
  if (!PTQ.ios || PTQ.standalone || localStorage.getItem(PTQ.installDismissKey) === "1") return;
  if (document.getElementById("ptqInstallTip")) return;
  const tip = document.createElement("div");
  tip.id = "ptqInstallTip";
  tip.className = "ptq-install-tip";
  tip.innerHTML = `<div><strong>${PTQ.t("Install ProTrack", "نصب ProTrack")}</strong><small>${PTQ.t("Share → Add to Home Screen", "Share → Add to Home Screen")}</small></div><button type="button" data-ptq-action="dismiss-install">${PTQ.t("Got it", "متوجه شدم")}</button>`;
  document.body.appendChild(tip);
};

PTQ.applyNativeShell = function() {
  document.body.classList.toggle("ptq-standalone", PTQ.standalone);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", PTQ.standalone ? "#000000" : "#0A4FFF");
};

PTQ.afterRender = function(root = document) {
  PTQ.enhanceImages(document);
  PTQ.polishPersian(root);
  PTQ.polishPersian(document.querySelector(".os-header"));
  PTQ.polishPersian(document.querySelector(".sidebar"));
  PTQ.polishPersian(document.querySelector(".os-bottom-nav"));
  PTQ.updateConnectionBanner();
};

PTQ.patchAfterRender = function() {
  if (window.PTC && !PTQ.afterRenderPatched) {
    const previous = PTC.afterRender;
    PTC.afterRender = function(root) {
      previous?.call(PTC, root);
      PTQ.afterRender(root || document.getElementById("view"));
    };
    PTQ.afterRenderPatched = true;
  }
};

document.addEventListener("click", event => {
  const ptqAction = event.target.closest("[data-ptq-action]");
  if (ptqAction) {
    event.preventDefault();
    if (ptqAction.dataset.ptqAction === "dismiss-install") {
      localStorage.setItem(PTQ.installDismissKey, "1");
      document.getElementById("ptqInstallTip")?.remove();
    }
    if (ptqAction.dataset.ptqAction === "dismiss-offline") {
      document.getElementById("ptqOfflineBanner")?.remove();
    }
    return;
  }
  const button = event.target.closest("button,[data-os-view],[data-os-action],[data-ptc-action]");
  if (!button) return;
  button.classList.add("ptq-pressed");
  setTimeout(() => button.classList.remove("ptq-pressed"), 170);
  if (button.dataset.osView) {
    PTQ.flashSkeleton(button.dataset.osView);
    PTQ.haptic("navigation");
    return;
  }
  const action = button.dataset.osAction || button.dataset.ptcAction || "";
  if (/delete|archive/i.test(action)) PTQ.haptic("delete");
  else if (/save|finish|attendance|wizard|registration/i.test(action)) PTQ.haptic("save");
  else if (/upload/i.test(action)) PTQ.haptic("upload");
  else PTQ.haptic("selection");
}, true);

document.addEventListener("change", event => {
  if (event.target?.id !== "ptcVideoInput") return;
  const file = event.target.files?.[0];
  if (!file || navigator.onLine) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const item = {id:`offline-${Date.now()}`, player:PTQ.t("Unassigned video","ویدیوی بدون بازیکن"), type:"Video Upload", fileName:file.name, date:osDateOffset(0), status:"Pending", offline:true};
  PTQ.queueOfflineUpload(item);
  try {
    OS.data.analysisQueue ||= [];
    OS.data.analysisQueue.unshift(item);
    pt2Save?.();
    osRender("analysis");
  } catch (_) {}
  toast(PTQ.t("Video saved for upload when online.", "ویدیو ذخیره شد و بعد از اتصال همگام می‌شود."), "success");
}, true);

window.addEventListener("online", () => { PTQ.syncOfflineQueue(); PTQ.updateConnectionBanner(); PTQ.haptic("success"); });
window.addEventListener("offline", () => { PTQ.updateConnectionBanner(); PTQ.haptic("selection"); });
window.addEventListener("ptq:queue", PTQ.updateConnectionBanner);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    PTQ.syncOfflineQueue();
    PTQ.afterRender(document);
  }
});

window.addEventListener("load", () => {
  PTQ.patchToast();
  PTQ.patchAfterRender();
  PTQ.applyNativeShell();
  PTQ.afterRender(document);
  PTQ.syncOfflineQueue();
  setTimeout(PTQ.showInstallTip, 1200);
});

PTQ.patchToast();
PTQ.patchAfterRender();
PTQ.applyNativeShell();
queueMicrotask(() => PTQ.afterRender(document));
