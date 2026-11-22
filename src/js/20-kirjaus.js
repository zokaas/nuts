/* ---------- kirjausikkuna ---------- */
function sessionByKey(key){ const i=idxOfISO(key); const f=sessionsOn(BASE,logs,ADAPT,i).find(s=>s.key===key); if(f) return f; if(/~[sf]/.test(key)&&logs[key]){ const l=logs[key]; return {key,idx:i,code:l.type||"J",text:l.stravaName?`Stravasta: ${l.stravaName}`:"Lisäliikunta",note:"",moved:true}; } return {key,idx:i,...effective(BASE,ADAPT,i),moved:false}; }
function openEditor(key,pre,mode){
  const s=sessionByKey(key); edit=s; const l=logs[key];
  draft=l?JSON.parse(JSON.stringify(l)):{status:null,km:null,min:null,hr:null,feel:null,flags:[],painArea:null,painLevel:null,rhr:null,sleepH:null,note:""};
  draft.flags=flagsOf(draft); if(pre&&(!l||l.status==="note")) draft.status=pre;
  $("edDate").textContent=`${fmt(s.idx)} · vk ${wkNo(weekOf(s.idx))}${s.moved?" · siirretty":""}`; $("edTitle").textContent=TYPES[s.code].l; $("edTarget").textContent=s.text||"Lepopäivä";
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
  { const r=$("edCycRow"); if(r){ const on=!!cyc().on; r.hidden=!on; if(on){ const d=isoOfIdx(edit.idx); const b=$("edCyc"); const sync=()=>{ const v=!!(cyc().days||{})[d]; b.setAttribute("aria-pressed",String(v)); b.textContent=v?"🩸 Kuukautiset merkitty ✓":"🩸 Kuukautiset tänä päivänä"; }; sync(); b.onclick=()=>{ meta.cycle=meta.cycle||{on:true}; const D=meta.cycle.days=meta.cycle.days||{}; if(D[d]) delete D[d]; else D[d]=1; persist(); sync(); }; } } }
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
  logs[s.key]=doc; persist();
  /* Sairas-merkintä tälle päivälle tai eiliselle käynnistää sairastilan: seuraavat päivät merkitään itsestään, kunnes painat "Olen terve". */
  const tN=todayIdx(); if(draft.flags.includes("sick")&&!sickActive()&&s.idx>=tN-1&&s.idx<=tN){ meta.sick={from:isoOfIdx(s.idx),kind:"neck",auto:[]}; persist(); closeEditor(); render(); scrollTo({top:0,behavior:"smooth"}); toast("Sairastila päällä. Lepää, ohjelma odottaa.",{l:"Peru",fn:()=>{ sickCancel(); toast("Peruttu. Ohjelma palasi ennalleen."); }}); return; }
  closeEditor(); render();
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
    $("doMerge").onclick=()=>{ restoreExtras(d); for(const k in d.logs){ if(!logs[k]||(d.logs[k].updatedAt||"")>(logs[k].updatedAt||"")) logs[k]=d.logs[k]; } adjOff={...adjOff,...(d.adjOff||{})}; edits={...(d.edits||{}),...edits}; weekScale={...(d.weekScale||{}),...weekScale}; (d.shoes||[]).forEach(x=>{ if(!shoes.find(y=>y.id===x.id)) shoes.push(x); }); gear={...(d.gear||{}),...gear}; if(!meta.defaultShoe&&d.defaultShoe) meta.defaultShoe=d.defaultShoe; if(!strava.worker&&d.stravaWorker){ strava.worker=d.stravaWorker; saveStrava(); } persist(); $("restoreMsg").textContent="Yhdistetty ✓"; render(); };
    $("doReplace").onclick=()=>{ logs=d.logs; adjOff=d.adjOff||{}; edits=d.edits||{}; weekScale=d.weekScale||{}; shoes=d.shoes||[]; gear=d.gear||{}; meta.defaultShoe=d.defaultShoe||null; persist(); $("restoreMsg").textContent="Palautettu ✓"; render(); };
  }catch(err){ $("restoreMsg").textContent="Tiedostoa ei voitu lukea. Valitse sovelluksen tekemä varmuuskopio (.json)."; }
  e.target.value=""; };

/* ---------- juhla & ilmoitus ---------- */
function toast(m,act){ const t=$("toast"); t.textContent=m; t.classList.toggle("act",!!act); if(act){ const b=document.createElement("button"); b.className="tbtn"; b.textContent=act.l; b.onclick=()=>{ t.classList.remove("show"); act.fn(); }; t.append(" ",b); } t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),act?5000:2800); }
function celebrate(){ const st=stats(); toast(`${pick(CHEERS,st.done)} +10 XP`); if(navigator.vibrate) navigator.vibrate(30);
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return; const c=$("fx"),ctx=c.getContext("2d"); c.width=innerWidth; c.height=innerHeight; c.hidden=false;
  const cs=getComputedStyle(document.documentElement), cols=["--accent","--hl","--fell","--ok"].map(v=>cs.getPropertyValue(v).trim()||"#1d5b6c");
  const ps=Array.from({length:70},()=>({x:innerWidth/2,y:innerHeight*.65,vx:(Math.random()-.5)*9,vy:-Math.random()*11-4,r:Math.random()*4+3,c:cols[Math.floor(Math.random()*cols.length)],a:Math.random()*6}));
  let f=0; (function step(){ ctx.clearRect(0,0,c.width,c.height); ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=.35; p.a+=.2; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle=p.c; ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r); ctx.restore(); }); if(++f<70) requestAnimationFrame(step); else { ctx.clearRect(0,0,c.width,c.height); c.hidden=true; } })(); }


