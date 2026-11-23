/* ---------- näkymät ---------- */
function route(){ const h=(location.hash||"").slice(1); if(h==="kisa") return "opas"; return ["historia","kalenteri","analyysi","opas","merkit","asetukset","ohje"].includes(h)?h:"tanaan"; }
function render(){
  const ti=todayIdx(), t=T0(); if(viewWeek===null) viewWeek=weekOf(t);
  sickSync(ti); BASE = buildBase(); ADAPT = buildAdapt(BASE, logs, adjOff, ti);
  const r=route(); document.body.dataset.route=r; $("pageTitle").textContent=TITLES[r]||""; document.querySelectorAll("[data-view]").forEach(v=>v.hidden=v.dataset.view!==r);
  document.querySelectorAll(".tabs a").forEach(a=>a.setAttribute("aria-current",a.getAttribute("href")==="#"+r?"page":"false"));
  const st=stats(), bs=badges(st); const ws=computeWarnings(BASE,logs,ADAPT,ti).concat(loadWarnings(ti)).concat(eventWarnings(ti)).concat(cpWarnings(ti)).concat(bloodWarnings()); checkCont30();
  renderCount(ti,st,bs);
  if(r==="tanaan"){ renderSick(ti); renderPlanWeek(ti); renderMonthCard(); renderHabits(ti); renderMaint(); renderRaceWeek(ti); renderStatus(ws); renderToday(t,ti); renderTip(t); renderSummary(ti); renderWeek(t); renderUpcoming(t); }
  if(r==="historia"){ renderHistory(st); }
  if(r==="asetukset"){ renderTheme(); renderIcu(); renderHabitSettings(); renderStrava(); renderCloud(); renderPush(); renderZones(); renderLoc(); }
  if(r==="analyysi") renderAnalysis(ti,st,t);
  if(r==="merkit") renderBadges(st,bs);
  if(r==="kalenteri") renderCalendar(t);
  if(r==="opas"){ renderMill(); renderStrength(); renderRace(); renderZones(); renderRacePlans(); }
  renderGearDot();
  const n=ws.filter(w=>w.level!=="info").length; try{ if(navigator.setAppBadge){ n?navigator.setAppBadge(n):navigator.clearAppBadge(); } }catch(e){}
  renderBackupNag();
}
function renderCount(ti,st,bs){ const b=bIdx()-ti,n=NUTS-ti; const {L}=levelOf(xpOf(st,bs));
  $("count").innerHTML=`<a href="#merkit" class="chip lvl">${L[2]} <b>${L[1]}</b> ›</a>`+(b>=0?`<span class="chip">Belgrad <b class="num">${b}</b> pv</span>`:"")+(n>=0?`<span class="chip">Nuts <b class="num">${n}</b> pv</span>`:"")+(st.cur>=2?`<span class="chip" title="${st.flexNow?"Joustopäivä käytetty tällä viikolla":"Yksi väliin jäänyt treeni viikossa ei katkaise putkea"}">🔥 <b class="num">${st.cur}</b> putki${st.flexNow?" 🛟":""}</span>`:""); }
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
function vitLabel(l){ const b=[typeof l.rhr==="number"?`♥ ${l.rhr}`:"", typeof l.sleepH==="number"?`😴 ${n1(l.sleepH)} h`:"", typeof l.hrv==="number"?`HRV ${l.hrv}`:""].filter(Boolean); return b.length?`<span class="state vit">${b.join(" · ")}</span>`:""; }
function stateLabel(l){ if(!l) return ""; const fl=flagsOf(l).filter(f=>f!=="great").map(f=>FLAG_L[f].split(" ")[0]).join("");
  const base = l.status==="moved"?`<span class="state">→ Siirretty</span>`: l.status==="done"?`<span class="state done">✓ Tehty${typeof l.km==="number"?` · ${n1(l.km)} km`:""}</span>`: l.status==="skip"?`<span class="state skip">Jäi väliin</span>`:vitLabel(l);
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
  $("today").innerHTML=`<div class="herohead"><div class="eyebrow">${label} · vk ${wkNo(w)} · ${PHASE(w)}</div>${d!==t?`<button class="link" data-seltoday>‹ Tänään</button>`:""}</div>`+sessionsOn(BASE,logs,ADAPT,d).map((s,k)=>sessionBlock(s,k===0,ti)).join("")+extrasOn(d).map(extraBlock).join(""); }
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
  return s.code==="L"?"":`<span class="mark" aria-label="kirjaamatta"></span>`; }
function extrasOn(i){ const d=isoOfIdx(i); return Object.keys(logs).filter(k=>k.startsWith(d+"~s")||k.startsWith(d+"~f")).sort().map(sessionByKey); }
function extraBlock(s){ const l=logs[s.key]||{}; const bits=[typeof l.km==="number"?`${n1(l.km)} km`:"", l.min?`${l.min} min`:"", l.hr?`♥ ${l.hr}`:""].filter(Boolean).join(" · ");
  return `<button class="xtra" data-open="${s.key}"><span class="type ${TYPES[s.code].c}">${TYPES[s.code].l}</span><span><b>${TYPES[s.code]?TYPES[s.code].l:"Lisäliikunta"}</b>${l.stravaName?` · ${esc(l.stravaName)}`:""}<small>${bits}</small></span><span aria-hidden="true">›</span></button>`; }
function estMin(code,text){ const m=(text||"").match(/(\d+)(?:[–-](\d+))?\s?min/); if(m) return +(m[2]||m[1]); const h=(text||"").match(/(\d+(?:[,.]\d+)?)(?:[–-](\d+(?:[,.]\d+)?))?\s?h\b/); if(h) return Math.round(parseFloat((h[2]||h[1]).replace(",","."))*60); const k=(text||"").match(/(\d+(?:[,.]\d+)?)\s?km/); if(k) return Math.round(parseFloat(k[1].replace(",","."))*7.5); return code==="L"?0:40; }
function isKey(i){ const r=(BASE[i]||[]); return ["P","YM","X","R"].includes(r[0]) || (RUN.has(r[0])&&hasIntensity(r[1])); }
function weekGoals(w){ const a0=(w-1)*7-1; let mod=0, vig=0, n=0; const sDays=new Set(); let keyN=0,keyD=0;
  for(let i=Math.max(0,a0);i<=a0+6;i++){ if(i<BASE.length&&isKey(i)){ keyN++; const l=logs[isoOfIdx(i)]; if(l&&l.status==="done") keyD++; } }
  for(const k in logs){ const i=idxOfISO(k); if(i<a0||i>a0+6||i<FIRST) continue; const l=logs[k]; if(l.status!=="done") continue; const code=logType(BASE,k,l); if(code==="L") continue;
    const txt=(BASE[i]&&!/~/.test(k))?BASE[i][1]:""; const min=(typeof l.min==="number"&&l.min>0)?l.min:estMin(code,txt); n++;
    if(VIG.has(code)) vig+=min; else mod+=min;
    if(l.strength||l.strengthStravaId||["K","SA","T","TL"].includes(code)||/lihaskunto/i.test(txt)) sDays.add(k.slice(0,10));
    if(l.strengthMin) mod+=l.strengthMin; }
  const act=mod+2*vig; return {act:Math.round(act), tot:Math.round(mod+vig), mod, vig, n, strength:sDays.size, keyN, keyD}; }
const fmtH=m=>{ m=Math.round(m); const h=Math.floor(m/60), r=m%60; return h?`${h} h${r?` ${r} min`:""}`:`${r} min`; };
/* Viikon suunniteltu liikunta (ohjelma + muokkaukset + mukautukset). */
function plannedWeekMin(w){ const a0=(w-1)*7-1; let s=0; for(let i=Math.max(a0,FIRST);i<=a0+6&&i<BASE.length;i++){ const e=effective(BASE,ADAPT,i); s+=planMin(e.code,e.text); } return s; }
function ring(pct,cls){ const r=17,c=2*Math.PI*r, p=Math.max(0,Math.min(1,pct)); return `<svg class="ring ${cls}" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" class="rbg"/><circle cx="22" cy="22" r="${r}" class="rfg" stroke-dasharray="${(c*p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/>${p>=1?`<text x="22" y="27" text-anchor="middle">✓</text>`:""}</svg>`; }
function goalsHTML(w, act, tgt){ const G=weekGoals(w); const kmP=tgt?act/tgt:0;
  return `<div class="goals">
    <div class="goal"><div class="gh">${ring(kmP,"r-nuts")}<div><b>Nuts</b><span class="num">${n1(act)} / ${tgt} km</span></div></div><small>Avaintreenit ${G.keyD}/${G.keyN}</small></div>
    <button class="goal" data-logfree="" aria-label="Liikunta: kirjaa"><div class="gh">${ring(G.tot/WEEK_MIN,"r-health")}<div><b>Liikunta</b><span class="num">${fmtH(G.tot)} / 4 h</span></div></div><small>Lihaskunto ${Math.min(G.strength,2)}/2 · ＋ kirjaa</small></button>
  </div>`; }
function slimGoal(w,act,tgt){ const G=weekGoals(w), pct=Math.min(100,tgt?act/tgt*100:0), pl=plannedWeekMin(w), cw=weekOf(T0());
  const mv=`<div class="kmbar mv"><div class="lbl"><span>Liikunta <b class="num">${fmtH(G.tot)}</b> / 4 h</span><span>${w>=cw?`ohjelmassa ~${fmtH(pl)}`:G.tot>=WEEK_MIN?"✓":""}</span></div><div class="track"><div class="fill" style="width:${Math.min(100,G.tot/WEEK_MIN*100)}%"></div></div>${w>=cw&&pl<WEEK_MIN?`<p class="tip">Ohjelmasta puuttuu noin ${fmtH(Math.ceil((WEEK_MIN-pl)/5)*5)} 4 tunnista: lisää kävely, uinti tai jooga lepopäivälle.</p>`:""}</div>`;
  return mv+`<div class="kmbar"><div class="lbl"><span><b class="num">${n1(act)}</b> / ${tgt} km</span><span>${G.keyN?`Avaintreenit ${G.keyD}/${G.keyN}`:""}</span></div><div class="track"><div class="fill" style="width:${pct}%"></div></div></div>`; }
function dayMark(ss){ const s=ss.find(x=>logs[x.key]&&logs[x.key].status!=="moved")||ss[0]; return markFor(s); }
function renderWeek(t){
  const w=viewWeek,[a,b]=weekRange(w),act=weekKm(BASE,logs,w),tgt=TARGET_EFF[w-1],pct=Math.min(100,tgt?act/tgt*100:0); const sel=selDay==null?t:selDay; let rows="", strip="";
  const a0=(w-1)*7-1;
  for(let i=a0;i<=a0+6;i++){
    if(i<FIRST||i>=BASE.length){ strip+=`<span class="sd empty" aria-hidden="true"><span class="dw">${DOW[dow(i)]}</span></span>`; continue; }
    const d=new Date(START_UTC+i*864e5), ss=sessionsOn(BASE,logs,ADAPT,i), s0=ss[0], ci=changeInfo(s0);
    strip+=`<button class="sd${i===t?" today":""}${i===sel?" sel":""}${ci?" chg":""}" data-sel="${i}" aria-pressed="${i===sel}" aria-label="${fmt(i)}: ${TYPES[s0.code].l}"><span class="dw">${DOW[dow(i)]}</span><span class="dn num">${d.getUTCDate()}</span><span class="ty ${TYPES[s0.code].c}">${SHORT[s0.code]||""}</span><span class="hics">${habIcons(i)}</span>${i<=t?(dayMark(ss)||`<span class="mark none"></span>`):`<span class="mark none"></span>`}${(ss.length-1+extrasOn(i).length)>0?`<i class="plus">+${ss.length-1+extrasOn(i).length}</i>`:""}</button>`;
  }
  $("week").innerHTML=`<div class="weekhead"><div><div class="eyebrow">${PHASE(w)}${(w<=21&&!(w>=8&&w<=10))?" · 🏠 sisäkausi":""}</div><h2>Viikko ${wkNo(w)}</h2></div><div class="navbtns"><button data-addev="" aria-label="Lisää meno" title="Lisää meno">＋</button><button id="wPrev" aria-label="Edellinen viikko" ${w<=FIRST_W?"disabled":""}>‹</button><button id="wNow" aria-label="Tämä viikko">•</button><button id="wNext" aria-label="Seuraava viikko" ${w>=36?"disabled":""}>›</button></div></div>
    <div class="strip" role="group" aria-label="Viikon päivät">${strip}</div>
    ${slimGoal(w,act,tgt)}${weekScaleControls(w,t)}`;
  { const lc=$("week").querySelector("#loadCtl"); if(lc) lc.ontoggle=e=>{ loadOpen=e.target.open; }; }
  $("wPrev").onclick=()=>weekGo(-1); $("wNext").onclick=()=>weekGo(1);
  if(moveFrom!=null) $("week").querySelectorAll(".sd[data-sel]").forEach(b=>{ const j=+b.dataset.sel; b.classList.toggle("mvfrom",j===moveFrom); b.classList.toggle("mvok",j!==moveFrom&&canSwap(j)); }); $("wNow").onclick=()=>{ viewWeek=weekOf(t); selDay=null; render(); };
}
let weekListOpen=false, moveFrom=null, lpT=null, lpFired=false, tx=null;
function weekGo(dw){ const t=T0(), sel=selDay==null?t:selDay; const nw=Math.min(36,Math.max(FIRST_W,viewWeek+dw)); if(nw===viewWeek) return; const off=sel-((viewWeek-1)*7-1); viewWeek=nw; const ns=Math.min(BASE.length-1,Math.max(FIRST,(nw-1)*7-1+off)); selDay= ns===t?null:ns; render(); }
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
  if(cw>FIRST_W){ let km=0, pl=0, dn=0, met=0; for(let w=FIRST_W;w<cw;w++){ const a=weekKm(BASE,logs,w); km+=a; if(TARGET_EFF[w-1]&&a>=TARGET_EFF[w-1]*0.9) met++; }
    for(let i=FIRST;i<(cw-1)*7-1&&i<BASE.length;i++){ const c=sessionsOn(BASE,logs,ADAPT,i)[0].code; if(c==="L") continue; pl++; const l=logs[isoOfIdx(i)]; if(l&&l.status==="done") dn++; }
    h+=`<button class="calpast" id="calPast" aria-expanded="${calPastOpen}"><span><b>Vk 1–${wkNo(cw-1)}</b> · ${n1(km)} km · ${dn}/${pl} treeniä · tavoite täynnä ${met}/${cw-FIRST_W} viikkona</span><span aria-hidden="true">${calPastOpen?"▴":"▾"}</span></button>`; }
  for(let w=calPastOpen?FIRST_W:Math.max(cw,FIRST_W);w<=36;w++){
    const a0=(w-1)*7-1, ph=PHASE(w); if(ph!==lastPh){ h+=`<div class="calphase">${esc(ph)}</div>`; lastPh=ph; }
    const act=weekKm(BASE,logs,w), tgt=TARGET_EFF[w-1]; let cells="";
    for(let i=a0;i<=a0+6;i++){
      if(i<FIRST||i>=BASE.length){ cells+=`<span class="cc empty"></span>`; continue; }
      const ss=sessionsOn(BASE,logs,ADAPT,i), s0=ss[0], note=BASE[i][2], c=s0.code, dim=!want(c), chg=changeInfo(s0)||(edits[isoOfIdx(i)]&&!edits[isoOfIdx(i)].ev);
      cells+=`<button class="cc${i===t?" today":""}${i<t?" past":""}${dim?" dim":""}${c==="R"?" race":""}${chg?" chg":""}" data-cal="${i}" aria-label="${fmt(i)}: ${TYPES[c].l}${chg?", muutettu":""}${note?`, ${esc(note)}`:""}"><span class="dn num">${new Date(START_UTC+i*864e5).getUTCDate()}</span><span class="ty ${TYPES[c].c}">${SHORT[c]||""}</span><span class="hics">${note&&i>t?"":habIcons(i)}</span>${i<=t?dayMark(ss)||`<span class="mark none"></span>`:note?`<span class="cn" aria-hidden="true">📌</span>`:`<span class="mark none"></span>`}${extrasOn(i).length?`<i class="plus">+${extrasOn(i).length}</i>`:""}</button>`;
    }
    const past=w<cw, met=tgt?act>=tgt*0.9:true;
    h+=`<div class="calwk${w===cw?" cur":""}${past?(met?" met":" short"):""}" id="cw${w}"><div class="cwh"><b>Vk ${wkNo(w)}</b><span>${fmtShort(Math.max(FIRST,a0))}–${fmtShort(Math.min(BASE.length-1,a0+6))}</span><span class="cwk num">${past&&met?"✓ ":""}${w<=cw?`${n1(act)} / `:""}${tgt} km</span></div><div class="calgrid">${cells}</div></div>`;
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
function renderUpcoming(t){ const it=[]; for(let i=t+1;i<=Math.min(BASE.length-1,t+21);i++){ const [c,text,note]=BASE[i]; if(c==="X"||c==="R"||note) it.push(`<li class="clamp" onclick="this.classList.toggle('open')"><time>${fmt(i)}</time><span>${c==="X"||c==="R"?`<b>${TYPES[c].l}:</b> `:""}${esc(note||text)}</span></li>`); }
  $("upcoming").innerHTML=it.slice(0,4).join("")||`<li><span class="note">Ei erityisiä päiviä lähiviikkoina.</span></li>`; }
function renderHistory(st){
  let es=entries().filter(e=>e.l.status!=="moved"); const f=hist.filter,q=hist.q.trim().toLowerCase();
  if(f==="run") es=es.filter(e=>RUN.has(e.code)); if(f==="other") es=es.filter(e=>!RUN.has(e.code)&&e.code!=="L");
  if(f==="health") es=es.filter(e=>flagsOf(e.l).some(x=>x!=="great")); if(f==="skip") es=es.filter(e=>e.l.status==="skip");
  if(q) es=es.filter(e=>(e.l.note||"").toLowerCase().includes(q)||TYPES[e.code].l.toLowerCase().includes(q)||(e.l.painArea||"").includes(q));
  es.sort({date:(a,b)=>a.key<b.key?1:-1,km:(a,b)=>(b.l.km||0)-(a.l.km||0),feel:(a,b)=>(a.l.feel||9)-(b.l.feel||9)}[hist.sort]);
  $("hTiles").innerHTML=[["Juostu",`${n1(st.km)} km`],["Treenejä",st.done],["Pisin",st.longest?`${n1(st.longest)} km`:"–"],["Keskivauhti",st.avgPace?`${st.avgPace}/km`:"–"],["Nousua",st.elev?`${Math.round(st.elev)} m`:""],["Paras putki",st.best]].filter(([,b])=>b!==""&&b!=="–"&&b!==0).map(([a,b])=>`<div class="tile"><span>${a}</span><b class="num">${b}</b></div>`).join("");
  document.querySelectorAll("#hFilters button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===f));
  let lastTW=null; const body=es.map(e=>{ const l=e.l,fl=flagsOf(l); const w=weekOf(e.idx); const gh=hist.sort==="date"&&w!==lastTW?`<tr class="wkrow"><td colspan="13">__WK${w}__</td></tr>`:""; lastTW=w; return gh+`<tr data-open="${e.key}" tabindex="0"><td class="num">${fmtShort(e.idx)}${e.key.endsWith("~m")?"→":""}</td><td>${typeChip(e.code)}${l.stravaId?' <span class="stv" title="Strava">S</span>':""}${l.strength?` 💪${l.strength}`:""}${l.stravaName?`<br><small class="sn">${esc(l.stravaName)}</small>`:""}</td><td>${l.status==="done"?"✓":l.status==="skip"?"väliin":"vointi"}</td><td class="num r">${typeof l.km==="number"?n1(l.km):""}</td><td class="num r">${typeof l.min==="number"?l.min:""}</td><td class="num r">${pace(l.km,l.min)}</td><td class="num r">${l.hr||""}</td><td class="num r">${l.elev??""}</td><td>${l.feel?FEEL[l.feel-1][1]:""}</td><td>${fl.map(x=>FLAG_L[x].split(" ")[0]).join("")}${l.painArea?` ${esc(l.painArea)}`:""}</td><td class="num r">${l.rhr||""}</td><td class="num r">${l.sleepH?n1(l.sleepH):""}</td><td class="nt">${esc(l.note||"")}</td></tr>`; }).join("");
  const cardArr=es.map(e=>{ const l=e.l,fl=flagsOf(l); const vit=l.status==="note"; const bits=vit?[typeof l.rhr==="number"?`leposyke ${l.rhr}`:"", typeof l.sleepH==="number"?`uni ${n1(l.sleepH)} h`:"", typeof l.hrv==="number"?`HRV ${l.hrv}`:""].filter(Boolean).join(" · "):[l.status==="done"?"✓":l.status==="skip"?"väliin":"📝", typeof l.km==="number"?`${n1(l.km)} km`:"", typeof l.min==="number"?`${l.min} min`:"", pace(l.km,l.min)?`${pace(l.km,l.min)}/km`:"", l.hr?`♥ ${l.hr}${tooHard(e)?" ⚠︎":""}`:"", l.elev?`↗ ${l.elev} m`:""].filter(Boolean).join(" · ").replace(/^(✓|📝) · /,"$1 ");
    return `<li class="hcard" data-open="${e.key}" tabindex="0"><span class="hd">${fmtShort(e.idx)}<small>${DOW[dow(e.idx)]}</small></span><span class="hm"><span>${vit?`<span class="type t-vit">♥ Vointi</span>`:typeChip(e.code)}${l.stravaId?' <span class="stv">S</span>':""}${l.strength?` 💪${l.strength}`:""} ${fl.map(x=>FLAG_L[x].split(" ")[0]).join("")}</span><span class="hs">${bits}</span>${l.stravaName||l.note?`<span class="hn">${esc(l.stravaName||"")}${l.stravaName&&l.note?" · ":""}${esc(l.note||"")}</span>`:""}</span></li>`; });
  const byDate=hist.sort==="date"; const wk=e=>weekOf(e.idx); const wsum={};
  if(byDate) es.forEach(e=>{ const w=wk(e); const o=wsum[w]=wsum[w]||{km:0,n:0}; if(e.l.status==="done"){ o.n++; if(typeof e.l.km==="number") o.km+=e.l.km; } });
  const whead=w=>`Vk ${wkNo(w)}<span>${n1(wsum[w].km)} km · ${wsum[w].n} treeni${wsum[w].n===1?"":"ä"}</span>`;
  let lastW=null; const cardsG=byDate?es.map((e,k)=>{ const w=wk(e); const h=w!==lastW?`<li class="wkhead">${whead(w)}</li>`:""; lastW=w; return h+cardArr[k]; }).join(""):cardArr.join("");
  $("hCards").innerHTML=cardsG;
  const bodyG=body.replace(/__WK(\d+)__/g,(_,w)=>wsum[w]?whead(+w):`Vk ${wkNo(+w)}`);
  $("hTable").innerHTML=es.length?`<table><thead><tr><th>Pvm</th><th>Treeni</th><th>Tila</th><th class="r">km</th><th class="r">min</th><th class="r">min/km</th><th class="r">syke</th><th class="r">nousu m</th><th>Fiilis</th><th>Vointi</th><th class="r">leposyke</th><th class="r">uni h</th><th>Muistiinpano</th></tr></thead><tbody>${bodyG}</tbody></table>`:`<p class="note">${Object.keys(logs).length?"Ei osumia tällä suodatuksella.":"Ei vielä kirjauksia."}</p>`;
}
function spark(vals,{min,max,w=320,h=96,color="var(--accent)",label,fmtv=v=>Math.round(v)}){ const pts=vals.map((v,i)=>v==null?null:[i/(vals.length-1)*w, h-(v-min)/(max-min||1)*h]); let d="",on=false;
  pts.forEach(p=>{ if(!p){on=false;return;} d+=(on?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)+" "; on=true; });
  const last=[...pts].reverse().find(Boolean);
  return `<svg viewBox="-4 -6 ${w+8} ${h+12}" class="spark" role="img" aria-label="${label}"><line x1="0" x2="${w}" y1="0" y2="0" stroke="var(--line)" stroke-dasharray="2 4"/><line x1="0" x2="${w}" y1="${h}" y2="${h}" stroke="var(--line)"/><text x="${w}" y="10" text-anchor="end" font-size="11" fill="var(--muted)">${fmtv(max)}</text><text x="${w}" y="${h-4}" text-anchor="end" font-size="11" fill="var(--muted)">${fmtv(min)}</text><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>${last?`<circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${color}"/>`:""}</svg>`; }
function renderAnalysis(ti,st,t0){
  document.querySelectorAll("[data-agroup]").forEach(g=>g.hidden=g.dataset.agroup!==anaTab);
  document.querySelectorAll("[data-atab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.atab===anaTab)));
  if(anaTab==="matka"){ renderTrail(st); renderProfile(t0); renderMonth(); }
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
  $("aCycle").innerHTML=cycleHTML(Math.max(0,ti)); $("aBlood").innerHTML=bloodHTML(); $("aHab").innerHTML=habGridHTML(Math.max(0,ti)); $("aHabIns").innerHTML=habitInsights(Math.max(0,ti));
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
  const hrv=g("hrv"); if(has(hrv)) tr+=`<div class="trend"><div><b>HRV</b><span>keskiarvo ${Math.round(avg(hrv))} ms</span></div>${spark(hrv,{min:Math.min(...hrv.filter(x=>x))-5,max:Math.max(...hrv.filter(x=>x))+5,color:"var(--ok)",label:"HRV 30 päivää"})}</div>`;
  $("aTrends").innerHTML=tr;
  $("aLoad").querySelectorAll(".tile").forEach(t=>{ const v=(t.querySelector("b")||{}).textContent; if(!v||/^(–|0 m)$/.test(v.trim())) t.remove(); });
  setTimeout(hideEmptyCards,0);
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
function hideEmptyCards(){ document.querySelectorAll("[data-agroup]").forEach(g=>{ const hid=[]; g.querySelectorAll(":scope > section.card").forEach(sec=>{ const body=[...sec.children].filter(c=>!c.classList.contains("eyebrow")); const empty=body.length>0&&body.every(c=>{ const h=c.innerHTML.trim(); return h===""||/^<p class="note">[^<]*<\/p>$/.test(h); }); sec.hidden=empty; if(empty){ const e=sec.querySelector(".eyebrow"); if(e) hid.push(e.textContent.trim().toLowerCase()); } });
    let n=g.querySelector(":scope > .emptynote"); if(!n){ n=document.createElement("p"); n.className="tip emptynote"; g.appendChild(n); } n.hidden=!hid.length; n.textContent=hid.length?`Täyttyvät, kun dataa kertyy: ${hid.join(", ")}.`:""; }); }
$("aSeg").onclick=e=>{ const b=e.target.closest("[data-atab]"); if(!b) return; anaTab=b.dataset.atab; render(); };
function renderBadges(st,bs){ const xp=xpOf(st,bs),{L,next}=levelOf(xp),pct=next?Math.round((xp-L[0])/(next[0]-L[0])*100):100;
  $("level").innerHTML=`<div class="lvlbig">${L[2]}</div><div class="lvlinfo"><div class="eyebrow">Taso</div><h2>${L[1]}</h2><div class="kmbar"><div class="lbl"><span><b class="num">${xp}</b> XP</span><span>${next?`${next[2]} ${next[1]}: ${next[0]} XP`:"Huipulla!"}</span></div><div class="track"><div class="fill" style="width:${pct}%"></div></div></div></div>`;
  $("badgeGrid").innerHTML=bs.map(b=>`<div class="badge${b.got?" got":""}"><span class="bi" aria-hidden="true">${b.icon}</span><b>${b.name}</b><span>${b.desc}</span></div>`).join(""); $("badgeCount").textContent=`${bs.filter(b=>b.got).length}/${bs.length} merkkiä`; }
function renderBackupNag(){ if(stravaConnected()){ $("backupNag").hidden=true; const fb=$("fileBackup"); if(fb) fb.open=false; return; } const n=Object.keys(logs).length; const last=meta.lastBackup?new Date(meta.lastBackup):null; const old=!last||(Date.now()-last.getTime())>7*864e5;
  $("backupNag").hidden=!(n>=3&&old); $("lastBackup").textContent=last?`Viimeisin varmuuskopio ${last.getDate()}.${last.getMonth()+1}.${last.getFullYear()}.`:"Varmuuskopiota ei ole vielä tehty."; }

