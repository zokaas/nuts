/* ===== v12: sairastila ===== */
function sickActive(){ return !!(meta.sick&&!meta.sick.to); }
function sickFlags(){ return meta.sick&&meta.sick.kind==="fever"?["sick","fever"]:["sick"]; }
/* Sairastilan aikana jokainen päivä alusta tähän päivään merkitään sairaaksi, jotta ohjelma, putket ja ilmoitukset mukautuvat. */
function sickSync(ti){ if(!meta.sickFix1){ meta.sickFix1=1; const X=meta.sick; if(X&&X.to&&X.to===X.from){ sickCancel_(X); meta.sick=null; } persist(); }
  const S=meta.sick; if(!S||S.to||ti<0) return; S.auto=S.auto||[]; let ch=false;
  for(let i=Math.max(FIRST,idxOfISO(S.from));i<=ti;i++){ const d=isoOfIdx(i); const l=logs[d]; const want=sickFlags();
    if(!l){ logs[d]={status:"note",flags:want.slice(),note:"",updatedAt:new Date().toISOString(),sickAuto:true}; if(!S.auto.includes(d)) S.auto.push(d); ch=true; continue; }
    const f=Array.isArray(l.flags)?l.flags:[]; const miss=want.filter(x=>!f.includes(x)), extra=S.kind!=="fever"&&S.auto.includes(d)&&f.includes("fever");
    if(miss.length||extra){ l.flags=f.filter(x=>!(extra&&x==="fever")).concat(miss); l.updatedAt=new Date().toISOString(); if(!S.auto.includes(d)) S.auto.push(d); ch=true; } }
  if(ch) persist(); }
function sickUnflag(d){ const l=logs[d]; if(!l) return; l.flags=(l.flags||[]).filter(x=>x!=="sick"&&x!=="fever"); l.updatedAt=new Date().toISOString();
  if(l.status==="note"&&!l.flags.length&&!l.note&&l.rhr==null&&l.sleepH==null&&l.feel==null&&!l.stravaId) delete logs[d]; }
/* Peruu sairastilan kokonaan: Sairas-merkinnät pois ja ohjelma palaa ennalleen. */
function sickCancel_(S){ new Set([...(S.auto||[]),S.from]).forEach(sickUnflag); }
function sickCancel(){ const S=meta.sick; if(!S) return; new Set([...(S.auto||[]),S.from]).forEach(sickUnflag); meta.sick=null; persist(); render(); }
function sickLen(){ const S=meta.sick; if(!S) return 0; const a=idxOfISO(S.from), b=S.to?idxOfISO(S.to):todayIdx(); return Math.max(1,b-a+1); }
function renderSick(ti){ const el=$("sickCard"); if(!el) return; const S=meta.sick; let html="";
  if(S&&!S.to){ const n=sickLen(), fev=S.kind==="fever", rec=sickRec(n,fev);
    const half=Math.ceil(rec/2);
    html=`<div class="sickhead"><h2>Sairastila</h2><span class="tip">päivä ${n}</span></div>
      <div class="seg2" role="group" aria-label="Oireet"><button type="button" data-sickkind="neck" aria-pressed="${!fev}"><b>Nuha tai kurkku</b><small>kaulan yläpuolella</small></button><button type="button" data-sickkind="fever" aria-pressed="${fev}"><b>Kuume tai koko keho</b><small>särky, väsymys, rintakehä</small></button></div>
      <p>${fev?"Täysi lepo. Treenit jatkuvat vasta, kun olet ollut vuorokauden kuumeeton. Kuumeisena treenaaminen rasittaa sydäntä.":"Kevyt kävely ulkona on ok, jos olo sallii. Ei juoksua, salia eikä spinningiä. Juo ja nuku."}</p>
      <ul class="sicklist"><li>Treenit on vaihdettu lepoon, eivätkä ne näy väliin jääneinä.</li><li>Tapojen putket ovat tauolla, eli flunssa ei katkaise niitä. Jos jaksat tehdä tavan, kuittaa se normaalisti.</li><li>Kun olet terve: ${rec} pv kevyttä paluuta (${half} pv 50 % ja ${rec-half} pv 75 % määrästä, ei vetoja${fev?", testi siirtyy":""}).</li></ul>
      ${n>=7?`<p class="tip">Jos oireet jatkuvat yli viikon tai pahenevat, ota yhteys terveydenhuoltoon.</p>`:""}
      <div class="row"><button class="btn primary" data-sickoff>Olen terve</button><button class="btn ghost" data-sickcancel>Merkitsin vahingossa</button></div>`; }
  else if(S&&S.to&&flagsOf(logs[S.to]).includes("sick")){ const end=idxOfISO(S.to)+(S.rec||0); const k=ti-idxOfISO(S.to);
    if(k>=1&&ti<=end){ html=`<div class="sickhead"><h2>Paluu sairastelusta</h2><span class="tip">päivä ${k}/${S.rec}</span></div><p class="tip">Juoksut ovat lyhyempiä ja ilman vetoja ${fmt(end)} asti. Jos olo huononee, palaa sairastilaan.</p><div class="row"><button class="btn ghost" data-sickresume>Olen taas kipeä</button></div>`; } }
  el.hidden=!html; el.innerHTML=html; el.classList.toggle("ret",!!(S&&S.to)); }
document.addEventListener("click",e=>{ const t=todayIdx(), tIso=isoOfIdx(Math.max(0,t));
  if(e.target.closest("[data-sickon]")){ meta.sick={from:tIso,kind:"neck",auto:[]}; persist(); render(); scrollTo({top:0,behavior:"smooth"}); toast("Sairastila päällä. Lepää, ohjelma odottaa."); return; }
  const k=e.target.closest("[data-sickkind]"); if(k&&meta.sick){ meta.sick.kind=k.dataset.sickkind; persist(); render(); return; }
  if(e.target.closest("[data-sickoff]")&&meta.sick){ const S=meta.sick; const fromI=idxOfISO(S.from);
    if(fromI>=t){ sickCancel(); toast("Sairastila poistettu. Tänään ei lasketa sairaspäiväksi."); return; }
    const toI=fromI>=t?t:t-1; if(toI<t){ sickUnflag(tIso); } S.to=isoOfIdx(toI); S.rec=sickRec(toI-fromI+1,S.kind==="fever"); persist(); render(); toast(`Hienoa! ${S.rec} päivän kevyt paluu alkaa.`); return; }
  if(e.target.closest("[data-sickcancel]")&&meta.sick){ sickCancel(); toast("Sairastila poistettu."); return; }
  if(e.target.closest("[data-sickresume]")&&meta.sick){ delete meta.sick.to; delete meta.sick.rec; persist(); render(); toast("Sairastila jatkuu."); } });

