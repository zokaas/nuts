/* ===== Matka Pallakselle – sovellus ===== */
const PLAN = JSON.parse(document.getElementById("plan").textContent);
let BASE = PLAN.map(r=>r.slice());
const PHASE = w => w<=8?"Pohja":w<=16?"Rakennus":w<=22?"Maratonjakso":w<=24?"Palautuminen":w<=33?"Kisaspesifi":"Kevennys";
const TYPES = {
  J:{l:"Juoksu",c:"t-run"}, JL:{l:"Juoksu + lihaskunto",c:"t-run"}, P:{l:"Pitkä lenkki",c:"t-long"},
  PT:{l:"Patikointi",c:"t-hike"}, YM:{l:"Ylämäkikävely",c:"t-hike"}, K:{l:"Kuntopiiri",c:"t-gym"}, T:{l:"Tribe",c:"t-gym"}, TL:{l:"Tribe tai lihaskunto",c:"t-gym"},
  S:{l:"Spinning",c:"t-bike"}, SH:{l:"Spinning tai hiihto",c:"t-bike"}, SL:{l:"Spinning tai lihaskunto",c:"t-bike"},
  LH:{l:"Lihashuolto",c:"t-hike"}, X:{l:"Testi",c:"t-test"}, R:{l:"Kisa",c:"t-race"}, L:{l:"Lepo",c:"t-rest"},
  V:{l:"Vapaa laji",c:"t-free"}, UI:{l:"Uinti",c:"t-swim"}, PY:{l:"Pyöräily",c:"t-bike"}, HI:{l:"Hiihto",c:"t-bike"}, SK:{l:"Sauvakävely",c:"t-hike"}, KA:{l:"Kävely",c:"t-hike"},
  SA:{l:"Sali / lihaskunto",c:"t-gym"}, JO:{l:"Jooga / liikkuvuus",c:"t-free"}, PA:{l:"Pallopeli",c:"t-gym"}, MU:{l:"Muu liikunta",c:"t-free"}
};
/* Lajit vaihtoon: [koodi, emoji, kerroin juoksuminuutteihin, rasittava?] */
const SPORTS = [["UI","🏊",1.15,0],["PY","🚴",1.4,0],["S","🚲",1,1],["HI","⛷️",1.1,1],["SK","🥢",1.6,0],["KA","🚶",2,0],["SA","🏋️",1,0],["JO","🧘",1,0],["PA","⚽",1,1],["MU","✨",1,0],["J","🏃",1,1]];
const VIG = new Set(["J","JL","P","X","R","S","SH","SL","T","TL","K","PA","HI"]);
const FLAGS = [["sick","🤒 Sairas"],["pain","🩹 Kipu"],["tired","😮‍💨 Väsynyt"],["sleep","😴 Huono uni"],["stress","🧠 Stressi"],["hangover","🍾 Darra"],["travel","✈️ Matkalla"],["great","⚡ Huippufiilis"]];
const FLAG_L = Object.fromEntries(FLAGS);
const AREAS = ["sääri","polvi","akillesjänne","pohje","jalkapohja","nilkka","lonkka","reisi","selkä","muu"];
const DOW = ["ma","ti","ke","to","pe","la","su"];
const SHORT = {V:"Vapaa",UI:"Uinti",PY:"Pyörä",HI:"Hiihto",SK:"Sauva",KA:"Kävely",SA:"Sali",JO:"Jooga",PA:"Pallo",MU:"Muu",J:"Juoksu",JL:"Juoksu",P:"Pitkä",PT:"Patikka",YM:"Ylämäki",K:"Piiri",T:"Tribe",TL:"Tribe",S:"Spin",SH:"Spin",SL:"Spin",LH:"Huolto",X:"Testi",R:"Kisa",L:"Lepo"};
const TITLES = {kalenteri:"Kalenteri",historia:"Historia",analyysi:"Analyysi",opas:"Opas",merkit:"Merkit",asetukset:"Asetukset"};
let selDay=null, statusOpen=false, anaTab="matka";
const FEEL = [["1","raskas"],["2","tahmea"],["3","ok"],["4","hyvä"],["5","kevyt"]];
const BELGRADE = idxOfISO("2027-04-18"), NUTS = idxOfISO("2027-07-23");
const bHalf=()=>meta.bGoal==="half", bIdx=()=>bHalf()?BELGRADE-1:BELGRADE;
const CHEERS = ["Poro nyökkää hyväksyvästi.","Tunturi on taas askeleen lähempänä.","Lakka kypsyy, sinä myös.","Pallas kuuli tämän.","Yksi tiili lisää kisakuntoon.","Kaamos ei pysäytä.","Hetta jää taakse, Pallas lähestyy.","Jalat kiittävät huomenna. Ehkä."];
const REST_LINES = ["Lepopäivä. Kunto kehittyy nyt, kun lepäät.","Lepo on treeniä, jota ei tarvitse hikoilla.","Sohva on tänään virallinen harjoituspaikka.","Kävely ja venyttely ok, muuten jalat ylös."];
const LEVELS = [[0,"Jänis","🐇"],[250,"Kettu","🦊"],[600,"Poro","🦌"],[1100,"Ahma","🦡"],[1800,"Kotka","🦅"],[2600,"Tunturisusi","🐺"]];
const STATIONS = [[0,"Hetta"],[.17,"Pyhäkero"],[.33,"Sioskuru"],[.5,"Hannukuru"],[.64,"Pahakuru"],[.8,"Montell"],[1,"Pallas"]];

/* ---------- tallennus (puhelimen muisti) ---------- */
const LS_LOGS="pallas.logs.v1", LS_ADJ="pallas.adjoff.v1", LS_META="pallas.meta.v1";
function load(k,def){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch(e){ return def; } }
const LS_EDITS="pallas.edits.v1", LS_SCALE="pallas.weekscale.v1", LS_SHOES="pallas.shoes.v1", LS_GEAR="pallas.gear.v1";
let logs = load(LS_LOGS,{}), adjOff = load(LS_ADJ,{}), meta = load(LS_META,{});
let edits = load(LS_EDITS,{}), weekScale = load(LS_SCALE,{}), shoes = load(LS_SHOES,[]), gear = load(LS_GEAR,{});
let storageOk = true;
function persist(){ try{ localStorage.setItem(LS_LOGS,JSON.stringify(logs)); localStorage.setItem(LS_ADJ,JSON.stringify(adjOff)); localStorage.setItem(LS_META,JSON.stringify(meta)); localStorage.setItem(LS_EDITS,JSON.stringify(edits)); localStorage.setItem(LS_SCALE,JSON.stringify(weekScale)); localStorage.setItem(LS_SHOES,JSON.stringify(shoes)); localStorage.setItem(LS_GEAR,JSON.stringify(gear)); storageOk=true; }catch(e){ storageOk=false; } if(typeof scheduleCloud==="function") scheduleCloud(); }
if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});

/* ---------- apurit ---------- */
function todayIdx(){ const t=new Date(); return idxOfISO(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`); }
function dow(i){ return ((i+1)%7+7)%7; }
function fmt(i){ const d=new Date(START_UTC+i*864e5); return `${DOW[dow(i)]} ${d.getUTCDate()}.${d.getUTCMonth()+1}.`; }
function fmtShort(i){ const d=new Date(START_UTC+i*864e5); return `${d.getUTCDate()}.${d.getUTCMonth()+1}.`; }
function esc(s){ return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function typeChip(code){ const t=TYPES[code]||TYPES.L; return `<span class="type ${t.c}">${t.l}</span>`; }
function hasKm(code){ return RUN.has(code)||code==="PT"||code==="YM"; }
function n1(x){ return String(Math.round(x*10)/10).replace(".",","); }
function pace(km,min){ if(!km||!min) return ""; const p=min/km; const m=Math.floor(p); let s=Math.round((p-m)*60); return `${m}:${String(s===60?0:s).padStart(2,"0")}`; }
function pick(a,seed){ return a[Math.abs(seed)%a.length]; }
const $=id=>document.getElementById(id);
let viewWeek=null, edit=null, draft=null, ADAPT={};
let hist={filter:"all",q:"",sort:"date"};
const T0=()=>Math.min(Math.max(todayIdx(),0),BASE.length-1);
const TOTAL_SESSIONS=PLAN.filter(p=>p[0]!=="L").length;

/* ---------- johdetut tiedot ---------- */
function entries(){ return Object.keys(logs).map(k=>({key:k,idx:idxOfISO(k),l:logs[k],code:logType(BASE,k,logs[k])})).filter(e=>e.idx>=0).sort((a,b)=>a.key<b.key?-1:1); }
function stats(){
  const es=entries(); let done=0,km=0,longest=0,rMin=0,rKm=0;
  es.forEach(e=>{ if(e.l.status!=="done"||e.code==="L") return; done++; if(RUN.has(e.code)&&typeof e.l.km==="number"){ km+=e.l.km; longest=Math.max(longest,e.l.km); if(typeof e.l.min==="number"&&e.l.min>0){ rMin+=e.l.min; rKm+=e.l.km; } } });
  const t=todayIdx(); let cur=0,best=0;
  for(let i=0;i<=Math.min(t,BASE.length-1);i++){ for(const s of sessionsOn(BASE,logs,ADAPT,i)){ if(s.code==="L") continue; const l=logs[s.key]; const fl=flagsOf(l);
    if(l&&l.status==="done"){ cur++; best=Math.max(best,cur); } else if(l&&l.status==="moved"){} else if(fl.includes("sick")||fl.includes("pain")){} else if((l&&l.status==="skip")||(!l&&i<t)) cur=0; } }
  let elev=0; es.forEach(e=>{ if(e.l.status==="done"&&typeof e.l.elev==="number") elev+=e.l.elev; });
  return {done,km,longest,cur,best,elev,avgPace:rKm?pace(rKm,rMin):""};
}
function badges(st){
  const es=entries().filter(e=>e.l.status==="done"); const run=es.filter(e=>RUN.has(e.code)&&typeof e.l.km==="number");
  const inR=(a,b)=>es.filter(e=>e.key>=a&&e.key<=b+"~").length; const all=entries();
  return [
    ["🥾","Ensimmäinen askel","Ensimmäinen treeni kirjattu",es.length>=1],
    ["🔥","Kolmen putki","3 suunniteltua treeniä peräkkäin",st.best>=3],
    ["⚡","Viikon putki","7 treeniä peräkkäin",st.best>=7],
    ["🌲","Kymppi","Yksi lenkki vähintään 10 km",run.some(e=>e.l.km>=10)],
    ["🏅","Puolikas","Yksi lenkki vähintään 21,1 km",run.some(e=>e.l.km>=21.1)],
    ["⛰️","Kolmikymppinen","Yksi lenkki vähintään 30 km",run.some(e=>e.l.km>=30)],
    ["💯","Sata kilsaa","Yhteensä 100 km",st.km>=100],
    ["🗺️","Hetta–Pallas ×4","Yhteensä 264 km",st.km>=264],
    ["🌍","Puolituhatta","Yhteensä 500 km",st.km>=500],
    ["🌑","Kaamoksen kulkija","10 treeniä joulu–tammikuussa",inR("2026-12-01","2027-01-31")>=10],
    ["🌴","Tropiikin tossu","Treeni Costa Ricassa",inR("2027-01-05","2027-01-24")>=1],
    ["🎯","Testi läpi","Tarkistuspisteen testi tehty",es.some(e=>e.code==="X")],
    ["⏳","Viiden tunnin retki","Treeni, jonka kesto vähintään 5 h",es.some(e=>typeof e.l.min==="number"&&e.l.min>=300)],
    ["🇷🇸","Belgradin maratoonari","Maraton 18.4. maalissa",!!(logs["2027-04-18"]&&logs["2027-04-18"].status==="done")],
    ["🦌","Tunturin valloittaja","Nuts 66 km maalissa",!!(logs["2027-07-23"]&&logs["2027-07-23"].status==="done")],
    ["💪","Voimaa jaloissa","10 lihaskuntotreeniä",entries().filter(e=>e.l.strength).length>=10],
    ["⛰️","Tuhat nousumetriä","Yhteensä 1000 m nousua",st.elev>=1000],
    ["🏔️","Pallastunturi ×10","Yhteensä 5000 m nousua",st.elev>=5000],
    ["📝","Rehellinen kirjaaja","Kirjasit väliin jääneen treenin",all.some(e=>e.l.status==="skip")],
    ["🛌","Viisas lepääjä","Lepäsit sairaana etkä juossut",all.some(e=>flagsOf(e.l).includes("sick"))&&!all.some(e=>flagsOf(e.l).includes("sick")&&e.l.status==="done"&&RUN.has(e.code))],
    ["💾","Varmuuskopioija","Varmuuskopio tallennettu",!!meta.lastBackup],
  ].map(([icon,name,desc,got])=>({icon,name,desc,got}));
}
function xpOf(st,bs){ return st.done*10+Math.round(st.km)+bs.filter(b=>b.got).length*25; }
function levelOf(xp){ let L=LEVELS[0],next=null; LEVELS.forEach((x,i)=>{ if(xp>=x[0]){ L=x; next=LEVELS[i+1]||null; } }); return {L,next}; }

/* ---------- näkymät ---------- */
function route(){ const h=(location.hash||"").slice(1); if(h==="kisa") return "opas"; return ["historia","kalenteri","analyysi","opas","merkit","asetukset"].includes(h)?h:"tanaan"; }
function render(){
  const ti=todayIdx(), t=T0(); if(viewWeek===null) viewWeek=weekOf(t);
  BASE = buildBase(); ADAPT = buildAdapt(BASE, logs, adjOff, ti);
  const r=route(); document.body.dataset.route=r; $("pageTitle").textContent=TITLES[r]||""; document.querySelectorAll("[data-view]").forEach(v=>v.hidden=v.dataset.view!==r);
  document.querySelectorAll(".tabs a").forEach(a=>a.setAttribute("aria-current",a.getAttribute("href")==="#"+r?"page":"false"));
  const st=stats(), bs=badges(st); const ws=computeWarnings(BASE,logs,ADAPT,ti).concat(eventWarnings(ti)).concat(cpWarnings(ti)); checkCont30();
  renderCount(ti,st,bs);
  if(r==="tanaan"){ renderMaint(); renderRaceWeek(ti); renderStatus(ws); renderToday(t,ti); renderTip(t); renderSummary(ti); renderWeek(t); renderUpcoming(t); }
  if(r==="historia"){ renderHistory(st); }
  if(r==="asetukset"){ renderStrava(); renderCloud(); renderPush(); renderZones(); renderLoc(); }
  if(r==="analyysi") renderAnalysis(ti,st,t);
  if(r==="merkit") renderBadges(st,bs);
  if(r==="kalenteri") renderCalendar(t);
  if(r==="opas"){ renderMill(); renderStrength(); renderRace(); renderZones(); renderRacePlans(); }
  renderGearDot();
  const n=ws.filter(w=>w.level!=="info").length; try{ if(navigator.setAppBadge){ n?navigator.setAppBadge(n):navigator.clearAppBadge(); } }catch(e){}
  renderBackupNag();
}
function renderCount(ti,st,bs){ const b=bIdx()-ti,n=NUTS-ti; const {L}=levelOf(xpOf(st,bs));
  $("count").innerHTML=`<a href="#merkit" class="chip lvl">${L[2]} <b>${L[1]}</b> ›</a>`+(b>=0?`<span class="chip">Belgrad <b class="num">${b}</b> pv</span>`:"")+(n>=0?`<span class="chip">Nuts <b class="num">${n}</b> pv</span>`:"")+(st.cur>=2?`<span class="chip">🔥 <b class="num">${st.cur}</b> putki</span>`:""); }
function renderStatus(ws){
  const lvl=ws.some(w=>w.level==="crit")?"crit":ws.some(w=>w.level==="warn")?"warn":"ok";
  const sickNow=ws.some(w=>w.title==="Sairastuminen kirjattu");
  const head=sickNow&&lvl==="ok"?"Lepää ja parane":{ok:"Aikataulussa",warn:"Pientä lipsumista",crit:"Nyt on pielessä"}[lvl];
  const pill=$("pill"); pill.className="pill st-"+lvl; pill.disabled=!ws.length;
  pill.innerHTML=`<span class="dot"></span>${head}${ws.length?`<span class="pc">${lvl==="ok"?`${ws.length} huomio${ws.length>1?"ta":""}`:"›"}</span>`:""}`;
  pill.setAttribute("aria-expanded", String(lvl!=="ok"||statusOpen));
  const el=$("status"); el.className="status st-"+lvl;
  el.hidden = !( (ws.length && (lvl!=="ok"||statusOpen)) || !storageOk );
  el.innerHTML=(ws.length?`<ul class="warns">${ws.map(w=>`<li class="warn w-${w.level}"><details${lvl!=="ok"&&w.level!=="info"&&ws.length===1?" open":""}><summary><b>${esc(w.title)}</b></summary><span>${esc(w.detail)}</span></details></li>`).join("")}</ul>`:"")+(storageOk?"":`<p class="note">Tallennus ei onnistu tässä selaimessa. Lisää sovellus kotinäytölle.</p>`);
}
$("pill").onclick=()=>{ const lvl=$("pill").className.includes("st-ok")?"ok":"x"; if(lvl==="ok"){ statusOpen=!statusOpen; render(); } else $("status").scrollIntoView({behavior:"smooth",block:"nearest"}); };
function stateLabel(l){ if(!l) return ""; const fl=flagsOf(l).filter(f=>f!=="great").map(f=>FLAG_L[f].split(" ")[0]).join("");
  const base = l.status==="moved"?`<span class="state">→ Siirretty</span>`: l.status==="done"?`<span class="state done">✓ Tehty${typeof l.km==="number"?` · ${n1(l.km)} km`:""}</span>`: l.status==="skip"?`<span class="state skip">Jäi väliin</span>`:`<span class="state">📝 Kirjattu</span>`;
  return base+(l.strength?` <span class="state done">💪 ${l.strength}</span>`:"")+(fl?` <span class="flags">${fl}</span>`:""); }

function changeInfo(s){
  if(s.moved || s.idx==null) return null; const i=s.idx; const sc=SCALED[i];
  if(!s.reason && !sc) return null;
  const o=rawAt(i); const oq=parseQty(o[1]), nq=parseQty(s.text);
  let head, pct=null; const chips=[];
  if(s.code==="L" && o[0]!=="L"){ head="Treeni peruttu"; chips.push("lepopäivä"); }
  else if(s.code!==o[0]){ head=`${TYPES[o[0]].l} → ${TYPES[s.code].l}`; if(RUN.has(o[0])&&!RUN.has(s.code)) chips.push("ei juoksua"); }
  if(oq&&nq&&oq.unit===nq.unit&&s.code!=="L"&&(s.code===o[0]||RUN.has(s.code))){ pct=Math.round(nq.v/oq.v*100); if(pct<100){ head=head||`Kevennetty −${100-pct} %`; chips.unshift(`${oq.str} → ${nq.str}`); } }
  if(hasIntensity(o[1]) && !hasIntensity(s.text) && s.code!=="L") chips.push("ei vetoja");
  if(!head) head = s.reason ? "Muutettu" : `Kevennetty −${Math.round((1-sc.f)*100)} %`;
  const reasons=[]; if(s.reason) reasons.push(s.reason); if(sc) reasons.push(`kevensit viikon ${sc.w} (${Math.round(sc.f*100)} %)`);
  let last=i; for(let j=i+1;j<=Math.min(BASE.length-1,i+14);j++){ if(ADAPT[j]||SCALED[j]) last=j; else if(BASE[j][0]!=="L") break; }
  const kind = s.kind || "scale";
  return {head, chips, reasons, kind, o, oq, nq, last};
}
function changeBlock(s){
  const c=changeInfo(s); if(!c) return "";
  const d=isoOfIdx(s.idx);
  const was=`${TYPES[c.o[0]].l}${c.oq?` · ${c.oq.str}`:""}`, now=s.code==="L"?"Lepo":`${TYPES[s.code].l}${c.nq?` · ${c.nq.str}`:""}`;
  const undo = s.reason ? `<button class="link" data-adjoff="${d}">Tee alkuperäinen treeni silti</button>` : `<button class="link" data-unscale="${SCALED[s.idx].w}">Peru viikon kevennys</button>`;
  return `<div class="chg k-${c.kind}">
    <div class="chg-head"><span class="pill">${esc(c.head)}</span></div>
    <div class="chg-grid"><div class="was"><small>Alun perin</small><s>${esc(was)}</s></div><div class="arr" aria-hidden="true">→</div><div class="now"><small>Tänään</small><b>${esc(now)}</b></div></div>
    ${c.chips.length?`<div class="chips static">${c.chips.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}
    <p class="why">${esc(c.reasons.join(" + "))}${c.last>s.idx?` · ${fmt(c.last)} asti`:""}</p>
    ${undo}</div>`;
}
function changeTag(s){ const c=changeInfo(s); if(!c) return ""; return `<span class="adtag k-${c.kind}">${esc(c.chips[0]&&c.chips[0].includes("→")?c.chips[0]:c.head)}</span>`; }
function sessionBlock(s,first,ti){
  const l=logs[s.key]; const text=s.text||(s.code==="L"?pick(REST_LINES,s.idx):"");
  const adaptBox = (s.reason||SCALED[s.idx]) && !s.moved ? changeBlock(s) :
    (adjOff[isoOfIdx(s.idx)]&&first ? `<div class="adapt off"><span>Käytät alkuperäistä ohjelmaa tälle päivälle.</span><button class="link" data-adjon="${isoOfIdx(s.idx)}">Ota mukautus takaisin</button></div>`:"");
  const editedBox = first && edits[isoOfIdx(s.idx)] && !edits[isoOfIdx(s.idx)].ev && !s.reason ? `<div class="adapt off"><span>${edits[isoOfIdx(s.idx)].sw?"⇄ Laji vaihdettu":"✏️ Muokattu"}. Alkuperäinen: ${TYPES[PLAN[s.idx][0]].l}${PLAN[s.idx][1]?`, ${esc(PLAN[s.idx][1])}`:""}</span><button class="link" data-unedit="${isoOfIdx(s.idx)}">Palauta</button></div>` : "";
  const prog = /lihaskunto|Tribe|Kuntopiiri/i.test(text)&&!(l&&l.strength) ? progFromText(text,weekOf(s.idx)) : null;
  const logged = l&&l.status&&l.status!=="note";
  const canMove = s.code!=="L" && !s.moved && s.idx<BASE.length-1 && !logged;
  const ia=(attrs,ic,lbl)=>`<button class="ia" ${attrs}><span aria-hidden="true">${ic}</span>${lbl}</button>`;
  const head=`${first?"":`<div class="eyebrow">Lisäksi: siirretty eiliseltä</div>`}`;
  if(l&&l.status==="moved") return `<div class="sess compact">${head}<div class="today-title"><h3>${TYPES[s.code].l}</h3><span class="state">→ Siirretty huomiselle</span></div><p class="tip">${esc(text)}</p><div class="row"><button class="btn small" data-unmove="${s.key}">Peru siirto</button><button class="btn small ghost" data-open="${s.key}" data-mode="vointi">♥ Vointi</button></div></div>`;
  if(logged){ const quick=l.status==="done"&&(l.quick||(l.km==null&&l.min==null));
    return `<div class="sess compact">${head}<div class="today-title"><h3>${TYPES[s.code].l}</h3>${stateLabel(l)}</div><p class="tip">${esc(text)}</p><div class="iconacts">${ia(`data-open="${s.key}"`,quick?"＋":"✎",quick?"Lisää tiedot":"Muokkaa")}${ia(`data-open="${s.key}" data-mode="vointi"`,"♥","Vointi")}${prog&&l.status==="done"?ia(`data-gostrength="${prog}"`,"💪",`Lihas ${prog}`):""}${l.status==="done"?ia(`data-undone="${s.key}"`,"↺","Peru"):""}</div></div>`; }
  let acts;
  if(s.code==="L") acts=`<div class="iconacts">${ia(`data-open="${s.key}" data-mode="vointi"`,"♥","Vointi")}${ia(`data-logfree="${s.idx}"`,"＋","Kirjaa liikunta")}</div>`;
  else if(ti!=null && s.idx>ti) acts=`<div class="iconacts">${ia(`data-open="${s.key}"`,"✎","Avaa")}${canMove?ia(`data-move="${s.key}"`,"→","Huomiselle"):""}${!s.moved&&s.code!=="R"?ia(`data-swap="${s.idx}"`,"⇄","Vaihda laji"):""}</div>`;
  else acts=`<button class="btn primary big" data-quick="${s.key}">✓ Tehty</button><div class="iconacts">${ia(`data-open="${s.key}" data-pre="skip"`,"✕","Väliin")}${canMove?ia(`data-move="${s.key}"`,"→","Huomiselle"):""}${!s.moved&&s.code!=="R"?ia(`data-swap="${s.idx}"`,"⇄","Vaihda laji"):""}${prog?ia(`data-gostrength="${prog}"`,"💪",`Lihas ${prog}`):""}${ia(`data-open="${s.key}" data-mode="vointi"`,"♥","Vointi")}</div>`;
  return `<div class="sess${first?"":" extra"}">${head}
    <div class="today-title"><h2>${TYPES[s.code].l}</h2>${stateLabel(l)}</div>${adaptBox}${editedBox}
    ${wxBox(s)}<p class="target">${esc(text)}</p>${zoneChip(s)}${millChip(s)}${s.note&&!s.moved?`<p class="tip">📌 ${esc(s.note)}</p>`:""}
    <div class="acts">${acts}</div></div>`;
}
const RACES={B:{idx:()=>bIdx(),get name(){ return bHalf()?"Belgradin puolimaraton":"Belgradin maraton"; },get start(){ return bHalf()?"la 17.4. klo 9.00":"su 18.4. klo 8.00"; },lat:44.8125,lon:20.4612,place:"Belgrad",
    chk:["Numerolappu noudettu expolta","Kengät ja sukat testattu pitkällä lenkillä","Geelit + 1 varalle","Kisa-asu valmiina sään mukaan","Hiertymävoide ja teipit","Aamupala sovittu klo 5","Lähtöalue ja kulku katsottu","Kello ladattu","Palautumisvaatteet ja juoma maaliin"],
    plan:[[7,4,"Kevyet lenkit. Ei uusia kenkiä, ruokia tai treenejä."],[3,1,"Hiilaritankkaus: pasta, riisi, leipä, vähemmän kuitua. Juo tasaisesti."],[1,1,"15 min hölkkä + 3 lyhyttä vetoa. Varusteet esille, numerolappu paitaan, nukkumaan ajoissa."],[0,0,"Herätys 5.00, aamupala klo 5, lähtöalueella 7.30. 5 min juoksu / 1 min kävely alusta asti."]]},
  N:{idx:()=>NUTS,name:"Nuts 66 km",start:"pe 23.7. klo 15.00 Hetta",lat:68.383,lon:23.633,place:"Hetta",
    chk:["Pakolliset varusteet pakattu (Opas → Nutsin varusteet)","Juomareppu: 1,5 l pullot/pussit testattu","Tankkaus: noin 50 g/h × 10 h ≈ 500 g hiilaria","Kuljetus Hettaan ja majoitus","Nouto Pallakselta sovittu","Hyttyskarkote ja aurinkorasva","Varavaatteet maaliin","Kello ja puhelin ladattu, varavirta"],
    plan:[[7,3,"Kevyet lenkit ja kävelyt. Ei mäkivetoja."],[2,1,"Matka Lappiin. Hiilaripainotteinen ruoka, juo hyvin."],[0,0,"Lounas klo 11–12, välipala klo 14, lähtö klo 15. Ylämäet kävellen, ensimmäinen tunti liian helposti."]]}};
function raceSoon(ti){ for(const k of ["B","N"]){ const d=RACES[k].idx()-ti; if(d>=0&&d<=7) return {k,d,R:RACES[k]}; } return null; }
function renderRaceWeek(ti){ const el=$("raceWeek"); const rs=raceSoon(ti); if(!rs){ el.hidden=true; return; } el.hidden=false; const {k,d,R}=rs;
  const done=(meta.rck&&meta.rck[k])||{}; const n=R.chk.filter((_,i)=>done[i]).length;
  const today=R.plan.find(([a,b])=>d<=a&&d>=b);
  const P=k==="B"?predictMarathon(ti):null;
  el.innerHTML=`<div class="rwhead"><div><div class="eyebrow">Kisaviikko</div><h2>${R.name}</h2><p class="tip">${R.start}</p></div><div class="rwcount"><b class="num">${d}</b><span>${d===0?"tänään!":d===1?"päivä":"päivää"}</span></div></div>
    ${today?`<p class="target">${esc(today[2])}</p>`:""}
    ${P?`<p class="tip">Arvio ${hm(P.lo)} – ${hm(P.hi)} · tavoitevauhti ${pace(1,P.pace)}/km</p>`:""}
    <div class="rwwx" id="raceWx"><span class="tip">Sää: ${R.place}…</span></div>
    <details class="fold"${n<R.chk.length?" open":""}><summary>Tarkistuslista ${n}/${R.chk.length}</summary><div class="rchk">${R.chk.map((x,i)=>`<label class="chk"><input type="checkbox" data-rck="${k}:${i}" ${done[i]?"checked":""}> ${esc(x)}</label>`).join("")}</div></details>
    <details class="fold"><summary>Aikataulu</summary><ul class="up">${R.plan.map(([a,b,txt])=>`<li><time>${a===0?"Kisapäivä":a===b?`${a} pv ennen`:`${a}–${b} pv ennen`}</time><span>${esc(txt)}</span></li>`).join("")}</ul></details>`;
  loadRaceWx(R, RACES[k].idx());
}
document.addEventListener("change",e=>{ const c=e.target.closest("[data-rck]"); if(!c) return; const [k,i]=c.dataset.rck.split(":"); meta.rck=meta.rck||{}; meta.rck[k]=meta.rck[k]||{}; meta.rck[k][i]=c.checked; persist(); render(); });
async function loadRaceWx(R, ridx){ const day=isoOfIdx(ridx); const ck="pallas.racewx."+day; const c=load(ck,null); const show=d=>{ const el=$("raceWx"); if(!el) return; if(!d){ el.innerHTML=`<span class="tip">Kisapäivän ennuste tulee näkyviin lähempänä.</span>`; return; }
    el.innerHTML=`<span class="tip">Ennuste ${R.place} ${fmt(ridx)}: <b>${Math.round(d.tmin)}–${Math.round(d.tmax)} °C</b> · ${WCODE[d.code]||""} · sade ${d.pp??"–"} % · tuuli ${Math.round(d.wind)} m/s</span>`; };
  if(c&&Date.now()-c.t<3*3600e3){ show(c.d); return; }
  try{ const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${R.lat}&longitude=${R.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max&wind_speed_unit=ms&timezone=auto&start_date=${day}&end_date=${day}`); if(!r.ok){ show(null); return; } const j=await r.json(); const D=j.daily; if(!D||!D.time||!D.time.length){ show(null); return; }
    const d={tmin:D.temperature_2m_min[0],tmax:D.temperature_2m_max[0],pp:D.precipitation_probability_max[0],code:D.weather_code[0],wind:D.wind_speed_10m_max[0]}; if(typeof d.tmax!=="number"){ show(null); return; } try{ localStorage.setItem(ck,JSON.stringify({t:Date.now(),d})); }catch(e){} show(d); }catch(e){ show(null); } }
function renderToday(t,ti){ const d=selDay==null?t:selDay; const w=weekOf(d);
  const label = d!==t ? fmt(d) : ti<0?"Ohjelma alkaa":ti>t?"Viimeinen päivä":`Tänään · ${fmt(d)}`;
  $("today").closest(".hero").classList.toggle("other", d!==t);
  $("today").innerHTML=`<div class="herohead"><div class="eyebrow">${label} · vk ${w} · ${PHASE(w)}</div>${d!==t?`<button class="link" data-seltoday>‹ Tänään</button>`:""}</div>`+sessionsOn(BASE,logs,ADAPT,d).map((s,k)=>sessionBlock(s,k===0,ti)).join("")+extrasOn(d).map(extraBlock).join(""); }
let keepSel=false;
function quickDone(key){ const s=sessionByKey(key), l=logs[key]||{}; logs[key]={...l,status:"done",type:s.code,km:l.km??null,min:l.min??null,flags:l.flags||[],note:l.note||"",quick:true,updatedAt:new Date().toISOString()}; persist(); render(); celebrate(); toast(stravaConnected()?"Tehty ✓ Strava täydentää km:t.":"Tehty ✓",{l:"Peru",fn:()=>undone(key)}); }
function undone(key){ const l=logs[key]; if(!l) return; const keep=flagsOf(l).length||l.rhr!=null||l.sleepH!=null||l.note; if(l.stravaId){ toast("Stravasta tullutta treeniä ei voi perua tästä. Avaa treeni ja tyhjennä."); return; } if(keep){ logs[key]={flags:l.flags||[],rhr:l.rhr??null,sleepH:l.sleepH??null,note:l.note||"",feel:null,status:"note",type:l.type,updatedAt:new Date().toISOString()}; } else delete logs[key]; persist(); render(); }
function unmove(key){ const s=sessionByKey(key), l=logs[key]; if(!l) return; if(logs[isoOfIdx(s.idx+1)+"~m"]){ toast("Siirretty treeni on jo kirjattu huomiselle. Tyhjennä se ensin."); return; } const keep=flagsOf(l).length||l.rhr!=null||l.sleepH!=null||l.note; if(keep){ const {movedTo,...rest}=l; logs[key]={...rest,status:"note"}; } else delete logs[key]; persist(); render(); toast("Siirto peruttu."); }
function moveTomorrow(key){ const s=sessionByKey(key), l=logs[key]; logs[key]={...(l||{}),status:"moved",type:s.code,movedTo:isoOfIdx(s.idx+1),updatedAt:new Date().toISOString()}; persist(); render(); toast("Siirretty huomiselle.",{l:"Peru",fn:()=>unmove(key)}); }
document.addEventListener("click",e=>{
  const mv=e.target.closest("[data-move]"); if(mv){ moveTomorrow(mv.dataset.move); return; }
  const qk=e.target.closest("[data-quick]"); if(qk){ quickDone(qk.dataset.quick); return; }
  const um=e.target.closest("[data-unmove]"); if(um){ unmove(um.dataset.unmove); return; }
  const ud=e.target.closest("[data-undone]"); if(ud){ undone(ud.dataset.undone); return; }
  const cl=e.target.closest("[data-cal]"); if(cl){ const i=+cl.dataset.cal; selDay=i===T0()?null:i; viewWeek=weekOf(i); keepSel=true; location.hash="#tanaan"; return; }
  const sd=e.target.closest("[data-sel]"); if(sd&&lpFired){ lpFired=false; return; }
  if(sd&&moveFrom!=null){ const j=+sd.dataset.sel; if(j===moveFrom){ moveFrom=null; render(); toast("Siirto peruttu."); } else if(canSwap(j)) doSwap(moveFrom,j); else toast("Tähän päivään ei voi siirtää."); return; }
  if(sd){ const i=+sd.dataset.sel; selDay = i===T0()?null:i; render(); const h=document.querySelector(".hero"); if(h&&h.getBoundingClientRect().top<0) h.scrollIntoView({behavior:"smooth",block:"start"}); return; }
  if(e.target.closest("[data-seltoday]")){ selDay=null; viewWeek=weekOf(T0()); render(); }
});
function renderTrail(st){
  const frac=Math.min(1,st.done/TOTAL_SESSIONS), d="M14,118 C52,112 60,70 96,74 S140,112 170,96 S206,40 236,48 S268,96 296,86 S334,30 366,26";
  $("trail").innerHTML=`<div class="eyebrow">Matkalla Pallakselle · ${st.done}/${TOTAL_SESSIONS} treeniä</div><svg viewBox="0 0 380 150" role="img" aria-label="Edistyminen Hetasta Pallakselle ${Math.round(frac*100)} prosenttia"><path d="M0,150 L0,120 L40,108 L80,70 L110,82 L150,104 L190,60 L230,34 L262,70 L292,78 L330,28 L360,14 L380,22 L380,150 Z" fill="var(--fell)" opacity=".12"/><path id="trailPath" d="${d}" fill="none" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/><path id="trailDone" d="${d}" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round"/><g id="stations"></g><g id="deer"><circle r="15" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/><text text-anchor="middle" dy="6" font-size="17">🦌</text></g></svg>`;
  const p=$("trailPath"),len=p.getTotalLength(); $("trailDone").setAttribute("stroke-dasharray",`${len*frac} ${len}`); let sh="";
  STATIONS.forEach(([f,name],k)=>{ const pt=p.getPointAtLength(len*f),ok=frac>=f; sh+=`<circle cx="${pt.x}" cy="${pt.y}" r="4.5" fill="${ok?"var(--accent)":"var(--surface)"}" stroke="${ok?"var(--accent)":"var(--muted)"}" stroke-width="1.5"/><text x="${pt.x}" y="${pt.y+(k%2?-12:20)}" text-anchor="${k===0?"start":k===STATIONS.length-1?"end":"middle"}" font-size="10.5" font-weight="${ok?700:400}" fill="var(--${ok?"ink":"muted"})">${name}</text>`; });
  $("stations").innerHTML=sh; const dp=p.getPointAtLength(len*frac); $("deer").setAttribute("transform",`translate(${dp.x},${dp.y-2})`);
}
function markFor(s){ const l=logs[s.key]; const fl=flagsOf(l);
  if(!l) return s.code==="L"?"":`<span class="mark" aria-label="kirjaamatta"></span>`;
  if(fl.includes("sick")) return `<span class="mark" aria-label="sairas">🤒</span>`;
  if(l.status==="moved") return `<span class="mark" aria-label="siirretty">→</span>`;
  if(l.status==="done") return `<span class="mark done${fl.includes("pain")?" pain":""}" aria-label="tehty">✓</span>`;
  if(l.status==="skip") return `<span class="mark skip" aria-label="väliin">–</span>`;
  return `<span class="mark" aria-label="kirjattu">📝</span>`; }
function extrasOn(i){ const d=isoOfIdx(i); return Object.keys(logs).filter(k=>k.startsWith(d+"~s")||k.startsWith(d+"~f")).sort().map(sessionByKey); }
function extraBlock(s){ const l=logs[s.key]||{}; const bits=[typeof l.km==="number"?`${n1(l.km)} km`:"", l.min?`${l.min} min`:"", l.hr?`♥ ${l.hr}`:""].filter(Boolean).join(" · ");
  return `<button class="xtra" data-open="${s.key}"><span class="type ${TYPES[s.code].c}">${TYPES[s.code].l}</span><span><b>${TYPES[s.code]?TYPES[s.code].l:"Lisäliikunta"}</b>${l.stravaName?` · ${esc(l.stravaName)}`:""}<small>${bits}</small></span><span aria-hidden="true">›</span></button>`; }
function estMin(code,text){ const m=(text||"").match(/(\d+)(?:[–-](\d+))?\s?min/); if(m) return +(m[2]||m[1]); const h=(text||"").match(/(\d+(?:[,.]\d+)?)(?:[–-](\d+(?:[,.]\d+)?))?\s?h\b/); if(h) return Math.round(parseFloat((h[2]||h[1]).replace(",","."))*60); const k=(text||"").match(/(\d+(?:[,.]\d+)?)\s?km/); if(k) return Math.round(parseFloat(k[1].replace(",","."))*7.5); return code==="L"?0:40; }
function isKey(i){ const r=(BASE[i]||[]); return ["P","YM","X","R"].includes(r[0]) || (RUN.has(r[0])&&hasIntensity(r[1])); }
function weekGoals(w){ const a0=(w-1)*7-1; let mod=0, vig=0, n=0; const sDays=new Set(); let keyN=0,keyD=0;
  for(let i=Math.max(0,a0);i<=a0+6;i++){ if(i<BASE.length&&isKey(i)){ keyN++; const l=logs[isoOfIdx(i)]; if(l&&l.status==="done") keyD++; } }
  for(const k in logs){ const i=idxOfISO(k); if(i<a0||i>a0+6||i<0) continue; const l=logs[k]; if(l.status!=="done") continue; const code=logType(BASE,k,l); if(code==="L") continue;
    const txt=(BASE[i]&&!/~/.test(k))?BASE[i][1]:""; const min=(typeof l.min==="number"&&l.min>0)?l.min:estMin(code,txt); n++;
    if(VIG.has(code)) vig+=min; else mod+=min;
    if(l.strength||l.strengthStravaId||["K","SA","T","TL"].includes(code)||/lihaskunto/i.test(txt)) sDays.add(k.slice(0,10));
    if(l.strengthMin) mod+=l.strengthMin; }
  const act=mod+2*vig; return {act:Math.round(act), mod, vig, n, strength:sDays.size, keyN, keyD}; }
function ring(pct,cls){ const r=17,c=2*Math.PI*r, p=Math.max(0,Math.min(1,pct)); return `<svg class="ring ${cls}" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" class="rbg"/><circle cx="22" cy="22" r="${r}" class="rfg" stroke-dasharray="${(c*p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/>${p>=1?`<text x="22" y="27" text-anchor="middle">✓</text>`:""}</svg>`; }
function goalsHTML(w, act, tgt){ const G=weekGoals(w); const kmP=tgt?act/tgt:0;
  return `<div class="goals">
    <div class="goal"><div class="gh">${ring(kmP,"r-nuts")}<div><b>Nuts</b><span class="num">${n1(act)} / ${tgt} km</span></div></div><small>Avaintreenit ${G.keyD}/${G.keyN}</small></div>
    <button class="goal" data-logfree="" aria-label="Terveys: kirjaa liikuntaa"><div class="gh">${ring(G.act/150,"r-health")}<div><b>Terveys</b><span class="num">${G.act} / 150 min</span></div></div><small>Lihaskunto ${Math.min(G.strength,2)}/2 · ＋ kirjaa</small></button>
  </div>`; }
function slimGoal(w,act,tgt){ const G=weekGoals(w), pct=Math.min(100,tgt?act/tgt*100:0);
  return `<div class="kmbar"><div class="lbl"><span><b class="num">${n1(act)}</b> / ${tgt} km</span><span>${G.keyN?`Avaintreenit ${G.keyD}/${G.keyN}`:""}</span></div><div class="track"><div class="fill" style="width:${pct}%"></div></div></div>`; }
function dayMark(ss){ const s=ss.find(x=>logs[x.key]&&logs[x.key].status!=="moved")||ss[0]; return markFor(s); }
function renderWeek(t){
  const w=viewWeek,[a,b]=weekRange(w),act=weekKm(BASE,logs,w),tgt=TARGET_EFF[w-1],pct=Math.min(100,tgt?act/tgt*100:0); const sel=selDay==null?t:selDay; let rows="", strip="";
  const a0=(w-1)*7-1;
  for(let i=a0;i<=a0+6;i++){
    if(i<0||i>=BASE.length){ strip+=`<span class="sd empty" aria-hidden="true"><span class="dw">${DOW[dow(i)]}</span></span>`; continue; }
    const d=new Date(START_UTC+i*864e5), ss=sessionsOn(BASE,logs,ADAPT,i), s0=ss[0], ci=changeInfo(s0);
    strip+=`<button class="sd${i===t?" today":""}${i===sel?" sel":""}${ci?" chg":""}" data-sel="${i}" aria-pressed="${i===sel}" aria-label="${fmt(i)}: ${TYPES[s0.code].l}"><span class="dw">${DOW[dow(i)]}</span><span class="dn num">${d.getUTCDate()}</span><span class="ty ${TYPES[s0.code].c}">${SHORT[s0.code]||""}</span>${i<=t?(dayMark(ss)||`<span class="mark none"></span>`):`<span class="mark none"></span>`}${(ss.length-1+extrasOn(i).length)>0?`<i class="plus">+${ss.length-1+extrasOn(i).length}</i>`:""}</button>`;
  }
  $("week").innerHTML=`<div class="weekhead"><div><div class="eyebrow">${PHASE(w)}${(w<=21&&!(w>=8&&w<=10))?" · 🏠 sisäkausi":""}</div><h2>Viikko ${w}</h2></div><div class="navbtns"><button data-addev="" aria-label="Lisää meno" title="Lisää meno">＋</button><button id="wPrev" aria-label="Edellinen viikko" ${w<=1?"disabled":""}>‹</button><button id="wNow" aria-label="Tämä viikko">•</button><button id="wNext" aria-label="Seuraava viikko" ${w>=36?"disabled":""}>›</button></div></div>
    <div class="strip" role="group" aria-label="Viikon päivät">${strip}</div>
    ${slimGoal(w,act,tgt)}${weekScaleControls(w,t)}`;
  if($("loadCtl")) $("loadCtl").ontoggle=e=>{ loadOpen=e.target.open; };
  $("wPrev").onclick=()=>weekGo(-1); $("wNext").onclick=()=>weekGo(1);
  if(moveFrom!=null) $("week").querySelectorAll(".sd[data-sel]").forEach(b=>{ const j=+b.dataset.sel; b.classList.toggle("mvfrom",j===moveFrom); b.classList.toggle("mvok",j!==moveFrom&&canSwap(j)); }); $("wNow").onclick=()=>{ viewWeek=weekOf(t); selDay=null; render(); };
}
let weekListOpen=false, moveFrom=null, lpT=null, lpFired=false, tx=null;
function weekGo(dw){ const t=T0(), sel=selDay==null?t:selDay; const nw=Math.min(36,Math.max(1,viewWeek+dw)); if(nw===viewWeek) return; const off=sel-((viewWeek-1)*7-1); viewWeek=nw; const ns=Math.min(BASE.length-1,Math.max(0,(nw-1)*7-1+off)); selDay= ns===t?null:ns; render(); }
function canSwap(j){ if(j<todayIdx()||j<0||j>=BASE.length) return false; const r=rawAt(j); if(r[0]==="R") return false; const l=logs[isoOfIdx(j)]; return !(l&&(l.status==="done"||l.status==="skip")); }
function startMove(i){ if(!canSwap(i)){ toast("Tätä päivää ei voi siirtää."); return; } moveFrom=i; if(navigator.vibrate) navigator.vibrate(25); render(); toast(`Siirrä ${fmt(i)}: napauta uutta päivää.`,{l:"Peru",fn:()=>{ moveFrom=null; render(); }}); }
function doSwap(i,j){ const di=isoOfIdx(i), dj=isoOfIdx(j), prev={[di]:edits[di],[dj]:edits[dj]}; const A=rawAt(i), B=rawAt(j);
  edits[di]={code:B[0],text:B[1],note:B[2]}; edits[dj]={code:A[0],text:A[1],note:A[2]}; moveFrom=null; persist(); render();
  toast(`Vaihdettu ${fmt(i)} ↔ ${fmt(j)}`,{l:"Peru",fn:()=>{ for(const k in prev){ if(prev[k]) edits[k]=prev[k]; else delete edits[k]; } persist(); render(); }}); }
(function(){ const W=$("week");
  W.addEventListener("touchstart",e=>{ const t=e.touches[0]; tx={x:t.clientX,y:t.clientY,strip:!!e.target.closest(".strip")}; const sd=e.target.closest(".sd[data-sel]"); lpFired=false; clearTimeout(lpT); if(sd) lpT=setTimeout(()=>{ lpFired=true; startMove(+sd.dataset.sel); },550); },{passive:true});
  W.addEventListener("touchmove",e=>{ if(!tx) return; const t=e.touches[0]; if(Math.abs(t.clientX-tx.x)>10||Math.abs(t.clientY-tx.y)>10) clearTimeout(lpT); },{passive:true});
  W.addEventListener("touchend",e=>{ clearTimeout(lpT); if(!tx) return; const t=e.changedTouches[0], dx=t.clientX-tx.x, dy=t.clientY-tx.y; if(tx.strip&&Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){ lpFired=true; weekGo(dx<0?1:-1); } tx=null; });
  W.addEventListener("contextmenu",e=>{ if(e.target.closest(".sd")) e.preventDefault(); });
})();
let calScrolled=false, calFilter="all";
let calPastOpen=false;
function renderCalendar(t){
  const cw=weekOf(t); let h="", lastPh=null;
  const want=c=> calFilter==="all" || (calFilter==="run"&&RUN.has(c)) || (calFilter==="key"&&(c==="P"||c==="X"||c==="R"));
  // menneet viikot yhteen riviin
  if(cw>1){ let km=0, pl=0, dn=0, met=0; for(let w=1;w<cw;w++){ const a=weekKm(BASE,logs,w); km+=a; if(TARGET_EFF[w-1]&&a>=TARGET_EFF[w-1]*0.9) met++; }
    for(let i=0;i<(cw-1)*7-1&&i<BASE.length;i++){ const c=sessionsOn(BASE,logs,ADAPT,i)[0].code; if(c==="L") continue; pl++; const l=logs[isoOfIdx(i)]; if(l&&l.status==="done") dn++; }
    h+=`<button class="calpast" id="calPast" aria-expanded="${calPastOpen}"><span><b>Vk 1–${cw-1}</b> · ${n1(km)} km · ${dn}/${pl} treeniä · tavoite täynnä ${met}/${cw-1} viikkona</span><span aria-hidden="true">${calPastOpen?"▴":"▾"}</span></button>`; }
  for(let w=calPastOpen?1:cw;w<=36;w++){
    const a0=(w-1)*7-1, ph=PHASE(w); if(ph!==lastPh){ h+=`<div class="calphase">${esc(ph)}</div>`; lastPh=ph; }
    const act=weekKm(BASE,logs,w), tgt=TARGET_EFF[w-1]; let cells="";
    for(let i=a0;i<=a0+6;i++){
      if(i<0||i>=BASE.length){ cells+=`<span class="cc empty"></span>`; continue; }
      const ss=sessionsOn(BASE,logs,ADAPT,i), s0=ss[0], note=BASE[i][2], c=s0.code, dim=!want(c), chg=changeInfo(s0)||(edits[isoOfIdx(i)]&&!edits[isoOfIdx(i)].ev);
      cells+=`<button class="cc${i===t?" today":""}${i<t?" past":""}${dim?" dim":""}${c==="R"?" race":""}${chg?" chg":""}" data-cal="${i}" aria-label="${fmt(i)}: ${TYPES[c].l}${chg?", muutettu":""}${note?`, ${esc(note)}`:""}"><span class="dn num">${new Date(START_UTC+i*864e5).getUTCDate()}</span><span class="ty ${TYPES[c].c}">${SHORT[c]||""}</span>${i<=t?dayMark(ss)||`<span class="mark none"></span>`:note?`<span class="cn" aria-hidden="true">📌</span>`:`<span class="mark none"></span>`}${extrasOn(i).length?`<i class="plus">+${extrasOn(i).length}</i>`:""}</button>`;
    }
    const past=w<cw, met=tgt?act>=tgt*0.9:true;
    h+=`<div class="calwk${w===cw?" cur":""}${past?(met?" met":" short"):""}" id="cw${w}"><div class="cwh"><b>Vk ${w}</b><span>${fmtShort(Math.max(0,a0))}–${fmtShort(Math.min(BASE.length-1,a0+6))}</span><span class="cwk num">${past&&met?"✓ ":""}${w<=cw?`${n1(act)} / `:""}${tgt} km</span></div><div class="calgrid">${cells}</div></div>`;
  }
  h+=`<p class="tip callegend"><span class="lg-chg"></span> ohjelmaa muutettu · ✓ tehty · ⊖ väliin · ○ kirjaamatta</p>`;
  $("calBody").innerHTML=h;
  if($("calPast")) $("calPast").onclick=()=>{ calPastOpen=!calPastOpen; render(); if(!calPastOpen){ const el=$("cw"+cw); if(el) el.scrollIntoView({block:"center"}); } };
  document.querySelectorAll("#calFilters [data-cf]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.cf===calFilter)));
  if(!calScrolled){ calScrolled=true; const el=$("cw"+cw); if(el&&cw>2) setTimeout(()=>el.scrollIntoView({block:"start"}),30); }
}
$("calFilters").onclick=e=>{ const b=e.target.closest("[data-cf]"); if(!b) return; calFilter=b.dataset.cf; render(); };
$("calNow").onclick=()=>{ if(calPastOpen){ calPastOpen=false; render(); } const el=$("cw"+weekOf(T0())); if(el) el.scrollIntoView({behavior:"smooth",block:"center"}); };
function renderProfile(t){
  const W=380,H=220,pl=26,pr=8,pt=26,pb=26,pw=W-pl-pr,ph=H-pt-pb,max=75,x=w=>pl+(w-1)*(pw/35),y=v=>pt+ph-v/max*ph,cw=weekOf(t);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Viikkokilometrit: tavoite ja toteuma">`;
  [0,25,50,75].forEach(v=>{ s+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-5}" y="${y(v)+4}" text-anchor="end" font-size="10" fill="var(--muted)">${v}</text>`; });
  let r=`M${x(1)},${y(0)} `; TARGET.forEach((v,i)=>r+=`L${x(i+1)},${y(v)} `); r+=`L${x(36)},${y(0)} Z`; s+=`<path d="${r}" fill="var(--line)" opacity=".75"/>`;
  let ln=""; TARGET.forEach((v,i)=>ln+=(i?"L":"M")+`${x(i+1)},${y(v)} `); s+=`<path d="${ln}" fill="none" stroke="var(--fell)" stroke-width="1.5"/>`; const bw=pw/35*.62;
  for(let w=1;w<=Math.min(cw,36);w++){ const a=weekKm(BASE,logs,w); if(a<=0) continue; const h=Math.min(a,max)/max*ph; s+=`<rect x="${x(w)-bw/2}" y="${pt+ph-h}" width="${bw}" height="${h}" rx="2" fill="var(--accent)" opacity="${w===cw?.55:1}"><title>Vk ${w}: ${a} / ${TARGET[w-1]} km</title></rect>`; }
  const flag=(w,l)=>{ s+=`<line x1="${x(w)}" x2="${x(w)}" y1="${y(TARGET[w-1])}" y2="${pt-6}" stroke="var(--ink)"/><text x="${x(w)}" y="${pt-10}" text-anchor="${w>30?"end":"middle"}" font-size="11" font-weight="700" fill="var(--ink)">${l}</text>`; };
  flag(22,"Belgrad 42 km"); flag(36,"Nuts 66 km");
  s+=`<line x1="${x(cw)}" x2="${x(cw)}" y1="${pt}" y2="${pt+ph}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${x(cw)+4}" y="${pt+12}" font-size="10" font-weight="700" fill="var(--accent)">nyt</text>`;
  const MON=["tam","hel","maa","huh","tou","kes","hei","elo","syy","lok","mar","jou"]; let lm=-1;
  for(let w=1;w<=36;w++){ const d=new Date(START_UTC+((w-1)*7-1)*864e5),m=d.getUTCMonth(); if(m!==lm){ s+=`<text x="${x(w)}" y="${H-8}" font-size="10" fill="var(--muted)">${MON[m]}</text>`; lm=m; } }
  $("profile").innerHTML=s+"</svg>";
}
function renderUpcoming(t){ const it=[]; for(let i=t+1;i<=Math.min(BASE.length-1,t+21);i++){ const [c,text,note]=BASE[i]; if(c==="X"||c==="R"||note) it.push(`<li><time>${fmt(i)}</time><span>${c==="X"||c==="R"?`<b>${TYPES[c].l}:</b> `:""}${esc(note||text)}</span></li>`); }
  $("upcoming").innerHTML=it.slice(0,4).join("")||`<li><span class="note">Ei erityisiä päiviä lähiviikkoina.</span></li>`; }
function renderHistory(st){
  let es=entries().filter(e=>e.l.status!=="moved"); const f=hist.filter,q=hist.q.trim().toLowerCase();
  if(f==="run") es=es.filter(e=>RUN.has(e.code)); if(f==="other") es=es.filter(e=>!RUN.has(e.code)&&e.code!=="L");
  if(f==="health") es=es.filter(e=>flagsOf(e.l).some(x=>x!=="great")); if(f==="skip") es=es.filter(e=>e.l.status==="skip");
  if(q) es=es.filter(e=>(e.l.note||"").toLowerCase().includes(q)||TYPES[e.code].l.toLowerCase().includes(q)||(e.l.painArea||"").includes(q));
  es.sort({date:(a,b)=>a.key<b.key?1:-1,km:(a,b)=>(b.l.km||0)-(a.l.km||0),feel:(a,b)=>(a.l.feel||9)-(b.l.feel||9)}[hist.sort]);
  $("hTiles").innerHTML=[["Juostu",`${n1(st.km)} km`],["Treenejä",st.done],["Pisin",st.longest?`${n1(st.longest)} km`:"–"],["Keskivauhti",st.avgPace?`${st.avgPace}/km`:"–"],["Nousua",st.elev?`${Math.round(st.elev)} m`:""],["Paras putki",st.best]].filter(([,b])=>b!==""&&b!=="–"&&b!==0).map(([a,b])=>`<div class="tile"><span>${a}</span><b class="num">${b}</b></div>`).join("");
  document.querySelectorAll("#hFilters button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===f));
  let lastTW=null; const body=es.map(e=>{ const l=e.l,fl=flagsOf(l); const w=weekOf(e.idx); const gh=hist.sort==="date"&&w!==lastTW?`<tr class="wkrow"><td colspan="13">__WK${w}__</td></tr>`:""; lastTW=w; return gh+`<tr data-open="${e.key}" tabindex="0"><td class="num">${fmtShort(e.idx)}${e.key.endsWith("~m")?"→":""}</td><td>${typeChip(e.code)}${l.stravaId?' <span class="stv" title="Strava">S</span>':""}${l.strength?` 💪${l.strength}`:""}${l.stravaName?`<br><small class="sn">${esc(l.stravaName)}</small>`:""}</td><td>${l.status==="done"?"✓":l.status==="skip"?"väliin":"📝"}</td><td class="num r">${typeof l.km==="number"?n1(l.km):""}</td><td class="num r">${typeof l.min==="number"?l.min:""}</td><td class="num r">${pace(l.km,l.min)}</td><td class="num r">${l.hr||""}</td><td class="num r">${l.elev??""}</td><td>${l.feel?FEEL[l.feel-1][1]:""}</td><td>${fl.map(x=>FLAG_L[x].split(" ")[0]).join("")}${l.painArea?` ${esc(l.painArea)}`:""}</td><td class="num r">${l.rhr||""}</td><td class="num r">${l.sleepH?n1(l.sleepH):""}</td><td class="nt">${esc(l.note||"")}</td></tr>`; }).join("");
  const cardArr=es.map(e=>{ const l=e.l,fl=flagsOf(l); const bits=[l.status==="done"?"✓":l.status==="skip"?"väliin":"📝", typeof l.km==="number"?`${n1(l.km)} km`:"", typeof l.min==="number"?`${l.min} min`:"", pace(l.km,l.min)?`${pace(l.km,l.min)}/km`:"", l.hr?`♥ ${l.hr}${tooHard(e)?" ⚠︎":""}`:"", l.elev?`↗ ${l.elev} m`:""].filter(Boolean).join(" · ").replace(/^(✓|📝) · /,"$1 ");
    return `<li class="hcard" data-open="${e.key}" tabindex="0"><span class="hd">${fmtShort(e.idx)}<small>${DOW[dow(e.idx)]}</small></span><span class="hm"><span>${typeChip(e.code)}${l.stravaId?' <span class="stv">S</span>':""}${l.strength?` 💪${l.strength}`:""} ${fl.map(x=>FLAG_L[x].split(" ")[0]).join("")}</span><span class="hs">${bits}</span>${l.stravaName||l.note?`<span class="hn">${esc(l.stravaName||"")}${l.stravaName&&l.note?" · ":""}${esc(l.note||"")}</span>`:""}</span></li>`; });
  const byDate=hist.sort==="date"; const wk=e=>weekOf(e.idx); const wsum={};
  if(byDate) es.forEach(e=>{ const w=wk(e); const o=wsum[w]=wsum[w]||{km:0,n:0}; if(e.l.status==="done"){ o.n++; if(typeof e.l.km==="number") o.km+=e.l.km; } });
  const whead=w=>`Vk ${w}<span>${n1(wsum[w].km)} km · ${wsum[w].n} treeni${wsum[w].n===1?"":"ä"}</span>`;
  let lastW=null; const cardsG=byDate?es.map((e,k)=>{ const w=wk(e); const h=w!==lastW?`<li class="wkhead">${whead(w)}</li>`:""; lastW=w; return h+cardArr[k]; }).join(""):cardArr.join("");
  $("hCards").innerHTML=cardsG;
  const bodyG=body.replace(/__WK(\d+)__/g,(_,w)=>wsum[w]?whead(+w):`Vk ${w}`);
  $("hTable").innerHTML=es.length?`<table><thead><tr><th>Pvm</th><th>Treeni</th><th>Tila</th><th class="r">km</th><th class="r">min</th><th class="r">min/km</th><th class="r">syke</th><th class="r">nousu m</th><th>Fiilis</th><th>Vointi</th><th class="r">leposyke</th><th class="r">uni h</th><th>Muistiinpano</th></tr></thead><tbody>${bodyG}</tbody></table>`:`<p class="note">${Object.keys(logs).length?"Ei osumia tällä suodatuksella.":"Ei vielä kirjauksia."}</p>`;
}
function spark(vals,{min,max,w=320,h=96,color="var(--accent)",label,fmtv=v=>Math.round(v)}){ const pts=vals.map((v,i)=>v==null?null:[i/(vals.length-1)*w, h-(v-min)/(max-min||1)*h]); let d="",on=false;
  pts.forEach(p=>{ if(!p){on=false;return;} d+=(on?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)+" "; on=true; });
  const last=[...pts].reverse().find(Boolean);
  return `<svg viewBox="-4 -6 ${w+8} ${h+12}" class="spark" role="img" aria-label="${label}"><line x1="0" x2="${w}" y1="0" y2="0" stroke="var(--line)" stroke-dasharray="2 4"/><line x1="0" x2="${w}" y1="${h}" y2="${h}" stroke="var(--line)"/><text x="${w}" y="10" text-anchor="end" font-size="11" fill="var(--muted)">${fmtv(max)}</text><text x="${w}" y="${h-4}" text-anchor="end" font-size="11" fill="var(--muted)">${fmtv(min)}</text><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>${last?`<circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${color}"/>`:""}</svg>`; }
function renderAnalysis(ti,st,t0){
  document.querySelectorAll("[data-agroup]").forEach(g=>g.hidden=g.dataset.agroup!==anaTab);
  document.querySelectorAll("[data-atab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.atab===anaTab)));
  if(anaTab==="matka"){ renderTrail(st); renderProfile(t0); }
  renderWeeklyList(ti);
  const t=Math.min(Math.max(ti,0),BASE.length-1);
  // mukautukset
  const ad=Object.keys(ADAPT).map(Number).filter(i=>i>=t&&i<=t+14).sort((a,b)=>a-b);
  const ad2=[...new Set(ad.concat(Object.keys(SCALED).map(Number).filter(i=>i>=t&&i<=t+14)))].sort((a,b)=>a-b);
  $("aAdapt").innerHTML=ad2.length?`<ul class="up">${ad2.map(i=>{ const s0=sessionsOn(BASE,logs,ADAPT,i)[0]; const c=changeInfo(s0); return c?`<li><time>${fmt(i)}</time><span><span class="adtag k-${c.kind}">${esc(c.head)}</span> ${esc(c.chips.join(" · "))}<br><small class="sn">${esc(c.reasons.join(" + "))}</small></span></li>`:""; }).join("")}</ul>`:`<p class="note">Ei muutoksia.</p>`;
  // kuorma
  const lr=loadRatio(BASE,logs,ti); const lw=weekOf(ti)-1; const last4=[]; for(let w=Math.max(1,lw-3);w<=Math.max(1,lw);w++) last4.push([w,weekKm(BASE,logs,w),TARGET[w-1]]);
  const comp = last4.length? Math.round(last4.reduce((a,x)=>a+x[1],0)/Math.max(1,last4.reduce((a,x)=>a+x[2],0))*100):0;
  const elevW=w=>{ const [a,z]=weekRange(w); let s2=0; for(const k in logs){ const i=idxOfISO(k); if(i>=a&&i<=z&&logs[k].status==="done"&&typeof logs[k].elev==="number") s2+=logs[k].elev; } return Math.round(s2); };
  $("aPred").innerHTML=predictionHTML(ti,true); $("aPredT").textContent=bHalf()?"Puolimaratonin aika-arvio":"Belgradin aika-arvio"; $("aCont").innerHTML=contHTML(ti); $("aCps").innerHTML=cpHTML(ti);
  $("aLoad").innerHTML=`<div class="tiles"><div class="tile"><span>Nousu tällä vk</span><b class="num">${elevW(weekOf(ti))} m</b></div><div class="tile"><span>Nousu viime vk</span><b class="num">${elevW(Math.max(1,weekOf(ti)-1))} m</b></div><div class="tile"><span>Toteuma 4 vk</span><b class="num">${comp} %</b></div><div class="tile"><span>Kuorma&shy;suhde</span><b class="num">${lr?String(Math.round(lr.ratio*100)/100).replace(".",","):"–"}</b></div><div class="tile"><span>7 pv km</span><b class="num">${lr?lr.acute:"–"}</b></div></div>
    <p class="tip">${lr? (lr.ratio>1.5?"Kuorma nousi viime viikolla jyrkästi suhteessa edellisiin viikkoihin. Pidä seuraavat päivät kevyinä.": lr.ratio<0.8?"Viime viikko oli kevyempi kuin edelliset. Hyvä palautumiseen, mutta älä jää pitkäksi aikaa alas.":"Kuorma nousee tasaisesti. Juuri näin pitääkin."):"Kuormasuhde (7 pv / 4 vk keskiarvo) näkyy, kun kirjauksia on 3 viikolta. Turvallinen alue 0,8–1,3."}</p>`;
  // trendit 30 pv
  const days=[...Array(30)].map((_,k)=>ti-29+k); const g=f=>days.map(i=>{ const l=logs[isoOfIdx(i)]; return l&&typeof l[f]==="number"?l[f]:null; });
  const feel=g("feel"), rhr=g("rhr"), sleep=g("sleepH"); const has=a=>a.filter(v=>v!=null).length>=2;
  const avg=a=>{ const v=a.filter(x=>x!=null); return v.length?v.reduce((s,x)=>s+x,0)/v.length:null; };
  let tr="";
  tr+=`<div class="trend"><div><b>Fiilis</b><span>${avg(feel)?`keskiarvo ${n1(avg(feel))} / 5`:"ei vielä dataa"}</span></div>${has(feel)?spark(feel,{min:1,max:5,label:"Fiilis 30 päivää"}):""}</div>`;
  tr+=`<div class="trend"><div><b>Leposyke</b><span>${avg(rhr)?`keskiarvo ${Math.round(avg(rhr))}`:"kirjaa aamuisin vointiin"}</span></div>${has(rhr)?spark(rhr,{min:Math.min(...rhr.filter(x=>x))-3,max:Math.max(...rhr.filter(x=>x))+3,color:"var(--crit)",label:"Leposyke 30 päivää"}):""}</div>`;
  tr+=`<div class="trend"><div><b>Uni</b><span>${avg(sleep)?`keskiarvo ${n1(avg(sleep))} h`:"kirjaa vointiin"}</span></div>${has(sleep)?spark(sleep,{min:4,max:10,color:"var(--fell)",label:"Uni 30 päivää"}):""}</div>`;
  $("aTrends").innerHTML=tr;
  // vointi 30 pv
  const cnt={}, areas={}; days.forEach(i=>{ const l=logs[isoOfIdx(i)]; flagsOf(l).forEach(f=>cnt[f]=(cnt[f]||0)+1); if(l&&l.painArea&&flagsOf(l).includes("pain")) areas[l.painArea]=(areas[l.painArea]||0)+1; });
  $("aHealth").innerHTML=Object.keys(cnt).length?`<div class="flagcounts">${FLAGS.filter(([k])=>cnt[k]).map(([k,l])=>`<span class="chip">${l} <b class="num">${cnt[k]}</b></span>`).join("")}</div>${Object.keys(areas).length?`<p class="tip">Kipu kirjattu: ${Object.entries(areas).map(([a,n])=>`${a} ${n}×`).join(", ")}.${Object.values(areas).some(n=>n>=3)?" Sama paikka toistuu: käy fysioterapeutilla.":""}</p>`:""}`:`<p class="note">Ei merkintöjä.</p>`;
  // oivallukset
  const ins=[]; const es=entries();
  const doneW=es.filter(e=>e.l.status==="done"&&e.idx>ti-28&&e.idx<=ti).length; let plannedW=0; for(let i=Math.max(0,ti-27);i<=Math.min(ti,BASE.length-1);i++) if(BASE[i][0]!=="L") plannedW++;
  if(plannedW) ins.push(`Viimeisen 4 viikon treeneistä tehty ${doneW}/${plannedW} (${Math.round(doneW/plannedW*100)} %).`);
  const runs=es.filter(e=>e.l.status==="done"&&RUN.has(e.code)&&e.l.km&&e.l.min&&e.idx>ti-42);
  if(runs.length>=6){ const h=Math.floor(runs.length/2); const p=a=>a.reduce((s,e)=>s+e.l.min,0)/a.reduce((s,e)=>s+e.l.km,0); const p1=p(runs.slice(0,h)),p2=p(runs.slice(h)); ins.push(p2<p1?`Keskivauhti on parantunut: ${pace(1,p1)} → ${pace(1,p2)} min/km.`:`Keskivauhti ${pace(1,p2)} min/km. Rauhallinen vauhti on oikea valinta pohjakaudella.`); }
  const lowSleepDays=days.filter(i=>{ const l=logs[isoOfIdx(i)]; return l&&(flagsOf(l).includes("sleep")||(l.sleepH&&l.sleepH<6.5)); }).length; if(lowSleepDays>=4) ins.push(`Huonoja yöunia ${lowSleepDays} kertaa 30 päivässä. Uni on palautumisen tärkein tekijä.`);
  if(cnt.hangover>=2) ins.push(`Darrapäiviä ${cnt.hangover}. Poro ei tuomitse, mutta pitkä lenkki kulkee paremmin selvin päin.`);
  { const easy=es.filter(e=>e.l.status==="done"&&e.l.hr&&zoneFor(e.code,(BASE[e.idx]||[])[1])===1&&e.idx>ti-28); if(zones()&&easy.length>=4){ const hard=easy.filter(tooHard).length; if(hard/easy.length>=0.4) ins.push(`${hard}/${easy.length} kevyestä lenkistä meni yli kevyen sykealueen. Hidasta: kevyen pitää tuntua helpolta.`); } }
  $("aInsights").innerHTML=ins.length?`<ul class="ins">${ins.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p class="note">Tulee, kun kirjauksia kertyy.</p>`;
}
$("aSeg").onclick=e=>{ const b=e.target.closest("[data-atab]"); if(!b) return; anaTab=b.dataset.atab; render(); };
function renderBadges(st,bs){ const xp=xpOf(st,bs),{L,next}=levelOf(xp),pct=next?Math.round((xp-L[0])/(next[0]-L[0])*100):100;
  $("level").innerHTML=`<div class="lvlbig">${L[2]}</div><div class="lvlinfo"><div class="eyebrow">Taso</div><h2>${L[1]}</h2><div class="kmbar"><div class="lbl"><span><b class="num">${xp}</b> XP</span><span>${next?`${next[2]} ${next[1]}: ${next[0]} XP`:"Huipulla!"}</span></div><div class="track"><div class="fill" style="width:${pct}%"></div></div></div></div>`;
  $("badgeGrid").innerHTML=bs.map(b=>`<div class="badge${b.got?" got":""}"><span class="bi" aria-hidden="true">${b.icon}</span><b>${b.name}</b><span>${b.desc}</span></div>`).join(""); $("badgeCount").textContent=`${bs.filter(b=>b.got).length}/${bs.length} merkkiä`; }
function renderBackupNag(){ if(stravaConnected()){ $("backupNag").hidden=true; const fb=$("fileBackup"); if(fb) fb.open=false; return; } const n=Object.keys(logs).length; const last=meta.lastBackup?new Date(meta.lastBackup):null; const old=!last||(Date.now()-last.getTime())>7*864e5;
  $("backupNag").hidden=!(n>=3&&old); $("lastBackup").textContent=last?`Viimeisin varmuuskopio ${last.getDate()}.${last.getMonth()+1}.${last.getFullYear()}.`:"Varmuuskopiota ei ole vielä tehty."; }

/* ---------- kirjausikkuna ---------- */
function sessionByKey(key){ const i=idxOfISO(key); const f=sessionsOn(BASE,logs,ADAPT,i).find(s=>s.key===key); if(f) return f; if(/~[sf]/.test(key)&&logs[key]){ const l=logs[key]; return {key,idx:i,code:l.type||"J",text:l.stravaName?`Stravasta: ${l.stravaName}`:"Lisäliikunta",note:"",moved:true}; } return {key,idx:i,...effective(BASE,ADAPT,i),moved:false}; }
function openEditor(key,pre,mode){
  const s=sessionByKey(key); edit=s; const l=logs[key];
  draft=l?JSON.parse(JSON.stringify(l)):{status:null,km:null,min:null,hr:null,feel:null,flags:[],painArea:null,painLevel:null,rhr:null,sleepH:null,note:""};
  draft.flags=flagsOf(draft); if(pre&&(!l||l.status==="note")) draft.status=pre;
  $("edDate").textContent=`${fmt(s.idx)} · vk ${weekOf(s.idx)}${s.moved?" · siirretty":""}`; $("edTitle").textContent=TYPES[s.code].l; $("edTarget").textContent=s.text||"Lepopäivä";
  const train=s.code!=="L"||(s.orig&&s.orig.code!=="L"); $("statusRow").hidden=!train; $("trainFields").hidden=!train;
  $("kmField").hidden=!hasKm(s.code);
  { const pc=plannedCont(s.text); $("contField").hidden=!(RUN.has(s.code)&&(pc!=null||weekOf(s.idx)<=12)); $("edCont").placeholder= pc!=null?String(pc):"30"; $("contHint").textContent= pc!=null?`Ohjelmassa ${pc} min. Jätä tyhjäksi, jos juoksit ohjelman mukaan.`:""; }
  [["edKm","km"],["edMin","min"],["edHr","hr"],["edRhr","rhr"],["edSleep","sleepH"],["edCont","cont"]].forEach(([id,f])=>$(id).value=typeof draft[f]==="number"?String(draft[f]).replace(".",","):"");
  $("edNote").value=draft.note||""; $("edErr").hidden=true; $("edClear").hidden=!l;
  const runish=RUN.has(s.code)||s.code==="PT"; const act=shoes.filter(x=>!x.retired||x.id===draft.shoeId);
  $("shoeField").hidden=!(runish&&act.length); $("edShoe").innerHTML=`<option value="">–</option>`+act.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join(""); $("edShoe").value = draft.shoeId ?? (l?"":(meta.defaultShoe||""));
  const fuelish=["P","X","R","PT"].includes(s.code)||(typeof draft.min==="number"&&draft.min>=75); $("fuelBox").hidden=!fuelish; $("fuelBox").open=!!(draft.fuel||draft.carbsH||draft.gut);
  $("edFuel").value=draft.fuel||""; $("edCarb").value=typeof draft.carbsH==="number"?draft.carbsH:""; draft.gut=draft.gut||null;
  planEditUI(s); $("peSuggest").hidden=true; $("peSuggest").innerHTML="";
  const canMove=train&&!s.moved&&s.idx<BASE.length-1&&(!l||l.status==="moved"||l.status==="skip"||l.status==="note");
  $("edMove").hidden=!canMove; $("edMove").textContent=l&&l.status==="moved"?"Peru siirto":"Siirrä huomiselle";
  const vo=mode==="vointi"; edMode=mode||null; $("sheetBg").classList.toggle("vmode",vo);
  if(vo){ $("statusRow").hidden=true; $("trainFields").hidden=true; $("shoeField").hidden=true; $("fuelBox").hidden=true; $("planEdit").hidden=true; $("edTitle").textContent="Vointi"; $("edTarget").textContent="Miten voit tänään? Vaikuttaa tuleviin treeneihin."; if(!l) $("edShoe").value=""; }
  syncEditor(); $("sheetBg").classList.add("open"); document.body.classList.add("locked");
}
function syncEditor(){
  $("edDone").setAttribute("aria-pressed",draft.status==="done"); $("edSkip").setAttribute("aria-pressed",draft.status==="skip");
  $("edFeel").innerHTML=FEEL.map(([v,l])=>`<button type="button" data-feel="${v}" aria-pressed="${draft.feel===+v}">${v}<small>${l}</small></button>`).join("");
  $("edFlags").innerHTML=FLAGS.map(([k,l])=>`<button type="button" data-flag="${k}" aria-pressed="${draft.flags.includes(k)}">${l}</button>`).join("");
  const pain=draft.flags.includes("pain"); $("painBox").hidden=!pain;
  $("edArea").innerHTML=AREAS.map(a=>`<button type="button" data-area="${a}" aria-pressed="${draft.painArea===a}">${a}</button>`).join("");
  $("edLevel").innerHTML=[[1,"lievä"],[2,"kohtalainen"],[3,"kova"]].map(([v,l])=>`<button type="button" data-level="${v}" aria-pressed="${draft.painLevel===v}">${l}</button>`).join("");
  $("sickHint").hidden=!draft.flags.includes("sick");
  $("edGut").innerHTML=[["ok","vatsa ok"],["some","pientä vaivaa"],["bad","kiukutteli"]].map(([v,l])=>`<button type="button" data-gut="${v}" aria-pressed="${draft.gut===v}">${l}</button>`).join("");
}
let edMode=null;
function closeEditor(){ $("sheetBg").classList.remove("open"); document.body.classList.remove("locked"); edit=null; draft=null; }
function showErr(m){ $("edErr").textContent=m; $("edErr").hidden=false; }
$("edDone").onclick=()=>{ draft.status=draft.status==="done"?null:"done"; syncEditor(); };
$("edSkip").onclick=()=>{ draft.status=draft.status==="skip"?null:"skip"; syncEditor(); };
$("edFeel").onclick=e=>{ const b=e.target.closest("[data-feel]"); if(!b) return; const v=+b.dataset.feel; draft.feel=draft.feel===v?null:v; syncEditor(); };
$("edFlags").onclick=e=>{ const b=e.target.closest("[data-flag]"); if(!b) return; const f=b.dataset.flag; draft.flags=draft.flags.includes(f)?draft.flags.filter(x=>x!==f):draft.flags.concat(f); if(f==="pain"&&draft.flags.includes("pain")&&!draft.painLevel) draft.painLevel=2; syncEditor(); };
$("edArea").onclick=e=>{ const b=e.target.closest("[data-area]"); if(!b) return; draft.painArea=b.dataset.area; syncEditor(); };
$("edLevel").onclick=e=>{ const b=e.target.closest("[data-level]"); if(!b) return; draft.painLevel=+b.dataset.level; syncEditor(); };
$("edGut").onclick=e=>{ const b=e.target.closest("[data-gut]"); if(!b) return; draft.gut=draft.gut===b.dataset.gut?null:b.dataset.gut; syncEditor(); };
$("edCancel").onclick=closeEditor; $("sheetBg").onclick=e=>{ if(e.target.id==="sheetBg") closeEditor(); };
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&edit) closeEditor(); });
$("edSave").onclick=()=>{
  const s=edit; const num=(id,lo,hi,msg)=>{ const v=$(id).value.trim().replace(",","."); if(v==="") return null; const n=Number(v); if(isNaN(n)||n<lo||n>hi) throw msg; return n; };
  let km,min,hr,rhr,sleepH; try{ km=num("edKm",0,150,"Tarkista kilometrit (0–150)."); min=num("edMin",0,900,"Tarkista kesto (0–900 min)."); hr=num("edHr",40,220,"Tarkista keskisyke (40–220)."); rhr=num("edRhr",30,120,"Tarkista leposyke (30–120)."); var cont=num("edCont",0,600,"Tarkista yhtäjaksoinen juoksu (min)."); sleepH=num("edSleep",0,16,"Tarkista unen määrä (0–16 h)."); var carbsH=num("edCarb",0,150,"Tarkista hiilihydraatit (0–150 g/h)."); }catch(m){ showErr(m); return; }
  const note=$("edNote").value.trim().slice(0,500); const pain=draft.flags.includes("pain");
  if(pain&&!draft.painArea){ showErr("Valitse, missä kipu tuntuu."); return; }
  const anyInfo=draft.flags.length||note||rhr!=null||sleepH!=null||draft.feel;
  if(!draft.status&&!anyInfo){ showErr(edMode==="vointi"?"Valitse jokin vointi tai kirjaa leposyke, uni tai muistiinpano.":s.code==="L"?"Kirjaa jotain: vointi, leposyke, uni tai muistiinpano.":"Valitse Tehty tai Jäi väliin, tai kirjaa vointi."); return; }
  const was=logs[s.key]?.status==="done";
  const doc={status:draft.status||"note",type:s.code,km:hasKm(s.code)?km:null,min,hr,feel:draft.feel??null,flags:draft.flags,painArea:pain?draft.painArea:null,painLevel:pain?draft.painLevel:null,rhr,sleepH,cont:(typeof cont==="number"?cont:null),note,shoeId:$("edShoe").value||null,fuel:$("edFuel").value.trim().slice(0,300)||null,carbsH,gut:draft.gut||null,updatedAt:new Date().toISOString()};
  logs[s.key]=doc; persist(); const sick=draft.flags.includes("sick")&&!(logs[s.key]&&was); closeEditor(); render();
  if(doc.status==="done"&&!was) celebrate(); else if(doc.flags.includes("sick")||doc.flags.includes("pain")) toast("Kirjattu. Ohjelma mukautuu: katso Tänään- ja Analyysi-näkymä.");
};
$("edMove").onclick=()=>{ const s=edit,l=logs[s.key];
  if(l&&l.status==="moved"){ if(logs[isoOfIdx(s.idx+1)+"~m"]){ showErr("Siirretty treeni on jo kirjattu huomiselle. Tyhjennä se ensin."); return; } delete logs[s.key]; }
  else logs[s.key]={...(l||{}),status:"moved",type:s.code,movedTo:isoOfIdx(s.idx+1),updatedAt:new Date().toISOString()};
  persist(); closeEditor(); render(); };
$("edClear").onclick=()=>{ const k=edit.key; if(logs[k]&&logs[k].status==="moved"&&logs[isoOfIdx(edit.idx+1)+"~m"]){ showErr("Huomiselle siirretty treeni on jo kirjattu. Tyhjennä se ensin."); return; } delete logs[k]; persist(); closeEditor(); render(); };
document.addEventListener("click",e=>{
  const o=e.target.closest("[data-adjoff]"); if(o){ adjOff[o.dataset.adjoff]=true; persist(); render(); return; }
  const n=e.target.closest("[data-adjon]"); if(n){ delete adjOff[n.dataset.adjon]; persist(); render(); return; }
  const b=e.target.closest("[data-open]"); if(!b||b.closest(".sheet")) return; openEditor(b.dataset.open,b.dataset.pre,b.dataset.mode); });
document.addEventListener("keydown",e=>{ if(e.key==="Enter"){ const r=e.target.closest&&e.target.closest("tr[data-open]"); if(r) openEditor(r.dataset.open); } });

/* ---------- historia, varmuuskopio ---------- */
$("hFilters").onclick=e=>{ const b=e.target.closest("[data-f]"); if(!b) return; hist.filter=b.dataset.f; render(); };
$("hSearch").oninput=e=>{ hist.q=e.target.value; render(); }; $("hSort").onchange=e=>{ hist.sort=e.target.value; render(); };
function csv(){ return [["pvm","treeni","tila","km","min","vauhti","syke","fiilis","vointi","kipu","leposyke","uni","kengät","tankkaus","g/h","muistiinpano"]].concat(entries().filter(e=>e.l.status!=="moved").map(e=>[e.key.slice(0,10),TYPES[e.code].l,e.l.status,e.l.km??"",e.l.min??"",pace(e.l.km,e.l.min),e.l.hr??"",e.l.feel??"",flagsOf(e.l).join(" "),e.l.painArea?`${e.l.painArea} ${e.l.painLevel||""}`:"",e.l.rhr??"",e.l.sleepH??"",(shoes.find(x=>x.id===e.l.shoeId)||{}).name||"",(e.l.fuel||"").replace(/[\n;]/g," "),e.l.carbsH??"",(e.l.note||"").replace(/[\n;]/g," ")])).map(r=>r.join(";")).join("\n"); }
$("hSearchBtn").onclick=()=>{ const r=$("hSearchRow"); r.hidden=!r.hidden; $("hSearchBtn").setAttribute("aria-pressed",String(!r.hidden)); if(!r.hidden) $("hSearch").focus(); else if(hist.q||hist.sort!=="date"){ hist.q=""; hist.sort="date"; $("hSearch").value=""; $("hSort").value="date"; render(); } };
$("hCopy").onclick=async()=>{ try{ await navigator.clipboard.writeText(csv()); toast("Taulukko kopioitu. Liitä Exceliin tai Sheetsiin."); }catch(e){ toast("Kopiointi ei onnistunut."); } };
async function backup(){
  const data={app:"matka-pallakselle",version:2,exportedAt:new Date().toISOString(),logs,adjOff,edits,weekScale,shoes,gear,defaultShoe:meta.defaultShoe||null,stravaWorker:strava.worker||null};
  const name=`pallas-varmuuskopio-${new Date().toISOString().slice(0,10)}.json`; const file=new File([JSON.stringify(data)],name,{type:"application/json"});
  try{ if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:"Matka Pallakselle: varmuuskopio"}); }
    else { const a=document.createElement("a"); a.href=URL.createObjectURL(file); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
    meta.lastBackup=new Date().toISOString(); persist(); render(); toast("Varmuuskopio luotu. Tallenna se iCloud Driveen."); }
  catch(e){ if(e&&e.name!=="AbortError") toast("Varmuuskopio ei onnistunut."); }
}
document.querySelectorAll("[data-backup]").forEach(b=>b.onclick=backup);
$("restoreFile").onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
  try{ const d=JSON.parse(await f.text()); if(d.app!=="matka-pallakselle"||typeof d.logs!=="object") throw 0;
    const n=Object.keys(d.logs).length; const cur=Object.keys(logs).length;
    $("restoreMsg").innerHTML=`Tiedostossa ${n} kirjausta (nyt sovelluksessa ${cur}). <button class="btn small primary" id="doMerge">Yhdistä</button> <button class="btn small" id="doReplace">Korvaa kaikki</button>`;
    $("doMerge").onclick=()=>{ for(const k in d.logs){ if(!logs[k]||(d.logs[k].updatedAt||"")>(logs[k].updatedAt||"")) logs[k]=d.logs[k]; } adjOff={...adjOff,...(d.adjOff||{})}; edits={...(d.edits||{}),...edits}; weekScale={...(d.weekScale||{}),...weekScale}; (d.shoes||[]).forEach(x=>{ if(!shoes.find(y=>y.id===x.id)) shoes.push(x); }); gear={...(d.gear||{}),...gear}; if(!meta.defaultShoe&&d.defaultShoe) meta.defaultShoe=d.defaultShoe; if(!strava.worker&&d.stravaWorker){ strava.worker=d.stravaWorker; saveStrava(); } persist(); $("restoreMsg").textContent="Yhdistetty ✓"; render(); };
    $("doReplace").onclick=()=>{ logs=d.logs; adjOff=d.adjOff||{}; edits=d.edits||{}; weekScale=d.weekScale||{}; shoes=d.shoes||[]; gear=d.gear||{}; meta.defaultShoe=d.defaultShoe||null; persist(); $("restoreMsg").textContent="Palautettu ✓"; render(); };
  }catch(err){ $("restoreMsg").textContent="Tiedostoa ei voitu lukea. Valitse sovelluksen tekemä varmuuskopio (.json)."; }
  e.target.value=""; };

/* ---------- juhla & ilmoitus ---------- */
function toast(m,act){ const t=$("toast"); t.textContent=m; t.classList.toggle("act",!!act); if(act){ const b=document.createElement("button"); b.className="tbtn"; b.textContent=act.l; b.onclick=()=>{ t.classList.remove("show"); act.fn(); }; t.append(" ",b); } t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),act?5000:2800); }
function celebrate(){ const st=stats(); toast(`${pick(CHEERS,st.done)} +10 XP`); if(navigator.vibrate) navigator.vibrate(30);
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return; const c=$("fx"),ctx=c.getContext("2d"); c.width=innerWidth; c.height=innerHeight; c.hidden=false;
  const cols=[getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#d9661f","#2e4a52","#e0b440","#5fbf8a"];
  const ps=Array.from({length:70},()=>({x:innerWidth/2,y:innerHeight*.65,vx:(Math.random()-.5)*9,vy:-Math.random()*11-4,r:Math.random()*4+3,c:cols[Math.floor(Math.random()*cols.length)],a:Math.random()*6}));
  let f=0; (function step(){ ctx.clearRect(0,0,c.width,c.height); ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=.35; p.a+=.2; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle=p.c; ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r); ctx.restore(); }); if(++f<70) requestAnimationFrame(step); else { ctx.clearRect(0,0,c.width,c.height); c.hidden=true; } })(); }


/* ===== v4: ohjelman muokkaus ===== */
var TARGET_EFF = TARGET.slice();
function estKm(text){ const m=(text||"").match(/(\d+(?:[,.]\d+)?)(?:[–-](\d+(?:[,.]\d+)?))?\s?(km|min|h)\b/); if(!m) return 0; const v=parseFloat((m[2]||m[1]).replace(",",".")); return m[3]==="km"?v:m[3]==="min"?v/7.5:v*7; }
function eventWarnings(ti){ const out=[]; const w=weekOf(Math.max(0,ti)); for(const ww of [w,w+1]){ const [a,z]=weekRange(ww); let lostLong=null, hasLong=false;
    for(let i=a;i<=z&&i<PLAN.length;i++){ const d=isoOfIdx(i); if(edits[d]&&PLAN[i][0]==="P"&&edits[d].code!=="P") lostLong=i; if(BASE[i][0]==="P") hasLong=true; }
    if(lostLong!==null&&!hasLong&&lostLong>=ti) out.push({level:"warn",title:`Viikon ${ww} pitkä lenkki poistui (${fmt(lostLong)})`,detail:"Pitkä lenkki on viikon tärkein treeni. Siirrä se toiselle päivälle: avaa päivä ja valitse Vaihda päiviä."}); }
  return out; }
var SCALED={};
function parseQty(text){ const m=(text||"").match(/(\d+(?:[,.]\d+)?)(?:[–-](\d+(?:[,.]\d+)?))?\s?(km|min|h)\b/); if(!m) return null; const v=parseFloat((m[2]||m[1]).replace(",",".")); return {v,unit:m[3],str:`${m[2]?m[1]+"–"+m[2]:m[1]} ${m[3]}`}; }
function rawAt(i){ const d=isoOfIdx(i), e=edits[d]; return e?[e.code,e.text,e.note??PLAN[i][2]]:PLAN[i].slice(); }
function buildBase(){
  const b=PLAN.map((r,i)=>rawAt(i));
  if(bHalf()){ for(let i=110;i<BELGRADE-3;i++){ const [c,t,n]=b[i]; if(c==="P"&&!edits[isoOfIdx(i)]&&estKm(t)>21) b[i]=[c,"18–21 km rauhallisesti. Juokse 5 min / kävele 1 min, tankkaa kuten kisassa.",n]; }
    if(!edits[isoOfIdx(BELGRADE-2)]) b[BELGRADE-2]=["J","Matka Belgradiin. 3 km hölkkä + 3×20 s. Hae numerolappu expolta (vain paikan päältä).",""];
    if(!edits[isoOfIdx(BELGRADE-1)]) b[BELGRADE-1]=["R","BELGRADIN PUOLIMARATON klo 9. Juokse 5 min / kävele 1 min alusta asti, geeli 40 min välein, aloita hitaammin kuin tuntuu.","Puolimaraton"];
    if(!edits[isoOfIdx(BELGRADE)]) b[BELGRADE]=["L","Kävele kaupungilla ja kannusta maratoonareita.",""]; }
  SCALED={}; for(const w in weekScale){ const f=weekScale[w]; const [a,z]=weekRange(+w); for(let i=a;i<=z&&i<b.length;i++){ const [c,t,n]=b[i]; if(RUN.has(c)&&c!=="R"&&c!=="X"){ b[i]=[c, scaleText(c,t,f,hasIntensity(t)?false:false), n]; SCALED[i]={f,w:+w}; } } }
  TARGET_EFF = TARGET.map((v,i)=>weekScale[i+1]?Math.round(v*weekScale[i+1]):v);
  // Menot ja muokkaukset: jos juoksu poistui ohjelmasta, viikon km-tavoite pienenee sen verran.
  const delta={}; for(const d in edits){ const i=idxOfISO(d); if(i<0||i>=PLAN.length) continue; const o=PLAN[i], e=edits[d], w=weekOf(i); if(e.sw) continue;
    delta[w]=(delta[w]||0) + (RUN.has(o[0])?estKm(o[1]):0) - (RUN.has(e.code)?estKm(e.text):0); }
  for(const w in delta){ if(Math.abs(delta[w])>=0.5) TARGET_EFF[w-1]=Math.max(0, Math.round(TARGET_EFF[w-1]-delta[w]*(weekScale[w]||1))); }
  return b;
}
function planEditUI(s){
  if(s.moved){ $("planEdit").hidden=true; return; } $("planEdit").hidden=false; $("planEdit").open=false;
  const i=s.idx, raw=rawAt(i);
  $("peType").innerHTML=Object.entries(TYPES).map(([k,v])=>`<option value="${k}"${k===raw[0]?" selected":""}>${v.l}</option>`).join("");
  $("peText").value=raw[1]||""; $("peEvent").value="";
  const opts=[]; for(let j=Math.max(0,i-6);j<=Math.min(PLAN.length-1,i+6);j++){ if(j===i||j<todayIdx()) continue; const r=rawAt(j); opts.push(`<option value="${j}">${fmt(j)} · ${TYPES[r[0]].l}</option>`); }
  $("peSwap").innerHTML=opts.join(""); $("peSwapRow").hidden=!opts.length;
  $("peReset").hidden=!edits[isoOfIdx(i)];
}
function afterPlanEdit(msg){ persist(); closeEditor(); render(); toast(msg); }
$("peSave").onclick=()=>{ const i=edit.idx; const code=$("peType").value, text=$("peText").value.trim().slice(0,300); edits[isoOfIdx(i)]={code,text,note:rawAt(i)[2]}; afterPlanEdit("Päivän ohjelma päivitetty."); };
$("peSwapBtn").onclick=()=>{ const i=edit.idx, j=+$("peSwap").value; if(isNaN(j)) return; const A=rawAt(i), B=rawAt(j); edits[isoOfIdx(i)]={code:B[0],text:B[1],note:B[2]}; edits[isoOfIdx(j)]={code:A[0],text:A[1],note:A[2]}; afterPlanEdit(`Treenit vaihdettu: ${fmt(i)} ↔ ${fmt(j)}.`); };
function isHardRaw(r){ return ["P","X","R"].includes(r[0]) || (RUN.has(r[0]) && hasIntensity(r[1])); }
function isMeno(j){ const e=edits[isoOfIdx(j)]; return !!(e && e.code==="L" && e.note && /ei treeniä/.test(e.text||"")); }
function suggestSlots(i, moved){
  const [a,z]=weekRange(weekOf(i)); const out=[]; const hard=isHardRaw(moved);
  for(let j=a;j<=z&&j<PLAN.length;j++){
    if(j===i||j<todayIdx()||isMeno(j)) continue; const r=rawAt(j);
    if(["R","X","P"].includes(r[0])) continue;
    if(r[0]==="L" && r[1]) continue; // tarkoituksellinen lepo: matka, juhlat, darra, palautus
    if(hard && isHardRaw(r)) continue;
    let score, what;
    if(r[0]==="L"){ score=3; what="lepopäivä"; }
    else if(!RUN.has(r[0])){ score=2; what=`${TYPES[r[0]].l.toLowerCase()} jää pois`; }
    else if(moved[0]==="P"||hard){ score=1; what=`${TYPES[r[0]].l.toLowerCase()} korvautuu`; }
    else continue;
    const why=[];
    if(hard){ for(const n of [j-1,j+1]){ if(n<0||n>=PLAN.length||n===i) continue; if(isHardRaw(rawAt(n))){ score-=2; why.push(`kova treeni ${n<j?"edellisenä":"seuraavana"} päivänä`); } } }
    if(!RUN.has(moved[0]) && j+1<PLAN.length && rawAt(j+1)[0]==="P"){ score-=1.5; why.push("pitkä lenkki seuraavana päivänä"); }
    if(RUN.has(moved[0]) && j-1>=0 && j-1!==i && rawAt(j-1)[0]==="P"){ score-=0.5; why.push("päivä pitkän lenkin jälkeen"); }
    if(moved[0]==="P" && dow(j)>=5) { score+=0.5; why.push("viikonloppu"); }
    score -= Math.abs(j-i)*0.2;
    out.push({j,score,label:`${fmt(j)}: ${what}`,why});
  }
  return out.sort((x,y)=>y.score-x.score).slice(0,3);
}
$("peEventBtn").onclick=()=>{ const i=edit.idx, name=$("peEvent").value.trim().slice(0,80)||"Meno"; const was=rawAt(i);
  edits[isoOfIdx(i)]={code:"L",text:`${name}: ei treeniä.`,note:name,ev:{name,kind:"off"}}; persist();
  if(was[0]==="L"){ closeEditor(); render(); toast(`Merkitty: ${name}.`); return; }
  showMoveSuggest(i,was,name); };
function showMoveSuggest(i,was,name){ $("planEdit").hidden=false; $("planEdit").open=true;
  const sug=suggestSlots(i,was);
  const best=sug.filter(x=>x.score>0);
  const drop = !isHardRaw(was) && was[0]!=="P";
  $("peSuggest").hidden=false;
  $("peSuggest").innerHTML=`<b>Merkitty: ${esc(name)}.</b> Minne ${esc(TYPES[was[0]].l.toLowerCase())} siirretään?
    <div class="sugs">${(best.length?best:sug).map((x,k)=>`<button class="btn${k===0&&best.length?" primary":""}" data-moveto="${x.j}">${esc(x.label)}${x.why.length?`<small>${esc(x.why.join(", "))}</small>`:k===0&&best.length?`<small>suositus</small>`:""}</button>`).join("")}
    <button class="btn ghost" data-dropmoved="1">Jätä pois tältä viikolta${drop?"<small>helppo treeni, ei haittaa</small>":"<small>ei suositella</small>"}</button></div>
    ${sug.length?"":`<p class="tip">Viikossa ei ole sopivaa vapaata päivää. Jätä treeni pois tai harkitse viikon keventämistä.</p>`}`;
  $("peSuggest").dataset.from=i; $("peSuggest").dataset.was=JSON.stringify(was);
  render(); $("peSuggest").scrollIntoView({block:"nearest"});
}
document.addEventListener("click",e=>{
  const m=e.target.closest("[data-moveto]"); if(m&&edit){ const j=+m.dataset.moveto, was=JSON.parse($("peSuggest").dataset.was); const keepNote=rawAt(j)[2];
    edits[isoOfIdx(j)]={code:was[0],text:was[1],note:keepNote}; persist(); closeEditor(); render(); toast(`${TYPES[was[0]].l} siirretty: ${fmt(j)}.`); return; }
  const d=e.target.closest("[data-dropmoved]"); if(d&&edit){ closeEditor(); render(); toast("Treeni jätetty pois. Viikon km-tavoite päivitetty."); }
});
$("peReset").onclick=()=>{ delete edits[isoOfIdx(edit.idx)]; afterPlanEdit("Alkuperäinen ohjelma palautettu."); };
let loadOpen=false;
function weekScaleControls(w,t){
  if(w<weekOf(t)) return weekScale[w]?`<p class="tip">Viikko oli kevennetty ${Math.round(weekScale[w]*100)} %.</p>`:"";
  const cur=weekScale[w]||1, orig=TARGET[w-1], name=cur===1?"Normaali":cur>=0.8?"Kevyt 80 %":"Palautus 60 %";
  const opt=(f,l,sub)=>`<button data-scale="${w}" data-f="${f}" aria-pressed="${cur===f}"><b>${l}</b><small>${sub}</small></button>`;
  return `<details class="loadctl" id="loadCtl"${loadOpen?" open":""}><summary><span>Viikon kuorma</span><span class="lcp${cur<1?" on":""}">${name} ›</span></summary>
    <div class="seg3" role="group" aria-label="Viikon kuorma">${opt(1,"Normaali",`${orig} km`)}${opt(0.8,"Kevyt",`80 % · ${Math.round(orig*.8)} km`)}${opt(0.6,"Palautus",`60 % · ${Math.round(orig*.6)} km`)}</div>
    <p class="tip">Juoksut lyhenevät, testit, kisat ja lihaskunto pysyvät. Kevennä, jos olet väsynyt, kipeä tai viikko on kiireinen.</p></details>`;
}

document.addEventListener("click",e=>{ const a=e.target.closest("[data-scale]"); if(a){ const w=+a.dataset.scale, f=+(a.dataset.f||0.8), prev=weekScale[w]; if(f>=1) delete weekScale[w]; else weekScale[w]=f; persist(); render(); toast(f>=1?"Viikko palautettu normaaliksi.":`Viikko kevennetty ${Math.round(f*100)} %.`,{l:"Peru",fn:()=>{ if(prev) weekScale[w]=prev; else delete weekScale[w]; persist(); render(); }}); return; }
  const b=e.target.closest("[data-unscale]"); if(b){ delete weekScale[+b.dataset.unscale]; persist(); render(); } });

/* ===== Vaihda laji / kirjaa vapaa liikunta ===== */
let sw=null; // {mode:"swap"|"log", i, code, min, moveTo}
function sportBtns(sel){ return SPORTS.filter(x=>sw.mode==="log"||x[0]!==rawAt(sw.i)[0]).map(([c,e])=>`<button type="button" data-sp="${c}" aria-pressed="${c===sel}"><span>${e}</span>${TYPES[c].l.replace(" / "," /<br>")}</button>`).join(""); }
function openSwap(i,mode){ const r=mode==="swap"?rawAt(i):null; sw={mode,i,code:null,min:null,moveTo:null};
  $("swTitle").textContent= mode==="swap"?"Vaihda laji":"Kirjaa liikunta"; $("swEyebrow").textContent=fmt(i);
  $("swOrig").innerHTML= mode==="swap"?`Ohjelmassa: <b>${TYPES[r[0]].l}</b>${r[1]?` · ${esc(r[1])}`:""}`:"Mikä tahansa liikunta lasketaan Terveys-tavoitteeseen.";
  $("swSave").textContent= mode==="swap"?"Vaihda":"Kirjaa"; $("swMin").value=""; $("swErr").hidden=true; syncSwap();
  $("swBg").classList.add("open"); document.body.classList.add("locked"); }
function closeSwap(){ $("swBg").classList.remove("open"); document.body.classList.remove("locked"); sw=null; }
function swImpact(){ if(sw.mode!=="swap"||!sw.code) return {html:"",key:false};
  const i=sw.i, r=rawAt(i), w=weekOf(i), [a,z]=weekRange(w); const key=["P","YM","X"].includes(r[0])||(RUN.has(r[0])&&hasIntensity(r[1]));
  const mNow=parseInt($("swMin").value)||estMin(r[0],r[1]); let runKm=0; for(let j=a;j<=z&&j<BASE.length;j++){ const rr= j===i?[sw.code,`${mNow} min`]: j===sw.moveTo? r : rawAt(j); if(RUN.has(rr[0])) runKm+=estKm(rr[1]); }
  const tgt=Math.round(TARGET[w-1]*(weekScale[w]||1)); const share=tgt?runKm/tgt:1;
  let msg=[], cls="ok";
  if(key&&sw.moveTo==null){ cls="warn"; msg.push(`<b>${TYPES[r[0]].l} on avaintreeni Nutsia varten.</b> Siirrä se toiselle päivälle, niin ${TYPES[sw.code].l.toLowerCase()} mahtuu tähän.`); }
  else if(!RUN.has(r[0])) msg.push("Hyvä vaihto: juoksumäärä ei muutu.");
  else if(sw.moveTo!=null) msg.push(`${TYPES[r[0]].l} siirtyy päivälle ${fmt(sw.moveTo)}.`);
  else msg.push(`Hyvä vaihto kevyelle päivälle.${["UI","PY","JO"].includes(sw.code)?" Lepuuttaa jalkoja.":""}`);
  if(RUN.has(r[0])&&tgt>0){ if(share<0.7){ cls="warn"; msg.push(`Viikon juoksu jäisi noin ${Math.round(runKm)} km:iin (${Math.round(share*100)} % tavoitteesta). Nutsia varten vähintään 70 % kannattaa juosta.`); } else msg.push(`Viikon suunniteltu juoksu vaihdon jälkeen noin ${Math.round(runKm)} km (tavoite ${tgt} km).`); }
  const sug = key ? suggestSlots(i,r).filter(x=>x.score>-1) : [];
  return {html:`<div class="swimp ${cls}">${msg.map(m=>`<p>${m}</p>`).join("")}${sug.length?`<div class="sugs">${sug.map(x=>`<button type="button" class="btn${sw.moveTo===x.j?" primary":""}" data-swto="${x.j}">Siirrä: ${esc(x.label)}${x.why.length?`<small>${esc(x.why.join(", "))}</small>`:""}</button>`).join("")}</div>`:""}</div>`, key};
}
function syncSwap(){ if(!sw) return; $("swSports").innerHTML=sportBtns(sw.code);
  if(sw.code&&!$("swMin").dataset.touched){ const r=sw.mode==="swap"?rawAt(sw.i):null; const base=r?estMin(r[0],r[1]):30; const f=(SPORTS.find(x=>x[0]===sw.code)||[])[2]||1; $("swMin").value= r&&RUN.has(r[0]) ? Math.round(base*f/5)*5 : base; }
  $("swImpact").innerHTML=swImpact().html; $("swMinRow").hidden=!sw.code; }
$("swSports").onclick=e=>{ const b=e.target.closest("[data-sp]"); if(!b) return; sw.code=b.dataset.sp; delete $("swMin").dataset.touched; syncSwap(); };
$("swMin").oninput=()=>{ $("swMin").dataset.touched="1"; };
$("swImpact").onclick=e=>{ const b=e.target.closest("[data-swto]"); if(!b) return; const j=+b.dataset.swto; sw.moveTo= sw.moveTo===j?null:j; syncSwap(); };
$("swX").onclick=closeSwap; $("swCancel").onclick=closeSwap; $("swBg").onclick=e=>{ if(e.target.id==="swBg") closeSwap(); };
$("swSave").onclick=()=>{ const err=m=>{ $("swErr").textContent=m; $("swErr").hidden=false; }; if(!sw.code) return err("Valitse laji."); const min=Math.max(5,Math.min(600,parseInt($("swMin").value)||0)); if(!parseInt($("swMin").value)) return err("Anna kesto minuutteina.");
  const i=sw.i, d=isoOfIdx(i), lbl=TYPES[sw.code].l;
  if(sw.mode==="log"){ const k=`${d}~f${Date.now().toString(36)}`; logs[k]={status:"done",type:sw.code,min,km:null,flags:[],note:"",manual:true,updatedAt:new Date().toISOString()}; persist(); closeSwap(); render(); celebrate(); toast(`${lbl} ${min} min kirjattu.`,{l:"Peru",fn:()=>{ delete logs[k]; persist(); render(); }}); return; }
  const r=rawAt(i), prev={[d]:edits[d]}; const imp=swImpact();
  if(sw.moveTo!=null){ const dj=isoOfIdx(sw.moveTo); prev[dj]=edits[dj]; edits[dj]={code:r[0],text:r[1],note:rawAt(sw.moveTo)[2],sw:{from:rawAt(sw.moveTo)[0]}}; }
  edits[d]={code:sw.code,text:`${lbl} ${min} min${VIG.has(sw.code)?"":" rauhallisesti"}.`,note:r[2],sw:{from:r[0]}};
  persist(); closeSwap(); render(); toast(`Vaihdettu: ${lbl} ${min} min.`,{l:"Peru",fn:()=>{ for(const k in prev){ if(prev[k]) edits[k]=prev[k]; else delete edits[k]; } persist(); render(); }}); };
document.addEventListener("click",e=>{ const a=e.target.closest("[data-swap]"); if(a){ openSwap(+a.dataset.swap,"swap"); return; }
  const f=e.target.closest("[data-logfree]"); if(f){ openSwap(f.dataset.logfree!==""?+f.dataset.logfree:todayIdx(),"log"); return; }
  const u=e.target.closest("[data-unedit]"); if(u){ const d=u.dataset.unedit, prev=edits[d]; delete edits[d]; persist(); render(); toast("Alkuperäinen palautettu.",{l:"Peru",fn:()=>{ edits[d]=prev; persist(); render(); }}); } });

/* ===== Ylläpitotila (Nutsin jälkeen) ===== */
function renderMaint(){ const ti=todayIdx(), on=ti>NUTS; document.body.classList.toggle("maint",on); $("maint").hidden=!on; if(!on) return;
  const w=weekOf(ti), G=weekGoals(w), a0=(w-1)*7-1; const items=[]; for(let i=a0;i<=a0+6;i++){ const d=isoOfIdx(i); for(const k of Object.keys(logs).filter(k=>k.startsWith(d)).sort()){ const l=logs[k]; if(l.status!=="done") continue; items.push(`<li><time>${DOW[dow(i)]} ${new Date(START_UTC+i*864e5).getUTCDate()}.</time><span>${typeChip(l.type||"MU")} ${l.min?`${l.min} min`:""}${l.km?` · ${n1(l.km)} km`:""}${l.stravaName?` · ${esc(l.stravaName)}`:""}</span></li>`); } }
  $("maint").innerHTML=`<div class="eyebrow">Ylläpitotila · ${ti-NUTS} pv Nutsista</div><h2>Liiku 3–4 kertaa viikossa, mitä tahansa</h2>
    <div class="goals"><div class="goal"><div class="gh">${ring(G.n/3,"r-nuts")}<div><b>Kerrat</b><span class="num">${G.n} / 3–4</span></div></div><small>${G.n>=3?"Viikon tavoite täynnä":`${3-G.n} kertaa vielä`}</small></div>
    <div class="goal"><div class="gh">${ring(G.act/150,"r-health")}<div><b>Terveys</b><span class="num">${G.act} / 150 min</span></div></div><small>Lihaskunto ${Math.min(G.strength,2)}/2</small></div></div>
    <button class="btn primary big" data-logfree="${ti}">＋ Kirjaa liikunta</button>
    <ul class="up">${items.join("")||`<li class="note">Ei vielä liikuntaa tällä viikolla. Strava-treenit tulevat tähän automaattisesti.</li>`}</ul>
    <p class="tip">Seuraava tavoite? Kerro, niin teen uuden ohjelman.</p>`; }

/* ===== Menot ja suunnitelmat ===== */
let evKind="note";
function isoInput(i){ return isoOfIdx(Math.min(BASE.length-1,Math.max(0,i))); }
function openEvent(i){ const d=i==null?(selDay==null?T0():selDay):i; $("evName").value=""; $("evFrom").value=isoInput(d); $("evTo").value=""; $("evFrom").min=isoInput(Math.max(0,todayIdx())); $("evFrom").max=$("evTo").max=isoInput(BASE.length-1); $("evTo").min=$("evFrom").value; evKind="note"; syncEvent(); $("evErr").hidden=true; renderEvList(); $("evBg").classList.add("open"); document.body.classList.add("locked"); setTimeout(()=>$("evName").focus(),50); }
function closeEvent(){ $("evBg").classList.remove("open"); document.body.classList.remove("locked"); }
function syncEvent(){ document.querySelectorAll("[data-evk]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.evk===evKind)));
  const a=idxOfISO($("evFrom").value), z=$("evTo").value?idxOfISO($("evTo").value):a; let lost=[];
  if(a>=0&&z>=a) for(let i=a;i<=Math.min(z,BASE.length-1);i++){ const r=rawAt(i); if(r[0]!=="L") lost.push(`${fmt(i)} ${TYPES[r[0]].l.toLowerCase()}`); }
  $("evInfo").textContent = evKind==="note" ? "Treeni pysyy. Päivään tulee merkintä, joka näkyy kalenterissa ja Tulossa-listassa." :
    lost.length ? `Päivä muuttuu lepopäiväksi. Poistuu: ${lost.join(", ")}.${lost.length===1&&z===a?" Saat ehdotukset, minne treeni siirretään.":""}` : "Päivä on jo lepopäivä: tulee vain merkintä.";
  $("evTo").min=$("evFrom").value; }
function renderEvList(){ const t=Math.max(0,todayIdx()); const it=Object.keys(edits).filter(d=>edits[d].ev&&idxOfISO(d)>=t).sort();
  // ryhmittele peräkkäiset samannimiset
  const groups=[]; it.forEach(d=>{ const e=edits[d], g=groups[groups.length-1]; if(g&&g.name===e.ev.name&&g.kind===e.ev.kind&&idxOfISO(d)===idxOfISO(g.days[g.days.length-1])+1) g.days.push(d); else groups.push({name:e.ev.name,kind:e.ev.kind,days:[d]}); });
  $("evList").innerHTML=groups.length?groups.map(g=>{ const a=idxOfISO(g.days[0]), z=idxOfISO(g.days[g.days.length-1]); return `<li><span><b>${esc(g.name)}</b><small>${fmt(a)}${z>a?` – ${fmt(z)}`:""} · ${g.kind==="off"?"ei treeniä":"muistutus"}</small></span><button class="btn small ghost" data-evdel="${g.days.join(",")}">Poista</button></li>`; }).join(""):`<li class="note">Ei tulevia menoja.</li>`; }
function saveEvent(){ const name=$("evName").value.trim().slice(0,60); const a=idxOfISO($("evFrom").value), z=$("evTo").value?idxOfISO($("evTo").value):a;
  const err=m=>{ $("evErr").textContent=m; $("evErr").hidden=false; };
  if(!name) return err("Anna menolle nimi."); if(a<0||a>=BASE.length) return err("Valitse päivä ohjelman ajalta."); if(z<a) return err("Loppupäivä on ennen alkua."); if(z-a>30) return err("Enintään 31 päivää kerralla.");
  if(evKind==="off") for(let i=a;i<=z;i++) if(rawAt(i)[0]==="R") return err("Kisapäivää ei voi merkitä lepopäiväksi. Valitse Muistutus.");
  const single=a===z, was=rawAt(a);
  for(let i=a;i<=z;i++){ const d=isoOfIdx(i), r=rawAt(i);
    if(evKind==="note") edits[d]={code:r[0],text:r[1],note:r[2]&&!r[2].includes(name)?`${name} · ${r[2]}`:name,ev:{name,kind:"note"}};
    else edits[d]={code:"L",text:`${name}: ei treeniä.`,note:name,ev:{name,kind:"off"}}; }
  persist(); closeEvent();
  if(evKind==="off"&&single&&was[0]!=="L"){ render(); openEditor(isoOfIdx(a)); showMoveSuggest(a,was,name); return; }
  render(); toast(`Lisätty: ${name}${single?` (${fmt(a)})`:` (${fmt(a)} – ${fmt(z)})`}.`);
}
$("evSave").onclick=saveEvent; $("evCancel").onclick=closeEvent; $("evX").onclick=closeEvent;
$("evBg").onclick=e=>{ if(e.target.id==="evBg") closeEvent(); };
$("evKinds").onclick=e=>{ const b=e.target.closest("[data-evk]"); if(!b) return; evKind=b.dataset.evk; syncEvent(); };
$("evFrom").onchange=syncEvent; $("evTo").onchange=syncEvent;
document.addEventListener("click",e=>{ const o=e.target.closest("[data-addev]"); if(o){ openEvent(o.dataset.addev?+o.dataset.addev:null); return; }
  const d=e.target.closest("[data-evdel]"); if(d){ d.dataset.evdel.split(",").forEach(k=>delete edits[k]); persist(); render(); renderEvList(); toast("Meno poistettu, alkuperäinen ohjelma palautettu."); } });

/* ===== v4: vinkit ja viikkokooste ===== */
const TIPS = [
  ["Pohja","Rauhallinen vauhti tuntuu aluksi liian hitaalta. Juuri siksi se toimii: sydän ja jänteet vahvistuvat ilman ylirasitusta."],
  ["Pohja","Kävelytauot eivät ole luovuttamista. Ultrajuoksijat kävelevät ylämäet, ja sinä harjoittelet sitä nyt."],
  ["Pohja","Juoksumatolla: kulma 1 % vastaa ulkojuoksua. Tuuletin päälle ja juomapullo käden ulottuville."],
  ["Pohja","Matolla vauhti tuntuu helposti liian kovalta. Säädä vauhtia sykkeen ja puhetestin mukaan, ei näytön lukemien."],
  ["Rakennus","Pitkä matolla puuduttaa: jaa se 15 minuutin jaksoihin, kuuntele podcastia tai vaihda kulmaa välillä 1–3 %."],
  ["Rakennus","Hiihto on erinomainen korvaaja kevyelle lenkille: sama kestävyys ilman iskutusta."],
  ["Maratonjakso","Sisäradalla vaihda suuntaa 15–20 minuutin välein, ettei kaarre rasita aina samaa jalkaa."],
  ["Pohja","Pakkasella hengitä buffin läpi ja pidä vauhti rauhallisena. Alle −15 °C:ssa lyhennä lenkkiä tai vaihda spinningiin."],
  ["Pohja","Pohjenousut joka päivä hampaita pestessä: 2 × 15. Akillesjänne kiittää keväällä."],
  ["Rakennus","Lisää vain yksi asia kerrallaan: joko pidempi lenkki tai lisää kertoja, ei molempia samalla viikolla."],
  ["Rakennus","Mäkivedoissa katse eteen, kädet tekevät töitä ja askel lyhyt. Alas kävellen."],
  ["Rakennus","Syö tunnin sisällä pitkästä lenkistä: hiilihydraattia ja proteiinia, esim. rahka ja banaani."],
  ["Rakennus","Rautavarastot hupenevat helposti kestävyysurheilijalla. Jos väsyttää jatkuvasti, pyydä lääkäriltä ferritiinimittaus."],
  ["Maratonjakso","Maratonvauhti on vauhti, jolla jaksaisit tunteja ja pystyt puhumaan lyhyitä lauseita."],
  ["Maratonjakso","Harjoittele juomista kävelytauoilla. Kisassa juot jokaisella juomapisteellä pienen määrän."],
  ["Maratonjakso","Testaa kisakengät ja -sukat vähintään kahdella pitkällä lenkillä. Ei mitään uutta kisapäivänä."],
  ["Maratonjakso","Kisa-aamuna: aamupala 3 h ennen lähtöä, esim. puuro, banaani ja kahvi, jos olet tottunut."],
  ["Palautuminen","Maratonin jälkeen lihakset ovat kunnossa ennen jänteitä. Palaa juoksuun maltilla, vaikka tuntuisi hyvältä."],
  ["Kisaspesifi","Alamäessä: lyhyt nopea askel, paino hieman eteenpäin, kädet tasapainona. Älä jarruta kantapäällä."],
  ["Kisaspesifi","Kivikossa katse 2–3 askelta eteenpäin. Jalat seuraavat katsetta."],
  ["Kisaspesifi","Sauvat: harjoittele ylämäkeen työntöä ja sauvojen kantamista tasaisella ennen kisaa."],
  ["Kisaspesifi","Tankkaa 40–60 g hiilihydraattia tunnissa pitkillä lenkeillä. Vatsa oppii sen samalla tavalla kuin jalat."],
  ["Kisaspesifi","Tunturisää vaihtuu tunnissa. Testaa sadetakki ja hanskat pitkällä lenkillä myös kesällä."],
  ["Kisaspesifi","Hyttyset: testaa karkotteen pysyvyys hiessä jo toukokuussa, ettei kisassa tule yllätyksiä."],
  ["Kevennys","Kevennysviikolla tunnet itsesi levottomaksi. Se tarkoittaa, että kunto on tallessa ja lihakset palautuvat."],
  ["Kevennys","Nuku hyvin kaksi yötä ennen kisaa. Kisaa edeltävän yön huono uni ei haittaa yhtä paljon."],
  ["Kevennys","Kisa alkaa klo 15: syö kunnon lounas noin klo 11–12 ja välipala tuntia ennen lähtöä."],
  ["Kaikki","Kipu, joka pahenee juostessa, on stop-merkki. Lihasväsymys, joka helpottaa lämmetessä, on normaalia."],
  ["Kaikki","Juo päivän mittaan niin, että virtsa on vaaleaa. Kahvi lasketaan nesteeksi."],
  ["Kaikki","Uni on paras palautusjuoma. 7–9 tuntia, ja kovien viikkojen aikana mieluummin yläpäästä."],
  ["Kaikki","Kirjaa vointi myös lepopäivinä. Mitä enemmän dataa, sitä paremmin ohjelma mukautuu."],
];
function renderTip(t){ const ph=PHASE(weekOf(t)); const pool=TIPS.filter(x=>x[0]===ph||x[0]==="Kaikki"); const tip=pool[t%pool.length]; $("tip").textContent=`💡 ${tip[1]}`; }
function weekSummary(w){
  const [a,b]=weekRange(w); let planned=0, done=0, longest=0, flags={}; const key=[];
  for(let i=a;i<=b&&i<BASE.length;i++){ for(const s of sessionsOn(BASE,logs,ADAPT,i)){ if(s.code==="L") continue; planned++; const l=logs[s.key]; if(l&&l.status==="done"){ done++; if(RUN.has(s.code)&&l.km>longest) longest=l.km; } } const l=logs[isoOfIdx(i)]; flagsOf(l).forEach(f=>flags[f]=(flags[f]||0)+1); }
  const [na,nb]=weekRange(w+1); for(let i=na;i<=nb&&i<BASE.length;i++){ const e=effective(BASE,ADAPT,i); if(["P","X","R"].includes(e.code)||hasIntensity(e.text)) key.push(`${fmt(i)}: ${TYPES[e.code].l}, ${e.text}`); }
  return {w,act:weekKm(BASE,logs,w),tgt:TARGET_EFF[w-1],planned,done,longest,flags,key};
}
function summaryHTML(S, full){
  const pct=S.planned?Math.round(S.done/S.planned*100):0; const kmPct=S.tgt?Math.round(S.act/S.tgt*100):0;
  const line = pct>=90&&kmPct>=85&&kmPct<=115 ? "Täydellinen viikko. Poro antaa yläkaviot." : pct>=70 ? "Hyvä viikko. Pieni lipsuminen kuuluu asiaan." : S.flags.sick ? "Sairasviikko: lepo oli oikea valinta." : "Vaikea viikko. Uusi viikko, uusi alku: jatka ohjelmasta, älä kirittele.";
  const fl=Object.entries(S.flags).filter(([k])=>k!=="great").map(([k,n])=>`${FLAG_L[k]} ${n}`).join(" · ");
  return `<div class="tiles"><div class="tile"><span>Treenit</span><b class="num">${S.done}/${S.planned}</b></div><div class="tile"><span>Km</span><b class="num">${n1(S.act)}/${S.tgt}</b></div><div class="tile"><span>Pisin</span><b class="num">${S.longest?n1(S.longest):"–"}</b></div></div>
    <p class="target">${line}</p>${fl?`<p class="tip">Vointi: ${fl}</p>`:""}
    ${full&&S.key.length?`<div class="eyebrow">Ensi viikon tärkeimmät</div><ul class="ins">${S.key.slice(0,4).map(k=>`<li>${esc(k)}</li>`).join("")}</ul>`:""}`;
}
function renderSummary(ti){ const d=dow(ti); const el=$("summary"); if(ti<5||ti>=BASE.length||!(d===6||d===0)){ el.hidden=true; return; }
  const w = d===6?weekOf(ti):weekOf(ti)-1; el.hidden=false; el.innerHTML=`<div class="eyebrow">Viikkokooste · viikko ${w}</div>`+summaryHTML(weekSummary(w),true); }
function renderWeeklyList(ti){ const cw=weekOf(ti); const ws=[]; for(let w=cw-1;w>=Math.max(1,cw-4);w--) ws.push(w);
  $("aWeeks").innerHTML=ws.length?ws.map(w=>`<details class="wk"><summary>Viikko ${w} · ${PHASE(w)}</summary>${summaryHTML(weekSummary(w),false)}</details>`).join(""):`<p class="note">Ensimmäinen kooste sunnuntaina.</p>`; }

/* ===== v4: kisa – kengät, varusteet, tankkaus ===== */
const GEAR = [["pack","Juomareppu tai -liivi"],["water","Juomaa vähintään 1 l (pullot tai pussi)"],["cup","Oma juomamuki"],["food","Energiaa (geelit, patukat) koko matkalle"],["jacket","Sadetakki, teipatut saumat"],["pants","Pitkät juoksuhousut"],["layer","Lämmin välikerros"],["hat","Pipo tai buffi"],["gloves","Hanskat"],["blanket","Avaruuslakana"],["whistle","Pilli"],["phone","Puhelin ladattuna + varavirta"],["first","Ensiside ja rakkolaastarit"],["mosq","Hyttyskarkote"],["poles","Sauvat (jos käytät)"],["shoes","Kisakengät, ajetut sisään"],["socks","Kisasukat + varasukat"],["bib","Numerolappu ja kiinnitys"],["cash","Käteistä / kortti, kuljetus Pallakselta"]];
function shoeKm(id){ let s=0; for(const k in logs){ const l=logs[k]; if(l.shoeId===id&&l.status==="done"&&typeof l.km==="number") s+=l.km; } const sh=shoes.find(x=>x.id===id); return (sh?sh.startKm||0:0)+s; }
function renderRace(){
  // kengät
  $("shoeList").innerHTML = shoes.length? shoes.map(sh=>{ const km=shoeKm(sh.id), lim=sh.limit||700, pct=Math.min(100,km/lim*100); const warn=km>=lim*0.85;
    return `<div class="shoe${sh.retired?" retired":""}"><div class="lbl"><b>👟 ${esc(sh.name)}${meta.defaultShoe===sh.id?" · oletus":""}</b><span class="num">${Math.round(km)} / ${lim} km</span></div><div class="track"><div class="fill${warn?" warnfill":""}" style="width:${pct}%"></div></div>
      ${warn&&!sh.retired?`<p class="tip">Kengät alkavat olla loppuun ajetut. Hanki uudet ja aja ne sisään ennen tärkeitä lenkkejä.</p>`:""}
      <div class="row"><button class="link" data-shoedef="${sh.id}">Aseta oletukseksi</button><button class="link" data-shoeret="${sh.id}">${sh.retired?"Palauta käyttöön":"Poista käytöstä"}</button></div></div>`; }).join("") : `<p class="note">Lisää kengät, niin näet kilometrit ja vaihtoajan.</p>`;
  // varusteet
  const have=GEAR.filter(([k])=>gear[k]&&gear[k].have).length, tested=GEAR.filter(([k])=>gear[k]&&gear[k].tested).length;
  $("gearHead").textContent=`${have}/${GEAR.length} hankittu · ${tested} testattu`;
  $("gearList").innerHTML=GEAR.map(([k,l])=>{ const g=gear[k]||{}; return `<div class="gear"><span>${esc(l)}</span><label class="chk"><input type="checkbox" data-gear="${k}" data-f="have" ${g.have?"checked":""}> hankittu</label><label class="chk"><input type="checkbox" data-gear="${k}" data-f="tested" ${g.tested?"checked":""}> testattu</label></div>`; }).join("");
  // tankkaus
  const fe=entries().filter(e=>e.l.fuel||e.l.carbsH||e.l.gut).sort((a,b)=>a.key<b.key?1:-1);
  const gutL={ok:"vatsa ok",some:"pientä vaivaa",bad:"vatsa kiukutteli"};
  const avgC=(()=>{ const v=fe.map(e=>e.l.carbsH).filter(x=>typeof x==="number"); return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null; })();
  $("fuelCard").hidden=!fe.length;
  $("fuelSum").innerHTML = fe.length? `<p class="tip">${fe.length} tankkauskirjausta${avgC?` · keskimäärin ${avgC} g hiilihydraattia/h`:""}${avgC&&avgC<40?" · tavoite pitkillä on 40–60 g/h":""}.</p>`:"";
  $("fuelList").innerHTML = fe.length? `<ul class="up">${fe.slice(0,12).map(e=>`<li><time>${fmtShort(e.idx)}</time><span><b>${TYPES[e.code].l}${e.l.km?` ${n1(e.l.km)} km`:""}</b>${e.l.carbsH?` · ${e.l.carbsH} g/h`:""}${e.l.gut?` · ${gutL[e.l.gut]}`:""}<br>${esc(e.l.fuel||"")}</span></li>`).join("")}</ul>` : `<p class="note">Kirjaa tankkaus pitkien lenkkien kirjausikkunassa.</p>`;
}
document.addEventListener("change",e=>{ const c=e.target.closest("[data-gear]"); if(!c) return; const k=c.dataset.gear; gear[k]={...(gear[k]||{}),[c.dataset.f]:c.checked}; persist(); renderRace(); });
document.addEventListener("click",e=>{ const d=e.target.closest("[data-shoedef]"); if(d){ meta.defaultShoe=d.dataset.shoedef; persist(); renderRace(); return; }
  const r=e.target.closest("[data-shoeret]"); if(r){ const sh=shoes.find(x=>x.id===r.dataset.shoeret); sh.retired=!sh.retired; persist(); renderRace(); } });
$("shoeAdd").onclick=()=>{ const name=$("shoeName").value.trim(); if(!name){ $("shoeName").focus(); return; } const start=Number(($("shoeStart").value||"0").replace(",","."))||0;
  const id="s"+Date.now().toString(36); shoes.push({id,name:name.slice(0,40),startKm:start,limit:700,retired:false}); if(!meta.defaultShoe) meta.defaultShoe=id; $("shoeName").value=""; $("shoeStart").value=""; persist(); renderRace(); toast("Kengät lisätty."); };


/* ===== Strava ===== */
const LS_STRAVA="pallas.strava.v1";
let strava = load(LS_STRAVA, {});   // {worker, a, r, e, name, lastSync, after}
function saveStrava(){ try{ localStorage.setItem(LS_STRAVA, JSON.stringify(strava)); }catch(e){} }
const CAT = t => ["Run","TrailRun","VirtualRun"].includes(t)?"run": ["Walk","Hike","Snowshoe"].includes(t)?"hike": t==="Swim"?"swim": ["Yoga","Pilates"].includes(t)?"yoga":
  ["Soccer","Basketball","Tennis","Badminton","Squash","Padel","Pickleball","Volleyball","TableTennis","Racquetball"].includes(t)?"ball": ["Ride","VirtualRide","EBikeRide","GravelRide","MountainBikeRide","Velomobile"].includes(t)?"bike": ["NordicSki","BackcountrySki","RollerSki"].includes(t)?"ski": "gym";
const CODE_CAT = c => RUN.has(c)?"run": (c==="PT"||c==="YM"||c==="SK"||c==="KA")?"hike": ["S","SH","SL","PY"].includes(c)?"bike": c==="HI"?"ski": ["T","TL","K","LH","SA"].includes(c)?"gym": c==="UI"?"swim": c==="JO"?"yoga": c==="PA"?"ball": null;
const CAT_CODE = {run:"J", hike:"KA", bike:"PY", ski:"HI", gym:"SA", swim:"UI", yoga:"JO", ball:"PA"};
function workerBase(){ return (strava.worker||"").replace(/\/+$/,""); }
function stravaConnected(){ return !!(strava.r && strava.worker); }
function connectStrava(){
  const w=$("stWorker").value.trim().replace(/\/+$/,"");
  if(!/^https:\/\/[^\s/]+\.workers\.dev$/.test(w) && !/^https:\/\/[^\s/]+\.[^\s/]+$/.test(w)){ $("stMsg").textContent="Anna välipalvelimen osoite muodossa https://nimi.tunnus.workers.dev"; return; }
  strava.worker=w; strava.state=Math.random().toString(36).slice(2)+Date.now().toString(36); saveStrava();
  location.href=`${w}/auth/start?state=${strava.state}`;
}
function codeOf(p){ return btoa(unescape(encodeURIComponent(JSON.stringify(p)))); }
function applyStravaPayload(p){ if(!p||!p.r) throw "bad"; Object.assign(strava,{a:p.a,r:p.r,e:p.e,name:p.n||"",state:null}); if(p.w) strava.worker=p.w; if(!strava.after) strava.after=Math.floor(Date.UTC(2026,10,16)/1000); saveStrava(); }
function handleStravaReturn(){
  const h=location.hash||"";
  if(h.startsWith("#strava-virhe")){ history.replaceState(null,"",location.pathname+"#historia"); setTimeout(()=>toast("Strava-yhteys ei onnistunut. Yritä uudelleen."),300); return; }
  if(!h.startsWith("#strava=")) return;
  history.replaceState(null,"",location.pathname+"#historia");
  let p=null; try{ p=JSON.parse(decodeURIComponent(h.slice(8))); }catch(e){}
  if(!p){ setTimeout(()=>toast("Strava-yhteyden vahvistus epäonnistui. Yhdistä uudelleen."),300); return; }
  if(strava.state && p.s===strava.state){ applyStravaPayload(p); setTimeout(async()=>{ toast(`Strava yhdistetty${strava.name?`: ${strava.name}`:""}.`); if(!Object.keys(logs).length) await cloudRestore(); syncStrava(true); },300); return; }
  // Palattiin eri muistiin (esim. Safari eikä kotinäytön sovellus): näytä yhdistämiskoodi.
  pendingCode = codeOf(p);
}
let pendingCode=null;
function useCode(raw){ try{ const p=JSON.parse(decodeURIComponent(escape(atob(raw.trim())))); applyStravaPayload(p); $("stCode").value=""; toast(`Strava yhdistetty${strava.name?`: ${strava.name}`:""}.`); (Object.keys(logs).length?Promise.resolve():cloudRestore()).then(()=>syncStrava(true)); renderStrava(); }catch(e){ $("stMsg").textContent="Koodi ei kelpaa. Kopioi koko koodi uudelleen."; } }
async function stravaToken(){
  if(strava.a && strava.e && strava.e*1000 > Date.now()+120000) return strava.a;
  const r=await fetch(`${workerBase()}/token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:strava.r})});
  if(!r.ok) throw new Error("token");
  const t=await r.json(); Object.assign(strava,{a:t.a,r:t.r,e:t.e}); saveStrava(); return strava.a;
}
let syncing=false;
async function syncStrava(manual){
  if(!stravaConnected()||syncing) return; syncing=true; renderStrava();
  try{
    const tok=await stravaToken(); let page=1, acts=[];
    while(page<=5){ const r=await fetch(`${workerBase()}/activities?after=${strava.after}&per_page=100&page=${page}`,{headers:{Authorization:`Bearer ${tok}`}});
      if(r.status===401){ throw new Error("auth"); } if(r.status===429){ throw new Error("rate"); } if(!r.ok) throw new Error("http");
      const batch=await r.json(); acts=acts.concat(batch); if(batch.length<100) break; page++; }
    const res=importActivities(acts);
    strava.lastSync=new Date().toISOString(); saveStrava(); persist(); render(); cloudSave(false);
    if(res.added||res.updated||manual) toast(res.added||res.updated?`Stravasta: ${res.added} uutta treeniä${res.updated?`, ${res.updated} päivitetty`:""}.`:"Ei uusia treenejä Stravassa.");
  }catch(e){
    const m=e.message==="auth"||e.message==="token"?"Strava-yhteys on vanhentunut. Yhdistä uudelleen.":e.message==="rate"?"Strava rajoitti hakuja hetkeksi. Yritä 15 min päästä.":"Stravaan ei saatu yhteyttä. Tarkista nettiyhteys.";
    if(e.message==="auth"||e.message==="token"){ strava.r=null; strava.a=null; saveStrava(); }
    if(manual||e.message==="auth"||e.message==="token") toast(m);
  }finally{ syncing=false; renderStrava(); }
}
function importActivities(acts){
  let added=0, updated=0; BASE=buildBase(); ADAPT=buildAdapt(BASE,logs,adjOff,todayIdx());
  acts.sort((x,y)=>x.start_date<y.start_date?-1:1);
  for(const a of acts){
    const date=(a.start_date_local||a.start_date||"").slice(0,10); const i=idxOfISO(date); if(!date||i<0) continue;
    if(i>=PLAN.length){ if(Object.keys(logs).some(k=>logs[k].stravaId===a.id)) continue; const c=CAT(a.sport_type||a.type); logs[`${date}~s${a.id}`]={status:"done",type:CAT_CODE[c]||"MU",km:(c==="run"||c==="hike")?Math.round(a.distance/100)/10:null,min:Math.round((a.moving_time||0)/60),hr:a.average_heartrate?Math.round(a.average_heartrate):null,stravaId:a.id,stravaName:a.name||"",flags:[],note:"",updatedAt:new Date().toISOString()}; added++; continue; }
    const cat=CAT(a.sport_type||a.type);
    if(Object.keys(logs).some(k=>logs[k].strengthStravaId===a.id)) continue;
    const already=Object.keys(logs).find(k=>logs[k].stravaId===a.id);
    const fields={status:"done", km: (cat==="run"||cat==="hike")? Math.round(a.distance/100)/10 : null, min: Math.round((a.moving_time||0)/60), hr: a.average_heartrate?Math.round(a.average_heartrate):null,
      elev: a.total_elevation_gain!=null?Math.round(a.total_elevation_gain):null, stravaId:a.id, stravaName:a.name||"", updatedAt:new Date().toISOString()};
    if(already){ const l=logs[already]; if(l.km!==fields.km||l.min!==fields.min||l.elev!==fields.elev){ logs[already]={...l,...fields,status:l.status==="skip"?"done":l.status}; updated++; } continue; }
    if(cat==="gym"){ const s0=sessionsOn(BASE,logs,ADAPT,i).find(s=>RUN.has(s.code)&&(s.code==="JL"||/lihaskunto/i.test(s.text||""))&&!(logs[s.key]&&logs[s.key].strengthStravaId));
      if(s0){ const prev=logs[s0.key]||{}; logs[s0.key]={...prev, type:prev.type||s0.code, status:prev.status||"note", flags:prev.flags||[], note:prev.note||"", strength:prev.strength||progFromText(s0.text,weekOf(i)), strengthMin:Math.round((a.moving_time||0)/60), strengthStravaId:a.id, updatedAt:new Date().toISOString()}; added++; continue; } }
    let key=null;
    for(const s of sessionsOn(BASE,logs,ADAPT,i)){ const l=logs[s.key]; if(l&&l.stravaId) continue; if(l&&l.status==="done"&&!l.quick) continue; if(CODE_CAT(s.code)===cat || (cat==="run"&&s.code==="JL") || (cat==="gym"&&s.code==="SL") || (cat==="bike"&&s.code==="TL") || s.code==="V"){ key=s.key; break; } }
    let type;
    if(key){ type=sessionByKey(key).code; } else { key=`${date}~s${a.id}`; type=CAT_CODE[cat]; }
    const prev=logs[key]||{};
    const doc={...prev, ...fields, quick:undefined, type, flags:prev.flags||[], feel:prev.feel??null, note:prev.note||"", shoeId: prev.shoeId ?? ((cat==="run"||cat==="hike")?(meta.defaultShoe||null):null)};
    logs[key]=doc; added++;
  }
  return {added,updated};
}
function renderStrava(){
  const el=$("stravaCard"); if(!el) return;
  const c=stravaConnected();
  $("stCodeBox").hidden=!pendingCode; if(pendingCode) $("stCodeOut").value=pendingCode;
  $("stPaste").hidden=c;
  $("stWorker").value=strava.worker||""; $("stWorkerRow").hidden=c;
  $("stConnect").hidden=c; $("stSync").hidden=!c; $("stDisconnect").hidden=!c; $("stSync").disabled=syncing; $("stSync").textContent=syncing?"Haetaan…":"Hae treenit nyt";
  const last=strava.lastSync?new Date(strava.lastSync):null;
  $("stStatus").innerHTML = c ? `✅ ${strava.name?esc(strava.name):"Yhdistetty"}${last?` · haettu ${last.getDate()}.${last.getMonth()+1}. ${String(last.getHours()).padStart(2,"0")}.${String(last.getMinutes()).padStart(2,"0")}`:""}` : "Ei yhdistetty.";
}
$("stConnect").onclick=connectStrava;
$("stCopyCode").onclick=async()=>{ try{ await navigator.clipboard.writeText(pendingCode); $("stCopyCode").textContent="Kopioitu ✓"; }catch(e){ $("stCodeOut").select(); } };
$("stUseCode").onclick=()=>useCode($("stCode").value);
$("stSync").onclick=()=>syncStrava(true);
$("stDisconnect").onclick=()=>{ strava={worker:strava.worker}; saveStrava(); renderStrava(); toast("Strava-yhteys katkaistu. Kirjaukset säilyvät."); };


/* ===== Lihaskunto: ohjelmat ja treenitila ===== */
const WARMUP = "Lämmittely 5 min: reipas kävely, hyppynaru tai kuntopyörä. Sitten 10 jalkaheilautusta eteen ja sivulle per jalka, 10 lantion pyöritystä ja 10 kyykkyä ilman painoa.";
const STRENGTH = {
  A:{name:"Pohja", when:"Viikot 1–16 · 2× viikossa talvella", time:"30 min", goal:"Rakentaa perusvoiman jalkoihin, pakaroihin ja keskivartaloon. Valmistaa jänteet ja nivelet juoksun iskutukseen.",
    ex:[
      {n:"Kyykky",s:3,r:"10–12",t:"3 s alas, 1 s ylös",rest:60,c:["Jalat hartioiden levyisesti, varpaat hieman ulospäin","Lantio taakse kuin istuisit tuolille, rintakehä pystyssä","Polvet varpaiden suuntaan, paino koko jalkapohjalla"],e:"Kyykky tuolille ja ylös",h:"Kahvakuula rinnan edessä (8–16 kg)",w:"Reisien ja pakaroiden perusvoima"},
      {n:"Askelkyykky taakse",s:3,r:"8 / jalka",t:"rauhallisesti",rest:60,c:["Astu pitkä askel taakse","Takapolvi lähes lattiaan, etupolvi pysyy nilkan päällä","Ponnista etujalan kantapäällä takaisin ylös"],e:"Ota tuesta kiinni",h:"Käsipainot käsissä",w:"Yhden jalan voima ja tasapaino"},
      {n:"Lantionnosto",s:3,r:"12–15",t:"pito 2 s ylhäällä",rest:45,c:["Selinmakuu, kantapäät lähellä pakaroita","Työnnä kantapäillä ja purista pakarat","Älä notkista selkää: kylkiluut alas"],e:"Pienempi liikerata",h:"Yhdellä jalalla",w:"Pakarat kantavat juoksussa lantiota"},
      {n:"Pohjenousu portaalla",s:3,r:"15",t:"1 s ylös, 3 s alas",rest:45,c:["Päkiät portaan reunalla, polvet suorina","Nouse täysin varpaille","Laske hitaasti, kantapää portaan alapuolelle"],e:"Lattialla, kahdella jalalla",h:"Yhdellä jalalla",w:"Akillesjänne ja pohkeet: yleisimmät juoksijan kipupaikat"},
      {n:"Lankku",s:3,r:"30–45 s",t:"pito",rest:30,c:["Kyynärpäät olkapäiden alla","Vatsa ja pakarat tiukkana","Suora linja päästä kantapäihin, lantio ei roiku"],e:"Polvet maassa",h:"Nosta vuorotellen jalkaa",w:"Keskivartalo pitää askeleen ryhdikkäänä väsyneenä"},
      {n:"Kylkilankku",s:2,r:"20–30 s / puoli",t:"pito",rest:30,c:["Kyynärpää olkapään alla","Lantio ylhäällä, vartalo suorana","Hengitä normaalisti"],e:"Alempi polvi maassa",h:"Nosta ylempi jalka",w:"Lantion tuki, estää polven kiertymistä"},
      {n:"Yhden jalan seisonta",s:2,r:"30 s / jalka",t:"pito",rest:15,c:["Polvi pehmeänä","Katse eteenpäin","Pidä lantio suorassa"],e:"Kevyt tuki sormilla",h:"Silmät kiinni tai tyynyn päällä",w:"Nilkan hallinta kivikkoon ja juurakkoon"},
    ]},
  B:{name:"Juoksijan voima", when:"Viikot 17–24 · 1–2× viikossa", time:"35 min", goal:"Yhden jalan voima, koska juoksu on hyppelyä yhdeltä jalalta toiselle. Tukee maratonjaksoa.",
    ex:[
      {n:"Bulgarialainen askelkyykky",s:3,r:"8 / jalka",t:"3 s alas, 1 s ylös",rest:90,c:["Takajalan päkiä penkillä tai tuolilla","Laskeudu suoraan alas, etupolvi linjassa varpaiden kanssa","Ylävartalo hieman eteenpäin kallistettuna"],e:"Ilman painoja, tuki kädellä",h:"Käsipainot (2 × 6–12 kg)",w:"Tehokkain yksittäinen juoksijan jalkaliike"},
      {n:"Askelnousu korkealle",s:3,r:"10 / jalka",t:"rauhallinen lasku",rest:60,c:["Polvenkorkuinen taso","Nouse etujalan voimalla, älä ponnista takajalalla","Laske hitaasti takaisin alas"],e:"Matalampi taso",h:"Käsipainot",w:"Suoraan ylämäkivoimaa tuntureille"},
      {n:"Yhden jalan maastaveto",s:3,r:"8 / jalka",t:"hitaasti",rest:60,c:["Kallista ylävartaloa eteen, vapaa jalka taakse","Selkä suorana, lantio suorassa","Nouse puristamalla pakaraa"],e:"Ota seinästä tuki",h:"Kahvakuula vastakkaisessa kädessä",w:"Takareidet ja tasapaino"},
      {n:"Yhden jalan lantionnosto",s:3,r:"10 / jalka",t:"pito 2 s",rest:45,c:["Toinen jalka suorana ilmassa","Työnnä kantapäällä","Lantio pysyy vaakasuorassa"],e:"Kahdella jalalla",h:"Kantapää penkillä",w:"Pakaroiden voima väsyneenä"},
      {n:"Yhden jalan pohjenousu",s:3,r:"12 / jalka",t:"1 s ylös, 3 s alas",rest:45,c:["Suorin polvin portaan reunalla","Täysi liikerata","Lopuksi 1 sarja polvi koukussa (syvä pohje)"],e:"Kahdella jalalla",h:"Käsipaino samassa kädessä",w:"Pohje kantaa maratonin lopussa"},
      {n:"Lankku olkapääkosketuksin",s:3,r:"10 / puoli",t:"rauhallisesti",rest:30,c:["Punnerrusasento, jalat leveämmällä","Kosketa vuorotellen vastakkaista olkapäätä","Lantio ei saa heilua"],e:"Polvet maassa",h:"Jalat lähempänä toisiaan",w:"Keskivartalon kiertojäykkyys"},
    ]},
  C:{name:"Alamäkivoima", when:"Viikot 25–33 · 1× viikossa", time:"30 min", goal:"Valmistaa reidet tunturin alamäkiin. Nutsissa jalat hajoavat yleensä alamäissä, eivät ylämäissä.",
    ex:[
      {n:"Hidas lasku portaalta",s:3,r:"8 / jalka",t:"4 s alas",rest:60,c:["Seiso portaalla yhdellä jalalla","Laske toisen jalan kantapää lattiaan 4 sekunnissa","Polvi pysyy linjassa, ei kierry sisään"],e:"Matalampi porras",h:"Korkeampi taso tai paino",w:"Eksentrinen voima = alamäkikestävyys"},
      {n:"Bulgarialainen askelkyykky",s:3,r:"8 / jalka",t:"3 s alas",rest:90,c:["Kuten ohjelmassa B","Painot käsiin","Hidas, hallittu lasku"],e:"Ilman painoja",h:"Raskaammat painot",w:"Reisien voima"},
      {n:"Seinäistunta",s:3,r:"45–60 s",t:"pito",rest:45,c:["Selkä seinää vasten","Reidet vaakatasossa, polvet 90°","Paino kantapäillä"],e:"Korkeampi asento",h:"Yhdellä jalalla 15 s / jalka",w:"Reisien sitkeys pitkiin laskuihin"},
      {n:"Hyppykyykky",s:3,r:"8",t:"räjähtävä ylös, pehmeä alas",rest:60,c:["Kyykkyyn ja räjähtävä hyppy ylös","Laskeudu pehmeästi päkiöiden kautta","Jatka suoraan seuraavaan"],e:"Nousu varpaille hypyn sijaan",h:"Korkeampi hyppy",w:"Jalkojen jousto ja reaktiivisuus"},
      {n:"Nilkkahypyt (pogo)",s:3,r:"20 s",t:"nopea",rest:40,c:["Pienet nopeat hypyt päkiöillä","Polvet lähes suorina","Kosketus maahan mahdollisimman lyhyt"],e:"Hyppy paikallaan hitaammin",h:"Yhdellä jalalla",w:"Akillesjänteen jousto ja kivikkojuoksu"},
      {n:"Yhden jalan pohjenousu",s:3,r:"15 / jalka",t:"3 s alas",rest:45,c:["Kuten ohjelmassa B","Täysi liikerata","Hidas lasku"],e:"Kahdella jalalla",h:"Käsipaino",w:"Pohkeet kestävät 66 km"},
      {n:"Kylkilankku",s:3,r:"45 s / puoli",t:"pito",rest:30,c:["Kyynärpää olkapään alla","Lantio ylhäällä","Ylempi jalka voi nousta"],e:"Polvi maassa",h:"Jalan nosto",w:"Lantion tuki väsyneenä"},
    ]},
  D:{name:"Pikapaketti 10 min", when:"Lenkin perään tai kiireisenä päivänä", time:"10 min", goal:"Kun aikaa on vähän: tärkeimmät liikkeet nilkoille, pohkeille ja keskivartalolle.",
    ex:[
      {n:"Pohjenousu portaalla",s:2,r:"15",t:"3 s alas",rest:20,c:["Polvet suorina","Täysi liikerata","Hidas lasku"],e:"Kahdella jalalla",h:"Yhdellä jalalla",w:"Akillesjänne"},
      {n:"Yhden jalan seisonta",s:2,r:"30 s / jalka",t:"pito",rest:10,c:["Polvi pehmeänä","Silmät kiinni, jos helppoa","Lantio suorassa"],e:"Tuki sormilla",h:"Silmät kiinni",w:"Nilkan hallinta"},
      {n:"Lankku",s:2,r:"30 s",t:"pito",rest:20,c:["Suora linja","Vatsa tiukkana","Hengitä"],e:"Polvet maassa",h:"60 s",w:"Keskivartalo"},
      {n:"Kylkilankku",s:1,r:"20 s / puoli",t:"pito",rest:10,c:["Lantio ylhäällä","Suora linja","Hengitä"],e:"Polvi maassa",h:"Jalan nosto",w:"Lantion tuki"},
    ]},
};
const PROGRESS = ["Viikot 1–2: tee 2 sarjaa jokaisesta liikkeestä. Opettele tekniikka.","Kun viimeinen sarja tuntuu helpolta kahdella peräkkäisellä kerralla, lisää 2 toistoa tai 2–4 kg.","Kevyellä viikolla tee 2 sarjaa.","Ei raskasta jalkatreeniä päivää ennen pitkää lenkkiä.","Lihasarkuus 1–2 päivää on normaalia. Nivel- tai jännekipu ei ole: kevennä ja kirjaa kipu."];
const LS_WO="pallas.workout.v1";
let wo = load(LS_WO, null); // {p, d:{exIdx:[bool]}, started}
let restT=null, restLeft=0;
function progForWeek(w){ return w<=16?"A":w<=24?"B":"C"; }
function progFromText(text,w){ const m=(text||"").match(/lihaskunto\s+([ABCD])\b/i); return m?m[1].toUpperCase():progForWeek(w); }
let opasProg=null;
function renderStrength(){
  const t=T0(); const cur=progForWeek(weekOf(t)); const p = opasProg || (wo&&wo.p) || cur; const P=STRENGTH[p];
  $("sProgs").innerHTML=Object.keys(STRENGTH).map(k=>`<button data-prog="${k}" aria-pressed="${k===p}">${k} · ${STRENGTH[k].name}${k===cur?" ★":""}</button>`).join("");
  const active = wo && wo.p===p;
  const doneSets = active ? Object.values(wo.d).flat().filter(Boolean).length : 0, allSets=P.ex.reduce((a,e)=>a+e.s,0);
  $("sHead").innerHTML=`<h3>${p} · ${P.name}</h3><p class="tip">${esc(P.when)} · noin ${P.time}</p><p class="target">${esc(P.goal)}</p><p class="tip">🔥 ${esc(WARMUP)}</p>`;
  const curEx= active ? P.ex.findIndex((e,i)=>(wo.d[i]||[]).filter(Boolean).length<e.s) : -1;
  $("sList").innerHTML=P.ex.map((e,i)=>{ const d=active?(wo.d[i]||[]):[]; const nd=d.filter(Boolean).length; const finished=active&&nd>=e.s;
    return `<li class="ex${finished?" fin":""}${i===curEx?" cur":""}" id="ex${i}"><details${i===curEx?" open":""}><summary class="exhead"><span class="exn">${finished?"✓":i+1}</span><div><b>${esc(e.n)}</b><div class="dose"><span>${e.s} × ${esc(e.r)}</span>${active?`<span>${nd}/${e.s}</span>`:`<span>lepo ${e.rest} s</span>`}</div></div></summary>
      <div class="exbody"><p class="tip">${esc(e.t)} · lepo ${e.rest} s · ${esc(e.w)}</p><ul class="cues">${e.c.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <p class="tip"><b>Helpompi:</b> ${esc(e.e)} · <b>Vaikeampi:</b> ${esc(e.h)}</p>
      ${active?`<div class="sets">${Array.from({length:e.s},(_,k)=>`<button class="set" data-set="${i}:${k}" aria-pressed="${!!d[k]}">Sarja ${k+1}${d[k]?" ✓":""}</button>`).join("")}</div>`:""}</div></details></li>`; }).join("");
  $("sList").classList.toggle("active",!!active);
  $("sStart").hidden=active; $("sFinish").hidden=!active; $("sCancel").hidden=!active;
  $("sStart").textContent = wo&&wo.p!==p ? `Aloita ${p} (keskeneräinen ${wo.p} poistuu)` : `Aloita treeni ${p}`;
  $("sProgress").textContent = active?`${doneSets}/${allSets} sarjaa tehty`:"";
  $("sRules").innerHTML=PROGRESS.map(x=>`<li>${esc(x)}</li>`).join("");
  const cnt=entries().filter(e=>e.l.strength).length; $("sCount").textContent=cnt?`Lihaskuntotreenejä kirjattu: ${cnt}`:"";
}
function saveWo(){ try{ wo?localStorage.setItem(LS_WO,JSON.stringify(wo)):localStorage.removeItem(LS_WO); }catch(e){} }
function startRest(sec){ clearInterval(restT); restLeft=sec; $("restBar").hidden=false; tick(); restT=setInterval(tick,1000);
  function tick(){ $("restTxt").textContent=`Lepo ${restLeft} s`; $("restFill").style.width=`${Math.max(0,restLeft/sec*100)}%`; if(restLeft<=0){ clearInterval(restT); $("restTxt").textContent="Seuraava sarja!"; if(navigator.vibrate) navigator.vibrate([80,60,80]); setTimeout(()=>$("restBar").hidden=true,2500); } restLeft--; } }
document.addEventListener("click",e=>{
  const pr=e.target.closest("[data-prog]"); if(pr){ opasProg=pr.dataset.prog; renderStrength(); return; }
  const st=e.target.closest("[data-set]"); if(st&&wo){ const [i,k]=st.dataset.set.split(":").map(Number); wo.d[i]=wo.d[i]||[]; wo.d[i][k]=!wo.d[i][k]; saveWo(); const ex=STRENGTH[wo.p].ex[i]; const fin=wo.d[i].filter(Boolean).length>=ex.s; if(wo.d[i][k]) startRest(ex.rest); renderStrength(); if(wo.d[i][k]&&fin){ const n=$("sList").querySelector(".ex.cur"); if(n) setTimeout(()=>n.scrollIntoView({behavior:"smooth",block:"center"}),60); } return; }
  const go=e.target.closest("[data-gostrength]"); if(go){ opasProg=go.dataset.gostrength; location.hash="#opas"; setTimeout(()=>$("strength").scrollIntoView({behavior:"smooth"}),80); }
});
$("sStart").onclick=()=>{ const p=opasProg||progForWeek(weekOf(T0())); wo={p,d:{},started:new Date().toISOString()}; saveWo(); renderStrength(); const n=$("sList").querySelector(".ex.cur"); (n||$("sList")).scrollIntoView({behavior:"smooth",block:"center"}); };
$("sCancel").onclick=()=>{ wo=null; saveWo(); clearInterval(restT); $("restBar").hidden=true; renderStrength(); };
$("restSkip").onclick=()=>{ clearInterval(restT); $("restBar").hidden=true; };
$("sFinish").onclick=()=>{
  const P=STRENGTH[wo.p]; const done=Object.values(wo.d).flat().filter(Boolean).length, all=P.ex.reduce((a,e)=>a+e.s,0);
  const t=todayIdx(); if(t<0||t>=BASE.length){ wo=null; saveWo(); renderStrength(); return; }
  const key=isoOfIdx(t); const code=BASE[t][0]; const prev=logs[key]||{};
  const strengthy=["T","TL","K","SL","LH"].includes(code); const mins=Math.round((Date.now()-new Date(wo.started).getTime())/60000);
  const doc={...prev, type:prev.type||code, strength:wo.p, strengthSets:`${done}/${all}`, status: prev.status && prev.status!=="note" ? prev.status : (strengthy?"done":(prev.status||"note")), flags:prev.flags||[], note: prev.note||"", min: prev.min ?? (strengthy?Math.min(mins,120):prev.min??null), updatedAt:new Date().toISOString()};
  logs[key]=doc; persist(); wo=null; saveWo(); clearInterval(restT); $("restBar").hidden=true; render(); celebrate(); toast(`Lihaskunto ${doc.strength} kirjattu (${done}/${all} sarjaa). 💪`);
};


/* ===== Pilvivarmuuskopio ===== */
let cloudTimer=null, cloudState={busy:false, last: meta.cloudSaved||null, err:null};
function weeksStatus(){ const t=Math.max(0,todayIdx()), w=weekOf(t), o={}; for(const x of [w,w+1]){ if(x>36) continue; o[isoOfIdx((x-1)*7-1)]={w:x,tgt:TARGET_EFF[x-1]}; } return o; }
function upcomingStatus(){ const t0=Math.max(0,todayIdx()); const t=Math.max(0,(weekOf(t0)-1)*7-1); const up={}; for(let i=t;i<=Math.min(BASE.length-1,t+21);i++){ const e=effective(BASE,ADAPT,i); up[isoOfIdx(i)]={code:e.code,label:TYPES[e.code].l,text:(e.text||"").slice(0,120),note:(BASE[i][2]||"").slice(0,40)}; } return up; }
function cloudPayload(){
  const ti=todayIdx(); let ws=[]; try{ ws=computeWarnings(BASE,logs,ADAPT,ti).concat(eventWarnings(ti)).concat(cpWarnings(ti)).map(w=>({level:w.level,title:w.title})); }catch(e){}
  return { data:{app:"matka-pallakselle",version:3,logs,adjOff,edits,weekScale,shoes,gear,hr:meta.hr||null,defaultShoe:meta.defaultShoe||null}, status:{upcoming:upcomingStatus(),weeks:weeksStatus(),warnings:ws,at:new Date().toISOString()}, refresh:strava.r||null };
}
function scheduleCloud(){ if(!stravaConnected()) return; clearTimeout(cloudTimer); cloudTimer=setTimeout(()=>cloudSave(false),8000); }
async function cloudSave(keepalive){
  if(!stravaConnected()) return; clearTimeout(cloudTimer);
  try{ cloudState.busy=true; const tok=await stravaToken();
    const r=await fetch(`${workerBase()}/backup`,{method:"PUT",keepalive:!!keepalive,headers:{Authorization:`Bearer ${tok}`,"Content-Type":"application/json"},body:JSON.stringify(cloudPayload())});
    if(r.status===503){ cloudState.err="Pilvitallennus ei ole vielä käytössä."; return; }
    if(!r.ok) throw new Error(r.status); const j=await r.json(); cloudState.last=meta.cloudSaved=j.savedAt; meta.lastBackup=j.savedAt; cloudState.err=null; try{ localStorage.setItem(LS_META,JSON.stringify(meta)); }catch(e){}
  }catch(e){ cloudState.err="Pilvitallennus epäonnistui. Yritetään uudelleen."; }
  finally{ cloudState.busy=false; if(route()==="historia") renderCloud(); }
}
async function cloudRestore(){
  try{ const tok=await stravaToken(); const r=await fetch(`${workerBase()}/backup`,{headers:{Authorization:`Bearer ${tok}`}});
    if(r.status===404){ toast("Pilvessä ei ole vielä varmuuskopiota."); return; } if(!r.ok) throw 0;
    const d=await r.json(); let n=0;
    for(const k in d.logs||{}){ if(!logs[k]||(d.logs[k].updatedAt||"")>(logs[k].updatedAt||"")){ logs[k]=d.logs[k]; n++; } }
    adjOff={...(d.adjOff||{}),...adjOff}; edits={...(d.edits||{}),...edits}; weekScale={...(d.weekScale||{}),...weekScale};
    (d.shoes||[]).forEach(x=>{ if(!shoes.find(y=>y.id===x.id)) shoes.push(x); }); gear={...(d.gear||{}),...gear};
    if(!meta.hr&&d.hr) meta.hr=d.hr; if(!meta.defaultShoe&&d.defaultShoe) meta.defaultShoe=d.defaultShoe;
    persist(); render(); toast(`Palautettu pilvestä: ${n} kirjausta.`);
  }catch(e){ toast("Palautus epäonnistui. Tarkista nettiyhteys."); }
}
function renderCloud(){
  const el=$("cloudStatus"); if(!el) return;
  if(!stravaConnected()){ el.textContent="Käytössä, kun Strava on yhdistetty."; $("cloudRestore").hidden=true; return; }
  const l=cloudState.last?new Date(cloudState.last):null;
  el.textContent = cloudState.err || (l?`☁️ Tallennettu automaattisesti ${l.getDate()}.${l.getMonth()+1}. ${String(l.getHours()).padStart(2,"0")}.${String(l.getMinutes()).padStart(2,"0")}`:"☁️ Tallentuu automaattisesti.");
  $("cloudRestore").hidden=false;
}
$("cloudRestore").onclick=cloudRestore;
document.addEventListener("visibilitychange",()=>{ if(document.hidden && cloudTimer) cloudSave(true); });

/* ===== Ilmoitukset (Web Push) ===== */
function pushSupported(){ return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }
function b64uToBytes(s){ const p="=".repeat((4-s.length%4)%4); const b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/")); return Uint8Array.from(b,c=>c.charCodeAt(0)); }
async function enablePush(){
  const msg=$("pushMsg");
  if(!pushSupported()){ msg.textContent= standalone ? "Tämä laite ei tue ilmoituksia (vaatii iOS 16.4+)." : "Avaa sovellus kotinäytön kuvakkeesta, niin ilmoitukset voi ottaa käyttöön."; return; }
  if(!stravaConnected()){ msg.textContent="Yhdistä ensin Strava (Historia → Strava)."; return; }
  try{
    const perm=await Notification.requestPermission(); if(perm!=="granted"){ msg.textContent="Ilmoitukset estetty. Salli ne iPhonen asetuksista: Asetukset → Ilmoitukset → Pallakselle."; return; }
    const reg=await navigator.serviceWorker.ready;
    const kr=await fetch(`${workerBase()}/push/key`); if(!kr.ok) throw new Error("key"); const {key}=await kr.json();
    let sub=await reg.pushManager.getSubscription(); if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64uToBytes(key)});
    const tok=await stravaToken();
    const r=await fetch(`${workerBase()}/push/subscribe`,{method:"POST",headers:{Authorization:`Bearer ${tok}`,"Content-Type":"application/json"},body:JSON.stringify(sub.toJSON())}); if(!r.ok) throw new Error("sub");
    const c=await caches.open("pallas-config"); await c.put("./config.json", new Response(JSON.stringify({worker:workerBase()})));
    meta.push=true; persist(); cloudSave(false); renderPush(); toast("Ilmoitukset käytössä.");
  }catch(e){ msg.textContent = e.message==="key"?"Ilmoituspalvelu ei ole vielä käytössä.":"Ilmoitusten käyttöönotto epäonnistui. Yritä uudelleen."; }
}
async function testPush(){ try{ const tok=await stravaToken(); const r=await fetch(`${workerBase()}/push/test`,{method:"POST",headers:{Authorization:`Bearer ${tok}`}}); const j=await r.json(); toast(j.ok?"Testi-ilmoitus lähetetty.":"Testi ei mennyt perille. Ota ilmoitukset uudelleen käyttöön."); }catch(e){ toast("Testi epäonnistui."); } }
async function disablePush(){ try{ const reg=await navigator.serviceWorker.ready; const s=await reg.pushManager.getSubscription(); if(s) await s.unsubscribe(); const tok=await stravaToken(); await fetch(`${workerBase()}/push/subscribe`,{method:"DELETE",headers:{Authorization:`Bearer ${tok}`}}); }catch(e){} meta.push=false; persist(); renderPush(); }
function renderPush(){ const on=!!meta.push; $("pushOn").hidden=on; $("pushTest").hidden=!on; $("pushOff").hidden=!on;
  $("pushStatus").textContent = on ? "🔔 Käytössä · iltaisin noin klo 20.45: kirjaamaton treeni, varoitukset ja huomisen pitkä lenkki, testi tai kisa" : "Pois päältä"; }
$("pushOn").onclick=enablePush; $("pushTest").onclick=testPush; $("pushOff").onclick=disablePush;


/* ===== Sykealueet (Karvonen) ===== */
function restHR(){ if(meta.hr&&meta.hr.rest) return meta.hr.rest; const v=Object.keys(logs).sort().slice(-21).map(k=>logs[k].rhr).filter(x=>typeof x==="number").sort((a,b)=>a-b); return v.length>=3?v[Math.floor(v.length/2)]:null; }
function maxHR(){ if(meta.hr&&meta.hr.max) return meta.hr.max; if(meta.hr&&meta.hr.age) return Math.round(208-0.7*meta.hr.age); return null; }
function zones(){ const mx=maxHR(), rs=restHR()||60; if(!mx) return null; const z=p=>Math.round(rs+(mx-rs)*p);
  return [{n:"Palauttava",a:z(.5),b:z(.6)},{n:"Kevyt",a:z(.6),b:z(.7)},{n:"Maratonvauhti",a:z(.7),b:z(.8)},{n:"Kynnys",a:z(.8),b:z(.88)},{n:"Kova",a:z(.88),b:mx}]; }
function zoneFor(code,text){ const t=(text||"").toLowerCase(); if(!RUN.has(code)&&code!=="YM") return null;
  if(/kynnys/.test(t)) return 3; if(/maratonvauh/.test(t)) return 2; if(/vedo|veto|testi|kisa|maraton|nuts/.test(t)&&code!=="P") return null; if(code==="YM") return 2; return 1; }
/* Yhtäjaksoinen juoksu */
function plannedCont(text){ const t=text||""; let m=t.match(/(\d+)\s?min juoksu \+/); if(m) return +m[1]; m=t.match(/(\d+)\s?min yhtäjaksoista/); if(m) return +m[1]; return null; }
function contOf(e){ const l=e.l; if(typeof l.cont==="number") return l.cont; if(l.status!=="done"||!RUN.has(e.code)) return null; const txt=(BASE[e.idx]||[])[1]||""; const pc=plannedCont(txt); if(pc!=null) return pc;
  if(/kävel/i.test(txt)) return null; return typeof l.min==="number"&&l.min>0 ? l.min : null; }
function contStats(){ const es=entries().filter(e=>RUN.has(e.code)); let max=0, maxAt=null, first30=null; const byW={};
  es.sort((a,b)=>a.idx-b.idx).forEach(e=>{ const c=contOf(e); if(c==null) return; if(c>max){ max=c; maxAt=e.idx; } if(c>=30&&first30==null) first30=e.idx; const w=weekOf(e.idx); byW[w]=Math.max(byW[w]||0,c); });
  return {max,maxAt,first30,byW}; }
function contHTML(ti){ const C=contStats(); const cw=weekOf(Math.max(0,ti)); const arr=[]; for(let w=1;w<=Math.min(cw,12);w++) arr.push(C.byW[w]??null);
  const pct=Math.min(100,C.max/30*100); const ms=[10,20,30].map(m=>`<span class="ms${C.max>=m?" on":""}">${C.max>=m?"✓ ":""}${m} min</span>`).join("");
  return `<div class="pred"><b class="num">${C.max} min</b><span>pisin yhtäjaksoinen juoksu${C.maxAt!=null?` · ${fmtShort(C.maxAt)}`:""}</span></div>
    <div class="kmbar"><div class="track"><div class="fill" style="width:${pct}%"></div></div></div><div class="mss">${ms}</div>
    ${C.first30!=null?`<p class="tip">🎉 30 min putkeen saavutettu ${fmt(C.first30)}</p>`:`<p class="tip">Tavoite: 30 min putkeen testissä pe 4.12. Merkitse kirjaukseen, jos juoksit pidempään tai lyhyemmin kuin ohjelmassa.</p>`}
    ${arr.filter(v=>v!=null).length>=2?spark(arr,{min:0,max:Math.max(30,...arr.filter(v=>v!=null)),color:"var(--accent)",label:"Pisin putki viikoittain"}):""}`; }
function checkCont30(){ const C=contStats(); if(C.first30!=null&&!meta.cont30){ meta.cont30=isoOfIdx(C.first30); persist(); setTimeout(()=>{ celebrate(); toast("🎉 30 minuuttia putkeen! Iso virstanpylväs."); },400); } }

/* ===== 2. Belgradin välitarkistukset ===== */
function maxLongKm(upto){ let m=0; for(const e of entries()){ if(e.idx>upto) continue; if(e.l.status==="done"&&RUN.has(e.code)&&typeof e.l.km==="number") m=Math.max(m,e.l.km); } return m; }
const CPS=[
  {id:"c30",by:17,t:"30 min yhtäjaksoista juoksua",v:()=>contStats().max,goal:30,u:"min"},
  {id:"c45",by:48,t:"45 min yhtäjaksoista juoksua",v:()=>contStats().max,goal:45,u:"min"},
  {id:"l17",by:95,t:"Pitkä lenkki 17 km",v:ti=>maxLongKm(ti),goal:17,u:"km"},
  {id:"l24",by:116,t:"Pitkä lenkki 24 km · päätöspiste",v:ti=>maxLongKm(ti),goal:24,u:"km"},
  {id:"l30",by:130,t:"Pitkä lenkki 30 km",v:ti=>maxLongKm(ti),goal:30,u:"km"}];
function cpState(ti){ return CPS.map(c=>{ const v=c.v(ti), ok=v>=c.goal; const st= ok?"ok": ti>c.by+2?"miss": ti>=c.by-14?"near":"later"; return {...c,val:v,st}; }); }
function planBNeeded(ti){ if(meta.bGoal) return false; const S=cpState(ti); return S.filter(x=>x.st==="miss").length>=2 || S.some(x=>(x.id==="l17"||x.id==="l24")&&x.st==="miss"); }
function cpWarnings(ti){ if(meta.bGoal==="half") return []; const S=cpState(ti).filter(x=>x.st==="miss"&&ti-x.by<=21); return S.map(x=>({level:"warn",title:`Välitarkistus jäi: ${x.t}`,detail:`Paras tähän asti ${n1(x.val)} ${x.u}. Katso Analyysi → Kunto.`})); }
function cpHTML(ti){ const S=cpState(ti); const half=meta.bGoal==="half";
  const ic={ok:"✓",miss:"✕",near:"●",later:"○"};
  return `${half?`<p class="note">Tavoitteena puolimaraton la 17.4. Välitarkistukset ovat suuntaa antavia.</p>`:""}<ul class="cps">${S.map(x=>`<li class="cp-${x.st}"><span class="cpi">${ic[x.st]}</span><span><b>${x.t}</b><small>${fmt(x.by)} mennessä · ${x.st==="ok"?"tehty":`nyt ${n1(x.val)} ${x.u}`}</small></span></li>`).join("")}</ul>
    ${planBNeeded(ti)?`<div class="swimp warn"><p><b>Belgrad: maraton vai puolimaraton?</b> Tarkistuksia on jäänyt. Puolimaraton on lauantaina 17.4. klo 9. Nuts-ohjelma jatkuu samana kummassakin tapauksessa. Ilmoittautuminen sulkeutuu 31.3.</p><div class="row"><button class="btn small" data-bgoal="full">Jatka maratonia</button><button class="btn small primary" data-bgoal="half">Vaihda puolimaratoniin</button></div></div>`:""}
    <p class="tip">Tavoite: <b>${half?"puolimaraton la 17.4.":"maraton su 18.4."}</b> · <button class="link" data-bgoal="${half?"full":"half"}">Vaihda ${half?"maratoniin":"puolimaratoniin"}</button></p>`; }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-bgoal]"); if(!b) return; const g=b.dataset.bgoal; const prev=meta.bGoal; meta.bGoal= g==="half"?"half":"keep"; if(g==="full"&&prev==="half") meta.bGoal="keep"; persist(); BASE=buildBase(); render(); toast(g==="half"?"Belgradin tavoite: puolimaraton la 17.4. Pitkät lenkit enintään 21 km.":"Belgradin tavoite: maraton su 18.4."); });

/* ===== 3. Säävaroitus ulkotreeneihin ===== */
const OUTDOOR=c=>RUN.has(c)||["PT","YM","SK","KA","PY","HI"].includes(c);
function wxDay(i){ const c=load("pallas.weather.v1",null); const D=c&&c.d&&c.d.daily; if(!D||!D.time) return null; const k=D.time.indexOf(isoOfIdx(i)); if(k<0) return null;
  return {code:D.weather_code[k],tmax:D.temperature_2m_max[k],amin:D.apparent_temperature_min[k],rain:D.precipitation_sum[k],pp:D.precipitation_probability_max[k],wind:D.wind_speed_10m_max[k]}; }
function wxRisk(d){ if(!d) return null; const r=[];
  if(d.code>=95) r.push("ukkosta"); if([56,57,66,67].includes(d.code)) r.push("jäätävää sadetta");
  if(d.rain>=10&&(d.pp??100)>=60) r.push(`rankkasadetta ${Math.round(d.rain)} mm`); if([75,86].includes(d.code)) r.push("runsasta lumisadetta");
  if(d.wind>=14) r.push(`kovaa tuulta ${Math.round(d.wind)} m/s`); if(d.amin<=-18) r.push(`kovaa pakkasta (tuntuu ${Math.round(d.amin)} °C)`);
  const heat=d.tmax>=27; if(heat) r.push(`hellettä ${Math.round(d.tmax)} °C`); return r.length?{txt:r.join(", "),heat:heat&&r.length===1}:null; }
function wxBox(s){ const ti=todayIdx(); if(s.idx<ti||s.idx>ti+1||!OUTDOOR(s.code)||isIndoor(s.idx)||s.code==="R") return ""; const l=logs[s.key]; if(l&&l.status&&l.status!=="note") return "";
  const R=wxRisk(wxDay(s.idx)); if(!R) return "";
  return `<div class="wxwarn"><p>⚠️ ${s.idx===ti?"Tänään":"Huomenna"} ${R.txt}. ${R.heat?"Juokse aamulla tai illalla ja juo enemmän.":"Siirrä, vaihda lajia tai juokse matolla."}</p>${R.heat?"":`<div class="row">${s.idx<BASE.length-1&&!s.moved?`<button class="btn small" data-move="${s.key}">→ Huomiselle</button>`:""}<button class="btn small" data-swap="${s.idx}">⇄ Vaihda laji</button></div>`}</div>`; }

/* Juoksumatto */
const isIndoor = i => { const w=weekOf(i); return w<=21 && !(w>=8&&w<=10); };
const kmh = p => (60/p).toFixed(1).replace(".",",");
function easyPace(){ const es=entries().filter(e=>e.l.status==="done"&&RUN.has(e.code)&&e.code!=="X"&&e.l.km>=2&&e.l.min>0).slice(-8).map(e=>e.l.min/e.l.km).sort((a,b)=>a-b); return es.length>=2? es[Math.floor(es.length/2)] : null; }
function millChip(s){ if(!isIndoor(s.idx)) return ""; const l=logs[s.key]; if(l&&l.status==="done") return "";
  if(s.code==="YM") return `<p class="mill">🏠 Matolla: kaltevuus 6–10 %, reipas kävely 5–6 km/h. Lyhyet hölkkäpätkät, jos jaksaa.</p>`;
  if(!RUN.has(s.code)||s.code==="R") return "";
  const p=easyPace(); const rw=(s.text||"").match(/(\d+)\s?min juoksu \+ (\d+)\s?min kävely/);
  let base;
  if(rw){ const fr=+rw[1]/(+rw[1]+ +rw[2]); const v= p ? Math.max(6.5,((60/p)-5.5*(1-fr))/fr) : null; base= v ? `juoksuosuudet noin <b>${v.toFixed(1).replace(".",",")} km/h</b>, kävely 5–6 km/h` : `juoksuosuudet <b>7–8 km/h</b>, kävely 5–6 km/h`; }
  else base= p ? `noin <b>${kmh(p)} km/h</b> (${pace(1,p)}/km)` : `aloita <b>7–8 km/h</b> ja säädä niin, että puhe vielä kulkee`;
  const hard = hasIntensity(s.text) ? (/mäki|vedo/i.test(s.text)?" Mäkivedot: kaltevuus 5–8 %, sama vauhti.":" Reippaat osuudet: nosta 1–1,5 km/h.") : "";
  return `<p class="mill">🏠 Matolla: ${base}, kaltevuus 1 %.${s.code==="P"?" Pitkä lenkki: pidä vauhti tasaisena, juo 20 min välein.":""}${hard}</p>`; }
function renderMill(){ const el=$("millTable"); if(!el) return; const P=predictMarathon(todayIdx()), e=easyPace(); const rows=[]; for(let p=5;p<=9.01;p+=0.5) rows.push(p);
  el.innerHTML=`<div class="mtg"><b>Vauhti</b><b>km/h</b><b>Vauhti</b><b>km/h</b>${[0,1,2,3,4].map(k=>`<span>${pace(1,rows[k])}</span><span class="num">${kmh(rows[k])}</span><span>${rows[k+5]?pace(1,rows[k+5]):""}</span><span class="num">${rows[k+5]?kmh(rows[k+5]):""}</span>`).join("")}</div>
    ${e?`<p class="tip">Oma helppo vauhtisi nyt: <b>${pace(1,e)}/km = ${kmh(e)} km/h</b>.</p>`:""}${P?`<p class="tip">Maratonvauhti-arvio: <b>${pace(1,P.pace)}/km = ${kmh(P.pace)} km/h</b>.</p>`:""}`; }
function millConv(from){ const pIn=$("millPace"), kIn=$("millKmh");
  if(from==="p"){ const m=pIn.value.trim().match(/^(\d{1,2})[:.,](\d{1,2})$/)||pIn.value.trim().match(/^(\d{1,2})$/); if(!m){ kIn.value=""; return; } const p=+m[1]+(m[2]?+m[2]/60:0); if(p>2) kIn.value=kmh(p); }
  else { const k=parseFloat(kIn.value.replace(",",".")); if(!(k>2&&k<30)){ pIn.value=""; return; } pIn.value=pace(1,60/k); } }
$("millPace").oninput=()=>millConv("p"); $("millKmh").oninput=()=>millConv("k");
function zoneChip(s){ const Z=zones(); const zi=zoneFor(s.code,s.text); if(!Z||zi==null) return ""; const z=Z[zi]; return `<span class="zchip">♥ ${z.n.toLowerCase()} ${z.a}–${z.b}</span>`; }
function tooHard(e){ const Z=zones(); if(!Z||!e.l.hr) return false; const zi=zoneFor(e.code, (BASE[e.idx]||[])[1]); return zi===1 && e.l.hr>Z[1].b+3; }
function renderZones(){ const Z=zones(); const h=meta.hr||{};
  $("hrMax").value=h.max||""; $("hrAge").value=h.age||""; $("hrRest").value=h.rest||"";
  $("hrRestAuto").textContent = !h.rest && restHR() ? `Leposyke kirjauksista: ${restHR()}` : "";
  $("zoneList").innerHTML = Z ? Z.map((z,i)=>`<li class="z z${i+1}"><b>${z.n}</b><span class="num">${z.a}–${z.b}</span></li>`).join("") : `<li class="note">Anna maksimisyke tai ikä.</li>`;
}
$("hrSave").onclick=()=>{ const n=id=>{ const v=Number($(id).value.trim()); return v>0?v:null; }; meta.hr={max:n("hrMax"),age:n("hrAge"),rest:n("hrRest")}; persist(); renderZones(); toast("Sykealueet päivitetty."); };

/* ===== Kisasuunnitelmat ===== */
function longPace(){ const ps=entries().filter(e=>e.l.status==="done"&&e.code==="P"&&e.l.km>=8&&e.l.min).slice(-3); if(!ps.length) return null; return ps.reduce((a,e)=>a+e.l.min,0)/ps.reduce((a,e)=>a+e.l.km,0); }
function hm(min){ const h=Math.floor(min/60), m=Math.round(min%60); return `${h} h ${String(m).padStart(2,"0")} min`; }
/* Maratonennuste: Riegel testeistä ja reippaista juoksuista, pitkien lenkkien vauhti */
function predictMarathon(upto){
  const es=entries().filter(e=>e.idx<=upto&&e.idx>upto-56&&e.l.status==="done"&&RUN.has(e.code)&&e.l.km>=3&&e.l.min>0&&e.code!=="R");
  const hard=es.filter(e=>e.code==="X"||hasIntensity((BASE[e.idx]||[])[1])).map(e=>({t:e.l.min*Math.pow(42.195/e.l.km,1.07),km:e.l.km}));
  const longs=es.filter(e=>e.code==="P"&&e.l.km>=8).slice(-3);
  const fromLong= longs.length? longs.reduce((a,e)=>a+e.l.min,0)/longs.reduce((a,e)=>a+e.l.km,0)*42.195*1.02 : null;
  const fromHard= hard.length? Math.min(...hard.map(x=>x.t)) : null;
  // Riegel ylilupaa lyhyistä matkoista, kun pisin lenkki on lyhyt: korjaa
  const maxLong=Math.max(0,...es.map(e=>e.l.km)); const endur = maxLong>=28?1:maxLong>=21?1.04:maxLong>=15?1.08:1.12;
  let t=null, basis="";
  if(fromHard&&fromLong){ t=(fromHard*endur+fromLong)/2; basis="testit ja pitkät lenkit"; }
  else if(fromHard){ t=fromHard*endur; basis="testit ja reippaat juoksut"; }
  else if(fromLong){ t=fromLong; basis="pitkät lenkit"; }
  else { const any=es.slice(-6); if(any.length>=3){ t=any.reduce((a,e)=>a+e.l.min,0)/any.reduce((a,e)=>a+e.l.km,0)*42.195*1.1; basis="kevyet juoksut (karkea)"; } }
  if(!t) return null; const spread= basis.includes("karkea")?0.1: maxLong>=21?0.04:0.07;
  return {t, lo:t*(1-spread), hi:t*(1+spread), basis, pace:t/42.195, maxLong};
}
function predictTrend(ti){ const out=[]; const cw=weekOf(Math.max(0,ti)); for(let w=1;w<=Math.min(cw,22);w++){ const end=Math.min(weekRange(w)[1],ti); const p=predictMarathon(end); out.push(p?p.t:null); } return out; }
function predictionHTML(ti, big){ const P0=predictMarathon(ti); const hf=bHalf()?Math.pow(0.5,1.06):1; const P=P0&&{...P0,t:P0.t*hf,lo:P0.lo*hf,hi:P0.hi*hf,pace:P0.t*hf/(bHalf()?21.0975:42.195)}; if(!P) return `<p class="note">Arvio syntyy, kun olet kirjannut vähintään 3 juoksua kilometreineen ja aikoineen.</p>`;
  const tr=predictTrend(ti).map(v=>v==null?v:v*hf); const prev=[...tr].slice(0,-1).reverse().find(v=>v!=null); const diff=prev?Math.round(P.t-prev):null;
  return `<div class="pred"><b class="num">${hm(P.t)}</b><span>${hm(P.lo)} – ${hm(P.hi)} · ${pace(1,P.pace)}/km</span></div>
    ${diff!=null&&diff!==0?`<p class="tip">${diff<0?`▼ ${-diff} min nopeampi`:`▲ ${diff} min hitaampi`} kuin viime viikolla</p>`:""}
    ${big&&tr.filter(v=>v!=null).length>=2?spark(tr,{min:Math.min(...tr.filter(Boolean))*0.97,max:Math.max(...tr.filter(Boolean))*1.03,color:"var(--fell)",label:"Aika-arvio viikoittain",fmtv:v=>hm(v).replace(" min","")}):""}
    <p class="tip">Perusta: ${P.basis}${P.maxLong<21?". Tarkentuu, kun pisin lenkki ylittää 21 km":""}.</p>`; }
function renderRacePlans(){
  const P=predictMarathon(todayIdx()); const bTime = P? P.t : null; const p=longPace();
  const gels = bTime? Math.max(4, Math.round(bTime/35)) : 7;
  $("raceB").innerHTML=`<ul class="ins">
    <li><b>Aika-arvio:</b> ${P?`${hm(P.lo)} – ${hm(P.hi)}, tavoitevauhti ${pace(1,P.pace)}/km (${P.basis})`:"tarkentuu kirjatuista juoksuista"}</li>
    <li><b>Taktiikka:</b> 5 min juoksu / 1 min kävely alusta asti, alku hitaammin kuin tuntuu</li>
    <li><b>Tankkaus:</b> geeli 35 min välein (noin ${gels} kpl), juo jokaisella juomapisteellä</li>
    <li><b>Edellinen ilta:</b> pasta tai riisi, varusteet valmiiksi, numerolappu paitaan</li>
    <li><b>Aamu:</b> herätys 5.00, aamupala klo 5 (puuro, banaani), lähtöalueella 7.30</li>
    <li><b>Jälkeen:</b> kävele, juo, syö tunnin sisällä. Seuraava viikko palautumista.</li></ul>`;
  const test=entries().find(e=>e.key==="2027-06-26"&&e.l.status==="done"&&e.l.km&&e.l.min);
  const nTime = test? 66*(test.l.min/test.l.km)*1.2 : (p? 66*p*1.6 : null);
  $("raceN").innerHTML=`<ul class="ins">
    <li><b>Aika-arvio:</b> ${nTime?`${hm(nTime*0.9)} – ${hm(nTime*1.15)}${test?" (testikisasta)":" (karkea, tarkentuu kesäkuun testistä)"}`:"tarkentuu kesäkuun testikisasta"}</li>
    <li><b>Lähtö pe 23.7. klo 15 Hetta:</b> lounas klo 11–12, välipala klo 14</li>
    <li><b>Taktiikka:</b> ylämäet kävellen, tasaiset ja loivat alamäet juosten, ensimmäinen tunti liian helposti</li>
    <li><b>Tankkaus:</b> 40–60 g hiilihydraattia tunnissa, juomaa 0,5 l/h (helteellä enemmän)</li>
    <li><b>Mukana:</b> pakolliset varusteet (lista alempana), hyttyskarkote, ladattu puhelin</li>
    <li><b>Huoltopisteet ja aikarajat:</b> järjestäjä julkaisee kesällä</li>
    <li><b>Maalin jälkeen:</b> kuljetus Pallakselta sovittu? Lämmin vaate ja syötävää</li></ul>`;
}

/* ===== Sää (Open-Meteo, ei avainta) ===== */
const WCODE={0:"selkeää",1:"enimmäkseen selkeää",2:"puolipilvistä",3:"pilvistä",45:"sumua",48:"sumua",51:"tihkua",53:"tihkua",55:"tihkua",56:"jäätävää tihkua",57:"jäätävää tihkua",61:"sadetta",63:"sadetta",65:"rankkasadetta",66:"jäätävää sadetta",67:"jäätävää sadetta",71:"lunta",73:"lunta",75:"runsasta lunta",77:"lumijyväsiä",80:"sadekuuroja",81:"sadekuuroja",82:"rankkoja kuuroja",85:"lumikuuroja",86:"lumikuuroja",95:"ukkosta",96:"ukkosta",99:"ukkosta"};
async function loadWeather(){
  const c=load("pallas.weather.v1",null); if(c&&Date.now()-c.t<60*60000){ showWeather(c.d); return; }
  const loc=meta.loc||{lat:60.17,lon:24.94,name:"Helsinki"};
  try{ const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=3&wind_speed_unit=ms&timezone=auto`); if(!r.ok) return;
    const j=await r.json(); if(!j||!j.current) return; const d={...j.current,name:loc.name,daily:j.daily||null}; try{ localStorage.setItem("pallas.weather.v1",JSON.stringify({t:Date.now(),d})); }catch(e){} showWeather(d); if(route()==="tanaan") render(); }catch(e){}
}
function weatherTip(d){ const t=d.temperature_2m, f=d.apparent_temperature, w=d.weather_code;
  if([56,57,66,67].includes(w)||(t>-3&&t<2&&d.precipitation>0)) return "Liukasta: juokse sisällä tai nastoilla.";
  if(f<=-15) return "Kova pakkanen: lyhennä tai vaihda sisätreeniin.";
  if(t>=25) return "Kuumaa: juokse aamulla tai illalla, juo reilusti.";
  if(w>=95) return "Ukkosta: odota sen menevän ohi.";
  return ""; }
function showWeather(d){ const el=$("weather"); if(!el) return; if(!d||typeof d.temperature_2m!=="number"){ el.hidden=true; return; } const tip=weatherTip(d);
  el.hidden=false; el.innerHTML=`<span>${esc(d.name)} ${Math.round(d.temperature_2m)} °C${Math.round(d.apparent_temperature)!==Math.round(d.temperature_2m)?` (tuntuu ${Math.round(d.apparent_temperature)})`:""} · ${WCODE[d.weather_code]||""} · ${Math.round(d.wind_speed_10m)} m/s</span>${tip?`<b>${esc(tip)}</b>`:""}`;
}

function renderGearDot(){ const last=meta.lastBackup?new Date(meta.lastBackup):null; const old=!last||(Date.now()-last.getTime())>7*864e5;
  const need = (!stravaConnected() && Object.keys(logs).length>=3 && old) || !!cloudState.err;
  $("gearDot").hidden=!need; }
function renderLoc(){ $("wLocName").textContent=`Sijainti: ${(meta.loc&&meta.loc.name)||"Helsinki"}`; }
$("wLocBtn").onclick=()=>{ if(!navigator.geolocation){ toast("Sijainti ei ole käytettävissä."); return; } navigator.geolocation.getCurrentPosition(p=>{ meta.loc={lat:+p.coords.latitude.toFixed(2),lon:+p.coords.longitude.toFixed(2),name:"Oma sijainti"}; persist(); try{ localStorage.removeItem("pallas.weather.v1"); }catch(e){} loadWeather(); renderLoc(); toast("Sijainti tallennettu."); },()=>toast("Sijaintia ei saatu.")); };
$("wLocReset").onclick=()=>{ delete meta.loc; persist(); try{ localStorage.removeItem("pallas.weather.v1"); }catch(e){} loadWeather(); renderLoc(); };
/* ---------- käynnistys ---------- */
window.addEventListener("hashchange",()=>{ if(!keepSel) selDay=null; keepSel=false; statusOpen=false; calScrolled=false; render(); if(route()!=="kalenteri") window.scrollTo(0,0); });
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&!edit){ selDay=null; render(); if(stravaConnected() && (!strava.lastSync || Date.now()-new Date(strava.lastSync).getTime()>30*60000)) syncStrava(false); } });
window.addEventListener("storage",()=>{ logs=load(LS_LOGS,{}); adjOff=load(LS_ADJ,{}); edits=load(LS_EDITS,{}); weekScale=load(LS_SCALE,{}); shoes=load(LS_SHOES,[]); gear=load(LS_GEAR,{}); if(!edit) render(); });
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
$("installHint").hidden = !!standalone;
$("edX").onclick=()=>closeEditor();
handleStravaReturn();
render();
loadWeather();
if(stravaConnected() && (!strava.lastSync || Date.now()-new Date(strava.lastSync).getTime()>30*60000)) setTimeout(()=>syncStrava(false),800);
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
