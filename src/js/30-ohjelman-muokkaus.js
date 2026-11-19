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

