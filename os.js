/* ProTrack OS v1.0 shell — extends the locked AI Analyst without changing its engine. */
const OS = {
  version: "1.0",
  lang: localStorage.getItem("protrack-os-lang") || "en",
  current: new URLSearchParams(location.search).get("view") || "home",
  profileId: null,
  profileTab: "overview",
  playerFilter: "all",
  search: "",
  installPrompt: null,
  user: JSON.parse(localStorage.getItem("protrack-os-user") || "null") || { loggedIn:false, name:"Academy Coach", role:"head", playerId:"p1" },
  data: null,
  dict: {
    en: {
      nav_home:"Home",nav_players:"Players",nav_analysis:"Analysis",nav_promotions:"Promotions",nav_settings:"Settings",
      head_coach:"Head Coach",assistant_coach:"Assistant Coach",player_role:"Player",
      morning:"Court intelligence",dashboard_title:"Tonight at a glance",dashboard_sub:"The decisions that need you before tomorrow's first session.",demo:"Demo academy data",
      active_players:"Active Players",sessions_today:"Sessions Today",sessions_tomorrow:"Tomorrow",avg_pdi:"Average PDI",avg_pti:"Average PTI",ready_count:"Ready",at_risk_count:"At Risk",
      alerts:"Player alerts",alerts_sub:"Signals generated from attendance and session history",view_all:"View all",actions:"Players needing attention",actions_sub:"Your next best actions",today:"Today's sessions",intelligence:"Academy intelligence",
      players:"Players",players_sub:"Profiles, history and current development state",search_players:"Search players",add_player:"Add player",all:"All",active:"Active",paused:"Paused",at_risk:"At Risk",inactive:"Inactive",
      analysis:"AI Analyst",analysis_sub:"ProTrack v2.0 · locked methodology",start_analysis:"Start new analysis",quick_note:"Quick session note",quick_note_sub:"Capture wins, issues and next focus in under 60 seconds.",video_analysis:"Video analysis",video_sub:"Upload match, training or assessment footage.",assessment:"Assessment",assessment_sub:"Create a structured assessment session.",reports:"Recent reports",reports_sub:"Open the full 17-section coach report.",
      promotions:"Promotion queue",promotions_sub:"Official PDI, PTI, rubric and confidence rules only",ready:"Ready",monitor:"Monitor",not_ready:"Not Ready",insufficient:"Insufficient Data",target:"Target",rubric_min:"Rubric min",confidence:"Confidence",sessions:"Sessions",
      settings:"Settings",settings_sub:"Language, access, installation and ProTrack-owned data",language:"Language",language_sub:"English / فارسی",account_role:"Account & role",account_sub:"Switch the current demo role",install:"Install ProTrack OS",install_sub:"Add to your iPhone or Android home screen",backup:"Export full backup",backup_sub:"Download all local ProTrack data",restore:"Restore backup",restore_sub:"Import a ProTrack JSON backup",logout:"Sign out",offline_ready:"Offline ready",offline_sub:"Core app cached on this device",methodology:"Methodology locked",methodology_sub:"AI Analyst v2.0 · Pro v7.1 Production",
      overview:"Overview",history:"History",attendance:"Attendance",package:"Package",contact:"Contact",emergency:"Emergency",start_date:"Start date",stage:"Current stage",track:"Track",coach:"Assigned coach",notes:"Coach notes",membership:"Membership",remaining:"remaining",attended:"attended",missed:"missed",consecutive:"consecutive absences",
      session_history:"Session timeline",no_history:"No session history yet",open_report:"Open report",promotion_reason:"Promotion review",primary_focus:"Primary focus",
      full_name:"Full name",gender:"Gender",age:"Age",phone:"Phone",emergency_contact:"Emergency contact",status:"Status",save_player:"Save player",cancel:"Cancel",close:"Close",
      wins:"Wins",issues:"Issues",priorities:"Priorities",next_focus:"Next session focus",attendance_result:"Attendance",present:"Present",absent:"Absent",save_note:"Save session note",select_player:"Select player",
      login_title:"Welcome to ProTrack OS",login_sub:"Choose your academy access for this local MVP.",your_name:"Your name",enter_academy:"Enter academy",role_permissions:"Access adapts to your selected role.",
      player_profile:"Player profile",back_players:"Back to players",add_session:"Add session note",status_updated:"Saved locally",backup_created:"Full ProTrack backup created.",backup_restored:"Backup restored.",install_ios:"On iPhone: Share → Add to Home Screen. On Android: Browser menu → Install app.",
      common_weakness:"Most common weakness",most_improved:"Most improved player",pdi_trend:"Average PDI trend",pti_trend:"Average PTI trend",readiness_trend:"Promotion readiness",this_block:"this training block",
      no_results:"No matching players",review_promotion:"Review promotion",contact_player:"Contact player",schedule_assessment:"Schedule assessment",review_attendance:"Review attendance",modify_plan:"Modify development plan",
      official_rules:"Official thresholds",evidence_rule:"Ready also requires complete core rubrics, MEDIUM/HIGH confidence and repeated evidence.",nightly:"Nightly management dashboard"
    },
    fa: {
      nav_home:"خانه",nav_players:"بازیکنان",nav_analysis:"آنالیز",nav_promotions:"ارتقا",nav_settings:"تنظیمات",
      head_coach:"سرمربی",assistant_coach:"مربی دستیار",player_role:"بازیکن",
      morning:"هوش کنار زمین",dashboard_title:"نگاه امشب",dashboard_sub:"تصمیم‌هایی که قبل از اولین جلسه فردا به توجه شما نیاز دارند.",demo:"داده‌های نمایشی آکادمی",
      active_players:"بازیکن فعال",sessions_today:"جلسه امروز",sessions_tomorrow:"فردا",avg_pdi:"میانگین PDI",avg_pti:"میانگین PTI",ready_count:"آماده ارتقا",at_risk_count:"در معرض خطر",
      alerts:"هشدارهای بازیکنان",alerts_sub:"سیگنال‌های ساخته‌شده از حضور و تاریخچه جلسات",view_all:"مشاهده همه",actions:"بازیکنان نیازمند توجه",actions_sub:"اقدام‌های بعدی پیشنهادی",today:"جلسات امروز",intelligence:"هوش آکادمی",
      players:"بازیکنان",players_sub:"پروفایل، تاریخچه و وضعیت فعلی رشد",search_players:"جستجوی بازیکن",add_player:"افزودن بازیکن",all:"همه",active:"فعال",paused:"متوقف",at_risk:"در معرض خطر",inactive:"غیرفعال",
      analysis:"آنالیزگر هوشمند",analysis_sub:"ProTrack v2.0 · متدولوژی قفل‌شده",start_analysis:"شروع آنالیز جدید",quick_note:"یادداشت سریع جلسه",quick_note_sub:"بردها، مشکلات و تمرکز بعدی را زیر ۶۰ ثانیه ثبت کنید.",video_analysis:"آنالیز ویدیو",video_sub:"ویدیوی مسابقه، تمرین یا ارزیابی را بارگذاری کنید.",assessment:"ارزیابی",assessment_sub:"یک جلسه ارزیابی ساختاریافته بسازید.",reports:"گزارش‌های اخیر",reports_sub:"گزارش کامل ۱۷ بخشی مربی را باز کنید.",
      promotions:"صف ارتقا",promotions_sub:"فقط قوانین رسمی PDI، PTI، روبریک و اطمینان",ready:"آماده",monitor:"پایش",not_ready:"آماده نیست",insufficient:"داده ناکافی",target:"هدف",rubric_min:"حداقل روبریک",confidence:"اطمینینان",sessions:"جلسه",
      settings:"تنظیمات",settings_sub:"زبان، دسترسی، نصب و داده‌های متعلق به ProTrack",language:"زبان",language_sub:"فارسی / English",account_role:"حساب و نقش",account_sub:"تغییر نقش نمایشی فعلی",install:"نصب ProTrack OS",install_sub:"افزودن به صفحه اصلی آیفون یا اندروید",backup:"خروجی کامل پشتیبان",backup_sub:"دریافت همه داده‌های محلی ProTrack",restore:"بازیابی پشتیبان",restore_sub:"وارد کردن فایل JSON پروترک",logout:"خروج",offline_ready:"آماده آفلاین",offline_sub:"هسته برنامه روی این دستگاه ذخیره شده",methodology:"متدولوژی قفل است",methodology_sub:"AI Analyst v2.0 · Pro v7.1 Production",
      overview:"نمای کلی",history:"تاریخچه",attendance:"حضور",package:"پکیج",contact:"تماس",emergency:"تماس اضطراری",start_date:"تاریخ شروع",stage:"مرحله فعلی",track:"مسیر",coach:"مربی مسئول",notes:"یادداشت مربی",membership:"عضویت",remaining:"باقی‌مانده",attended:"حاضر",missed:"غایب",consecutive:"غیبت متوالی",
      session_history:"خط زمانی جلسات",no_history:"هنوز جلسه‌ای ثبت نشده",open_report:"بازکردن گزارش",promotion_reason:"بررسی ارتقا",primary_focus:"تمرکز اصلی",
      full_name:"نام کامل",gender:"جنسیت",age:"سن",phone:"تلفن",emergency_contact:"تماس اضطراری",status:"وضعیت",save_player:"ذخیره بازیکن",cancel:"انصراف",close:"بستن",
      wins:"بردها",issues:"مشکلات",priorities:"اولویت‌ها",next_focus:"تمرکز جلسه بعد",attendance_result:"حضور",present:"حاضر",absent:"غایب",save_note:"ذخیره یادداشت جلسه",select_player:"انتخاب بازیکن",
      login_title:"به ProTrack OS خوش آمدید",login_sub:"برای این MVP محلی، سطح دسترسی آکادمی را انتخاب کنید.",your_name:"نام شما",enter_academy:"ورود به آکادمی",role_permissions:"دسترسی بر اساس نقش انتخابی تنظیم می‌شود.",
      player_profile:"پروفایل بازیکن",back_players:"بازگشت به بازیکنان",add_session:"افزودن یادداشت جلسه",status_updated:"به‌صورت محلی ذخیره شد",backup_created:"پشتیبان کامل ProTrack ساخته شد.",backup_restored:"پشتیبان بازیابی شد.",install_ios:"آیفون: Share ← Add to Home Screen. اندروید: منوی مرورگر ← Install app.",
      common_weakness:"ضعف پرتکرار",most_improved:"بیشترین پیشرفت",pdi_trend:"روند میانگین PDI",pti_trend:"روند میانگین PTI",readiness_trend:"آمادگی ارتقا",this_block:"در این بلوک تمرینی",
      no_results:"بازیکنی پیدا نشد",review_promotion:"بررسی ارتقا",contact_player:"تماس با بازیکن",schedule_assessment:"زمان‌بندی ارزیابی",review_attendance:"بررسی حضور",modify_plan:"اصلاح برنامه رشد",
      official_rules:"آستانه‌های رسمی",evidence_rule:"وضعیت آماده همچنین به روبریک‌های کامل، اطمینان متوسط/بالا و شواهد تکرارشونده نیاز دارد.",nightly:"داشبورد مدیریتی شبانه"
    }
  }
};

function osT(key, vars={}) {
  let value = OS.dict[OS.lang][key] || OS.dict.en[key] || key;
  Object.entries(vars).forEach(([k,v]) => value = value.replace(`{${k}}`, v));
  return value;
}
function osEsc(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function osSlug(value) { return String(value).toLowerCase().replace(/\s+/g,"-"); }
function osInitials(name) { return String(name||"PT").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase(); }
function osDateOffset(days) { const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
function osDisplayDate(value) { return new Intl.DateTimeFormat(OS.lang==="fa"?"fa-IR":"en",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value+"T12:00:00")); }
function osRoleLabel(role=OS.user.role) { return osT(role==="head"?"head_coach":role==="assistant"?"assistant_coach":"player_role"); }
function osSave() { localStorage.setItem("protrack-os-data",JSON.stringify(OS.data)); localStorage.setItem("protrack-os-user",JSON.stringify(OS.user)); }
function osScore(value) { return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : osT("insufficient"); }

function osSeedData() {
  const saved=localStorage.getItem("protrack-os-data"); if(saved){ try { return JSON.parse(saved); } catch(_){} }
  return {players:[], sessions:[], quickNotes:[]};
}
OS.data=osSeedData();

function osPromotion(player) {
  const stages=["Starter","Foundation","Development","Competition","Elite"];
  const idx=stages.indexOf(player.track); const target=stages[Math.min(idx+1,stages.length-1)];
  const rules={Foundation:{pdi:4.5,pti:4.5,rubric:3},Development:{pdi:6,pti:6,rubric:5},Competition:{pdi:7.5,pti:7.5,rubric:7},Elite:{pdi:9,pti:9,rubric:9}};
  if(idx<0||!rules[target]||![player.pdi,player.pti,player.rubricMin].every(v=>Number.isFinite(Number(v)))) return {status:"Insufficient Data",target,reason:osT("insufficient")};
  const r=rules[target], confidence=player.confidence||"LOW", consistency=player.sessionsCompleted>1;
  const threshold=player.pdi>=r.pdi&&player.pti>=r.pti, rubric=player.rubricMin>=r.rubric, evidence=confidence!=="LOW"&&consistency;
  if(threshold&&rubric&&evidence) return {status:"Ready",target,rule:r,reason:OS.lang==="fa"?`آستانه‌های ${target}، حداقل روبریک، اطمینان و شواهد تکرارشونده تأیید شده‌اند.`:`${target} thresholds, core rubric minimum, confidence and repeated evidence are satisfied.`};
  const close=player.pdi>=r.pdi-1&&player.pti>=r.pti-1&&confidence!=="LOW";
  if(close) return {status:"Monitor",target,rule:r,reason:OS.lang==="fa"?`به شرایط ${target} نزدیک است؛ ${!rubric?"حداقل روبریک":"ثبات تکرارشونده"} هنوز باید تأیید شود.`:`Close to ${target}; ${!rubric?"core rubric minimum":"repeated consistency"} still needs confirmation.`};
  const blockers=[];
  if(player.pdi<r.pdi)blockers.push(`PDI < ${r.pdi}`); if(player.pti<r.pti)blockers.push(`PTI < ${r.pti}`); if(!rubric)blockers.push(`${osT("rubric_min")} < ${r.rubric}`); if(confidence==="LOW")blockers.push(`${osT("confidence")}: LOW`);
  return {status:"Not Ready",target,rule:r,reason:blockers.join(" · ")};
}

function osVisiblePlayers() {
  if(OS.user.role==="player") return OS.data.players.filter(p=>p.id===OS.user.playerId);
  if(OS.user.role==="assistant") return OS.data.players.filter(p=>p.coach.toLowerCase().includes("sara"));
  return OS.data.players;
}

function osAlerts() {
  const alerts=[];
  osVisiblePlayers().forEach(p=>{
    const total=p.attendance.attended+p.attendance.missed, rate=total?p.attendance.attended/total*100:0;
    const last=p.ptiHistory||[], pdi=p.pdiHistory||[];
    if(rate<75) alerts.push({player:p,type:"attendance",level:"high",icon:"!",title:OS.lang==="fa"?`حضور ${p.name} به ${Math.round(rate)}٪ رسیده`:`${p.name} attendance is ${Math.round(rate)}%`,text:OS.lang==="fa"?"پیش از جلسه بعد با بازیکن تماس بگیرید.":"Contact the player before the next session."});
    else if(rate<80) alerts.push({player:p,type:"attendance",level:"medium",icon:"!",title:OS.lang==="fa"?`حضور ${p.name} زیر ۸۰٪ است`:`${p.name} attendance is below 80%`,text:osT("review_attendance")});
    if(last.length>=3&&last.at(-1)<last.at(-2)&&last.at(-2)<last.at(-3)) alerts.push({player:p,type:"pti",level:"high",icon:"↓",title:OS.lang==="fa"?`PTI ${p.name} در حال کاهش است`:`${p.name} PTI is declining`,text:`${last.at(-3).toFixed(1)} → ${last.at(-1).toFixed(1)} · ${osT("this_block")}`});
    if(pdi.length>=3&&pdi.at(-1)<pdi.at(-2)&&pdi.at(-2)<pdi.at(-3)) alerts.push({player:p,type:"pdi",level:"medium",icon:"↓",title:OS.lang==="fa"?`PDI ${p.name} در حال کاهش است`:`${p.name} PDI is declining`,text:`${pdi.at(-3).toFixed(1)} → ${pdi.at(-1).toFixed(1)}`});
    if(p.commitmentTrend==="down") alerts.push({player:p,type:"commitment",level:"medium",icon:"◷",title:OS.lang==="fa"?`تعهد ${p.name} کاهش یافته`:`${p.name} commitment is declining`,text:osT("review_attendance")});
    if(osPromotion(p).status==="Ready") alerts.push({player:p,type:"promotion",level:"medium",icon:"⇧",title:OS.lang==="fa"?`${p.name} آماده بررسی ارتقا است`:`${p.name} needs a promotion review`,text:`${p.track} → ${osPromotion(p).target}`});
  });
  return alerts.sort((a,b)=>(a.level==="high"?-1:1)-(b.level==="high"?-1:1));
}

function osActions() {
  return osAlerts().slice(0,4).map(a=>({player:a.player,label:a.type==="promotion"?osT("review_promotion"):a.type==="attendance"?osT("contact_player"):a.type==="pti"?osT("modify_plan"):osT("schedule_assessment")}));
}

function osSetNav(view) {
  document.querySelectorAll(".os-nav").forEach(b=>b.classList.toggle("active",b.dataset.osView===view||(view==="player"&&b.dataset.osView==="players")||(view==="analysis-form"&&b.dataset.osView==="analysis")||(view==="report"&&b.dataset.osView==="analysis")));
}

function osPageHead(eyebrow,title,sub,extra="") { return `<div class="os-page-head"><div><span class="eyebrow">${osEsc(eyebrow)}</span><h1>${osEsc(title)}</h1><p>${osEsc(sub)}</p>${extra}</div><span class="os-date-chip">${osDisplayDate(osDateOffset(0))}</span></div>`; }
function osKpi(label,value,meta,accent="#0A4FFF",glow="rgba(10,79,255,.13)") { return `<article class="os-card os-kpi" style="--kpi-accent:${accent};--kpi-glow:${glow}"><small>${osEsc(label)}</small><strong>${osEsc(value)}</strong><span><i></i>${osEsc(meta)}</span></article>`; }
function osStatus(status) { const key=status==="Ready"?"ready":status==="Monitor"?"monitor":status==="Not Ready"?"not_ready":status==="Insufficient Data"?"insufficient":status.toLowerCase().replaceAll(" ","_"); return `<span class="os-status ${osSlug(status)}">${osEsc(osT(key))}</span>`; }
function osPlayer(id) { return OS.data.players.find(p=>p.id===id); }

function osRender(view=OS.current) {
  OS.current=view; osSetNav(view); const root=document.getElementById("view");
  const renderers={home:osRenderHome,players:osRenderPlayers,player:osRenderPlayer,analysis:osRenderAnalysis,promotions:osRenderPromotions,settings:osRenderSettings};
  if(renderers[view]) renderers[view](root); else osRenderHome(root);
  document.documentElement.lang=OS.lang==="fa"?"fa":"en"; document.documentElement.dir=OS.lang==="fa"?"rtl":"ltr";
  document.getElementById("osRoleLabel").textContent=osRoleLabel();
  document.querySelector(".os-lang").textContent=OS.lang==="fa"?"EN":"FA";
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=osT(el.dataset.i18n));
  root.focus({preventScroll:true}); window.scrollTo({top:0,behavior:"smooth"});
}

function osRenderHome(root) {
  const players=osVisiblePlayers(), active=players.filter(p=>p.status==="Active").length, today=OS.data.sessions.filter(s=>s.date===osDateOffset(0)&&players.some(p=>p.id===s.playerId)), tomorrow=OS.data.sessions.filter(s=>s.date===osDateOffset(1)&&players.some(p=>p.id===s.playerId));
  const avg=key=>players.length?(players.reduce((s,p)=>s+Number(p[key]||0),0)/players.length).toFixed(1):"—"; const ready=players.filter(p=>osPromotion(p).status==="Ready").length, risk=players.filter(p=>p.status==="At Risk").length, alerts=osAlerts(), actions=osActions();
  const focusCounts={};players.forEach(p=>focusCounts[p.primaryFocus]=(focusCounts[p.primaryFocus]||0)+1); const weakness=Object.entries(focusCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||osT("insufficient"); const improved=[...players].sort((a,b)=>(b.ptiHistory.at(-1)-b.ptiHistory[0])-(a.ptiHistory.at(-1)-a.ptiHistory[0]))[0];
  root.innerHTML=`${osPageHead(osT("nightly"),osT("dashboard_title"),osT("dashboard_sub"),`<span class="os-demo-label">${osT("demo")}</span>`)}
    <div class="os-kpi-scroll">${osKpi(osT("active_players"),active,`${players.length} ${osT("players")}`)}${osKpi(osT("sessions_today"),today.length,`${tomorrow.length} ${osT("sessions_tomorrow")}`,"#20d39a","rgba(32,211,154,.12)")}${osKpi(osT("avg_pdi"),avg("pdi"),`PTI ${avg("pti")}`)}${osKpi(osT("ready_count"),ready,`${risk} ${osT("at_risk_count")}`,ready?"#20d39a":"#ffbe55","rgba(255,190,85,.1)")}</div>
    <div class="os-dashboard-grid"><div>
      <section class="os-section"><div class="os-section-head"><div><h2>${osT("alerts")}</h2><p>${osT("alerts_sub")}</p></div><span class="os-count">${alerts.length}</span></div><div class="os-alert-list">${alerts.slice(0,4).map(a=>`<article class="os-card os-alert ${a.level}" data-os-action="open-player" data-id="${a.player.id}"><span class="os-alert-icon">${a.icon}</span><div><h3>${osEsc(a.title)}</h3><p>${osEsc(a.text)}</p></div><span class="os-chevron">›</span></article>`).join("")}</div></section>
      <section class="os-section os-card os-action-center"><div class="os-section-head"><div><h2>${osT("actions")}</h2><p>${osT("actions_sub")}</p></div></div><div class="os-action-list">${actions.map((a,i)=>`<button class="os-action" data-os-action="open-player" data-id="${a.player.id}"><span class="os-action-num">${i+1}</span><span><strong>${osEsc(a.label)}</strong><small>${osEsc(a.player.name)} · ${osEsc(a.player.primaryFocus)}</small></span><span class="os-chevron">›</span></button>`).join("")}</div></section>
    </div><div>
      <section class="os-section"><div class="os-section-head"><div><h2>${osT("today")}</h2><p>${today.length} ${osT("sessions_today")}</p></div></div><div class="os-session-list">${today.slice(0,6).map(s=>{const p=osPlayer(s.playerId);return `<article class="os-card os-session" data-os-action="open-player" data-id="${p.id}"><span class="os-time">${s.time}</span><div><h3>${osEsc(p.name)}</h3><p>${osEsc(s.type)} · ${osEsc(s.notes)}</p></div><span class="os-session-meta"><strong>${osEsc(s.coach)}</strong><small>${osEsc(p.track)}</small></span></article>`;}).join("")}</div></section>
      <section class="os-section os-card os-insight"><div class="os-section-head"><div><h2>${osT("intelligence")}</h2><p>${osT("this_block")}</p></div></div><div class="os-insight-grid"><div class="os-insight-item"><small>${osT("common_weakness")}</small><strong>${osEsc(weakness)}</strong></div><div class="os-insight-item"><small>${osT("most_improved")}</small><strong>${osEsc(improved?.name||osT("insufficient"))}</strong></div><div class="os-insight-item"><small>${osT("pdi_trend")}</small><strong class="os-trend">${players.length?osT("insufficient"):"—"}</strong></div><div class="os-insight-item"><small>${osT("readiness_trend")}</small><strong>${ready}/${players.length}</strong></div></div></section>
    </div></div>`;
}

function osRenderPlayers(root) {
  let players=osVisiblePlayers(); if(OS.playerFilter!=="all")players=players.filter(p=>osSlug(p.status)===OS.playerFilter); if(OS.search)players=players.filter(p=>p.name.toLowerCase().includes(OS.search.toLowerCase()));
  root.innerHTML=`${osPageHead(osT("morning"),osT("players"),osT("players_sub"))}<div class="os-toolbar"><input class="os-search" data-os-input="player-search" value="${osEsc(OS.search)}" placeholder="${osEsc(osT("search_players"))}">${OS.user.role==="head"?`<button class="os-square-button" data-os-action="add-player" aria-label="${osT("add_player")}">＋</button>`:""}</div><div class="os-filter-row">${["all","active","paused","at-risk","inactive"].map(f=>`<button class="os-filter ${OS.playerFilter===f?"active":""}" data-os-action="filter-player" data-filter="${f}">${osT(f.replace("-","_"))}</button>`).join("")}</div><div class="os-player-list">${players.length?players.map(osPlayerRow).join(""):`<div class="empty-state os-card"><div><div class="empty-icon">◎</div><h3>${osT("no_results")}</h3></div></div>`}</div>`;
  const input=root.querySelector('[data-os-input="player-search"]'); input?.addEventListener("input",e=>{OS.search=e.target.value;osRenderPlayers(root);const next=root.querySelector('[data-os-input="player-search"]');next?.focus();next?.setSelectionRange(OS.search.length,OS.search.length);});
}
function osPlayerRow(p) { const promo=osPromotion(p); return `<article class="os-card os-player-row" data-os-action="open-player" data-id="${p.id}"><span class="os-avatar">${osInitials(p.name)}</span><div><h3>${osEsc(p.name)}</h3><p>${osEsc(p.track)} · ${osEsc(p.coach)}</p><div class="os-player-numbers"><span>PDI <b>${osScore(p.pdi)}</b></span><span>PTI <b>${osScore(p.pti)}</b></span><span>${promo.target}</span></div></div><div>${osStatus(p.status)}<span class="os-chevron" style="display:block;text-align:center;margin-top:7px">›</span></div></article>`; }

function osRenderPlayer(root) {
  const p=osPlayer(OS.profileId)||osVisiblePlayers()[0]; if(!p){osRender("players");return;} OS.profileId=p.id; const promo=osPromotion(p), total=p.attendance.attended+p.attendance.missed, rate=total?Math.round(p.attendance.attended/total*100):0, remaining=p.sessionsPurchased-p.sessionsUsed;
  const sameAnalyses=state.analyses.filter(a=>a.playerName.toLowerCase()===p.name.toLowerCase()).sort((a,b)=>Number(b.sessionNumber)-Number(a.sessionNumber));
  root.innerHTML=`<button class="os-back" data-os-view="players">‹ ${osT("back_players")}</button><section class="os-card os-profile-hero"><span class="os-avatar">${osInitials(p.name)}</span><div><h1>${osEsc(p.name)}</h1><p>${osEsc(p.age)} · ${osEsc(p.gender)} · ${osEsc(p.membership)}</p></div><div class="os-profile-status">${osStatus(p.status)}${osStatus(promo.status)}<span class="os-status">${osEsc(p.track)}</span></div></section><div class="os-score-pair"><article class="os-card os-score-box"><small>PDI</small><strong>${osScore(p.pdi)}</strong><div class="os-progress"><i style="--value:${p.pdi*10}%"></i></div></article><article class="os-card os-score-box"><small>PTI</small><strong>${osScore(p.pti)}</strong><div class="os-progress"><i style="--value:${p.pti*10}%"></i></div></article></div><div class="os-profile-tabs">${["overview","history","attendance","package"].map(tab=>`<button class="os-profile-tab ${OS.profileTab===tab?"active":""}" data-os-action="profile-tab" data-tab="${tab}">${osT(tab)}</button>`).join("")}</div><div id="osProfileContent">${osProfileTabContent(p,promo,rate,remaining,sameAnalyses)}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px"><button class="os-secondary-button" data-os-action="quick-note" data-id="${p.id}">${osT("add_session")}</button>${sameAnalyses[0]?`<button class="os-primary-button" data-os-action="open-report" data-id="${sameAnalyses[0].id}">${osT("open_report")}</button>`:`<button class="os-primary-button" data-os-action="start-analysis" data-player="${p.id}">${osT("start_analysis")}</button>`}</div>`;
}

function osProfileTabContent(p,promo,rate,remaining,analyses) {
  if(OS.profileTab==="overview") return `<div class="os-profile-layout"><section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${osT("player_profile")}</h2></div></div><div class="os-detail-grid">${[["contact",p.phone],["emergency",p.emergency],["start_date",osDisplayDate(p.startDate)],["stage",p.stage],["coach",p.coach],["membership",p.membership]].map(([k,v])=>`<div class="os-detail"><small>${osT(k)}</small><strong>${osEsc(v)}</strong></div>`).join("")}</div></section><section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${osT("promotion_reason")}</h2></div>${osStatus(promo.status)}</div><div class="os-promotion-reason">${osEsc(promo.reason)}</div><div class="os-thresholds"><div class="os-threshold"><small>PDI</small><strong>${p.pdi}/${promo.rule?.pdi??"—"}</strong></div><div class="os-threshold"><small>PTI</small><strong>${p.pti}/${promo.rule?.pti??"—"}</strong></div><div class="os-threshold"><small>${osT("rubric_min")}</small><strong>${p.rubricMin}/${promo.rule?.rubric??"—"}</strong></div></div></section></div><section class="os-card os-detail-card" style="margin-top:10px"><div class="os-detail"><small>${osT("primary_focus")}</small><strong>${osEsc(p.primaryFocus)}</strong></div><div class="os-detail" style="margin-top:12px"><small>${osT("notes")}</small><strong>${osEsc(p.coachNotes)}</strong></div></section>`;
  if(OS.profileTab==="history") { const sessions=OS.data.sessions.filter(s=>s.playerId===p.id).sort((a,b)=>b.date.localeCompare(a.date)); return `<section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${osT("session_history")}</h2><p>${p.sessionsCompleted} ${osT("sessions")}</p></div></div><div class="os-timeline">${[...analyses.map(a=>({date:a.date.slice(0,10),title:`Session ${a.sessionNumber} · ${a.analysisType}`,text:`PDI ${osScore(calculatePDI(a))} · PTI ${osScore(calculatePTI(a))}`,report:a.id})),...sessions.map(s=>({date:s.date,title:`${s.type} · ${s.coach}`,text:s.notes}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(x=>`<article class="os-card os-timeline-item" ${x.report?`data-os-action="open-report" data-id="${x.report}"`:""}><h3>${osEsc(x.title)}</h3><p>${osDisplayDate(x.date)} · ${osEsc(x.text)}</p></article>`).join("")||`<p>${osT("no_history")}</p>`}</div></section>`; }
  if(OS.profileTab==="attendance") return `<section class="os-card os-detail-card"><div class="os-attendance-ring" style="--attendance:${rate}%"><strong>${rate}%</strong></div><div class="os-detail-grid"><div class="os-detail"><small>${osT("attended")}</small><strong>${p.attendance.attended}</strong></div><div class="os-detail"><small>${osT("missed")}</small><strong>${p.attendance.missed}</strong></div><div class="os-detail"><small>${osT("consecutive")}</small><strong>${p.attendance.consecutive}</strong></div><div class="os-detail"><small>${osT("status")}</small><strong>${rate<75?osT("at_risk"):osT("active")}</strong></div></div></section>`;
  return `<section class="os-card os-package-bar"><div class="os-package-numbers"><div><span>${osT("membership")}</span><strong>${osEsc(p.membership)}</strong></div><div><strong>${remaining}</strong><span> / ${p.sessionsPurchased} ${osT("remaining")}</span></div></div><div class="os-progress"><i style="--value:${Math.max(0,remaining/p.sessionsPurchased*100)}%"></i></div><div class="os-detail-grid" style="margin-top:17px"><div class="os-detail"><small>${osT("sessions")}</small><strong>${p.sessionsPurchased}</strong></div><div class="os-detail"><small>${OS.lang==="fa"?"استفاده‌شده":"Used"}</small><strong>${p.sessionsUsed}</strong></div></div></section>`;
}

function osRenderAnalysis(root) {
  const reports=state.analyses.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  root.innerHTML=`${osPageHead("PROTRACK v2.0",osT("analysis"),osT("analysis_sub"))}<section class="os-card os-analysis-hero"><div class="os-analysis-icon">◇</div><h2>${osT("start_analysis")}</h2><p>${OS.lang==="fa"?"ویدیو و شواهد قابل مشاهده را ثبت کنید؛ موتور قفل‌شده PDI، PTI و آمادگی ارتقا را بدون حدس محاسبه می‌کند.":"Capture video and observable evidence; the locked engine calculates PDI, PTI and promotion readiness without guessing."}</p><button class="os-primary-button" data-os-action="start-analysis">${osT("start_analysis")}</button></section><div class="os-quick-grid"><button class="os-quick-card" data-os-action="quick-note"><span>✎</span><strong>${osT("quick_note")}</strong><small>${osT("quick_note_sub")}</small></button><button class="os-quick-card" data-os-action="start-analysis"><span>▶</span><strong>${osT("video_analysis")}</strong><small>${osT("video_sub")}</small></button><button class="os-quick-card" data-os-action="start-analysis"><span>◉</span><strong>${osT("assessment")}</strong><small>${osT("assessment_sub")}</small></button><button class="os-quick-card" data-os-view="promotions"><span>⇧</span><strong>${osT("promotions")}</strong><small>${osT("promotions_sub")}</small></button></div><section class="os-section"><div class="os-section-head"><div><h2>${osT("reports")}</h2><p>${osT("reports_sub")}</p></div></div><div class="os-player-list">${reports.map(a=>`<article class="os-card os-player-row" data-os-action="open-report" data-id="${a.id}"><span class="os-avatar">${osInitials(a.playerName)}</span><div><h3>${osEsc(a.playerName)}</h3><p>Session ${a.sessionNumber} · ${osEsc(a.analysisType)}</p><div class="os-player-numbers"><span>PDI <b>${osScore(calculatePDI(a))}</b></span><span>PTI <b>${osScore(calculatePTI(a))}</b></span></div></div><span class="os-chevron">›</span></article>`).join("")}</div></section>`;
}

function osRenderPromotions(root) {
  const players=osVisiblePlayers();
  root.innerHTML=`${osPageHead("PROTRACK PROMOTION ENGINE",osT("promotions"),osT("promotions_sub"))}<section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${osT("official_rules")}</h2><p>${osT("evidence_rule")}</p></div></div><div class="os-thresholds"><div class="os-threshold"><small>Foundation</small><strong>4.5 / 4.5</strong></div><div class="os-threshold"><small>Development</small><strong>6.0 / 6.0</strong></div><div class="os-threshold"><small>Competition</small><strong>7.5 / 7.5</strong></div></div></section><div class="os-filter-row" style="margin-top:13px">${["Ready","Monitor","Not Ready"].map(s=>`<span class="os-filter active">${osT(s==="Ready"?"ready":s==="Monitor"?"monitor":"not_ready")} · ${players.filter(p=>osPromotion(p).status===s).length}</span>`).join("")}</div><div class="os-promotion-list">${players.sort((a,b)=>({Ready:0,Monitor:1,"Not Ready":2}[osPromotion(a).status]-{Ready:0,Monitor:1,"Not Ready":2}[osPromotion(b).status])).map(p=>{const promo=osPromotion(p);return `<article class="os-card os-promotion" data-os-action="open-player" data-id="${p.id}"><div class="os-promotion-top"><span class="os-avatar">${osInitials(p.name)}</span><div><h3>${osEsc(p.name)}</h3><p>${osEsc(p.track)} → ${osEsc(promo.target)}</p></div>${osStatus(promo.status)}</div><div class="os-promotion-reason">${osEsc(promo.reason)}</div><div class="os-thresholds"><div class="os-threshold"><small>PDI</small><strong>${p.pdi}/${promo.rule?.pdi??"—"}</strong></div><div class="os-threshold"><small>PTI</small><strong>${p.pti}/${promo.rule?.pti??"—"}</strong></div><div class="os-threshold"><small>${osT("rubric_min")}</small><strong>${p.rubricMin}/${promo.rule?.rubric??"—"}</strong></div></div></article>`;}).join("")}</div>`;
}

function osRenderSettings(root) {
  root.innerHTML=`${osPageHead("PROTRACK OS v1.0",osT("settings"),osT("settings_sub"))}<section class="os-card os-settings-group"><button class="os-setting" data-os-action="language"><span class="os-setting-icon">文</span><span><strong>${osT("language")}</strong><small>${osT("language_sub")}</small></span><span class="os-chevron">${OS.lang==="fa"?"EN":"FA"}</span></button><button class="os-setting" data-os-action="account"><span class="os-setting-icon">◎</span><span><strong>${osT("account_role")}</strong><small>${osEsc(OS.user.name)} · ${osRoleLabel()}</small></span><span class="os-chevron">›</span></button><button class="os-setting" data-os-action="install"><span class="os-setting-icon">⇩</span><span><strong>${osT("install")}</strong><small>${osT("install_sub")}</small></span><span class="os-chevron">›</span></button></section><section class="os-card os-settings-group"><button class="os-setting" data-os-action="backup"><span class="os-setting-icon">↧</span><span><strong>${osT("backup")}</strong><small>${osT("backup_sub")}</small></span><span class="os-chevron">›</span></button><button class="os-setting" data-os-action="restore"><span class="os-setting-icon">↥</span><span><strong>${osT("restore")}</strong><small>${osT("restore_sub")}</small></span><span class="os-chevron">›</span></button><input type="file" id="osRestoreInput" accept="application/json" hidden><div class="os-setting"><span class="os-setting-icon">✓</span><span><strong>${osT("offline_ready")}</strong><small>${osT("offline_sub")}</small></span><span class="presence-dot"></span></div></section><section class="os-card os-settings-group"><div class="os-setting"><span class="os-setting-icon">▣</span><span><strong>${osT("methodology")}</strong><small>${osT("methodology_sub")}</small></span><span class="os-status active">LOCKED</span></div><button class="os-setting" data-os-action="logout"><span class="os-setting-icon">↪</span><span><strong>${osT("logout")}</strong><small>Local demo session</small></span><span class="os-chevron">›</span></button></section><p class="os-version">ProTrack OS v1.0<br>AI Analyst v2.0 FINAL MASTER CLEAN<br>Your Game. Elevated.</p>`;
  document.getElementById("osRestoreInput")?.addEventListener("change",osRestoreBackup);
}

function osOpenModal(content, extraClass="") { const modal=document.getElementById("osModal");modal.className=`os-modal open ${extraClass}`;modal.setAttribute("aria-hidden","false");modal.innerHTML=content; }
function osCloseModal() { const modal=document.getElementById("osModal");modal.className="os-modal";modal.setAttribute("aria-hidden","true");modal.innerHTML=""; }
function osModalFrame(title,sub,body,cls="") { return `<section class="os-modal-card ${cls}"><div class="os-modal-handle"></div><div class="os-modal-head"><div><h2>${osEsc(title)}</h2><p>${osEsc(sub)}</p></div><button class="os-modal-close" data-os-action="close-modal">×</button></div>${body}</section>`; }

function osOpenLogin() {
  const body=`<div class="os-login-logo"><img src="assets/protrack-official.png" alt="ProTrack"></div><div class="os-login-title"><h1>${osT("login_title")}</h1><p>${osT("login_sub")}</p></div><form class="os-form" id="osLoginForm"><div class="os-field"><label>${osT("your_name")}</label><input name="name" value="${osEsc(OS.user.name)}" required></div><div class="os-role-options">${osRoleButtons(OS.user.role)}</div><input type="hidden" name="role" value="${OS.user.role}"><button class="os-primary-button" type="submit">${osT("enter_academy")}</button><p class="os-version">${osT("role_permissions")}</p></form>`;
  osOpenModal(osModalFrame("","",body,"os-login-card"),"open");
  document.getElementById("osLoginForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target);OS.user={...OS.user,name:fd.get("name")||"Academy Coach",role:fd.get("role")||"head",loggedIn:true};osSave();osCloseModal();osRender("home");});
}
function osRoleButtons(active) { return [{id:"head",icon:"♛",key:"head_coach"},{id:"assistant",icon:"◉",key:"assistant_coach"},{id:"player",icon:"◎",key:"player_role"}].map(r=>`<button type="button" class="os-role-option ${active===r.id?"active":""}" data-os-action="select-role" data-role="${r.id}"><span>${r.icon}</span><div><strong>${osT(r.key)}</strong><small>${r.id==="head"?"Full academy access":r.id==="assistant"?"Assigned players & session notes":"Personal journey & reports"}</small></div></button>`).join(""); }
function osOpenAccount() { const body=`<form class="os-form" id="osAccountForm"><div class="os-field"><label>${osT("your_name")}</label><input name="name" value="${osEsc(OS.user.name)}" required></div><div class="os-role-options">${osRoleButtons(OS.user.role)}</div><input type="hidden" name="role" value="${OS.user.role}"><button class="os-primary-button" type="submit">${osT("status_updated")}</button></form>`;osOpenModal(osModalFrame(osT("account_role"),osT("account_sub"),body));document.getElementById("osAccountForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target);OS.user={...OS.user,name:fd.get("name"),role:fd.get("role")};osSave();osCloseModal();osRender(OS.current);}); }

function osOpenQuickNote(playerId="") { const options=osVisiblePlayers().map(p=>`<option value="${p.id}" ${p.id===playerId?"selected":""}>${osEsc(p.name)}</option>`).join("");const body=`<form class="os-form" id="osQuickForm"><div class="os-field"><label>${osT("select_player")}</label><select name="playerId" required>${options}</select></div><div class="os-field"><label>${osT("wins")}</label><textarea name="wins" placeholder="${osT("wins")}"></textarea></div><div class="os-field"><label>${osT("issues")}</label><textarea name="issues" placeholder="${osT("issues")}"></textarea></div><div class="os-field"><label>${osT("priorities")}</label><input name="priorities" placeholder="${osT("priorities")}"></div><div class="os-field"><label>${osT("next_focus")}</label><input name="focus" required placeholder="${osT("next_focus")}"></div><div class="os-field"><label>${osT("attendance_result")}</label><select name="attendance"><option value="present">${osT("present")}</option><option value="absent">${osT("absent")}</option></select></div><button class="os-primary-button" type="submit">${osT("save_note")}</button></form>`;osOpenModal(osModalFrame(osT("quick_note"),osT("quick_note_sub"),body));document.getElementById("osQuickForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target),p=osPlayer(fd.get("playerId"));const note={id:`q${Date.now()}`,playerId:p.id,date:osDateOffset(0),wins:fd.get("wins"),issues:fd.get("issues"),priorities:fd.get("priorities"),focus:fd.get("focus"),attendance:fd.get("attendance")};OS.data.quickNotes.push(note);OS.data.sessions.push({id:`s${Date.now()}`,playerId:p.id,date:osDateOffset(0),time:new Date().toTimeString().slice(0,5),type:"Training",coach:OS.user.name,status:"Completed",notes:note.focus});p.sessionsCompleted++;p.sessionsUsed++;if(note.attendance==="present"){p.attendance.attended++;p.attendance.consecutive=0}else{p.attendance.missed++;p.attendance.consecutive++}p.primaryFocus=note.focus||p.primaryFocus;osSave();osCloseModal();toast(osT("status_updated"));osRender(OS.current==="player"?"player":"home");}); }

function osOpenAddPlayer() { const body=`<form class="os-form" id="osPlayerForm"><div class="os-field"><label>${osT("full_name")}</label><input name="name" required></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div class="os-field"><label>${osT("gender")}</label><select name="gender"><option>Female</option><option>Male</option><option>Other</option></select></div><div class="os-field"><label>${osT("age")}</label><input name="age" type="number" min="5" max="100"></div></div><div class="os-field"><label>${osT("phone")}</label><input name="phone"></div><div class="os-field"><label>${osT("emergency_contact")}</label><input name="emergency"></div><div class="os-field"><label>${osT("membership")}</label><input name="membership" value="Academy 20"></div><div class="os-field"><label>${osT("coach")}</label><input name="coach" value="${osEsc(OS.user.name)} · ${osRoleLabel()}"></div><div class="os-field"><label>${osT("notes")}</label><textarea name="notes"></textarea></div><button class="os-primary-button" type="submit">${osT("save_player")}</button></form>`;osOpenModal(osModalFrame(osT("add_player"),osT("players_sub"),body));document.getElementById("osPlayerForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target),p={id:`p${Date.now()}`,name:fd.get("name"),gender:fd.get("gender"),age:Number(fd.get("age"))||"",phone:fd.get("phone")||osT("insufficient"),emergency:fd.get("emergency")||osT("insufficient"),startDate:osDateOffset(0),stage:"Starter",track:"Starter",status:"Active",pdi:null,pti:null,rubricMin:null,confidence:"LOW",sessionsCompleted:0,attendance:{attended:0,missed:0,consecutive:0},coach:fd.get("coach"),coachNotes:fd.get("notes"),membership:fd.get("membership"),sessionsPurchased:20,sessionsUsed:0,primaryFocus:osT("insufficient"),pdiHistory:[],ptiHistory:[],commitment:null,commitmentTrend:"stable"};OS.data.players.push(p);osSave();osCloseModal();OS.profileId=p.id;OS.profileTab="overview";osRender("player");}); }

function osStartAnalysis(playerId) { const p=playerId?osPlayer(playerId):null;state.draft=blankDraft();if(p){state.draft.playerName=p.name;state.draft.sessionNumber=p.sessionsCompleted+1;state.draft.background=`${p.age} · ${p.track} · ${p.membership}`;state.draft.coachNotes=p.coachNotes;}state.step=1;OS.current="analysis-form";osSetNav("analysis-form");renderNew();osLocalizeLegacy();window.scrollTo(0,0); }
function osOpenReport(id) { state.activeId=id;OS.current="report";osSetNav("report");renderReport();osLocalizeLegacy();window.scrollTo(0,0); }

OS.legacyMap={
  "New player analysis":"آنالیز جدید بازیکن","Player profile":"پروفایل بازیکن","Identity & context":"هویت و زمینه","Evidence":"شواهد","Video & match data":"ویدیو و داده مسابقه","Scoring":"امتیازدهی","Observable evidence":"شواهد قابل مشاهده","Review":"بازبینی","Judgment & priorities":"قضاوت و اولویت‌ها","Player name":"نام بازیکن","Session number":"شماره جلسه","Analysis type":"نوع آنالیز","Player background":"پیشینه بازیکن","Coach notes":"یادداشت مربی","Continue →":"ادامه ←","← Back":"بازگشت →","Evidence intake":"دریافت شواهد","Upload match or training video":"بارگذاری ویدیوی مسابقه یا تمرین","Evidence coverage":"پوشش شواهد","Footage context":"زمینه ویدیو","Optional match statistics":"آمار اختیاری مسابقه","Evidence scoring":"امتیازدهی شواهد","Core rubric":"روبریک اصلی","Performance KPIs":"شاخص‌های عملکرد","Padel-specific & tactical":"پدل‌محور و تاکتیکی","Overall performance":"عملکرد کلی","Review & generate":"بازبینی و تولید","Generate ProTrack report":"تولید گزارش ProTrack","Overall assessment score":"امتیاز ارزیابی کلی","Track classification":"طبقه‌بندی مسیر","Final coach summary":"جمع‌بندی نهایی مربی","Required":"ضروری","Training Analysis":"آنالیز تمرین","Match Analysis":"آنالیز مسابقه","Assessment Session":"جلسه ارزیابی","Video Analysis":"آنالیز ویدیو","Required identity and session context. Missing inputs are never guessed.":"هویت و زمینه جلسه را ثبت کنید؛ داده‌های ناقص هرگز حدس زده نمی‌شوند.","Enter only visible or supported scores. Leave unavailable areas blank; the report will state “Insufficient Data.”":"فقط امتیازهای قابل مشاهده یا مستند را وارد کنید؛ موارد ناموجود به‌عنوان «داده ناکافی» ثبت می‌شوند.","Dashboard Database Output":"خروجی پایگاه داده داشبورد","QA Validation Summary":"خلاصه اعتبارسنجی QA","Rubric Engine Report":"گزارش موتور روبریک","Performance KPI Dashboard":"داشبورد KPI عملکرد","Padel-Specific Analysis":"آنالیز اختصاصی پدل","Decision Making Analysis":"آنالیز تصمیم‌گیری","Error Analysis":"آنالیز خطا","Match KPI Dashboard":"داشبورد KPI مسابقه","PDI Dashboard":"داشبورد PDI","PTI Dashboard":"داشبورد PTI","Assessment Dashboard":"داشبورد ارزیابی","Player Journey":"مسیر بازیکن","Progress Dashboard":"داشبورد پیشرفت","Results Generator":"تولیدکننده نتایج","Training Priority Matrix":"ماتریس اولویت تمرین","Development Plan":"برنامه رشد","Final Coach Report":"گزارش نهایی مربی","Copy database JSON":"کپی JSON داشبورد","DOCX":"DOCX","PDF":"PDF","← All analyses":"همه آنالیزها →","PROTRACK FINAL ASSESSMENT":"ارزیابی نهایی PROTRACK","Promotion Status":"وضعیت ارتقا","Primary Development Focus":"تمرکز اصلی رشد","Confidence Level":"سطح اطمینان"
};
function osLocalizeLegacy() {
  if(OS.lang!=="fa")return; const root=document.getElementById("view");const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{const raw=n.nodeValue,trim=raw.trim(),mapped=OS.legacyMap[trim];if(mapped)n.nodeValue=raw.replace(trim,mapped);});document.documentElement.dir="rtl";
}

function osSetLanguage() { OS.lang=OS.lang==="en"?"fa":"en";localStorage.setItem("protrack-os-lang",OS.lang);if(["analysis-form","report"].includes(OS.current)){if(OS.current==="analysis-form")renderNew();else renderReport();osLocalizeLegacy();}else osRender(OS.current); }
function osBackup() { const payload={version:"ProTrack OS v1.0",exportedAt:new Date().toISOString(),management:OS.data,analyses:state.analyses};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`ProTrack_Backup_${osDateOffset(0)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(osT("backup_created")); }
function osRestoreBackup(event) { const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result);if(!payload.management||!Array.isArray(payload.management.players))throw new Error();OS.data=payload.management;if(Array.isArray(payload.analyses)){state.analyses=payload.analyses;saveAnalyses();}osSave();toast(osT("backup_restored"));osRender("home");}catch(_){toast(OS.lang==="fa"?"فایل پشتیبان معتبر نیست.":"Invalid backup file.");}};reader.readAsText(file); }
async function osInstall() { if(OS.installPrompt){OS.installPrompt.prompt();await OS.installPrompt.userChoice;OS.installPrompt=null;}else toast(osT("install_ios")); }

document.addEventListener("click",event=>{
  const el=event.target.closest("[data-os-view],[data-os-action]");if(!el)return;
  if(el.dataset.osView){event.preventDefault();osRender(el.dataset.osView);return;}
  const action=el.dataset.osAction;
  if(action==="language")osSetLanguage();
  if(action==="account")osOpenAccount();
  if(action==="close-modal")osCloseModal();
  if(action==="quick-note")osOpenQuickNote(el.dataset.id||"");
  if(action==="add-player")osOpenAddPlayer();
  if(action==="open-player"){OS.profileId=el.dataset.id;OS.profileTab="overview";osRender("player");}
  if(action==="profile-tab"){OS.profileTab=el.dataset.tab;osRender("player");}
  if(action==="filter-player"){OS.playerFilter=el.dataset.filter;osRender("players");}
  if(action==="start-analysis")osStartAnalysis(el.dataset.player||"");
  if(action==="open-report")osOpenReport(el.dataset.id);
  if(action==="select-role"){const form=el.closest("form");form.querySelectorAll(".os-role-option").forEach(b=>b.classList.remove("active"));el.classList.add("active");form.querySelector('input[name="role"]').value=el.dataset.role;}
  if(action==="backup")osBackup();
  if(action==="restore")document.getElementById("osRestoreInput")?.click();
  if(action==="install")osInstall();
  if(action==="logout"){OS.user.loggedIn=false;osSave();osOpenLogin();}
});

window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();OS.installPrompt=event;});
window.addEventListener("online",()=>document.body.classList.remove("is-offline"));
window.addEventListener("offline",()=>{document.body.classList.add("is-offline");toast(OS.lang==="fa"?"حالت آفلاین فعال شد.":"Offline mode active.");});
if("serviceWorker" in navigator&&location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});

setTimeout(()=>document.getElementById("splash")?.classList.add("hide"),650);
osRender(OS.current);
