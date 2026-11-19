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
    const date=(a.start_date_local||a.start_date||"").slice(0,10); const i=idxOfISO(date); if(!date||i<FIRST) continue;
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


