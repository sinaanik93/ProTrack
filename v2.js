/* ProTrack OS v2.0 product layer. The locked AI Analyst and promotion engine remain unchanged. */
var PT2 = {
  version: "2.0.0",
  authReady: false,
  original: {
    render: osRender,
    home: osRenderHome,
    player: osRenderPlayer,
    profile: osProfileTabContent,
    analysis: osRenderAnalysis,
    settings: osRenderSettings,
    visiblePlayers: osVisiblePlayers,
    openReport: osOpenReport,
    startAnalysis: osStartAnalysis
  }
};

function pt2Fa(en, fa) { return OS.lang === "fa" ? fa : en; }
function pt2Date(value) { return value ? osDisplayDate(value) : "—"; }
function pt2Id(prefix) { return `${prefix}${Date.now()}${Math.floor(Math.random()*100)}`; }
function pt2Save() { OS.data.v2 = true; osSave(); }
function pt2Coach(id) { return OS.data.coaches.find(x => x.id === id); }
function pt2PlayerName(id) { return osPlayer(id)?.name || "—"; }
function pt2CanManage() { return OS.user.role === "head"; }
function pt2CanCoach() { return OS.user.role === "head" || OS.user.role === "assistant"; }

function pt2Migrate() {
  const d = OS.data;
  d.academy ||= {name:"ProTrack Private Coaching",location:"Tehran · International Academy",phone:"+98 21 0000 0000",email:"academy@protrack.local",founded:"2024",certifications:["ProTrack AI Analyst v2.0","Pro v7.1 Production Methodology"]};
  d.coaches ||= [
    {id:"c1",name:"Yekta",title:"Head Coach",phone:"+98 912 000 0001",specialty:"Performance & academy direction",certifications:["ProTrack Head Coach"],active:true},
    {id:"c2",name:"Sara Ahmadi",title:"Assistant Coach",phone:"+98 912 000 0002",specialty:"Foundation & tactical development",certifications:["ProTrack Assistant Coach"],active:true}
  ];
  d.players.forEach((p,i)=>{p.coachId ||= p.coach?.toLowerCase().includes("sara") ? "c2" : "c1";p.nationality ||= i%2?"Iranian":"International";p.dominantHand ||= i%2?"Left":"Right";p.playingSide ||= i%3?"Right":"Left";p.goals ||= p.primaryFocus;});
  d.registrations ||= [
    {id:"r1",name:"Kian Rahimi",phone:"+98 912 755 2100",source:"Instagram",goal:"Competition preparation",status:"Assessment",created:osDateOffset(-3)},
    {id:"r2",name:"Diana Khosravi",phone:"+98 912 412 6650",source:"Referral",goal:"Technical foundation",status:"New",created:osDateOffset(-1)}
  ];
  d.bookings ||= [{id:"b1",playerId:"p4",date:osDateOffset(2),time:"17:30",type:"Progress assessment",coachId:"c2",status:"Confirmed"}];
  d.programs ||= [
    {id:"pg1",name:"Competition Readiness 8",level:"Development",sessions:8,focus:"Decision making under pressure",playerIds:["p1","p3"],active:true},
    {id:"pg2",name:"Foundation Control 6",level:"Foundation",sessions:6,focus:"Positioning and wall play",playerIds:["p2","p4"],active:true}
  ];
  d.tournaments ||= [{id:"t1",name:"Tehran Padel Open",date:osDateOffset(28),location:"Tehran",status:"Registered",playerIds:["p1","p3"]}];
  d.rankings ||= [{id:"rk1",playerId:"p1",event:"Academy ladder",position:2,points:860,date:osDateOffset(-7)},{id:"rk2",playerId:"p3",event:"Academy ladder",position:4,points:740,date:osDateOffset(-7)}];
  d.achievements ||= [{id:"a1",playerId:"p2",title:"Most Improved",detail:"Foundation block · +0.9 PTI",date:osDateOffset(-10)},{id:"a2",playerId:"p1",title:"12-session streak",detail:"Consistent training attendance",date:osDateOffset(-4)}];
  d.journey ||= d.players.flatMap(p=>[{id:pt2Id("j"),playerId:p.id,date:p.startDate,title:"Joined ProTrack",detail:`Started ${p.track} pathway`,type:"milestone"}]);
  d.stories ||= [{id:"st1",playerId:"p2",title:"From hesitation to control",summary:"A focused development block improved confidence, wall play and match readiness.",published:true,date:osDateOffset(-5)}];
  d.archivedPlayers ||= [];
  pt2Save();
}

OS.version = "2.0";
pt2Migrate();

osVisiblePlayers = function() {
  const active = OS.data.players.filter(p => !p.archived);
  if (OS.user.role === "player") return active.filter(p => p.id === OS.user.playerId);
  if (OS.user.role === "assistant") return active.filter(p => p.coachId === OS.user.coachId);
  return active;
};

function pt2Allowed(view) {
  const common = ["home","players","player","analysis","promotions","settings","report"];
  if (OS.user.role === "head") return true;
  if (OS.user.role === "assistant") return [...common,"bookings","programs","competitions","leaderboards"].includes(view);
  return ["home","players","player","analysis","programs","competitions","leaderboards","settings","report"].includes(view);
}

function pt2Ops() {
  const head = [
    ["academy","⌂",pt2Fa("Academy profile","پروفایل آکادمی"),pt2Fa("Identity & certifications","هویت و گواهی‌ها")],
    ["coaches","♙",pt2Fa("Coaches","مربیان"),pt2Fa("Profiles & assignments","پروفایل و تخصیص")],
    ["registrations","↳",pt2Fa("Registrations","ثبت‌نام‌ها"),pt2Fa("Lead-to-player pipeline","مسیر متقاضی تا بازیکن")],
    ["bookings","◷",pt2Fa("Assessments","ارزیابی‌ها"),pt2Fa("Bookings & status","رزرو و وضعیت")],
    ["programs","▤",pt2Fa("Programs","برنامه‌ها"),pt2Fa("Packages & assignments","پکیج و تخصیص")],
    ["competitions","♢",pt2Fa("Competition hub","مرکز مسابقات"),pt2Fa("Events, rankings & awards","رویداد، رتبه و افتخار")],
    ["leaderboards","↗",pt2Fa("Leaderboards","جدول برترین‌ها"),pt2Fa("Progress & consistency","پیشرفت و استمرار")],
    ["stories","✦",pt2Fa("Stories","داستان‌های تحول"),pt2Fa("Player transformation","تحول بازیکنان")]
  ];
  const allowed = head.filter(x=>pt2Allowed(x[0]));
  return `<section class="os-section pt2-operations"><div class="os-section-head"><div><h2>${pt2Fa("Academy operations","عملیات آکادمی")}</h2><p>${pt2Fa("The whole academy, one operating view","نمای یکپارچه مدیریت آکادمی")}</p></div></div><div class="pt2-module-grid">${allowed.map(([view,icon,title,sub])=>`<button class="pt2-module os-card" data-os-view="${view}"><span>${icon}</span><strong>${title}</strong><small>${sub}</small><i>›</i></button>`).join("")}</div></section>`;
}

osRenderHome = function(root) {
  if (OS.user.role === "player") {
    const p=osVisiblePlayers()[0];if(!p){const archived=OS.data.archivedPlayers?.some(x=>x.id===OS.user.playerId);root.innerHTML=`<div class="os-card pt2-empty">${archived?pt2Fa("Your player profile is archived. Contact the academy to restore access.","پروفایل بازیکن شما بایگانی شده است؛ برای بازیابی دسترسی با آکادمی تماس بگیرید."):pt2Fa("No player profile is linked to this account. Contact the academy administrator.","پروفایل بازیکنی به این حساب متصل نیست؛ با مدیر آکادمی تماس بگیرید.")}</div>`;return;}
    const next=OS.data.sessions.filter(x=>x.playerId===p.id&&x.date>=osDateOffset(0)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0],promo=osPromotion(p),awards=OS.data.achievements.filter(x=>x.playerId===p.id),programs=OS.data.programs.filter(x=>x.playerIds.includes(p.id));
    root.innerHTML=`${osPageHead(pt2Fa("MY PROTRACK","پروترک من"),pt2Fa(`Welcome, ${p.name.split(" ")[0]}`,`خوش آمدی، ${p.name.split(" ")[0]}`),pt2Fa("Your performance, journey and next focus in one place.","عملکرد، مسیر و تمرکز بعدی تو در یک نگاه."))}<div class="os-kpi-scroll">${osKpi("PDI",osScore(p.pdi),p.pdiHistory.length?pt2Fa("Development trend","روند رشد"):"—")}${osKpi("PTI",osScore(p.pti),p.primaryFocus,"#20d39a","rgba(32,211,154,.12)")}${osKpi(pt2Fa("Promotion","ارتقا"),osT(promo.status==="Ready"?"ready":promo.status==="Monitor"?"monitor":"not_ready"),promo.target)}${osKpi(pt2Fa("Attendance","حضور"),`${Math.round(p.attendance.attended/(p.attendance.attended+p.attendance.missed)*100)}%`,`${p.attendance.attended} ${pt2Fa("sessions","جلسه")}`)}</div><div class="pt2-two"><section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${pt2Fa("Next session","جلسه بعدی")}</h2><p>${pt2Fa("Arrive ready for the next development step","برای قدم بعدی رشد آماده باش")}</p></div></div>${next?`<div class="pt2-row"><span><strong>${osEsc(next.type)} · ${next.time}</strong><small>${pt2Date(next.date)} · ${osEsc(next.notes)}</small></span></div>`:`<p class="pt2-empty">${pt2Fa("No upcoming session scheduled.","جلسه‌ای در آینده ثبت نشده است.")}</p>`}<div class="os-detail"><small>${osT("primary_focus")}</small><strong>${osEsc(p.primaryFocus)}</strong></div></section><section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${pt2Fa("My momentum","روند من")}</h2><p>${pt2Fa("Programs and achievements","برنامه‌ها و افتخارات")}</p></div></div><div class="pt2-awards">${awards.slice(0,2).map(x=>`<article><span>✦</span><div><strong>${osEsc(x.title)}</strong><small>${osEsc(x.detail)}</small></div></article>`).join("")}${programs.map(x=>`<article><span>▤</span><div><strong>${osEsc(x.name)}</strong><small>${osEsc(x.focus)}</small></div></article>`).join("")}</div><button class="os-primary-button" data-os-action="open-player" data-id="${p.id}">${pt2Fa("Open my player passport","باز کردن پاسپورت بازیکن")}</button></section></div>`;
    return;
  }
  PT2.original.home(root);
  root.querySelector(".os-demo-label")?.remove();
  const pageHead = root.querySelector(".os-page-head");
  pageHead?.insertAdjacentHTML("afterend", pt2Ops());
  root.querySelectorAll(".os-section-head h2").forEach(h=>{
    if(h.textContent.trim()==="Players needing attention") h.style.color="#f4f8ff";
    if(h.textContent.trim()==="Your next best actions") h.style.color="#c8d4e8";
  });
};

osProfileTabContent = function(p,promo,rate,remaining,analyses) {
  if (OS.profileTab === "passport") return `<section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${pt2Fa("Player passport","پاسپورت بازیکن")}</h2><p>${pt2Fa("Personal, sporting and playing identity","هویت فردی، ورزشی و بازی")}</p></div></div><div class="os-detail-grid">${[[pt2Fa("Full name","نام کامل"),p.name],[pt2Fa("Nationality","ملیت"),p.nationality],[pt2Fa("Dominant hand","دست غالب"),p.dominantHand],[pt2Fa("Playing side","سمت بازی"),p.playingSide],[pt2Fa("Development goal","هدف رشد"),p.goals],[pt2Fa("Assigned coach","مربی مسئول"),pt2Coach(p.coachId)?.name||p.coach]].map(([k,v])=>`<div class="os-detail"><small>${osEsc(k)}</small><strong>${osEsc(v||"—")}</strong></div>`).join("")}</div></section>`;
  if (OS.profileTab === "competition") { const ranks=OS.data.rankings.filter(x=>x.playerId===p.id), events=OS.data.tournaments.filter(x=>x.playerIds.includes(p.id));return `<section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${pt2Fa("Competition record","سابقه مسابقات")}</h2></div></div>${events.map(x=>`<div class="pt2-row"><span><strong>${osEsc(x.name)}</strong><small>${pt2Date(x.date)} · ${osEsc(x.location)}</small></span>${osStatus(x.status)}</div>`).join("")||`<p class="pt2-empty">${pt2Fa("No tournament record yet.","هنوز سابقه مسابقه ثبت نشده است.")}</p>`}${ranks.map(x=>`<div class="pt2-row"><span><strong>#${x.position} · ${osEsc(x.event)}</strong><small>${x.points} ${pt2Fa("points","امتیاز")}</small></span></div>`).join("")}</section>`; }
  if (OS.profileTab === "achievements") { const items=OS.data.achievements.filter(x=>x.playerId===p.id);return `<section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${pt2Fa("Achievements","افتخارات")}</h2></div></div><div class="pt2-awards">${items.map(x=>`<article><span>✦</span><div><strong>${osEsc(x.title)}</strong><small>${osEsc(x.detail)} · ${pt2Date(x.date)}</small></div></article>`).join("")||`<p class="pt2-empty">${pt2Fa("The next milestone starts here.","نقطه عطف بعدی از همین‌جا شروع می‌شود.")}</p>`}</div></section>`; }
  if (OS.profileTab === "journey") { const items=OS.data.journey.filter(x=>x.playerId===p.id).sort((a,b)=>b.date.localeCompare(a.date));return `<section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${pt2Fa("Player journey","مسیر بازیکن")}</h2></div></div><div class="pt2-journey">${items.map(x=>`<article><i></i><div><small>${pt2Date(x.date)}</small><strong>${osEsc(x.title)}</strong><p>${osEsc(x.detail)}</p></div></article>`).join("")}</div></section>`; }
  if (OS.profileTab === "overview" && !pt2CanManage()) return `<div class="os-profile-layout"><section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${osT("player_profile")}</h2></div></div><div class="os-detail-grid">${[["contact",p.phone],["start_date",pt2Date(p.startDate)],["stage",p.stage],["coach",pt2Coach(p.coachId)?.name||p.coach],["membership",p.membership],["primary_focus",p.primaryFocus]].map(([k,v])=>`<div class="os-detail"><small>${osT(k)}</small><strong>${osEsc(v)}</strong></div>`).join("")}</div></section><section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${osT("promotion_reason")}</h2></div>${osStatus(promo.status)}</div><div class="os-promotion-reason">${osEsc(promo.reason)}</div></section></div>`;
  return PT2.original.profile(p,promo,rate,remaining,analyses);
};

osRenderPlayer = function(root) {
  PT2.original.player(root);
  const tabs = root.querySelector(".os-profile-tabs");
  if (tabs) tabs.innerHTML = [["overview",osT("overview")],["passport",pt2Fa("Passport","پاسپورت")],["history",osT("history")],["attendance",osT("attendance")],["competition",pt2Fa("Competition","مسابقات")],["achievements",pt2Fa("Awards","افتخارات")],["journey",pt2Fa("Journey","مسیر")],["package",osT("package")]].map(([id,label])=>`<button class="os-profile-tab ${OS.profileTab===id?"active":""}" data-os-action="profile-tab" data-tab="${id}">${label}</button>`).join("");
  if (pt2CanManage()) root.insertAdjacentHTML("beforeend",`<div class="pt2-danger-zone"><button class="os-secondary-button" data-os-action="v2-edit-player" data-id="${OS.profileId}">${pt2Fa("Edit passport","ویرایش پاسپورت")}</button><button class="pt2-danger" data-os-action="v2-archive-player" data-id="${OS.profileId}">${pt2Fa("Archive player","بایگانی بازیکن")}</button></div>`);
  if (OS.user.role === "player") root.querySelectorAll('[data-os-action="quick-note"],[data-os-action="start-analysis"]').forEach(x=>x.remove());
};

osRenderAnalysis = function(root) {
  if (OS.user.role === "head") { PT2.original.analysis(root); return; }
  const visibleNames=new Set(osVisiblePlayers().map(p=>p.name.toLowerCase())), reports=state.analyses.filter(a=>visibleNames.has(a.playerName.toLowerCase())).sort((a,b)=>new Date(b.date)-new Date(a.date));
  root.innerHTML=`${osPageHead("PROTRACK v2.0",OS.user.role==="player"?pt2Fa("My analysis reports","گزارش‌های آنالیز من"):pt2Fa("Assigned player reports","گزارش بازیکنان من"),pt2Fa("Role-scoped performance reports","گزارش‌های عملکرد متناسب با سطح دسترسی"))}${OS.user.role==="assistant"?`<section class="os-card os-analysis-hero"><div class="os-analysis-icon">◇</div><h2>${osT("start_analysis")}</h2><p>${pt2Fa("Analyze an assigned player using the locked v2.0 methodology.","بازیکن تخصیص‌یافته را با متدولوژی قفل‌شده v2.0 آنالیز کنید.")}</p><button class="os-primary-button" data-os-action="start-analysis">${osT("start_analysis")}</button></section>`:""}<div class="os-player-list">${reports.map(a=>`<article class="os-card os-player-row" data-os-action="open-report" data-id="${a.id}"><span class="os-avatar">${osInitials(a.playerName)}</span><div><h3>${osEsc(a.playerName)} · ${osEsc(a.analysisType)}</h3><p>${pt2Fa("Session","جلسه")} ${a.sessionNumber} · ${friendlyDate(a.date)}</p></div><span class="os-chevron">›</span></article>`).join("")||`<div class="os-card pt2-empty">${pt2Fa("No published reports yet.","هنوز گزارشی منتشر نشده است.")}</div>`}</div>`;
};

osOpenReport = function(id) {
  const a=state.analyses.find(x=>x.id===id),allowed=new Set(osVisiblePlayers().map(p=>p.name.toLowerCase()));
  if(!a || (OS.user.role!=="head"&&!allowed.has(a.playerName.toLowerCase()))){toast(pt2Fa("You do not have access to this report.","شما به این گزارش دسترسی ندارید."));return;}
  PT2.original.openReport(id);
};
osStartAnalysis = function(playerId) {
  if(!pt2CanCoach()){toast(pt2Fa("Only coaches can start an analysis.","فقط مربیان می‌توانند آنالیز جدید شروع کنند."));return;}
  if(playerId&&!osVisiblePlayers().some(p=>p.id===playerId)){toast(pt2Fa("This player is outside your assignment.","این بازیکن در فهرست تخصیص شما نیست."));return;}
  PT2.original.startAnalysis(playerId);
};

function pt2RenderAcademy(root) {
  const a=OS.data.academy;
  root.innerHTML=`${osPageHead("PROTRACK ORGANIZATION",pt2Fa("Academy profile","پروفایل آکادمی"),pt2Fa("Official academy identity and certifications","هویت رسمی و گواهی‌های آکادمی"))}<div class="pt2-two"><section class="os-card pt2-brand-card"><div class="os-login-logo"><img src="assets/protrack-official.png" alt="ProTrack"></div><h2>${osEsc(a.name)}</h2><p>${osEsc(a.location)}</p><div class="os-detail-grid">${[[pt2Fa("Phone","تلفن"),a.phone],[pt2Fa("Email","ایمیل"),a.email],[pt2Fa("Founded","تأسیس"),a.founded]].map(([k,v])=>`<div class="os-detail"><small>${k}</small><strong>${osEsc(v)}</strong></div>`).join("")}</div></section><section class="os-card os-detail-card"><div class="os-section-head"><div><h2>${pt2Fa("Certifications","گواهی‌ها")}</h2><p>${pt2Fa("Methodology and production status","وضعیت متدولوژی و تولید")}</p></div></div><div class="pt2-awards">${a.certifications.map(x=>`<article><span>✓</span><div><strong>${osEsc(x)}</strong><small>${pt2Fa("Active · verified","فعال · تأییدشده")}</small></div></article>`).join("")}</div>${pt2CanManage()?`<button class="os-primary-button" data-os-action="v2-edit-academy">${pt2Fa("Edit academy profile","ویرایش پروفایل آکادمی")}</button>`:""}</section></div>`;
}

function pt2RenderCoaches(root) {
  root.innerHTML=`${osPageHead("TEAM",pt2Fa("Coach profiles","پروفایل مربیان"),pt2Fa("Roles, specialties and player assignments","نقش، تخصص و بازیکنان تخصیص‌یافته"),pt2CanManage()?`<button class="pt2-head-action" data-os-action="v2-add-coach">＋ ${pt2Fa("Add coach","افزودن مربی")}</button>`:"")}<div class="pt2-card-grid">${OS.data.coaches.map(c=>{const count=OS.data.players.filter(p=>p.coachId===c.id&&!p.archived).length;return `<article class="os-card pt2-person"><span class="os-avatar">${osInitials(c.name)}</span><div><h2>${osEsc(c.name)}</h2><p>${osEsc(c.title)} · ${osEsc(c.specialty)}</p><div class="pt2-pills"><span>${count} ${pt2Fa("players","بازیکن")}</span><span>${c.active?pt2Fa("Active","فعال"):pt2Fa("Inactive","غیرفعال")}</span></div></div></article>`}).join("")}</div>`;
}

function pt2RenderRegistrations(root) {
  const stages=["New","Contacted","Assessment","Enrolled"];
  root.innerHTML=`${osPageHead("PIPELINE",pt2Fa("Registration pipeline","مسیر ثبت‌نام"),pt2Fa("From first contact to active player","از اولین تماس تا بازیکن فعال"),`<button class="pt2-head-action" data-os-action="v2-add-registration">＋ ${pt2Fa("New lead","متقاضی جدید")}</button>`)}<div class="pt2-board">${stages.map(stage=>`<section><header><strong>${pt2Fa(stage,{New:"جدید",Contacted:"تماس‌گرفته",Assessment:"ارزیابی",Enrolled:"ثبت‌نام‌شده"}[stage])}</strong><span>${OS.data.registrations.filter(x=>x.status===stage).length}</span></header>${OS.data.registrations.filter(x=>x.status===stage).map(x=>`<article class="os-card"><h3>${osEsc(x.name)}</h3><p>${osEsc(x.goal)}</p><small>${osEsc(x.phone)} · ${osEsc(x.source)}</small><div class="pt2-inline-actions">${stage!=="Enrolled"?`<button data-os-action="v2-advance-registration" data-id="${x.id}">${pt2Fa("Advance","مرحله بعد")}</button>`:""}${stage==="Assessment"?`<button data-os-action="v2-enroll-registration" data-id="${x.id}">${pt2Fa("Create player","ساخت بازیکن")}</button>`:""}</div></article>`).join("")}</section>`).join("")}</div>`;
}

function pt2RenderBookings(root) {
  const items=OS.data.bookings.slice().sort((a,b)=>a.date.localeCompare(b.date));
  root.innerHTML=`${osPageHead("ASSESSMENTS",pt2Fa("Assessment bookings","رزرو ارزیابی"),pt2Fa("Schedule, ownership and completion status","زمان‌بندی، مسئول و وضعیت تکمیل"),pt2CanCoach()?`<button class="pt2-head-action" data-os-action="v2-add-booking">＋ ${pt2Fa("Schedule","رزرو")}</button>`:"")}<div class="pt2-table os-card"><div class="pt2-table-head"><span>${pt2Fa("Player","بازیکن")}</span><span>${pt2Fa("Date","تاریخ")}</span><span>${pt2Fa("Coach","مربی")}</span><span>${pt2Fa("Status","وضعیت")}</span></div>${items.map(x=>`<div class="pt2-table-row"><span><strong>${osEsc(pt2PlayerName(x.playerId))}</strong><small>${osEsc(x.type)}</small></span><span>${pt2Date(x.date)} · ${x.time}</span><span>${osEsc(pt2Coach(x.coachId)?.name||"—")}</span><span>${osStatus(x.status)}</span></div>`).join("")}</div>`;
}

function pt2RenderPrograms(root) {
  const visible=OS.data.programs.filter(pg=>OS.user.role!=="player"||pg.playerIds.includes(OS.user.playerId));
  root.innerHTML=`${osPageHead("DEVELOPMENT",pt2Fa("Programs & packages","برنامه‌ها و پکیج‌ها"),pt2Fa("Structured development blocks and assignments","بلوک‌های رشد ساختاریافته و تخصیص‌ها"),pt2CanManage()?`<button class="pt2-head-action" data-os-action="v2-add-program">＋ ${pt2Fa("New program","برنامه جدید")}</button>`:"")}<div class="pt2-card-grid">${visible.map(x=>`<article class="os-card pt2-program"><span class="eyebrow">${osEsc(x.level)} · ${x.sessions} ${pt2Fa("sessions","جلسه")}</span><h2>${osEsc(x.name)}</h2><p>${osEsc(x.focus)}</p><div class="pt2-avatars">${x.playerIds.map(id=>`<span title="${osEsc(pt2PlayerName(id))}">${osInitials(pt2PlayerName(id))}</span>`).join("")}<small>${x.playerIds.length} ${pt2Fa("assigned","تخصیص‌یافته")}</small></div></article>`).join("")}</div>`;
}

function pt2RenderCompetitions(root) {
  root.innerHTML=`${osPageHead("COMPETITION",pt2Fa("Competition hub","مرکز مسابقات"),pt2Fa("Tournaments, rankings and achievements","مسابقات، رتبه‌بندی و افتخارات"),pt2CanManage()?`<button class="pt2-head-action" data-os-action="v2-add-competition">＋ ${pt2Fa("Add record","ثبت رکورد")}</button>`:"")}<div class="pt2-three"><section class="os-card os-detail-card"><div class="os-section-head"><h2>${pt2Fa("Tournaments","مسابقات")}</h2></div>${OS.data.tournaments.map(x=>`<div class="pt2-row"><span><strong>${osEsc(x.name)}</strong><small>${pt2Date(x.date)} · ${osEsc(x.location)}</small></span>${osStatus(x.status)}</div>`).join("")}</section><section class="os-card os-detail-card"><div class="os-section-head"><h2>${pt2Fa("Rankings","رتبه‌بندی")}</h2></div>${OS.data.rankings.sort((a,b)=>a.position-b.position).map(x=>`<div class="pt2-row"><b>#${x.position}</b><span><strong>${osEsc(pt2PlayerName(x.playerId))}</strong><small>${x.points} ${pt2Fa("points","امتیاز")}</small></span></div>`).join("")}</section><section class="os-card os-detail-card"><div class="os-section-head"><h2>${pt2Fa("Achievements","افتخارات")}</h2></div><div class="pt2-awards">${OS.data.achievements.map(x=>`<article><span>✦</span><div><strong>${osEsc(x.title)}</strong><small>${osEsc(pt2PlayerName(x.playerId))} · ${osEsc(x.detail)}</small></div></article>`).join("")}</div></section></div>`;
}

function pt2RenderLeaderboards(root) {
  const players=osVisiblePlayers();
  const gain=p=>(p.ptiHistory?.length>1?p.ptiHistory.at(-1)-p.ptiHistory[0]:0);
  const boards=[
    [pt2Fa("Performance","عملکرد"),[...players].sort((a,b)=>b.pti-a.pti),p=>`PTI ${osScore(p.pti)}`],
    [pt2Fa("Most improved","بیشترین پیشرفت"),[...players].sort((a,b)=>gain(b)-gain(a)),p=>`${gain(p)>=0?"+":""}${gain(p).toFixed(1)} PTI`],
    [pt2Fa("Consistency","استمرار"),[...players].sort((a,b)=>(b.attendance.attended/(b.attendance.attended+b.attendance.missed))-(a.attendance.attended/(a.attendance.attended+a.attendance.missed))),p=>`${Math.round(p.attendance.attended/(p.attendance.attended+p.attendance.missed)*100)}%`]
  ];
  root.innerHTML=`${osPageHead("MOTIVATION",pt2Fa("Academy leaderboards","جدول برترین‌های آکادمی"),pt2Fa("Progress is celebrated; locked scores are never altered.","پیشرفت دیده می‌شود؛ امتیازهای قفل‌شده هرگز تغییر نمی‌کنند."))}<div class="pt2-three">${boards.map(([title,list,value])=>`<section class="os-card pt2-leader"><h2>${title}</h2>${list.slice(0,5).map((p,i)=>`<div><b>${i+1}</b><span class="os-avatar">${osInitials(p.name)}</span><span><strong>${osEsc(p.name)}</strong><small>${osEsc(p.primaryFocus)}</small></span><em>${value(p)}</em></div>`).join("")}</section>`).join("")}</div>`;
}

function pt2RenderStories(root) {
  root.innerHTML=`${osPageHead("PLAYER STORIES",pt2Fa("Transformation stories","داستان‌های تحول"),pt2Fa("Human progress behind the performance data","پیشرفت انسانی پشت داده‌های عملکرد"),pt2CanManage()?`<button class="pt2-head-action" data-os-action="v2-add-story">＋ ${pt2Fa("New story","داستان جدید")}</button>`:"")}<div class="pt2-card-grid">${OS.data.stories.map(x=>`<article class="os-card pt2-story"><span class="eyebrow">${pt2Date(x.date)} · ${osEsc(pt2PlayerName(x.playerId))}</span><h2>${osEsc(x.title)}</h2><p>${osEsc(x.summary)}</p><span class="os-status ${x.published?"active":"monitor"}">${x.published?pt2Fa("Published","منتشرشده"):pt2Fa("Draft","پیش‌نویس")}</span></article>`).join("")}</div>`;
}

function pt2RenderArchived(root) {
  root.innerHTML=`${osPageHead("RECORDS",pt2Fa("Archived players","بازیکنان بایگانی‌شده"),pt2Fa("Restore records or permanently remove them","بازیابی یا حذف دائمی رکوردها"))}<div class="os-player-list">${OS.data.archivedPlayers.map(p=>`<article class="os-card os-player-row"><span class="os-avatar">${osInitials(p.name)}</span><div><h3>${osEsc(p.name)}</h3><p>${osEsc(p.track)} · ${osEsc(p.phone)}</p></div><div class="pt2-inline-actions"><button data-os-action="v2-restore-player" data-id="${p.id}">${pt2Fa("Restore","بازیابی")}</button><button class="pt2-text-danger" data-os-action="v2-delete-player" data-id="${p.id}">${pt2Fa("Delete","حذف")}</button></div></article>`).join("")||`<div class="os-card pt2-empty">${pt2Fa("Archive is empty.","بایگانی خالی است.")}</div>`}</div>`;
}

osRenderSettings = function(root) {
  const secure=pt2Fa("Secure server session","نشست امن سرور");
  root.innerHTML=`${osPageHead("PROTRACK OS v2.0",osT("settings"),pt2Fa("Account, security, installation and academy-owned data","حساب، امنیت، نصب و داده‌های متعلق به آکادمی"))}<section class="os-card os-settings-group"><button class="os-setting" data-os-action="language"><span class="os-setting-icon">文</span><span><strong>${osT("language")}</strong><small>${osT("language_sub")}</small></span><span class="os-chevron">${OS.lang==="fa"?"EN":"FA"}</span></button><button class="os-setting" data-os-action="account"><span class="os-setting-icon">◎</span><span><strong>${pt2Fa("Account & security","حساب و امنیت")}</strong><small>${osEsc(OS.user.name)} · ${osRoleLabel()} · ${secure}</small></span><span class="os-chevron">›</span></button><button class="os-setting" data-os-action="install"><span class="os-setting-icon">⇩</span><span><strong>${osT("install")}</strong><small>${osT("install_sub")}</small></span><span class="os-chevron">›</span></button></section>${pt2CanManage()?`<section class="os-card os-settings-group"><button class="os-setting" data-os-view="archived"><span class="os-setting-icon">▱</span><span><strong>${pt2Fa("Archived players","بازیکنان بایگانی‌شده")}</strong><small>${OS.data.archivedPlayers.length} ${pt2Fa("records","رکورد")}</small></span><span class="os-chevron">›</span></button><button class="os-setting" data-os-action="backup"><span class="os-setting-icon">↧</span><span><strong>${osT("backup")}</strong><small>${osT("backup_sub")}</small></span><span class="os-chevron">›</span></button><button class="os-setting" data-os-action="restore"><span class="os-setting-icon">↥</span><span><strong>${osT("restore")}</strong><small>${osT("restore_sub")}</small></span><span class="os-chevron">›</span></button><input type="file" id="osRestoreInput" accept="application/json" hidden></section>`:""}<section class="os-card os-settings-group"><div class="os-setting"><span class="os-setting-icon">✓</span><span><strong>${osT("offline_ready")}</strong><small>${osT("offline_sub")}</small></span><span class="presence-dot"></span></div><div class="os-setting"><span class="os-setting-icon">▣</span><span><strong>${osT("methodology")}</strong><small>${osT("methodology_sub")}</small></span><span class="os-status active">LOCKED</span></div><button class="os-setting" data-os-action="logout"><span class="os-setting-icon">↪</span><span><strong>${osT("logout")}</strong><small>${secure}</small></span><span class="os-chevron">›</span></button></section><p class="os-version">ProTrack OS v2.0<br>AI Analyst v2.0 FINAL MASTER CLEAN<br>Your Game. Elevated.</p>`;
  document.getElementById("osRestoreInput")?.addEventListener("change",osRestoreBackup);
};

osRender = function(view=OS.current) {
  if (!PT2.authReady || !OS.user.loggedIn) { osOpenLogin(); return; }
  if (!pt2Allowed(view)) { toast(pt2Fa("You do not have access to that area.","شما به این بخش دسترسی ندارید.")); view="home"; }
  OS.current=view;osSetNav(view);const root=document.getElementById("view");
  const v2={academy:pt2RenderAcademy,coaches:pt2RenderCoaches,registrations:pt2RenderRegistrations,bookings:pt2RenderBookings,programs:pt2RenderPrograms,competitions:pt2RenderCompetitions,leaderboards:pt2RenderLeaderboards,stories:pt2RenderStories,archived:pt2RenderArchived};
  const legacy={home:osRenderHome,players:osRenderPlayers,player:osRenderPlayer,analysis:osRenderAnalysis,promotions:osRenderPromotions,settings:osRenderSettings};
  (v2[view]||legacy[view]||osRenderHome)(root);
  document.documentElement.lang=OS.lang==="fa"?"fa":"en";document.documentElement.dir=OS.lang==="fa"?"rtl":"ltr";
  document.getElementById("osRoleLabel").textContent=osRoleLabel();document.querySelector(".os-lang").textContent=OS.lang==="fa"?"EN":"FA";
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=osT(el.dataset.i18n));
  document.querySelector(".os-fab").hidden=OS.user.role==="player";
  const promoNav=document.querySelector('.os-nav[data-os-view="promotions"],.os-nav[data-os-view="programs"]');
  if(promoNav){promoNav.dataset.osView=OS.user.role==="player"?"programs":"promotions";promoNav.querySelector(".os-nav-icon").textContent=OS.user.role==="player"?"▤":"⇧";promoNav.querySelector("small").textContent=OS.user.role==="player"?pt2Fa("Programs","برنامه‌ها"):osT("nav_promotions");}
  const playersNav=document.querySelector('.os-nav[data-os-view="players"] small');if(playersNav)playersNav.textContent=OS.user.role==="player"?pt2Fa("Passport","پاسپورت"):osT("nav_players");
  root.focus({preventScroll:true});window.scrollTo({top:0,behavior:"smooth"});
};

osOpenLogin = function() {
  if (document.querySelector("#osLoginForm")) return;
  const body=`<div class="os-login-logo"><img src="assets/protrack-official.png" alt="ProTrack"></div><div class="os-login-title"><span class="eyebrow">PROTRACK OS v2.0</span><h1>${pt2Fa("Welcome back","خوش آمدید")}</h1><p>${pt2Fa("Sign in with your academy account.","با حساب آکادمی خود وارد شوید.")}</p></div><form class="os-form" id="osLoginForm"><div class="os-field"><label>${pt2Fa("Username","نام کاربری")}</label><input name="username" autocomplete="username" required></div><div class="os-field"><label>${pt2Fa("Password","رمز عبور")}</label><input name="password" type="password" autocomplete="current-password" required></div><p class="pt2-form-error" id="pt2LoginError" role="alert"></p><button class="os-primary-button" type="submit">${pt2Fa("Sign in","ورود")}</button><p class="os-version">${pt2Fa("Protected role-based access · 8-hour session","دسترسی محافظت‌شده بر اساس نقش · نشست ۸ ساعته")}</p></form>`;
  osOpenModal(osModalFrame("","",body,"os-login-card"),"open");
  document.getElementById("osLoginForm").addEventListener("submit",async e=>{e.preventDefault();const btn=e.target.querySelector("button");btn.disabled=true;const fd=new FormData(e.target);try{const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:fd.get("username"),password:fd.get("password")})});const out=await res.json();if(!res.ok)throw new Error(out.message);OS.user={...out.user,loggedIn:true};osSave();PT2.authReady=true;osCloseModal();osRender("home");}catch(_){document.getElementById("pt2LoginError").textContent=pt2Fa("The username or password is incorrect.","نام کاربری یا رمز عبور نادرست است.");btn.disabled=false;}});
};

osOpenAccount = function() {
  const body=`<div class="pt2-account"><div class="os-avatar">${osInitials(OS.user.name)}</div><div><h3>${osEsc(OS.user.name)}</h3><p>${osRoleLabel()} · @${osEsc(OS.user.username)}</p></div></div><form class="os-form" id="pt2PasswordForm"><h3>${pt2Fa("Change password","تغییر رمز عبور")}</h3><div class="os-field"><label>${pt2Fa("Current password","رمز فعلی")}</label><input type="password" name="old" required></div><div class="os-field"><label>${pt2Fa("New password (10+ characters)","رمز جدید (حداقل ۱۰ کاراکتر)")}</label><input type="password" name="next" minlength="10" required></div><p class="pt2-form-error" id="pt2PasswordError"></p><button class="os-primary-button">${pt2Fa("Update password","به‌روزرسانی رمز")}</button></form>`;
  osOpenModal(osModalFrame(pt2Fa("Account & security","حساب و امنیت"),pt2Fa("Your role is assigned by the academy.","نقش شما توسط آکادمی تعیین می‌شود."),body));
  document.getElementById("pt2PasswordForm").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.target),res=await fetch("/api/auth/password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({oldPassword:fd.get("old"),newPassword:fd.get("next")})});if(res.ok){toast(pt2Fa("Password updated.","رمز عبور به‌روزرسانی شد."));osCloseModal();}else document.getElementById("pt2PasswordError").textContent=pt2Fa("Check your current password and requirements.","رمز فعلی و شرایط رمز جدید را بررسی کنید.");});
};

function pt2OpenForm(kind,id="") {
  const players=OS.data.players.filter(p=>!p.archived), coaches=OS.data.coaches.filter(c=>c.active);
  const configs={
    coach:{title:pt2Fa("Add coach","افزودن مربی"),fields:`<div class="os-field"><label>${pt2Fa("Full name","نام کامل")}</label><input name="name" required></div><div class="os-field"><label>${pt2Fa("Title","سمت")}</label><input name="title" required></div><div class="os-field"><label>${pt2Fa("Specialty","تخصص")}</label><input name="specialty" required></div><div class="os-field"><label>${pt2Fa("Phone","تلفن")}</label><input name="phone"></div>`},
    registration:{title:pt2Fa("New registration lead","متقاضی جدید"),fields:`<div class="os-field"><label>${pt2Fa("Full name","نام کامل")}</label><input name="name" required></div><div class="os-field"><label>${pt2Fa("Phone","تلفن")}</label><input name="phone" required></div><div class="os-field"><label>${pt2Fa("Source","منبع آشنایی")}</label><input name="source"></div><div class="os-field"><label>${pt2Fa("Goal","هدف")}</label><textarea name="goal" required></textarea></div>`},
    booking:{title:pt2Fa("Schedule assessment","رزرو ارزیابی"),fields:`<div class="os-field"><label>${pt2Fa("Player","بازیکن")}</label><select name="playerId">${players.map(p=>`<option value="${p.id}">${osEsc(p.name)}</option>`).join("")}</select></div><div class="pt2-field-pair"><div class="os-field"><label>${pt2Fa("Date","تاریخ")}</label><input name="date" type="date" value="${osDateOffset(1)}" required></div><div class="os-field"><label>${pt2Fa("Time","ساعت")}</label><input name="time" type="time" value="17:00" required></div></div><div class="os-field"><label>${pt2Fa("Coach","مربی")}</label><select name="coachId">${coaches.map(c=>`<option value="${c.id}">${osEsc(c.name)}</option>`).join("")}</select></div><div class="os-field"><label>${pt2Fa("Assessment type","نوع ارزیابی")}</label><input name="type" value="Progress assessment"></div>`},
    program:{title:pt2Fa("New program","برنامه جدید"),fields:`<div class="os-field"><label>${pt2Fa("Program name","نام برنامه")}</label><input name="name" required></div><div class="pt2-field-pair"><div class="os-field"><label>${pt2Fa("Level","سطح")}</label><select name="level"><option>Starter</option><option>Foundation</option><option>Development</option><option>Competition</option></select></div><div class="os-field"><label>${pt2Fa("Sessions","جلسات")}</label><input name="sessions" type="number" value="8"></div></div><div class="os-field"><label>${pt2Fa("Focus","تمرکز")}</label><textarea name="focus" required></textarea></div>`},
    story:{title:pt2Fa("New transformation story","داستان تحول جدید"),fields:`<div class="os-field"><label>${pt2Fa("Player","بازیکن")}</label><select name="playerId">${players.map(p=>`<option value="${p.id}">${osEsc(p.name)}</option>`).join("")}</select></div><div class="os-field"><label>${pt2Fa("Title","عنوان")}</label><input name="title" required></div><div class="os-field"><label>${pt2Fa("Story summary","خلاصه داستان")}</label><textarea name="summary" required></textarea></div>`},
    player:{title:pt2Fa("Edit player passport","ویرایش پاسپورت بازیکن"),fields:""}
  };
  const cfg=configs[kind];if(!cfg)return;
  let fields=cfg.fields;
  if(kind==="player"){const p=osPlayer(id);fields=`<div class="os-field"><label>${pt2Fa("Full name","نام کامل")}</label><input name="name" value="${osEsc(p.name)}" required></div><div class="pt2-field-pair"><div class="os-field"><label>${pt2Fa("Nationality","ملیت")}</label><input name="nationality" value="${osEsc(p.nationality||"")}"></div><div class="os-field"><label>${pt2Fa("Dominant hand","دست غالب")}</label><select name="dominantHand"><option ${p.dominantHand==="Right"?"selected":""}>Right</option><option ${p.dominantHand==="Left"?"selected":""}>Left</option></select></div></div><div class="os-field"><label>${pt2Fa("Assigned coach","مربی مسئول")}</label><select name="coachId">${coaches.map(c=>`<option value="${c.id}" ${p.coachId===c.id?"selected":""}>${osEsc(c.name)}</option>`).join("")}</select></div><div class="os-field"><label>${pt2Fa("Development goal","هدف رشد")}</label><textarea name="goals">${osEsc(p.goals||"")}</textarea></div>`;}
  osOpenModal(osModalFrame(cfg.title,pt2Fa("Complete the required fields.","فیلدهای ضروری را کامل کنید."),`<form class="os-form" id="pt2EntityForm">${fields}<button class="os-primary-button">${pt2Fa("Save","ذخیره")}</button></form>`));
  document.getElementById("pt2EntityForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target),o=Object.fromEntries(fd.entries());
    if(kind==="coach")OS.data.coaches.push({id:pt2Id("c"),...o,certifications:[],active:true});
    if(kind==="registration")OS.data.registrations.push({id:pt2Id("r"),...o,status:"New",created:osDateOffset(0)});
    if(kind==="booking")OS.data.bookings.push({id:pt2Id("b"),...o,status:"Confirmed"});
    if(kind==="program")OS.data.programs.push({id:pt2Id("pg"),...o,sessions:Number(o.sessions),playerIds:[],active:true});
    if(kind==="story")OS.data.stories.push({id:pt2Id("st"),...o,published:true,date:osDateOffset(0)});
    if(kind==="player"){const p=osPlayer(id);Object.assign(p,o);p.coach=pt2Coach(o.coachId)?.name||p.coach;}
    pt2Save();osCloseModal();toast(pt2Fa("Saved.","ذخیره شد."));osRender(kind==="player"?"player":kind==="coach"?"coaches":kind==="registration"?"registrations":kind==="booking"?"bookings":kind==="program"?"programs":"stories");
  });
}

async function pt2Logout() { await fetch("/api/auth/logout",{method:"POST"}).catch(()=>{});OS.user={loggedIn:false,name:"",role:"player"};osSave();PT2.authReady=true;osOpenLogin(); }

document.addEventListener("click",event=>{
  const el=event.target.closest("[data-os-action]");if(!el)return;const a=el.dataset.osAction;
  if(a==="quick-note"&&OS.user.role==="player"){event.preventDefault();event.stopImmediatePropagation();toast(pt2Fa("Session notes are created by your coach.","یادداشت جلسه توسط مربی ثبت می‌شود."));return;}
  const handled=["logout","v2-add-registration","v2-add-booking","v2-add-program","v2-add-story","v2-edit-player","v2-archive-player","v2-restore-player","v2-delete-player","v2-advance-registration","v2-enroll-registration","v2-edit-academy","v2-add-competition"];
  if(!handled.includes(a))return;event.preventDefault();event.stopImmediatePropagation();
  if(a==="logout")pt2Logout();
  if(a==="v2-add-coach")pt2OpenForm("coach");if(a==="v2-add-registration")pt2OpenForm("registration");if(a==="v2-add-booking")pt2OpenForm("booking");if(a==="v2-add-program")pt2OpenForm("program");if(a==="v2-add-story")pt2OpenForm("story");if(a==="v2-edit-player")pt2OpenForm("player",el.dataset.id);
  if(a==="v2-archive-player"){const p=osPlayer(el.dataset.id);if(confirm(pt2Fa(`Archive ${p.name}? Their history will be preserved.`,`${p.name} بایگانی شود؟ تاریخچه حفظ خواهد شد.`))){OS.data.players=OS.data.players.filter(x=>x.id!==p.id);p.archived=true;OS.data.archivedPlayers.push(p);pt2Save();osRender("players");}}
  if(a==="v2-restore-player"){const i=OS.data.archivedPlayers.findIndex(x=>x.id===el.dataset.id);const [p]=OS.data.archivedPlayers.splice(i,1);p.archived=false;OS.data.players.push(p);pt2Save();osRender("archived");}
  if(a==="v2-delete-player"){const p=OS.data.archivedPlayers.find(x=>x.id===el.dataset.id);if(confirm(pt2Fa(`Permanently delete ${p.name}? This cannot be undone.`,`حذف دائمی ${p.name}؟ این عملیات قابل بازگشت نیست.`))){OS.data.archivedPlayers=OS.data.archivedPlayers.filter(x=>x.id!==p.id);pt2Save();osRender("archived");}}
  if(a==="v2-advance-registration"){const x=OS.data.registrations.find(x=>x.id===el.dataset.id),stages=["New","Contacted","Assessment","Enrolled"];x.status=stages[Math.min(stages.length-1,stages.indexOf(x.status)+1)];pt2Save();osRender("registrations");}
  if(a==="v2-enroll-registration"){const x=OS.data.registrations.find(x=>x.id===el.dataset.id);if(!confirm(pt2Fa(`Create a player profile for ${x.name}?`,`پروفایل بازیکن برای ${x.name} ساخته شود؟`)))return;x.status="Enrolled";const p={id:pt2Id("p"),name:x.name,gender:"—",age:"",phone:x.phone,emergency:"—",startDate:osDateOffset(0),stage:"Starter",track:"Starter",status:"Active",pdi:null,pti:null,rubricMin:null,confidence:"LOW",sessionsCompleted:0,attendance:{attended:0,missed:0,consecutive:0},coachId:"c1",coach:pt2Coach("c1").name,coachNotes:"",membership:"Starter 20",sessionsPurchased:20,sessionsUsed:0,primaryFocus:x.goal,pdiHistory:[],ptiHistory:[],commitment:null,commitmentTrend:"stable",nationality:"—",dominantHand:"Right",playingSide:"Right",goals:x.goal};OS.data.players.push(p);OS.data.journey.push({id:pt2Id("j"),playerId:p.id,date:osDateOffset(0),title:"Joined ProTrack",detail:"Converted from registration pipeline",type:"milestone"});pt2Save();OS.profileId=p.id;osRender("player");}
  if(a==="v2-edit-academy"){const v=prompt(pt2Fa("Academy location","موقعیت آکادمی"),OS.data.academy.location);if(v!==null){OS.data.academy.location=v;pt2Save();osRender("academy");}}
  if(a==="v2-add-competition"){const name=prompt(pt2Fa("Tournament name","نام مسابقه"));if(name){OS.data.tournaments.push({id:pt2Id("t"),name,date:osDateOffset(14),location:"—",status:"Planned",playerIds:[]});pt2Save();osRender("competitions");}}
},true);

(async function pt2InitAuth(){
  try { const res=await fetch("/api/auth/session",{cache:"no-store"});if(!res.ok)throw new Error();const out=await res.json();OS.user={...out.user,loggedIn:true};osSave();PT2.authReady=true;osCloseModal();osRender(pt2Allowed(OS.current)?OS.current:"home"); }
  catch(_){OS.user={loggedIn:false,name:"",role:"player",playerId:null};osSave();PT2.authReady=true;osOpenLogin();}
})();
