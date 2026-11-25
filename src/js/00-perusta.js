/* ===== Matka Pallakselle – sovellus ===== */
const PLAN = JSON.parse(document.getElementById("plan").textContent);
let BASE = PLAN.map(r=>r.slice());
const PHASE = w => w<=8?"Pohja":w<=16?"Rakennus":w<=22?"Maratonjakso":w<=24?"Palautuminen":w<=33?"Kisaspesifi":"Kevennys";
const TYPES = {
  J:{l:"Juoksu",c:"t-run"}, JL:{l:"Juoksu + lihaskunto",c:"t-run"}, P:{l:"Pitkä lenkki",c:"t-long"},
  PT:{l:"Patikointi",c:"t-hike"}, YM:{l:"Ylämäkikävely",c:"t-hike"}, K:{l:"Kuntopiiri",c:"t-gym"}, RF:{l:"Reformer-pilates",c:"t-gym"}, T:{l:"Tribe",c:"t-gym"}, TL:{l:"Tribe tai lihaskunto",c:"t-gym"},
  S:{l:"Spinning",c:"t-bike"}, SH:{l:"Spinning tai hiihto",c:"t-bike"}, SL:{l:"Spinning tai lihaskunto",c:"t-bike"},
  LH:{l:"Lihashuolto",c:"t-hike"}, X:{l:"Testi",c:"t-test"}, R:{l:"Kisa",c:"t-race"}, L:{l:"Lepo",c:"t-rest"},
  V:{l:"Vapaa laji",c:"t-free"}, UI:{l:"Uinti",c:"t-swim"}, PY:{l:"Pyöräily",c:"t-bike"}, HI:{l:"Hiihto",c:"t-bike"}, SK:{l:"Sauvakävely",c:"t-hike"}, KA:{l:"Kävely",c:"t-hike"},
  SA:{l:"Sali / lihaskunto",c:"t-gym"}, JO:{l:"Jooga / liikkuvuus",c:"t-free"}, PA:{l:"Pallopeli",c:"t-gym"}, MU:{l:"Muu liikunta",c:"t-free"}
};
/* Lajit vaihtoon: [koodi, emoji, kerroin juoksuminuutteihin, rasittava?] */
/* Lajivaihtoehdot: [koodi, ikoni, kestokerroin juoksuun nähden, raskas]. SPLABEL = napin nimi, jos eri kuin tyypin nimi. */
const SPLABEL = {T:"HIIT / Tribe"};
const SPORTS = [["UI","🏊",1.15,0],["PY","🚴",1.4,0],["S","🚲",1,1],["HI","⛷️",1.1,1],["SK","🥢",1.6,0],["KA","🚶",2,0],["SA","🏋️",1,0],["RF","🤸",1,0],["T","🔥",1,1],["JO","🧘",1,0],["PA","⚽",1,1],["MU","✨",1,0],["J","🏃",1,1]];
const VIG = new Set(["J","JL","P","X","R","S","SH","SL","T","TL","K","PA","HI"]);
const FLAGS = [["sick","🤒 Sairas"],["pain","🩹 Kipu"],["tired","😮‍💨 Väsynyt"],["sleep","😴 Huono uni"],["stress","🧠 Stressi"],["hangover","🍾 Darra"],["travel","✈️ Matkalla"],["great","⚡ Huippufiilis"]];
const FLAG_L = Object.fromEntries(FLAGS.concat([["fever","🌡️ Kuume"]]));
const AREAS = ["sääri","polvi","akillesjänne","pohje","jalkapohja","nilkka","lonkka","reisi","selkä","muu"];
const DOW = ["ma","ti","ke","to","pe","la","su"];
const SHORT = {V:"Vapaa",UI:"Uinti",PY:"Pyörä",HI:"Hiihto",SK:"Sauva",KA:"Kävely",SA:"Sali",JO:"Jooga",PA:"Pallo",RF:"Reformer",MU:"Muu",J:"Juoksu",JL:"Juoksu",P:"Pitkä",PT:"Patikka",YM:"Ylämäki",K:"Piiri",T:"Tribe",TL:"Tribe",S:"Spin",SH:"Spin",SL:"Spin",LH:"Huolto",X:"Testi",R:"Kisa",L:"Lepo"};
const TITLES = {ohje:"Näin sovellus toimii",kalenteri:"Kalenteri",historia:"Historia",analyysi:"Analyysi",opas:"Opas",merkit:"Merkit",asetukset:"Asetukset"};
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
/* Ohjelma ja tavat alkavat ma 23.11.2026; sitä edeltävät päivät eivät näy missään (käyttäjän päätös 22.11.). */
const FIRST = idxOfISO("2026-11-26"); // ohjelma alkaa to 26.11. beachvolleylla (käyttäjän päätös 25.11.2026)
const FIRST_W = weekOf(FIRST);
const wkNo = w => w - FIRST_W + 1; // näytettävä viikkonumero: 23.11. alkava viikko = 1
function entries(){ return Object.keys(logs).map(k=>({key:k,idx:idxOfISO(k),l:logs[k],code:logType(BASE,k,logs[k])})).filter(e=>e.idx>=FIRST).sort((a,b)=>a.key<b.key?-1:1); }
/* Putki joustopäivällä: yksi väliin jäänyt päivä/treeni viikossa (ma–su) ei katkaise putkea. ev = [{w, ok}] aikajärjestyksessä */
function flexStreak(ev, wNow){ let cur=0,best=0; const used=new Set(); for(const e of ev){ if(e.ok){ cur++; best=Math.max(best,cur); } else if(!used.has(e.w)&&cur>0){ used.add(e.w); } else { cur=0; } } return {cur,best,flexNow:used.has(wNow)}; }
function stats(){
  const es=entries(); let done=0,km=0,longest=0,rMin=0,rKm=0;
  es.forEach(e=>{ if(e.l.status!=="done"||e.code==="L") return; done++; if(RUN.has(e.code)&&typeof e.l.km==="number"){ km+=e.l.km; longest=Math.max(longest,e.l.km); if(typeof e.l.min==="number"&&e.l.min>0){ rMin+=e.l.min; rKm+=e.l.km; } } });
  const t=todayIdx(); const ev=[];
  for(let i=0;i<=Math.min(t,BASE.length-1);i++){ for(const s of sessionsOn(BASE,logs,ADAPT,i)){ if(s.code==="L") continue; const l=logs[s.key]; const fl=flagsOf(l);
    if(l&&l.status==="done") ev.push({w:weekOf(i),ok:true}); else if(l&&l.status==="moved"){} else if(fl.includes("sick")||fl.includes("pain")){} else if((l&&l.status==="skip")||(!l&&i<t)) ev.push({w:weekOf(i),ok:false}); } }
  const FS=flexStreak(ev,weekOf(Math.max(0,t))); const cur=FS.cur, best=FS.best, flexNow=FS.flexNow;
  let elev=0; es.forEach(e=>{ if(e.l.status==="done"&&typeof e.l.elev==="number") elev+=e.l.elev; });
  return {done,km,longest,cur,best,flexNow,elev,avgPace:rKm?pace(rKm,rMin):""};
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
    ["🇷🇸",bHalf()?"Belgradin puolimaratoonari":"Belgradin maratoonari",bHalf()?"Puolimaraton 17.4. maalissa":"Maraton 18.4. maalissa",!!(logs[isoOfIdx(bIdx())]&&logs[isoOfIdx(bIdx())].status==="done")],
    ["🦌","Tunturin valloittaja","Nuts 66 km maalissa",!!(logs["2027-07-23"]&&logs["2027-07-23"].status==="done")],
    ["💪","Voimaa jaloissa","10 lihaskuntotreeniä",entries().filter(e=>e.l.strength).length>=10],
    ["⛰️","Tuhat nousumetriä","Yhteensä 1000 m nousua",st.elev>=1000],
    ["🏔️","Pallastunturi ×10","Yhteensä 5000 m nousua",st.elev>=5000],
    ["📝","Rehellinen kirjaaja","Kirjasit väliin jääneen treenin",all.some(e=>e.l.status==="skip")],
    ["🛌","Viisas lepääjä","Lepäsit sairaana etkä juossut",all.some(e=>flagsOf(e.l).includes("sick"))&&!all.some(e=>flagsOf(e.l).includes("sick")&&e.l.status==="done"&&RUN.has(e.code))],
    ["💾","Varmuuskopioija","Varmuuskopio tallennettu",!!meta.lastBackup],
    ["🗓️","Suunnittelija","4 viikkoa suunniteltu etukäteen",Object.keys(meta.planned||{}).length>=4],
    ...habitBadges(),
  ].map(([icon,name,desc,got])=>({icon,name,desc,got}));
}
function xpOf(st,bs){ return st.done*10+Math.round(st.km)+bs.filter(b=>b.got).length*25+habitXP().xp; }
/* Tavat: XP, merkit */
function habStats(){ const H=meta.hab||{}, hs=(meta.habits||[]); const ti=todayIdx(); let xp=0, full=0, perfectWeek=false; const count={}, maxStreak={};
  const dates=Object.keys(H).sort(); if(!dates.length) return {xp:0,full:0,count,maxStreak,perfectWeek,kuuri:false};
  const first=Math.min(idxOfISO(dates[0]),ti), fullDays=new Set();
  for(let i=first;i<=ti;i++){ const r=H[isoOfIdx(i)]||{}; const req=hs.filter(h=>!h.off&&!h.task).filter(h=>{ const on=habitOn(h,i); return on&&!on.opt; });
    for(const id in r){ count[id]=(count[id]||0)+1; xp+=2; }
    if(req.length&&req.every(h=>r[h.id])){ full++; xp+=5; fullDays.add(i); } }
  for(const h of hs){ if(h.task) continue; maxStreak[h.id]=flexStreak(habEvents(h,Math.min(first,habFirst(h)),ti),weekOf(ti)).best; }
  for(let w=weekOf(Math.max(0,first));w<weekOf(ti)+1;w++){ const a0=(w-1)*7-1; if(a0+6>ti) break; let ok=true; for(let i=a0;i<=a0+6;i++) if(!fullDays.has(i)){ ok=false; break; } if(ok){ perfectWeek=true; break; } }
  const pesu=hs.find(h=>h.id==="pesu"); let kuuri=false; if(pesu){ const sc=pesu.sched&&pesu.sched[0]; if(sc&&sc.to){ let need=0,ok=0; for(let i=idxOfISO(sc.from);i<=idxOfISO(sc.to);i++){ const on=habitOn(pesu,i); if(on&&!on.opt){ need++; if(habDone("pesu",i)) ok++; } } kuuri= need>0 && ok>=need; } }
  return {xp,full,count,maxStreak,perfectWeek,kuuri}; }
let _hx=null, _hxKey="";
function habitXP(){ const k=JSON.stringify(meta.hab||{})+JSON.stringify(meta.habits||[]).length+":"+todayIdx(); if(k!==_hxKey){ _hx=habStats(); _hxKey=k; } return _hx; }
function habitBadges(){ const S=habitXP(); const best=Math.max(0,...Object.values(S.maxStreak));
  return [["🔆","Tapojen alku","Ensimmäinen täysi tapapäivä",S.full>=1],["🔥","Tapaputki 7","Sama tapa 7 päivää putkeen",best>=7],["🌅","Aamuvirkku","30 aamuherättelyä",(S.count.hera||0)>=30],
["💆","Hiuskuuri","4 viikon hiuskuuri tehty",S.kuuri],["🌟","Täydellinen viikko","Kaikki tavat joka päivä ma–su",S.perfectWeek],["🗓️","Tapa juurtuu","Sama tapa 30 päivää putkeen",best>=30]]; }
/* Tavat ja vointi */
function habitInsights(ti){ const hs=habits(); const out=[]; const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  for(const h of hs){ if(h.week||h.task) continue; const g={y:{rhr:[],sl:[],fe:[]},n:{rhr:[],sl:[],fe:[]}};
    for(let i=Math.max(0,ti-90);i<ti;i++){ const on=habitOn(h,i); if(!on) continue; const k=habDone(h.id,i)?"y":"n"; if(k==="n"&&on.opt) continue;
      const nx=logs[isoOfIdx(i+1)], td=logs[isoOfIdx(i)]; if(nx&&typeof nx.rhr==="number") g[k].rhr.push(nx.rhr); if(nx&&typeof nx.sleepH==="number") g[k].sl.push(nx.sleepH); if(td&&typeof td.feel==="number") g[k].fe.push(td.feel); }
    const cmp=(m,th,fmtd)=>{ if(g.y[m].length<4||g.n[m].length<4) return null; const d=avg(g.y[m])-avg(g.n[m]); return Math.abs(d)>=th?fmtd(d):null; };
    const r=[cmp("rhr",2,d=>`leposyke seuraavana aamuna ${Math.abs(d).toFixed(0)} lyöntiä ${d<0?"matalampi":"korkeampi"}`),cmp("sl",0.3,d=>`uni ${Math.abs(d).toFixed(1).replace(".",",")} h ${d>0?"pidempi":"lyhyempi"}`),cmp("fe",0.3,d=>`treenifiilis ${Math.abs(d).toFixed(1).replace(".",",")} ${d>0?"parempi":"heikompi"}`)].filter(Boolean);
    if(r.length) out.push(`${h.ic} Päivinä, joina teit tavan "${esc(h.name)}": ${r.join(", ")}.`);
}
  return out.length?`<ul class="ins">${out.map(x=>`<li>${x}</li>`).join("")}</ul><p class="tip">Yhteys ei todista syytä: hyvinä päivinä on myös helpompi muistaa tavat.</p>`:`<p class="note">Ei vielä selviä eroja. Vertailu tarvitsee vähintään 4 päivää, joina tapa on tehty, ja 4, joina se jäi, sekä aamuisin kirjatun leposykkeen tai unen.</p>`; }
function levelOf(xp){ let L=LEVELS[0],next=null; LEVELS.forEach((x,i)=>{ if(xp>=x[0]){ L=x; next=LEVELS[i+1]||null; } }); return {L,next}; }

