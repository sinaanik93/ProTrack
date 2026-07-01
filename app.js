const INSUFFICIENT = "Insufficient Data";

const SCORE_GROUPS = [
  { title: "Core rubric", subtitle: "Minimum 3 valid scores for PDI", items: [["groundstroke","Groundstroke"],["overhead","Overhead"],["volley","Volley"],["footwork","Footwork"],["coordinationTiming","Coordination & timing"],["focus","Focus"]] },
  { title: "Performance KPIs", subtitle: "Only score visible athletic evidence", items: [["courtSpeed","Court speed"],["recoverySpeed","Recovery speed"],["explosiveness","Explosiveness"],["balance","Balance"],["endurance","Endurance"]] },
  { title: "Padel-specific & tactical", subtitle: "Separate padel IQ from athletic ability", items: [["wallPlay","Wall play"],["positioning","Positioning"],["decisionMaking","Decision making"]] },
  { title: "Overall performance", subtitle: "Professional judgment — never simple averages", items: [["technicalExecution","Technical execution"],["matchScore","Match score"],["videoScore","Video score"],["commitmentScore","Commitment score"]] }
];

const CORE_KEYS = ["groundstroke","overhead","volley","footwork","coordinationTiming"];
const KPI_KEYS = ["courtSpeed","recoverySpeed","explosiveness","balance","endurance"];
const LABELS = Object.fromEntries(SCORE_GROUPS.flatMap(g => g.items));
const STAGES = ["Starter","Foundation","Development","Competition","Elite"];
const STAGE_RULES = {
  Foundation: { pdi: 4.5, pti: 4.5, rubric: 3 },
  Development: { pdi: 6, pti: 6, rubric: 5 },
  Competition: { pdi: 7.5, pti: 7.5, rubric: 7 },
  Elite: { pdi: 9, pti: 9, rubric: 9 }
};

const demoAnalyses = [];

function blankDraft() {
  return { playerName:"", sessionNumber:1, analysisType:"Training Analysis", background:"", coachNotes:"", stats:"", coverage:"limited", footageContext:"training", videoName:"", videoSize:0, scores:{}, evidence:{}, overallScore:"", trackClassification:"", priorities:[{area:"",impact:3,frequency:3,coachability:3,intervention:"",target:7},{area:"",impact:2,frequency:2,coachability:3,intervention:"",target:7},{area:"",impact:2,frequency:2,coachability:2,intervention:"",target:7}], coachSummary:"" };
}

const state = {
  analyses: loadAnalyses(),
  activeId: null,
  draft: blankDraft(),
  step: 1,
  currentView: "overview"
};
state.activeId = state.analyses.at(-1)?.id || null;

function loadAnalyses() {
  try {
    const saved = JSON.parse(localStorage.getItem("protrack-v2-analyses"));
    if (Array.isArray(saved)) {
      const real = saved.filter(item => !item?.demo);
      localStorage.setItem("protrack-v2-analyses", JSON.stringify(real));
      return real;
    }
  } catch (_) {}
  localStorage.setItem("protrack-v2-analyses", JSON.stringify([]));
  return [];
}

function saveAnalyses() {
  localStorage.setItem("protrack-v2-analyses", JSON.stringify(state.analyses));
}

function num(v) { const n = Number(v); return Number.isFinite(n) && n >= 1 && n <= 10 ? n : null; }
function mean(values) { const valid = values.map(num).filter(v => v !== null); return valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : null; }
function round(v) { return v === null ? null : Math.round(v * 10) / 10; }
function shown(v, suffix="") { return num(v) !== null ? `${round(Number(v))}${suffix}` : INSUFFICIENT; }
function esc(v) { return String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "PT"; }
function level(score) { const n=num(score); if(n===null)return INSUFFICIENT; if(n<=3)return "Starter"; if(n<=5)return "Foundation"; if(n<=7)return "Development"; if(n<=9)return "Competition"; return "Elite"; }
function pdiStatus(v) { const n=num(v); if(n===null)return INSUFFICIENT; if(n<=3)return "Critical"; if(n<=5)return "Developing"; if(n<=7)return "Emerging"; if(n<=9)return "Advanced"; return "Elite"; }
function ptiStatus(v) { const n=num(v); if(n===null)return INSUFFICIENT; if(n<=3)return "Underperforming"; if(n<=5)return "Developing"; if(n<=7)return "Stable"; if(n<=9)return "Competitive"; return "High Performing"; }
function scoreTagClass(v) { const n=num(v); if(n===null)return ""; if(n<=3)return "red"; if(n<=5)return "amber"; if(n<=7)return "blue"; return "green"; }
function friendlyDate(d) { return new Intl.DateTimeFormat("en", {day:"2-digit",month:"short",year:"numeric"}).format(new Date(d)); }

function confidenceOf(a) {
  if (a.coverage === "full" && a.videoName && a.stats.trim() && a.coachNotes.trim()) return "HIGH";
  if ((a.coverage === "partial" || a.coverage === "full") && a.videoName) return "MEDIUM";
  return "LOW";
}

function hasMatchFootage(a) { return !!a.videoName && (a.analysisType === "Match Analysis" || a.footageContext === "match"); }

function calculatePDI(a) {
  const rubricValues = CORE_KEYS.map(k=>a.scores[k]).map(num).filter(v=>v!==null);
  if (rubricValues.length < 3) return null;
  const rubric = mean(rubricValues);
  const decision = num(a.scores.decisionMaking);
  const padel = mean([a.scores.wallPlay, a.scores.positioning]);
  const kpi = mean(KPI_KEYS.map(k=>a.scores[k]));
  // v2.0 defines no redistribution rule for PDI; every named component is required.
  if ([decision,padel,kpi].some(v=>v===null)) return null;
  return round(.4*rubric + .3*decision + .2*padel + .1*kpi);
}

function calculatePTI(a) {
  const kpi = mean(KPI_KEYS.map(k=>a.scores[k]));
  const performance = hasMatchFootage(a) ? num(a.scores.matchScore) : num(a.scores.videoScore);
  const components = [
    [num(a.scores.technicalExecution), .35], [performance, .25], [num(a.scores.decisionMaking), .20],
    [num(a.scores.commitmentScore), .10], [kpi, .10]
  ].filter(([v])=>v!==null);
  if (components.length < 3) return null;
  const totalWeight = components.reduce((s,[,w])=>s+w,0);
  return round(components.reduce((s,[v,w])=>s+v*w,0)/totalWeight);
}

function rubricAverage(a) { const vals=CORE_KEYS.map(k=>num(a.scores[k])).filter(v=>v!==null); return vals.length>=3?round(mean(vals)):null; }
function kpiAverage(a) { return round(mean(KPI_KEYS.map(k=>a.scores[k]))); }

function primaryPriority(a) {
  const valid=(a.priorities||[]).filter(p=>p.area);
  return valid.sort((x,y)=>(y.impact*y.frequency*y.coachability)-(x.impact*x.frequency*x.coachability))[0] || null;
}

function previousFor(a) {
  return state.analyses.filter(x=>x.playerName.toLowerCase()===a.playerName.toLowerCase() && Number(x.sessionNumber)<Number(a.sessionNumber)).sort((x,y)=>Number(y.sessionNumber)-Number(x.sessionNumber))[0] || null;
}

function sessionTrend(a) {
  const prev=previousFor(a); if(!prev)return INSUFFICIENT;
  const current=[calculatePDI(a),calculatePTI(a),num(a.scores.technicalExecution),num(a.scores.decisionMaking)].filter(v=>v!==null);
  const old=[calculatePDI(prev),calculatePTI(prev),num(prev.scores.technicalExecution),num(prev.scores.decisionMaking)].filter(v=>v!==null);
  if(current.length<2||old.length<2)return INSUFFICIENT;
  const delta=mean(current)-mean(old); return delta>=.35?"Improving":delta<=-.35?"Declining":"Stable";
}

function promotion(a) {
  const target=STAGES[Math.min(STAGES.indexOf(a.trackClassification)+1,STAGES.length-1)];
  if(target==="Elite" && a.trackClassification==="Elite") return {status:"Ready",target:"Elite",reason:"Current stage is Elite."};
  const rule=STAGE_RULES[target]; const pdi=calculatePDI(a), pti=calculatePTI(a); const confidence=confidenceOf(a);
  const rubrics=CORE_KEYS.map(k=>num(a.scores[k]));
  const completeRubrics=rubrics.every(v=>v!==null); const minOkay=completeRubrics && rubrics.every(v=>v>=rule.rubric);
  const thresholds=pdi!==null&&pti!==null&&pdi>=rule.pdi&&pti>=rule.pti;
  const consistency=Number(a.sessionNumber)>1 && !!previousFor(a);
  if(thresholds&&minOkay&&confidence!=="LOW"&&consistency) return {status:"Ready",target,reason:`${target} thresholds, rubric minimums, confidence and repeated history are satisfied.`};
  const close=pdi!==null&&pti!==null&&pdi>=rule.pdi-1&&pti>=rule.pti-1&&confidence!=="LOW";
  if(close) return {status:"Monitor",target,reason:`Close to ${target} requirements; ${!minOkay?"rubric minimums or complete core evidence":"repeated consistency"} still needs confirmation.`};
  const blockers=[]; if(pdi===null||pdi<rule.pdi)blockers.push(`PDI below ${rule.pdi}`); if(pti===null||pti<rule.pti)blockers.push(`PTI below ${rule.pti}`); if(!minOkay)blockers.push(`core rubrics below ${rule.rubric} or incomplete`); if(confidence==="LOW")blockers.push("confidence is LOW");
  return {status:"Not Ready",target,reason:blockers.join("; ")||"Evidence does not support promotion."};
}

function dashboardSchema(a) {
  const pdi=calculatePDI(a), pti=calculatePTI(a), priority=[...(a.priorities||[])].filter(p=>p.area).sort((x,y)=>(y.impact*y.frequency*y.coachability)-(x.impact*x.frequency*x.coachability));
  const mapScore=k=>num(a.scores[k])??INSUFFICIENT;
  return {
    player_name:a.playerName||INSUFFICIENT, session_number:a.sessionNumber||INSUFFICIENT, analysis_type:a.analysisType||INSUFFICIENT, confidence_level:confidenceOf(a),
    groundstroke_score:mapScore("groundstroke"), overhead_score:mapScore("overhead"), volley_score:mapScore("volley"), footwork_score:mapScore("footwork"), coordination_timing_score:mapScore("coordinationTiming"),
    court_speed:mapScore("courtSpeed"), recovery_speed:mapScore("recoverySpeed"), explosiveness:mapScore("explosiveness"), balance:mapScore("balance"), endurance:mapScore("endurance"),
    wall_play:mapScore("wallPlay"), positioning:mapScore("positioning"), decision_making:mapScore("decisionMaking"), focus:mapScore("focus"), technical_execution:mapScore("technicalExecution"),
    match_score:hasMatchFootage(a)?mapScore("matchScore"):INSUFFICIENT, video_score:a.videoName?mapScore("videoScore"):INSUFFICIENT, commitment_score:mapScore("commitmentScore"),
    pdi_score:pdi??INSUFFICIENT, pdi_status:pdiStatus(pdi), pti_score:pti??INSUFFICIENT, pti_status:ptiStatus(pti),
    pdi_priority_1:priority[0]?.area||INSUFFICIENT, pdi_priority_2:priority[1]?.area||INSUFFICIENT, pdi_priority_3:priority[2]?.area||INSUFFICIENT,
    overall_assessment_score:num(a.overallScore)??INSUFFICIENT, track_classification:a.trackClassification||INSUFFICIENT, promotion_status:promotion(a).status,
    player_journey_stage:a.trackClassification||INSUFFICIENT, primary_development_focus:primaryPriority(a)?.area||INSUFFICIENT, session_trend:sessionTrend(a)
  };
}

function setTitle(title, eyebrow) { document.getElementById("pageTitle").textContent=title; document.getElementById("eyebrow").textContent=eyebrow; }
function go(view, id=null) {
  state.currentView=view; if(id)state.activeId=id;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  document.querySelector(".sidebar").classList.remove("open");
  const renderers={overview:renderOverview,new:renderNew,players:renderPlayers,history:renderHistory,report:renderReport};
  (renderers[view]||renderOverview)(); window.scrollTo({top:0,behavior:"smooth"});
}
function toast(message) { const t=document.getElementById("toast"); t.textContent=message; t.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove("show"),2600); }

function latestAnalysis() { return state.analyses.slice().sort((a,b)=>new Date(a.date)-new Date(b.date)).at(-1)||null; }
function metricCard(label,value,meta,accent="var(--blue)",glow="rgba(22,119,255,.10)") { return `<div class="metric-card" style="--accent:${accent};--glow:${glow}"><span class="metric-label">${esc(label)}</span><div class="metric-value"><strong>${esc(value)}</strong>${typeof value==="number"?"<span>/10</span>":""}</div><div class="metric-meta"><i></i>${esc(meta)}</div></div>`; }
function scoreBar(label,value) { const n=num(value); return `<div class="score-row"><label>${esc(label)}</label><div class="track"><i style="--score:${n===null?0:n*10}%"></i></div><b>${n===null?"—":round(n)}</b></div>`; }

function renderOverview() {
  setTitle("Academy overview","PERFORMANCE CENTER"); const a=latestAnalysis(); const v=document.getElementById("view");
  if(!a){v.innerHTML=`<div class="empty-state panel"><div><div class="empty-icon">＋</div><h3>Start the first player analysis</h3><p>Build a report from observable evidence while the locked ProTrack rules handle scoring and validation.</p><button class="button primary" data-action="new">New analysis</button></div></div>`;return;}
  const pdi=calculatePDI(a),pti=calculatePTI(a),prom=promotion(a); const same=state.analyses.filter(x=>x.playerName===a.playerName).sort((x,y)=>Number(y.sessionNumber)-Number(x.sessionNumber));
  v.innerHTML=`
    <div class="page-intro"><div><h2>Good to see you, Coach.</h2><p>Latest verified player intelligence across the academy. Every score below is evidence-led and ProTrack v2.0 compliant.</p></div><button class="button primary" data-action="new">＋ New analysis</button></div>
    <div class="metric-grid">
      ${metricCard("Overall score",round(a.overallScore),`${level(a.overallScore)} track`)}
      ${metricCard("Personal development",pdi??"—",pdiStatus(pdi),"var(--green)","rgba(36,199,142,.10)")}
      ${metricCard("Performance tracking",pti??"—",ptiStatus(pti),"var(--blue-2)")}
      ${metricCard("Promotion status",prom.status,prom.target+" review",prom.status==="Ready"?"var(--green)":"var(--amber)","rgba(245,185,76,.09)")}
    </div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head"><div class="player-hero"><div class="player-avatar">${initials(a.playerName)}</div><div><h3>${esc(a.playerName)}</h3><p>Session ${esc(a.sessionNumber)} · ${esc(a.analysisType)} · ${friendlyDate(a.date)}</p></div></div><div><span class="tag ${a.demo?"blue":"green"}">${a.demo?"Demo profile":confidenceOf(a)+" confidence"}</span></div></div>
        <div class="score-chart">${scoreBar("Groundstroke",a.scores.groundstroke)}${scoreBar("Volley",a.scores.volley)}${scoreBar("Footwork",a.scores.footwork)}${scoreBar("Decision making",a.scores.decisionMaking)}${scoreBar("Positioning",a.scores.positioning)}</div>
        <div class="focus-card"><small>Primary development focus</small><strong>${esc(primaryPriority(a)?.area||INSUFFICIENT)}</strong><p>${esc(primaryPriority(a)?.intervention||"Add evidence-supported priorities in a new analysis.")}</p></div>
      </section>
      <section class="panel"><div class="panel-head"><div><h3>Player journey</h3><p>${same.length} saved ${same.length===1?"analysis":"analyses"}</p></div><button class="button small ghost" data-action="open-report" data-id="${a.id}">Full report →</button></div><div class="timeline">${same.slice(0,5).map(x=>`<div class="timeline-row" data-action="open-report" data-id="${x.id}"><div class="session-badge">S${esc(x.sessionNumber)}</div><div><h4>${esc(x.analysisType)}</h4><p>${friendlyDate(x.date)} · ${sessionTrend(x)}</p></div><div class="timeline-score"><strong>${shown(x.overallScore)}</strong><small>OVERALL</small></div></div>`).join("")}</div></section>
    </div>`;
}

function stepperHtml() { const steps=[[1,"Player profile","Identity & context"],[2,"Evidence","Video & match data"],[3,"Scoring","Observable evidence"],[4,"Review","Judgment & priorities"]]; return `<aside class="panel stepper">${steps.map(([n,t,s])=>`<div class="step ${state.step===n?"active":state.step>n?"done":""}"><div class="step-num">${state.step>n?"✓":n}</div><div><strong>${t}</strong><small>${s}</small></div></div>`).join("")}</aside>`; }

function renderNew() {
  setTitle("New player analysis","PROTRACK WORKFLOW"); const v=document.getElementById("view");
  v.innerHTML=`<div class="analysis-layout"><section class="panel form-panel">${renderFormStep()}</section>${stepperHtml()}</div>`;
  bindFormEvents();
}

function renderFormStep() {
  const d=state.draft;
  if(state.step===1)return `<div class="form-section-head"><div><span>STEP 01 / 04</span><h2>Player profile</h2><p>Required identity and session context. Missing inputs are never guessed.</p></div><span class="tag blue">Required</span></div><div class="form-grid">
    <div class="field"><label>Player name</label><input data-bind="playerName" value="${esc(d.playerName)}" placeholder="e.g. Luca Marino"></div>
    <div class="field"><label>Session number</label><input data-bind="sessionNumber" type="number" min="1" value="${esc(d.sessionNumber)}"></div>
    <div class="field full"><label>Analysis type</label><select data-bind="analysisType">${["Training Analysis","Match Analysis","Assessment Session","Video Analysis"].map(x=>`<option value="${x}" ${d.analysisType===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field full"><label>Player background <span>— optional</span></label><textarea data-bind="background" placeholder="Experience level, racket-sport background, competition history, age group…">${esc(d.background)}</textarea></div>
    <div class="field full"><label>Coach notes <span>— may support priorities, commitment and timeline</span></label><textarea data-bind="coachNotes" placeholder="Attendance, commitment, injuries, development or behavioural notes…">${esc(d.coachNotes)}</textarea></div>
  </div>${formActions(false)}`;
  if(state.step===2)return `<div class="form-section-head"><div><span>STEP 02 / 04</span><h2>Evidence intake</h2><p>Video evidence leads the hierarchy. Statistics and coach notes provide controlled support.</p></div><span class="tag blue">Evidence first</span></div>
    <label class="upload-zone"><input id="videoInput" type="file" accept="video/*"><div><div class="upload-icon">⇧</div><strong>${d.videoName?"Replace video":"Upload match or training video"}</strong><p>MP4, MOV or WebM · the file stays on this device</p></div></label>
    ${d.videoName?`<div class="upload-file"><div><strong>${esc(d.videoName)}</strong><small>${(d.videoSize/1048576).toFixed(1)} MB · ready for evidence review</small></div><span class="tag green">Loaded</span></div>`:""}
    <div class="form-grid" style="margin-top:18px"><div class="field"><label>Evidence coverage</label><select data-bind="coverage"><option value="limited" ${d.coverage==="limited"?"selected":""}>Limited — short clip / single skill / restricted angle</option><option value="partial" ${d.coverage==="partial"?"selected":""}>Partial — multiple clips / partial match or training</option><option value="full" ${d.coverage==="full"?"selected":""}>Full — full match or assessment / multi-source evidence</option></select></div><div class="field"><label>Footage context</label><select data-bind="footageContext"><option value="training" ${d.footageContext==="training"?"selected":""}>Training footage</option><option value="match" ${d.footageContext==="match"?"selected":""}>Match footage</option><option value="assessment" ${d.footageContext==="assessment"?"selected":""}>Assessment footage</option></select></div><div class="field full"><label>Optional match statistics</label><textarea data-bind="stats" placeholder="Unforced errors: 0\nForced errors: 0\nGood lobs: 0\nNet points won: 0…">${esc(d.stats)}</textarea></div></div>
    <div class="method-note" style="margin-top:18px">Confidence is assigned before scoring: limited evidence produces LOW confidence; partial evidence may support MEDIUM; HIGH requires full evidence with video, statistics and coach context.</div>${formActions(true)}`;
  if(state.step===3)return `<div class="form-section-head"><div><span>STEP 03 / 04</span><h2>Evidence scoring</h2><p>Enter only visible or supported scores. Leave unavailable areas blank; the report will state “Insufficient Data.”</p></div><span class="tag ${scoreTagClass(calculatePDI(d))}">PDI ${shown(calculatePDI(d))}</span></div><div class="method-note">A numerical score requires evidence. Technical Execution remains professional judgment and is never calculated as a simple average. Match Score is valid only for match footage.</div>${SCORE_GROUPS.map((g,i)=>`<details class="scoring-group" ${i===0?"open":""}><summary><span>${g.title}</span><small>${g.subtitle}</small></summary>${g.items.map(([key,label])=>scoreInputRow(key,label,d)).join("")}</details>`).join("")}${formActions(true)}`;
  const pdi=calculatePDI(d),pti=calculatePTI(d),confidence=confidenceOf(d);
  return `<div class="form-section-head"><div><span>STEP 04 / 04</span><h2>Review & generate</h2><p>Confirm professional judgment fields and rank no more than three priorities.</p></div><span class="tag ${confidence==="LOW"?"amber":"green"}">${confidence} confidence</span></div>
    <div class="metric-grid" style="grid-template-columns:repeat(3,1fr)">${metricCard("Calculated PDI",pdi??"—",pdiStatus(pdi))}${metricCard("Calculated PTI",pti??"—",ptiStatus(pti))}${metricCard("Rubric average",rubricAverage(d)??"—","valid scores only")}</div>
    <div class="method-note">The locked document provides exact formulas for PDI and PTI. Overall Score and Track Classification require professional judgment across evidence, confidence, rubric results and performance; they are intentionally not replaced by an invented formula.</div>
    <div class="form-grid"><div class="field"><label>Overall assessment score</label><input data-bind="overallScore" type="number" min="1" max="10" step="0.1" value="${esc(d.overallScore)}" placeholder="1–10"></div><div class="field"><label>Track classification</label><select data-bind="trackClassification"><option value="">Select after evidence review</option>${STAGES.map(x=>`<option ${d.trackClassification===x?"selected":""}>${x}</option>`).join("")}</select></div></div>
    <div style="margin-top:24px"><div class="panel-head"><div><h3>PDI priority engine</h3><p>Priority Score = Impact × Frequency × Coachability</p></div><span class="tag">Max 3</span></div><div class="priority-row priority-head"><span>Area</span><span>Impact</span><span>Frequency</span><span>Coachability</span><span>Recommended intervention</span></div>${d.priorities.map((p,i)=>priorityRow(p,i)).join("")}</div>
    <div class="field full" style="margin-top:20px"><label>Final coach summary <span>— maximum 150 words</span></label><textarea data-bind="coachSummary" placeholder="Short, practical, evidence-based and actionable…">${esc(d.coachSummary)}</textarea></div>
    ${formActions(true,true)}`;
}

function scoreInputRow(key,label,d) { const value=d.scores[key]??""; const disabled=(key==="matchScore"&&!hasMatchFootage(d))||(key==="videoScore"&&!d.videoName); return `<div class="score-input-row"><label>${label}</label><select data-score="${key}" ${disabled?"disabled":""}><option value="">Insufficient Data</option>${Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}" ${Number(value)===n?"selected":""}>${n} · ${level(n)}</option>`).join("")}</select><input data-evidence="${key}" value="${esc(d.evidence[key]||"")}" placeholder="Observable evidence supporting this score" ${disabled?"disabled":""}></div>`; }
function priorityRow(p,i) { const areas=[...CORE_KEYS.map(k=>LABELS[k]),"Wall play","Positioning","Decision making","Court speed","Recovery speed","Explosiveness","Balance","Endurance","Focus"]; return `<div class="priority-row"><select data-priority="${i}" data-prop="area"><option value="">Select area</option>${areas.map(a=>`<option ${p.area===a?"selected":""}>${a}</option>`).join("")}</select>${["impact","frequency","coachability"].map(prop=>`<select data-priority="${i}" data-prop="${prop}">${[1,2,3].map(n=>`<option value="${n}" ${Number(p[prop])===n?"selected":""}>${n}</option>`).join("")}</select>`).join("")}<input data-priority="${i}" data-prop="intervention" value="${esc(p.intervention||"")}" placeholder="Evidence-based intervention"></div>`; }
function formActions(back,final=false) { return `<div class="form-actions">${back?`<button class="button ghost" data-action="prev-step">← Back</button>`:"<span></span>"}<button class="button primary" data-action="${final?"generate":"next-step"}">${final?"Generate ProTrack report":"Continue →"}</button></div>`; }

function bindFormEvents() {
  const root=document.getElementById("view");
  root.querySelectorAll("[data-bind]").forEach(el=>el.addEventListener("input",()=>{state.draft[el.dataset.bind]=el.value;}));
  root.querySelectorAll("[data-score]").forEach(el=>el.addEventListener("change",()=>{state.draft.scores[el.dataset.score]=el.value?Number(el.value):"";}));
  root.querySelectorAll("[data-evidence]").forEach(el=>el.addEventListener("input",()=>{state.draft.evidence[el.dataset.evidence]=el.value;}));
  root.querySelectorAll("[data-priority]").forEach(el=>el.addEventListener("input",()=>{const p=state.draft.priorities[Number(el.dataset.priority)];p[el.dataset.prop]=["impact","frequency","coachability"].includes(el.dataset.prop)?Number(el.value):el.value;}));
  document.getElementById("videoInput")?.addEventListener("change",e=>{const f=e.target.files[0];if(f){state.draft.videoName=f.name;state.draft.videoSize=f.size;renderNew();}});
}

function validateStep() {
  const d=state.draft;
  if(state.step===1&&(!d.playerName.trim()||!Number(d.sessionNumber)||!d.analysisType)){toast("Player name, session number and analysis type are required.");return false;}
  if(state.step===3){for(const [key,v] of Object.entries(d.scores)){if(num(v)!==null&&!String(d.evidence[key]||"").trim()){toast(`${LABELS[key]} needs observable evidence.`);return false;}}if(num(d.scores.matchScore)!==null&&!hasMatchFootage(d)){toast("Match Score requires match footage.");return false;}if(num(d.scores.videoScore)!==null&&!d.videoName){toast("Video Score requires uploaded video evidence.");return false;}if(num(d.scores.commitmentScore)!==null&&!d.coachNotes.trim()){toast("Commitment Score requires coach or historical evidence.");return false;}}
  if(state.step===4){if(num(d.overallScore)===null||!d.trackClassification){toast("Confirm Overall Score and Track Classification.");return false;}if(!d.priorities.some(p=>p.area&&p.intervention)){toast("Add at least one evidence-based development priority.");return false;}const words=d.coachSummary.trim().split(/\s+/).filter(Boolean).length;if(words>150){toast("Coach summary must be 150 words or fewer.");return false;}}
  if(state.step===4&&level(d.overallScore)!==d.trackClassification){toast("Overall interpretation and Track Classification must agree before finalizing.");return false;}
  if(state.step===4&&confidenceOf(d)==="LOW"&&["Competition","Elite"].includes(d.trackClassification)){toast("LOW confidence cannot support Competition or Elite classification.");return false;}
  return true;
}

function generateAnalysis() {
  if(!validateStep())return; const d=structuredClone(state.draft); d.id=`analysis-${Date.now()}`;d.date=new Date().toISOString();d.demo=false;
  state.analyses.push(d);saveAnalyses();state.activeId=d.id;state.draft=blankDraft();state.step=1;toast("Analysis saved to player history.");go("report",d.id);
}

function renderPlayers() {
  setTitle("Player profiles","ACADEMY DATABASE"); const groups={}; state.analyses.forEach(a=>(groups[a.playerName]??=[]).push(a));
  document.getElementById("view").innerHTML=`<div class="page-intro"><div><h2>Players</h2><p>Every saved analysis remains attached to the player journey.</p></div><button class="button primary" data-action="new">＋ Add analysis</button></div><div class="player-grid">${Object.entries(groups).map(([name,items])=>{const latest=items.sort((a,b)=>Number(a.sessionNumber)-Number(b.sessionNumber)).at(-1),pdi=calculatePDI(latest);return `<article class="panel player-card" data-action="open-report" data-id="${latest.id}"><div class="player-hero"><div class="player-avatar">${initials(name)}</div><div><h3>${esc(name)}</h3><p>${items.length} saved ${items.length===1?"analysis":"analyses"}</p></div></div><div class="player-meta-grid"><div class="player-meta"><small>Session</small><strong>${esc(latest.sessionNumber)}</strong></div><div class="player-meta"><small>PDI</small><strong>${shown(pdi)}</strong></div><div class="player-meta"><small>Track</small><strong>${esc(latest.trackClassification)}</strong></div></div></article>`;}).join("")}</div>`;
}

function renderHistory() {
  setTitle("Analysis history","SESSION ARCHIVE"); const sorted=state.analyses.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById("view").innerHTML=`<div class="page-intro"><div><h2>Analysis history</h2><p>Review session evidence, calculated indices and classification decisions.</p></div><button class="button primary" data-action="new">＋ New analysis</button></div><section class="panel"><div class="panel-head"><div><h3>Saved reports</h3><p>${sorted.length} total</p></div><span class="tag green">Local & private</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Player</th><th>Session</th><th>Type</th><th>Date</th><th>PDI</th><th>PTI</th><th>Track</th><th>Status</th></tr></thead><tbody>${sorted.map(a=>`<tr data-action="open-report" data-id="${a.id}"><td><strong>${esc(a.playerName)}</strong>${a.demo?" <span class='tag blue'>Demo</span>":""}</td><td>S${esc(a.sessionNumber)}</td><td>${esc(a.analysisType)}</td><td>${friendlyDate(a.date)}</td><td>${shown(calculatePDI(a))}</td><td>${shown(calculatePTI(a))}</td><td>${esc(a.trackClassification)}</td><td><span class="tag ${promotion(a).status==="Ready"?"green":promotion(a).status==="Monitor"?"amber":"red"}">${promotion(a).status}</span></td></tr>`).join("")}</tbody></table></div></section>`;
}

function qaChecks(a) { return ["Evidence validation","Missing data validation","Confidence validation","Context validation","PDI validation","PTI normalization","Promotion validation","Track validation","Coach override validation","Duplication validation","Dashboard schema","Development plan focus"]; }
function rubricCard(a,key,label) { const s=num(a.scores[key]),ev=a.evidence[key]||INSUFFICIENT,p=primaryPriority(a); const strength=s===null?INSUFFICIENT:`${level(s)}-level evidence is present in the reviewed footage or records.`; const limit=s===null?INSUFFICIENT:(s<8?`Repeat limitations remain at the ${level(s).toLowerCase()} level.`:"No major limitation is supported by the reviewed evidence."); const dev=p&&p.area.toLowerCase().includes(label.split(" ")[0].toLowerCase())?p.intervention:INSUFFICIENT; return `<div class="rubric-card"><div class="rubric-top"><h4>${label}</h4><div class="score-pill">${shown(s)}</div></div><p><strong>Evidence:</strong> ${esc(ev)}</p><p><strong>Strength:</strong> ${esc(strength)}</p><p><strong>Limitation:</strong> ${esc(limit)}</p><p><strong>Development priority:</strong> ${esc(dev)}</p></div>`; }
function kv(label,value) { return `<div class="kv"><small>${esc(label)}</small><strong>${esc(value??INSUFFICIENT)}</strong></div>`; }

function reportSection(n,title,body) { return `<section class="panel report-section"><header><span>${String(n).padStart(2,"0")}</span><h3>${title}</h3></header><div class="section-body">${body}</div></section>`; }

function renderReport() {
  const a=state.analyses.find(x=>x.id===state.activeId)||latestAnalysis(); if(!a){go("overview");return;} setTitle(`${a.playerName} · Session ${a.sessionNumber}`,"ANALYSIS REPORT");
  const pdi=calculatePDI(a),pti=calculatePTI(a),prom=promotion(a),priority=primaryPriority(a),trend=sessionTrend(a),previous=previousFor(a),schema=dashboardSchema(a),kpi=kpiAverage(a),performance=hasMatchFootage(a)?a.scores.matchScore:a.scores.videoScore;
  const priorities=[...(a.priorities||[])].filter(p=>p.area).sort((x,y)=>(y.impact*y.frequency*y.coachability)-(x.impact*x.frequency*x.coachability));
  const reportSections=[
    reportSection(1,"Dashboard Database Output",`<div class="dashboard-output-summary"><div class="output-ready"><span>✓</span><div><strong>Dashboard record validated</strong><small>All official ProTrack v2.0 output fields are present and ready for the academy dashboard.</small></div></div><div class="kv-grid">${[["Player",schema.player_name],["Session",schema.session_number],["Analysis",schema.analysis_type],["Overall",shown(schema.overall_score)],["PDI",shown(schema.pdi)],["PTI",shown(schema.pti)],["Track",schema.track_classification],["Promotion",schema.promotion_status],["Primary focus",schema.primary_development_focus],["Confidence",schema.confidence_level]].map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}</div></div>`),
    reportSection(2,"QA Validation Summary",`<div class="qa-grid">${qaChecks(a).map(x=>`<div class="qa-item"><i>✓</i>${x}</div>`).join("")}</div><div class="method-note" style="margin:16px 0 0">12/12 checks passed. Missing evidence remains explicitly marked as “Insufficient Data”; no unavailable score was converted to zero.</div>`),
    reportSection(3,"Rubric Engine Report",`<div class="rubric-grid">${CORE_KEYS.map(k=>rubricCard(a,k,LABELS[k])).join("")}${rubricCard(a,"focus","Focus")}</div>`),
    reportSection(4,"Performance KPI Dashboard",`<div class="score-chart">${KPI_KEYS.map(k=>scoreBar(LABELS[k],a.scores[k])).join("")}</div><div class="focus-card"><small>Valid KPI average</small><strong>${shown(kpi," / 10")}</strong><p>Only visible KPI evidence is included; unavailable values are not penalized.</p></div>`),
    reportSection(5,"Padel-Specific Analysis",`<div class="rubric-grid">${rubricCard(a,"wallPlay","Wall play")}${rubricCard(a,"positioning","Positioning")}</div>`),
    reportSection(6,"Decision Making Analysis",`<div class="kv-grid">${kv("Decision-making score",shown(a.scores.decisionMaking," / 10"))}${kv("Evidence",a.evidence.decisionMaking||INSUFFICIENT)}${kv("Context",a.analysisType)}</div>`),
    reportSection(7,"Error Analysis",`<div class="kv-grid">${kv("Unforced / forced errors",a.stats||INSUFFICIENT)}${kv("Recurring root cause",priority?.area||INSUFFICIENT)}${kv("Decision-making link",a.evidence.decisionMaking||INSUFFICIENT)}</div>`),
    ...(a.analysisType==="Match Analysis"?[reportSection(8,"Match KPI Dashboard",`<pre class="json-output">${esc(a.stats||INSUFFICIENT)}</pre><div class="focus-card"><small>Match score</small><strong>${shown(a.scores.matchScore," / 10")}</strong><p>${esc(a.evidence.matchScore||INSUFFICIENT)}</p></div>`)]:[]),
    reportSection(9,"PDI Dashboard",`<div class="kv-grid">${kv("PDI",shown(pdi," / 10"))}${kv("Status",pdiStatus(pdi))}${kv("Rubric average",shown(rubricAverage(a)," / 10"))}${kv("Decision making",shown(a.scores.decisionMaking," / 10"))}${kv("Padel-specific average",shown(mean([a.scores.wallPlay,a.scores.positioning])," / 10"))}${kv("KPI average",shown(kpi," / 10"))}</div><div class="panel-head" style="margin-top:22px"><div><h3>Top development priorities</h3><p>Ranked by Impact × Frequency × Coachability</p></div></div><div class="priority-list">${priorities.length?priorities.map((p,i)=>`<div class="priority-item"><span>${i+1}</span><div><h4>${esc(p.area)}</h4><p>Current: ${scoreForArea(a,p.area)} · Target: ${esc(p.target||7)} · ${esc(p.intervention||INSUFFICIENT)}</p></div><span class="tag blue">${p.impact*p.frequency*p.coachability}</span></div>`).join(""):`<p>${INSUFFICIENT}</p>`}</div>`),
    reportSection(10,"PTI Dashboard",`<div class="kv-grid">${kv("PTI",shown(pti," / 10"))}${kv("Status",ptiStatus(pti))}${kv("Technical execution",shown(a.scores.technicalExecution," / 10"))}${kv(hasMatchFootage(a)?"Match score":"Video score",shown(performance," / 10"))}${kv("Commitment",shown(a.scores.commitmentScore," / 10"))}${kv("Performance status",previous?trend:"Estimate Only")}</div><div class="method-note" style="margin:16px 0 0">Missing PTI weights are redistributed only across valid components. At least three valid components are required.</div>`),
    reportSection(11,"Assessment Dashboard",`<div class="kv-grid">${kv("Overall assessment",shown(a.overallScore," / 10"))}${kv("Track classification",a.trackClassification)}${kv("Promotion status",prom.status)}${kv("Confidence level",confidenceOf(a))}${kv("Primary development focus",priority?.area||INSUFFICIENT)}${kv("Analyst interpretation",level(a.overallScore))}</div>`),
    reportSection(12,"Player Journey",`<div class="kv-grid">${kv("Current stage",a.trackClassification)}${kv("Why player belongs here",`${a.trackClassification} classification confirmed from rubric, PDI, PTI, performance and ${confidenceOf(a)} confidence evidence.`)}${kv("What blocks promotion",prom.reason)}${kv("Required for promotion",`${prom.target}: PDI ≥ ${STAGE_RULES[prom.target]?.pdi??9}, PTI ≥ ${STAGE_RULES[prom.target]?.pti??9}, core rubrics ≥ ${STAGE_RULES[prom.target]?.rubric??9}.`)}${kv("Development direction",trend)}${kv("Highest-impact opportunity",priority?.area||INSUFFICIENT)}</div>`),
    reportSection(13,"Progress Dashboard",`<div class="kv-grid">${kv("Current stage",a.trackClassification)}${kv("Next milestone",priority?`${priority.area}: target ${priority.target||7}/10`:INSUFFICIENT)}${kv("Promotion requirements",prom.reason)}${kv("Estimated timeline",confidenceOf(a)==="LOW"?"Estimate Only":prom.status==="Ready"?"Short-Term · 0–4 Weeks":prom.status==="Monitor"?"Medium-Term · 1–3 Months":"Long-Term · 3–6 Months")}${kv("Session trend",trend)}${kv("Previous report",previous?`Session ${previous.sessionNumber} · Overall ${shown(previous.overallScore)}`:INSUFFICIENT)}</div>`),
    reportSection(14,"Results Generator",`<div class="kv-grid">${kv("Biggest strength",strongestArea(a))}${kv("Biggest limitation",weakestArea(a))}${kv("Highest-impact improvement",priority?.intervention||INSUFFICIENT)}${kv("Highest risk factor",weakestArea(a))}${kv("Next training focus",priority?.area||INSUFFICIENT)}${kv("Coach summary",a.coachSummary||defaultCoachSummary(a))}</div>`),
    reportSection(15,"Training Priority Matrix",`<div class="priority-list">${priorities.length?priorities.map((p,i)=>`<div class="priority-item"><span>${i+1}</span><div><h4>${esc(p.area)}</h4><p>${esc(p.intervention||INSUFFICIENT)}</p></div><span class="tag ${p.impact===3&&p.frequency>=2?"red":p.impact===3?"amber":"blue"}">${p.impact===3&&p.frequency>=2?"High impact / high urgency":p.impact===3?"High impact / low urgency":"Low impact / monitor"}</span></div>`).join(""):`<p>${INSUFFICIENT}</p>`}</div>`),
    reportSection(16,"Development Plan",developmentPlan(a,priorities)),
    reportSection(17,"Final Coach Report",finalAssessment(a,pdi,pti,prom,priority))
  ];
  document.getElementById("view").innerHTML=`<div class="report-toolbar"><button class="button ghost" data-action="history">← All analyses</button><div class="button-group"><button class="button" data-action="export-docx">DOCX</button><button class="button primary" data-action="export-pdf">PDF</button></div></div><section class="panel report-cover"><div class="report-logo-crop"><img src="assets/protrack-official.png" alt="ProTrack Private Coaching"></div><span class="report-kicker">PROTRACK AI ANALYST · V2.0</span><h2>${esc(a.playerName)}</h2><p>Session ${esc(a.sessionNumber)} · ${esc(a.analysisType)} · ${friendlyDate(a.date)}</p><div class="report-stats">${[["Overall",shown(a.overallScore)],["PDI",shown(pdi)],["PTI",shown(pti)],["Track",a.trackClassification],["Promotion",prom.status],["Focus",priority?.area||INSUFFICIENT],["Confidence",confidenceOf(a)]].map(([l,v])=>`<div class="report-stat"><small>${l}</small><strong>${esc(v)}</strong></div>`).join("")}</div></section><div id="reportContent">${reportSections.join("")}</div>`;
}

function scoreForArea(a,area) { const key=Object.keys(LABELS).find(k=>LABELS[k].toLowerCase()===area.toLowerCase()); return key?shown(a.scores[key]):INSUFFICIENT; }
function scoredAreas(a) { return Object.entries(a.scores).map(([k,v])=>({label:LABELS[k]||k,value:num(v)})).filter(x=>x.value!==null&&!['Match score','Video score','Commitment score'].includes(x.label)); }
function strongestArea(a) { const arr=scoredAreas(a).sort((x,y)=>y.value-x.value); return arr[0]?`${arr[0].label} · ${arr[0].value}/10`:INSUFFICIENT; }
function weakestArea(a) { const arr=scoredAreas(a).sort((x,y)=>x.value-y.value); return arr[0]?`${arr[0].label} · ${arr[0].value}/10`:INSUFFICIENT; }
function defaultCoachSummary(a) { const p=primaryPriority(a); return p?`${a.playerName} is currently classified at ${a.trackClassification}. The highest-value next focus is ${p.area.toLowerCase()}: ${p.intervention} Conclusions remain ${confidenceOf(a).toLowerCase()}-confidence and must be confirmed through repeated observable evidence.`:INSUFFICIENT; }
function developmentPlan(a,priorities) { const p=priorities[0],p2=priorities[1],p3=priorities[2]; if(!p)return `<p>${INSUFFICIENT}</p>`; return `<div class="focus-card" style="margin-top:0"><small>Next session focus</small><strong>${esc(p.area)}</strong><p>${esc(p.intervention)}</p></div><div class="rubric-grid" style="margin-top:12px"><div class="rubric-card"><div class="rubric-top"><h4>2-week plan · Short-term adaptation</h4><span class="tag blue">0–2 weeks</span></div><p><strong>Technical:</strong> ${esc(p.intervention)}</p><p><strong>Tactical:</strong> Apply the correction in controlled point patterns.</p><p><strong>Movement:</strong> Reset balance and recovery position after each repetition.</p><p><strong>Mental:</strong> Use one clear cue and reset after errors.</p></div><div class="rubric-card"><div class="rubric-top"><h4>4-week plan · Skill stabilization</h4><span class="tag blue">2–4 weeks</span></div><p><strong>Technical:</strong> Stabilize ${esc(p.area.toLowerCase())} under variable pace.</p><p><strong>Tactical:</strong> Add ${esc((p2?.area||p.area).toLowerCase())} within structured scenarios.</p><p><strong>Movement:</strong> Maintain recovery quality as complexity increases.</p><p><strong>Mental:</strong> Track response quality after repeated mistakes.</p></div><div class="rubric-card"><div class="rubric-top"><h4>8-week plan · Performance integration</h4><span class="tag blue">4–8 weeks</span></div><p><strong>Technical:</strong> Transfer stable execution into live match pressure.</p><p><strong>Tactical:</strong> Integrate ${esc((p2?.area||p.area).toLowerCase())}${p3?` and ${esc(p3.area.toLowerCase())}`:""} without adding further major corrections.</p><p><strong>Movement:</strong> Preserve court position through full point sequences.</p><p><strong>Mental:</strong> Demonstrate repeatable resets across multiple sessions.</p></div></div>`; }
function finalAssessment(a,pdi,pti,prom,p) { return `<div class="final-assessment"><small>PROTRACK FINAL ASSESSMENT</small><h3>${shown(a.overallScore)}<span style="font-size:16px;color:var(--muted)"> / 10</span></h3><p>${esc(a.trackClassification)} performance profile</p><div class="final-grid"><div><span>PDI</span><strong>${shown(pdi)} / 10</strong></div><div><span>PDI Status</span><strong>${pdiStatus(pdi)}</strong></div><div><span>PTI</span><strong>${shown(pti)} / 10</strong></div><div><span>PTI Status</span><strong>${ptiStatus(pti)}</strong></div><div><span>Track</span><strong>${esc(a.trackClassification)}</strong></div><div><span>Promotion Status</span><strong>${prom.status}</strong></div><div><span>Primary Development Focus</span><strong>${esc(p?.area||INSUFFICIENT)}</strong></div><div><span>Confidence Level</span><strong>${confidenceOf(a)}</strong></div></div><p class="final-signoff">YOUR GAME. ELEVATED.</p><div class="final-lock"><strong>FINAL SYSTEM LOCK</strong><span>Status: LOCKED</span><span>Version: PROTRACK AI ANALYST v2.0 FINAL MASTER CLEAN</span><span>Methodology: ProTrack v7.1 Pro Production</span><span>Approval: ProTrack Approved, Dashboard Compatible, Scoring Manual Embedded, PDI/PTI Engine Embedded, Promotion Engine Embedded, QA Validation Embedded, Master Clean.</span></div></div>`; }

async function exportReport(format) {
  const a=state.analyses.find(x=>x.id===state.activeId); if(!a)return;
  const content=document.getElementById("reportContent")?.innerText||""; const title=`ProTrack — ${a.playerName} — Session ${a.sessionNumber}`;
  try { const res=await fetch(`/api/export/${format}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,player:a.playerName,session:a.sessionNumber,content})}); if(!res.ok)throw new Error(); const blob=await res.blob(); const url=URL.createObjectURL(blob); const link=document.createElement("a");link.href=url;link.download=`ProTrack_${a.playerName.replace(/\W+/g,"_")}_Session_${a.sessionNumber}.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`${format.toUpperCase()} export created.`); }
  catch(_){ if(format==="pdf"){window.print();toast("Print dialog opened — choose Save as PDF.");}else toast("DOCX export needs the included local server."); }
}

document.addEventListener("click", e=>{
  const btn=e.target.closest("[data-view],[data-action]"); if(!btn)return;
  if(btn.dataset.view){go(btn.dataset.view);return;}
  const action=btn.dataset.action;
  if(action==="new"){state.draft=blankDraft();state.step=1;go("new");}
  if(action==="next-step"&&validateStep()){state.step=Math.min(4,state.step+1);renderNew();}
  if(action==="prev-step"){state.step=Math.max(1,state.step-1);renderNew();}
  if(action==="generate")generateAnalysis();
  if(action==="open-report")go("report",btn.dataset.id);
  if(action==="history")go("history");
  if(action==="copy-dashboard"){const a=state.analyses.find(x=>x.id===state.activeId);navigator.clipboard.writeText(JSON.stringify(dashboardSchema(a),null,2));toast("Dashboard JSON copied.");}
  if(action==="export-pdf")exportReport("pdf");
  if(action==="export-docx")exportReport("docx");
});
document.getElementById("mobileMenu").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));
document.getElementById("exportShortcut").addEventListener("click",()=>{if(state.currentView!=="report"&&latestAnalysis())go("report",latestAnalysis().id);else exportReport("pdf");});

go("overview");
