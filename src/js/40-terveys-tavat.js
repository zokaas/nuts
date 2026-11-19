/* ===== Tavat ===== */
const HABIT_V3=[
  {id:"dvit",ic:"💊",name:"D-vitamiini 10 µg",when:"aamu",sched:[{from:"2026-11-19",to:"2027-03-31",days:"all"},{from:"2027-10-01",to:"2028-03-31",days:"all"}]},
  {id:"veri1",ic:"🩸",name:"Verikoe: ferritiini ja perusverenkuva",task:true,when:"päivä",note:"Työterveys tai lääkäri. Lähtötaso treenin alussa.",sched:[{from:"2026-11-19",to:"2026-12-31",days:"all"}]},
  {id:"veri2",ic:"🩸",name:"Verikoe: ferritiini ja perusverenkuva",task:true,when:"päivä",note:"Vertaa lähtötasoon ennen Belgradin kovimpia viikkoja.",sched:[{from:"2027-02-01",to:"2027-03-15",days:"all"}]}];
const HABIT_DEFAULT=[
  {id:"hera",ic:"🌅",name:"Verenkierron herättely 5 min",when:"aamu",sched:[{from:"2026-11-19",days:"all"}]},
  {id:"pesu",ic:"🧴",name:"Hiustenpesu",when:"päivä",week:2,sched:[
    {from:"2026-11-16",to:"2026-12-13",label:"Hilseen rauhoitus (vk 1–4)",days:{0:{n:"Pesupäivä: öljy ensin · ketokonatsoli"},2:{n:"Pikapesu, jos hiukset rasvoittuvat · mieto shampoo",opt:true},4:{n:"Pesupäivä + methi-naamio · ketokonatsoli"}}},
    {from:"2026-12-14",label:"Ylläpito (vk 5→)",days:{0:{n:"Pesupäivä"},4:{n:"Pesupäivä"}},todo:true}]},
  ...HABIT_V3];
function habits(){ if(!meta.habits){ meta.habits=JSON.parse(JSON.stringify(HABIT_DEFAULT)); meta.hab=meta.hab||{}; meta.habMig=4; persist(); }
  if((meta.habMig||0)<2){ meta.habits=meta.habits.filter(h=>h.id!=="letti"&&h.id!=="kampa"); meta.habMig=2; persist(); }
  if((meta.habMig||0)<3){ for(const h of HABIT_V3) if(!meta.habits.some(x=>x.id===h.id)) meta.habits.push(JSON.parse(JSON.stringify(h))); meta.habMig=3; persist(); }
  if((meta.habMig||0)<4){ for(const h of meta.habits){ const s=h.sched&&h.sched[0]; if(!h.task&&s&&s.from&&s.from<"2026-11-19"&&!(meta.hab&&meta.hab["2026-11-18"]&&meta.hab["2026-11-18"][h.id])) s.from="2026-11-19"; } meta.habMig=4; persist(); } return meta.habits.filter(h=>!h.off); }
function habitOn(h,i){ if(h.task||!meta.habMove||!meta.habMove[h.id]) return habitOnBase(h,i); const d=isoOfIdx(i), mv=meta.habMove[h.id]; if(mv[d]) return null;
  for(const f in mv) if(mv[f]===d){ const b=habitOnBase(h,idxOfISO(f)); if(b) return {...b,n:(b.n?b.n+" · ":"")+`siirretty ${fmt(idxOfISO(f))}`,moved:f}; } return habitOnBase(h,i); }
function habitOnBase(h,i){ const d=isoOfIdx(i), w=dow(i); const sc=(h.sched||[]).find(x=>x.from<=d&&(!x.to||d<=x.to)); if(!sc) return null;
  if(h.task){ const H=meta.hab||{}; for(const k in H){ if(k>=sc.from&&k<d&&H[k][h.id]) return null; } return {n:h.note||"",opt:false,task:true,sc}; } if(sc.days==="all") return {n:"",opt:false,sc}; const x=sc.days[w]; return x?{...x,sc}:null; }
function habIcons(i,max=1){ if(!meta.habits) return ""; return meta.habits.filter(h=>!h.off&&!h.task).map(h=>({h,on:habitOn(h,i)})).filter(x=>x.on&&x.on.sc.days!=="all").map(x=>`<span class="hic${x.on.opt?" opt":""}${habDone(x.h.id,i)?" done":""}" title="${esc(x.h.name)}">${x.h.ic}</span>`).slice(0,max).join(""); }
function habDone(id,i){ const r=(meta.hab||{})[isoOfIdx(i)]; return !!(r&&r[id]); }
function habEvents(h,from,to){ const ev=[]; for(let k=from;k<=to;k++){ const on=habitOn(h,k); if(!on||on.opt) continue; if(!habDone(h.id,k)&&flagsOf(logs[isoOfIdx(k)]).includes("sick")) continue; const d=habDone(h.id,k); if(!d&&k===to) continue; ev.push({w:weekOf(k),ok:d}); } return ev; }
function habFirst(h){ return idxOfISO(((h.sched||[])[0]||{}).from||isoOfIdx(0)); }
function habStreak(h,i){ return flexStreak(habEvents(h,habFirst(h),i),weekOf(i)).cur; }
function habFlexNow(h,i){ return flexStreak(habEvents(h,habFirst(h),i),weekOf(i)).flexNow; }
function habWeek(h,i){ const a0=(weekOf(i)-1)*7-1; let n=0; for(let k=a0;k<=a0+6;k++) if(habDone(h.id,k)) n++; return n; }
let habMoveOpen=null;
function habMoveTargets(h,i){ const out=[]; for(let k=i+1;k<=i+6&&out.length<5;k++){ const ex=habitOn(h,k); if(ex&&!ex.opt) continue; out.push(k); } return out; }
function renderHabits(ti){ const el=$("habits"); if(!el) return; const i=selDay==null?ti:selDay; const fut=i>ti; const hs=habits().map(h=>({h,on:habitOn(h,i)})).filter(x=>x.on);
  if(!hs.length&&!cyc().on){ el.hidden=true; return; } el.hidden=false; const yHas=ti>FIRST&&habits().some(h=>habitOn(h,ti-1)); const dayLbl= i===ti?`Tänään · ${fmt(i)}`: i===ti-1?`Eilen · ${fmt(i)}`: i===ti+1?`Huomenna · ${fmt(i)}`: fmt(i);
  const order={aamu:0,"päivä":1,ilta:2}; hs.sort((a,b)=>order[a.h.when]-order[b.h.when]);
  const need=hs.filter(x=>!x.on.opt&&!x.h.task).length, needDone=hs.filter(x=>!x.on.opt&&!x.h.task&&habDone(x.h.id,i)).length;
  el.innerHTML=`<div class="habhead"><div><div class="eyebrow">Tavat${fut?" · tulossa":""}</div><b class="habday${i!==ti?" past":""}">${dayLbl}</b></div>${need&&!fut?`<span class="habcount${needDone>=need?" ok":""}">${needDone>=need?"✓ ":""}${needDone}/${need}</span>`:""}</div>
    ${(()=>{ const dn=hs.filter(x=>!fut&&!x.h.task&&habDone(x.h.id,i)); return dn.length?`<div class="habdone">${dn.map(({h})=>`<button class="hchip" data-hab="${h.id}" data-hi="${i}" aria-pressed="true" aria-label="${esc(h.name)} tehty, peru napauttamalla">✓ ${h.ic} ${esc(h.name.replace(/ \d.*$/,""))}</button>`).join("")}</div>`:""; })()}
    <ul class="hablist">${!fut?cycRow(i):""}${hs.filter(x=>fut||x.h.task||!habDone(x.h.id,i)).map(({h,on})=>{ const d=habDone(h.id,i); const st=habStreak(h,i); const bv=h.task&&(meta.blood||{})[h.id]; const wk=fut?"":h.task?(d?(bv?`Ferritiini ${bv.ferr??"–"} · Hb ${bv.hb??"–"}`:"Tehty ✓"):"Tehtävä"):h.week?`${habWeek(h,i)}/${h.week} tällä viikolla`:(st>=2?`🔥 ${st} pv putkeen${habFlexNow(h,i)?" · 🛟 joustopäivä käytetty":""}`:"");
      return `<li><button class="hab${d?" done":""}${on.opt?" opt":""}${fut?" fut":""}${h.task?" task":""}" ${fut?"disabled":`data-hab="${h.id}" data-hi="${i}"`} aria-pressed="${d}"><span class="hk" aria-hidden="true">${d?"✓":""}</span><span class="hi" aria-hidden="true">${h.ic}</span><span class="ht"><b>${esc(h.name)}${on.opt?` <small>valinnainen</small>`:""}</b>${on.n&&!h.task?`<small>${esc(on.n)}</small>`:""}${wk?`<small class="hs">${wk}</small>`:""}</span></button>${!h.task&&!d&&!on.opt&&!fut&&on.sc.days!=="all"?(on.moved?`<button class="link bgo" data-hmvundo="${h.id}:${on.moved}">↺ Peru siirto</button>`:habMoveOpen===h.id+":"+i?`<div class="hmv">${habMoveTargets(h,i).map(k=>`<button class="btn small" data-hmv="${h.id}:${isoOfIdx(i)}:${isoOfIdx(k)}">${k===i+1?"Huomenna":DOW[dow(k)]+" "+new Date(START_UTC+k*864e5).getUTCDate()+"."}</button>`).join("")}<button class="btn small ghost" data-hmvopen="">Peruuta</button></div>`:`<button class="link bgo" data-hmvopen="${h.id}:${i}">→ Siirrä toiselle päivälle</button>`):""}${h.task&&d&&!fut?`<button class="link bgo" data-bgo="${h.id}">${(meta.blood||{})[h.id]?"Muokkaa arvoja":"＋ Kirjaa ferritiini ja hemoglobiini"}</button>`:""}</li>`; }).join("")}</ul>
    ${i!==ti?`<button class="link" data-seltoday>‹ Takaisin tähän päivään</button>`:yHas?`<button class="link" data-sel="${ti-1}">Unohtuiko eilen? Merkitse eilisen tavat</button>`:""}`; }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-hab]"); if(b){ const id=b.dataset.hab, i=+b.dataset.hi, d=isoOfIdx(i); meta.hab=meta.hab||{}; const r=meta.hab[d]=meta.hab[d]||{}; if(r[id]) delete r[id]; else { r[id]=1; if(navigator.vibrate) navigator.vibrate(10); } if(!Object.keys(r).length) delete meta.hab[d];
    persist(); renderHabits(todayIdx()); renderCount(todayIdx(),stats(),badges(stats())); const all=habits().filter(h=>{ if(h.task) return false; const on=habitOn(h,i); return on&&!on.opt; }); if(r[id]&&all.every(h=>habDone(h.id,i))){ celebrate(); toast("Päivän tavat tehty ✓ +5 XP bonus"); } else if(r[id]){ const tk=meta.habits.find(x=>x.id===id)?.task; if(tk&&/^veri/.test(id)) toast("Verikoe kuitattu ✓ +2 XP",{l:"Kirjaa arvot",fn:()=>{ anaTab="vointi"; bloodEdit=id; location.hash="#analyysi"; }}); else toast(tk?"Tehtävä kuitattu ✓ +2 XP":"+2 XP"); } return; }
});
function habGridHTML(ti){ const hs=habits().filter(h=>!h.task); if(!hs.length) return `<p class="note">Ei tapoja.</p>`; const N=28, a=ti-N+1;
  return hs.map(h=>{ let req=0, ok=0; const cells=[]; const f0=idxOfISO(((h.sched||[])[0]||{}).from||isoOfIdx(a)); for(let i=Math.max(a,f0,FIRST);i<=ti;i++){ const on=habitOn(h,i); const d=habDone(h.id,i); if(on&&!on.opt){ req++; if(d) ok++; } cells.push(`<i class="${d?"y":on?(on.opt?"o":(i===ti?"t":"n")):"x"}" title="${fmt(i)}"></i>`); }
    return `<div class="hgrow"><div class="hgh"><span>${h.ic} ${esc(h.name)}</span><span class="num">${req?Math.round(ok/req*100):0} %</span></div><div class="hgrid">${cells.join("")}</div></div>`; }).join("")+`<p class="tip">Viimeiset 4 viikkoa. Vihreä = tehty, harmaa = jäi, tyhjä = ei ohjelmassa.</p>`; }
function renderHabitSettings(){ const el=$("habSet"); if(!el) return; habits(); const all=meta.habits; const ct=$("cycOn"); if(ct){ ct.checked=!!cyc().on; ct.onchange=()=>{ meta.cycle=meta.cycle||{}; meta.cycle.on=ct.checked; persist(); toast(ct.checked?"Kiertoseuranta päällä: merkitse Tavat-kortista.":"Kiertoseuranta pois. Merkinnät säilyvät."); }; }
  el.innerHTML=`<ul class="evlist">${all.map(h=>`<li><span><b>${h.ic} ${esc(h.name)}</b><small>${h.off?"pois käytöstä":habDesc(h)}</small></span><span class="row"><button class="btn small ghost" data-haboff="${h.id}">${h.off?"Näytä":"Piilota"}</button><button class="btn small ghost" data-habdel="${h.id}" aria-label="Poista ${esc(h.name)}">🗑</button></span></li>`).join("")}</ul>`; }
function habDesc(h){ if(h.task){ const sc=(h.sched||[])[0]; const done=Object.keys(meta.hab||{}).find(k=>meta.hab[k][h.id]); return done?`tehty ${fmt(idxOfISO(done))}`:`tehtävä ${fmt(idxOfISO(sc.from))}–${fmt(idxOfISO(sc.to))}`; } const d=isoOfIdx(Math.max(0,todayIdx())); const sc=(h.sched||[]).find(x=>x.from<=d&&(!x.to||d<=x.to))||(h.sched||[])[0]; if(!sc) return ""; const when={aamu:"aamuisin",ilta:"iltaisin","päivä":""}[h.when]||"";
  if(sc.days==="all") return `joka päivä ${when}`.trim(); return Object.keys(sc.days).map(k=>DOW[k]+(sc.days[k].opt?" (valinn.)":"")).join(", ")+(sc.label?` · ${sc.label}`:""); }
document.addEventListener("click",e=>{ const d=e.target.closest("[data-habdel]"); if(!d) return; const i=meta.habits.findIndex(x=>x.id===d.dataset.habdel); if(i<0) return; const [h]=meta.habits.splice(i,1); persist(); renderHabitSettings(); toast(`Poistettu: ${h.name}`,{l:"Peru",fn:()=>{ meta.habits.splice(i,0,h); persist(); renderHabitSettings(); }}); });
document.addEventListener("click",e=>{ const b=e.target.closest("[data-haboff]"); if(!b) return; const h=meta.habits.find(x=>x.id===b.dataset.haboff); h.off=!h.off; persist(); renderHabitSettings(); });
$("habAdd").onclick=()=>{ const name=$("habName").value.trim().slice(0,50); if(!name){ $("habName").focus(); return; } const days=[...document.querySelectorAll("#habDays [aria-pressed='true']")].map(b=>+b.dataset.hd);
  const sc= days.length===0||days.length===7 ? "all" : Object.fromEntries(days.map(d=>[d,{n:""}])); habits();
  meta.habits.push({id:"h"+Date.now().toString(36),ic:$("habIc").value.trim()||"✅",name,when:$("habWhen").value,sched:[{from:isoOfIdx(Math.max(0,todayIdx())),days:sc}]});
  persist(); $("habName").value=""; $("habIc").value=""; document.querySelectorAll("#habDays button").forEach(b=>b.setAttribute("aria-pressed","false")); renderHabitSettings(); toast(`Lisätty: ${name}`); };
$("habDays").onclick=e=>{ const b=e.target.closest("[data-hd]"); if(b) b.setAttribute("aria-pressed",String(b.getAttribute("aria-pressed")!=="true")); };
function restoreExtras(d){ if(d.habits&&!meta.habits) meta.habits=d.habits; if(d.hab){ meta.hab=meta.hab||{}; for(const k in d.hab) meta.hab[k]={...d.hab[k],...(meta.hab[k]||{})}; } if(d.bGoal&&!meta.bGoal) meta.bGoal=d.bGoal; if(d.rck&&!meta.rck) meta.rck=d.rck; if(d.blood) meta.blood={...d.blood,...(meta.blood||{})}; if(d.habMove&&!meta.habMove) meta.habMove=d.habMove; if(d.cycle&&!meta.cycle) meta.cycle=d.cycle; if(d.planned) meta.planned={...d.planned,...(meta.planned||{})}; if(d.sick&&!meta.sick) meta.sick=d.sick; }

document.addEventListener("click",e=>{ const o=e.target.closest("[data-hmvopen]"); if(o){ habMoveOpen=o.dataset.hmvopen||null; renderHabits(todayIdx()); return; }
  const m=e.target.closest("[data-hmv]"); if(m){ const [id,from,to]=m.dataset.hmv.split(":"); meta.habMove=meta.habMove||{}; const mv=meta.habMove[id]=meta.habMove[id]||{};
    const orig=Object.keys(mv).find(f=>mv[f]===from)||from; mv[orig]=to; if(orig===to) delete mv[orig]; habMoveOpen=null; persist(); render(); const h=meta.habits.find(x=>x.id===id); toast(`${h.ic} ${h.name} siirretty: ${fmt(idxOfISO(to))}`,{l:"Peru",fn:()=>{ if(orig===from) delete mv[orig]; else mv[orig]=from; persist(); render(); }}); return; }
  const u=e.target.closest("[data-hmvundo]"); if(u){ const [id,f]=u.dataset.hmvundo.split(":"); delete meta.habMove[id][f]; persist(); render(); toast("Siirto peruttu."); } });

/* ===== Intervals.icu: uni, leposyke, HRV Suunnosta ===== */
const icu=()=>meta.icu||{};
async function icuSync(manual){ const c=icu(); if(!c.ath||!c.key){ if(manual) toast("Anna ensin Intervals.icu-tunnus ja API-avain."); return; } if(!workerBase()){ if(manual) toast("Välipalvelin puuttuu (Strava-asetukset)."); return; }
  const t=todayIdx(); const oldest=isoOfIdx(t-(c.last?6:30)), newest=isoOfIdx(t);
  try{ const r=await fetch(`${workerBase()}/icu/wellness`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({athlete:c.ath,key:c.key,oldest,newest})});
    if(r.status===401){ meta.icu.err="Tunnus tai API-avain ei kelpaa."; persist(); renderIcu(); if(manual) toast(meta.icu.err); return; }
    if(!r.ok){ meta.icu.err=r.status===404?"Välipalvelin päivittyy vielä. Yritä hetken päästä uudelleen.":"Haku epäonnistui, yritetään myöhemmin."; persist(); renderIcu(); if(manual) toast(meta.icu.err); return; }
    const rows=await r.json(); let n=0, latest=null;
    for(const w of rows){ if(!w||!w.d) continue; const d=c.shift?isoOfIdx(idxOfISO(w.d)+1):w.d; const i=idxOfISO(d); if(i<0) continue;
      const vals={rhr:typeof w.rhr==="number"&&w.rhr>25?Math.round(w.rhr):null, sleepH:typeof w.sleep==="number"&&w.sleep>0?Math.round(w.sleep/360)/10:null, hrv:typeof w.hrv==="number"&&w.hrv>0?Math.round(w.hrv):null};
      if(vals.rhr==null&&vals.sleepH==null&&vals.hrv==null) continue;
      const prev=logs[d]; const old=(prev&&prev.icu)||{}; const l=prev?{...prev}:{status:"note",type:i<BASE.length?BASE[i][0]:"L",flags:[],note:""};
      let ch=false; for(const k of ["rhr","sleepH","hrv"]){ if(vals[k]==null) continue; if(l[k]==null||l[k]===old[k]){ if(l[k]!==vals[k]){ l[k]=vals[k]; ch=true; } } }
      l.icu=vals; if(ch||!prev){ l.updatedAt=new Date().toISOString(); logs[d]=l; n++; } if(!latest||d>latest.d) latest={d,...vals}; }
    meta.icu.last=Date.now(); meta.icu.latest=latest; delete meta.icu.err; persist(); if(n) render(); else renderIcu();
    if(manual) toast(n?`Haettu ${n} päivän uni- ja leposyketiedot.`:"Ei uutta dataa. Tarkista, että Suunnon wellness-tuonti on päällä Intervals.icu:ssa."); }
  catch(e){ if(manual) toast("Yhteys Intervals.icu:hun epäonnistui."); } }
function renderIcu(){ const el=$("icuStatus"); if(!el) return; const c=icu(); $("icuAth").value=c.ath||""; $("icuKey").value=c.key?"••••••••":""; $("icuShift").checked=!!c.shift;
  const L=c.latest; el.innerHTML= c.err?`⚠️ ${esc(c.err)}`: c.last?`✓ Yhdistetty · haettu ${new Date(c.last).toLocaleString("fi-FI",{day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"})}${L?`<br>Viimeisin: ${fmt(idxOfISO(L.d))} · uni ${L.sleepH!=null?n1(L.sleepH)+" h":"–"} · leposyke ${L.rhr??"–"} · HRV ${L.hrv??"–"}`:""}`:"Ei yhdistetty. Hakee Suunnon unen, leposykkeen ja HRV:n automaattisesti."; }
$("icuSave").onclick=()=>{ const ath=$("icuAth").value.trim(), k=$("icuKey").value.trim(); meta.icu=meta.icu||{}; if(ath) meta.icu.ath=ath.replace(/\s/g,""); if(k&&!/^•+$/.test(k)) meta.icu.key=k; meta.icu.shift=$("icuShift").checked; delete meta.icu.last; persist(); icuSync(true); };
$("icuShift").onchange=()=>{ meta.icu=meta.icu||{}; meta.icu.shift=$("icuShift").checked; delete meta.icu.last; persist(); };
$("icuOff").onclick=()=>{ delete meta.icu; persist(); renderIcu(); toast("Intervals.icu-yhteys poistettu. Haetut tiedot säilyvät."); };

/* ===== Sunnuntain suunnitteluhetki ===== */
let planOpen=false, planForce=false;
function renderPlanWeek(ti){ const el=$("planWeek"); if(!el) return; const t=Math.max(0,ti); const nw=weekOf(t)+1; const show=(dow(t)===6||dow(t)===5&&new Date().getHours()>=17||planForce)&&nw<=36&&t<NUTS;
  if(!show){ el.hidden=true; return; } el.hidden=false; const done=(meta.planned||{})[nw];
  if(!planOpen){ el.innerHTML=`<button class="planbtn" data-planopen><span>🗓️</span><span><b>${done?"Ensi viikko suunniteltu ✓":"Suunnittele ensi viikko"}</b><small>${done?"Avaa ja tarkista":"Noin 2 minuuttia · viikko "+nw}</small></span><span aria-hidden="true">›</span></button>`; return; }
  const cw=weekOf(t), act=weekKm(BASE,logs,cw), tgt=TARGET_EFF[cw-1]; let pl=0,dn=0; const [a,b]=weekRange(cw); for(let i=a;i<=b&&i<BASE.length;i++){ const c=sessionsOn(BASE,logs,ADAPT,i)[0].code; if(c==="L") continue; pl++; const l=logs[isoOfIdx(i)]; if(l&&l.status==="done") dn++; }
  const a0=(nw-1)*7-1; const days=[]; for(let i=a0;i<=a0+6;i++){ if(i<FIRST||i>=BASE.length) continue; const s0=sessionsOn(BASE,logs,ADAPT,i)[0]; const note=BASE[i][2]; days.push(`<li><time>${DOW[dow(i)]} ${new Date(START_UTC+i*864e5).getUTCDate()}.</time><span>${typeChip(s0.code)} ${esc((s0.text||"").slice(0,60))}${(s0.text||"").length>60?"…":""}${note?` <b>📌 ${esc(note)}</b>`:""} ${habIcons(i)}</span></li>`); }
  el.innerHTML=`<div class="weekhead"><div><div class="eyebrow">Suunnitteluhetki</div><h2>Viikko ${nw}</h2></div><button class="x" data-planclose aria-label="Sulje">×</button></div>
    <div class="pstep"><b>1. Mennyt viikko</b><p>${dn}/${pl} treeniä · ${n1(act)} / ${tgt} km${pl&&dn>=pl?" · täysi viikko 💪":""}</p></div>
    <div class="pstep"><b>2. Ensi viikon treenit</b><ul class="up pdays">${days.join("")}</ul></div>
    <div class="pstep"><b>3. Menot</b><p class="tip">Onko tulossa juhlia, matkoja tai työkiireitä?</p><button class="btn small" data-addev="${a0+1}">＋ Lisää meno ensi viikolle</button></div>
    <div class="pstep"><b>4. Kuorma</b>${weekScaleControls(nw,t)}</div>
    <button class="btn primary big" data-plandone="${nw}">${done?"Valmis ✓":"Valmis, viikko suunniteltu"}</button>`;
  const lc=el.querySelector("#loadCtl"); if(lc) lc.open=true; }
document.addEventListener("click",e=>{ if(e.target.closest("[data-planopen]")){ planOpen=true; renderPlanWeek(todayIdx()); return; }
  if(e.target.closest("[data-planclose]")){ planOpen=false; planForce=false; render(); return; }
  const d=e.target.closest("[data-plandone]"); if(d){ meta.planned=meta.planned||{}; const first=!meta.planned[d.dataset.plandone]; meta.planned[d.dataset.plandone]=isoOfIdx(todayIdx()); persist(); planOpen=false; planForce=false; render(); if(first){ celebrate(); toast("Ensi viikko suunniteltu ✓"); } return; }
  if(e.target.closest("[data-planfrom]")){ planForce=true; planOpen=true; location.hash="#tanaan"; setTimeout(()=>{ const el=$("planWeek"); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); },80); } });

/* ===== Kuukautiskierto (valinnainen) ===== */
const cyc=()=>meta.cycle||{};
function cycStarts(){ const D=cyc().days||{}; const ks=Object.keys(D).sort(); const st=[]; let prev=null; for(const k of ks){ const i=idxOfISO(k); if(prev==null||i-prev>2) st.push(i); prev=i; } return st; }
function cycInfo(i){ const st=cycStarts().filter(x=>x<=i); if(!st.length) return null; const last=st[st.length-1]; const all=cycStarts(); const lens=[]; for(let k=1;k<all.length;k++){ const L=all[k]-all[k-1]; if(L>=20&&L<=40) lens.push(L); } const avg=lens.length?Math.round(lens.reduce((a,b)=>a+b,0)/lens.length):28;
  const day=i-last+1; const ph= day<=5?"Kuukautiset":day<=avg-15?"Follikulaarivaihe":day<=avg-12?"Ovulaation aika":"Luteaalivaihe"; return {day,avg,ph,next:last+avg,known:lens.length}; }
function cycVisible(i){ const D=cyc().days||{}; if(D[isoOfIdx(i)]||D[isoOfIdx(i-1)]) return true; const ci=cycInfo(i); if(!ci||!ci.known&&cycStarts().length<1) return false; return i>=ci.next-2&&i<=ci.next+5; }
function cycRow(i){ if(!cyc().on||!cycVisible(i)) return ""; const on=!!(cyc().days||{})[isoOfIdx(i)]; const ci=cycInfo(i);
  return `<li><button class="hab cyc${on?" done":""}" data-cyc="${i}" aria-pressed="${on}"><span class="hk" aria-hidden="true">${on?"✓":""}</span><span class="hi" aria-hidden="true">🩸</span><span class="ht"><b>${(cyc().days||{})[isoOfIdx(i-1)]&&!on?"Jatkuuko kuukautiset?":"Kuukautiset tänään"}</b><small>${ci&&on?`Kierron päivä ${ci.day}`:ci?`Arvioitu alku ${fmt(ci.next)}`:""}</small></span></button></li>`; }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-cyc]"); if(!b) return; const d=isoOfIdx(+b.dataset.cyc); meta.cycle=meta.cycle||{on:true}; const D=meta.cycle.days=meta.cycle.days||{}; if(D[d]) delete D[d]; else D[d]=1; persist(); renderHabits(todayIdx()); });
function cycleHTML(ti){ if(!cyc().on) return ""; const ci=cycInfo(ti); const st=cycStarts();
  let rows=""; const ph={Kuukautiset:{fe:[],rhr:[]},Follikulaarivaihe:{fe:[],rhr:[]},"Ovulaation aika":{fe:[],rhr:[]},Luteaalivaihe:{fe:[],rhr:[]}};
  for(let i=Math.max(0,ti-120);i<=ti;i++){ const c=cycInfo(i); if(!c) continue; const l=logs[isoOfIdx(i)]; if(l&&typeof l.feel==="number") ph[c.ph].fe.push(l.feel); if(l&&typeof l.rhr==="number") ph[c.ph].rhr.push(l.rhr); }
  const av=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):null; const enough=st.length>=2;
  if(enough) rows=Object.entries(ph).map(([k,v])=>`<li><span>${k}</span><span class="num">${av(v.fe)!=null?`fiilis ${av(v.fe).toFixed(1).replace(".",",")}`:"–"} · ${av(v.rhr)!=null?`leposyke ${Math.round(av(v.rhr))}`:"–"}</span></li>`).join("");
  return `<section class="card"><div class="eyebrow">Kuukautiskierto</div>${ci?`<p><b>Päivä ${ci.day}</b> · ${ci.ph}</p><p class="tip">Seuraavat arviolta ${fmt(ci.next)} · keskipituus ${ci.avg} pv${ci.known?"":" (oletus, tarkentuu)"}</p>`:`<p class="note">Merkitse kuukautisten päivät Tavat-kortista.</p>`}
    ${enough?`<ul class="blist cyclist">${rows}</ul><p class="tip">Monella kestävyysurheilijalla olo on kevyempi follikulaarivaiheessa ja raskaampi luteaalivaiheessa, mutta erot ovat yksilöllisiä. Runsaat kuukautiset kuluttavat rautavarastoja, joten seuraa ferritiiniä.</p>`:`<p class="tip">Vertailu fiiliksestä ja leposykkeestä vaiheittain näkyy, kun kaksi kiertoa on merkitty.</p>`}</section>`; }

/* ===== Verikoearvot ===== */
const BLOOD=[["veri1","Marraskuu"],["veri2","Helmikuu"]];
let bloodEdit=null;
const BFIELDS=[["ferr","Ferritiini","µg/l","Rautavarastot"],["hb","Hemoglobiini","g/l","Anemia"],["tfr","Transferriinireseptori (TfR)","mg/l","Raudanpuute, tulehdus ei sotke"],["tsh","TSH","mU/l","Kilpirauhanen"],["t4v","T4-V","pmol/l","Kilpirauhanen"],["crp","CRP / hs-CRP","mg/l","Tulehdus"],["d25","D-vitamiini","nmol/l","D-vitamiinitaso"],["lihas","Lihasmassa (luustolihas)","kg","Kehonkoostumus"],["rasva","Rasvaprosentti","%","Kehonkoostumus"],["paino","Paino","kg","Kehonkoostumus"]];
function bloodHTML(){ const B=meta.blood||{}; const a=B.veri1||{}, b=B.veri2||{};
  const rows=BFIELDS.filter(([k])=>typeof a[k]==="number"||typeof b[k]==="number").map(([k,l,u])=>{ const x=a[k], y=b[k]; const d=typeof x==="number"&&typeof y==="number"?y-x:null;
    return `<li><span><b>${l}</b><small>${u}</small></span><span class="bv num">${typeof x==="number"?n1(x):"–"} → ${typeof y==="number"?n1(y):"–"}${d!=null?` <em class="${d<0&&(k==="ferr"||k==="hb")?"neg":""}">(${d>0?"+":""}${n1(d)})</em>`:""}</span></li>`; }).join("");
  const form=id=>{ const o=B[id]||{}; return `<div class="bform">${BFIELDS.map(([k,l,u,why])=>`<div class="field"><label for="b_${k}">${l} <small>${u} · ${why}</small></label><input id="b_${k}" inputmode="decimal" value="${o[k]??""}"></div>`).join("")}<div class="field"><label for="bD">Näytteenottopäivä</label><input type="date" id="bD" value="${o.date||isoOfIdx(Math.max(0,todayIdx()))}"></div><div class="row"><button class="btn primary small" data-bsave="${id}">Tallenna</button><button class="btn ghost small" data-bcancel>Peruuta</button></div></div>`; };
  return `<div class="bhead"><span>Marraskuu${a.date?` <small>${fmtShort(idxOfISO(a.date))}</small>`:""}</span><span>→</span><span>Helmikuu${b.date?` <small>${fmtShort(idxOfISO(b.date))}</small>`:""}</span></div>
    ${rows?`<ul class="blist">${rows}</ul>`:`<p class="note">Ei vielä arvoja. Kirjaa ne, kun saat tulokset.</p>`}
    ${bloodEdit?form(bloodEdit):`<div class="row">${BLOOD.map(([id,l])=>`<button class="btn small" data-bedit="${id}">${(B[id]?"Muokkaa ":"Kirjaa ")+l.toLowerCase()+"n arvot"}</button>`).join("")}</div>`}
    ${bloodNotes().map(x=>`<p class="tip">${x}</p>`).join("")}<p class="tip">Ferritiini nousee tulehduksessa, joten flunssan tai yskän aikana se voi näyttää todellista paremmalta. Transferriinireseptori kertoo silloin raudanpuutteesta luotettavammin. Viitearvot vaihtelevat laboratorioittain, joten tulkinta lääkärin kanssa.</p>`; }
/* Verenluovutukset (pvm): ferritiinin lasku niiden jälkeen on odotettavaa, ei hälytys. */
const DONATIONS=[]; // esim. "2027-08-20" – lisää, kun luovutat
function bloodNotes(){ const B=meta.blood||{}, a=B.veri1, b=B.veri2, out=[];
  const last=b&&b.ferr!=null?b:a; if(last&&typeof last.ferr==="number"&&last.ferr<30) out.push(`⚠️ Ferritiini ${n1(last.ferr)} µg/l on alle 30, jota käytetään yleisesti raudanpuutteen rajana. Keskustele lääkärin kanssa raudasta.`);
  const don=a&&b?DONATIONS.filter(d=>d>=(a.date||"2026-11-18")&&d<=(b.date||"2099")):[];
  if(a&&b&&typeof a.ferr==="number"&&typeof b.ferr==="number"&&b.ferr<=a.ferr*0.7) out.push(don.length
    ? `ℹ️ Ferritiini laski ${n1(a.ferr)} → ${n1(b.ferr)} µg/l (${Math.round((1-b.ferr/a.ferr)*100)} %). Lasku on odotettavaa verenluovutuksen (${don.map(d=>fmt(idxOfISO(d))).join(", ")}) jälkeen: rautavarastot palautuvat kuukausien aikana. Syö rautapitoista ruokaa ja tarkista uudelleen touko–kesäkuussa.`
    : `⚠️ Ferritiini laski ${n1(a.ferr)} → ${n1(b.ferr)} µg/l (${Math.round((1-b.ferr/a.ferr)*100)} %). Treenimäärän kasvu kuluttaa rautavarastoja.`);
  if(a&&b&&typeof a.hb==="number"&&typeof b.hb==="number"&&a.hb-b.hb>=10) out.push(`⚠️ Hemoglobiini laski ${a.hb} → ${b.hb} g/l.`);
  return out; }
function bloodWarnings(){ const W=bloodNotes().filter(x=>x.startsWith("⚠️")); return W.length?[{level:"warn",title:"Verikoe: ferritiini vaatii huomiota",detail:W.join(" ").replace(/⚠️ /g,"")+" Katso Analyysi → Vointi."}]:[]; }
document.addEventListener("click",e=>{ const ed=e.target.closest("[data-bedit]"); if(ed){ bloodEdit=ed.dataset.bedit; $("aBlood").innerHTML=bloodHTML(); setTimeout(()=>$("b_ferr").focus(),30); return; }
  if(e.target.closest("[data-bcancel]")){ bloodEdit=null; $("aBlood").innerHTML=bloodHTML(); return; }
  const sv=e.target.closest("[data-bsave]"); if(sv){ const num=id=>{ const v=parseFloat($(id).value.replace(",",".")); return isFinite(v)&&v>0?v:null; }; const o={date:$("bD").value||null}; BFIELDS.forEach(([k])=>o[k]=num("b_"+k));
    if(o.ferr==null&&o.hb==null){ toast("Kirjaa vähintään ferritiini tai hemoglobiini."); return; } if(o.hb!=null&&o.hb<50) o.hb=Math.round(o.hb*10); // g/dl → g/l
    meta.blood=meta.blood||{}; meta.blood[sv.dataset.bsave]=o; meta.hab=meta.hab||{}; const d=o.date||isoOfIdx(todayIdx()); (meta.hab[d]=meta.hab[d]||{})[sv.dataset.bsave]=1;
    bloodEdit=null; persist(); render(); toast(bloodNotes().length?"Tallennettu. Katso huomio.":"Verikoearvot tallennettu ✓"); return; }
  const go=e.target.closest("[data-bgo]"); if(go){ anaTab="vointi"; bloodEdit=go.dataset.bgo; location.hash="#analyysi"; setTimeout(()=>{ const el=$("aBlood"); if(el) el.scrollIntoView({behavior:"smooth",block:"center"}); },120); } });

