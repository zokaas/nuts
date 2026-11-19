/* ===== Pilvivarmuuskopio ===== */
let cloudTimer=null, cloudState={busy:false, last: meta.cloudSaved||null, err:null};
function weeksStatus(){ const t=Math.max(0,todayIdx()), w=weekOf(t), o={}; for(const x of [w,w+1]){ if(x>36) continue; o[isoOfIdx((x-1)*7-1)]={w:x,tgt:TARGET_EFF[x-1]}; } return o; }
function upcomingStatus(){ const t0=Math.max(0,todayIdx()); const t=Math.max(0,(weekOf(t0)-1)*7-1); const up={}; for(let i=t;i<=Math.min(BASE.length-1,t+21);i++){ const e=effective(BASE,ADAPT,i); up[isoOfIdx(i)]={code:e.code,label:TYPES[e.code].l,text:(e.text||"").slice(0,120),note:(BASE[i][2]||"").slice(0,40)}; } return up; }
function cloudPayload(){
  const ti=todayIdx(); let ws=[]; try{ ws=computeWarnings(BASE,logs,ADAPT,ti).concat(eventWarnings(ti)).concat(cpWarnings(ti)).map(w=>({level:w.level,title:w.title})); }catch(e){}
  return { data:{app:"matka-pallakselle",version:3,logs,adjOff,edits,weekScale,shoes,gear,hr:meta.hr||null,defaultShoe:meta.defaultShoe||null,habits:meta.habits||null,hab:meta.hab||{},bGoal:meta.bGoal||null,rck:meta.rck||null,blood:meta.blood||null,habMove:meta.habMove||null,cycle:meta.cycle||null,planned:meta.planned||null,sick:meta.sick||null}, status:{upcoming:upcomingStatus(),weeks:weeksStatus(),warnings:ws,at:new Date().toISOString()}, refresh:strava.r||null };
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
    restoreExtras(d);
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

