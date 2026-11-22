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
  const w = d===6?weekOf(ti):weekOf(ti)-1; const S=weekSummary(w);
  /* Ei koostetta viikolta, jolla ei ollut yhtään treeniä (esim. ennen ohjelman alkua). */
  if(!S.planned){ el.hidden=true; return; }
  el.hidden=false; el.innerHTML=`<div class="eyebrow">Viikkokooste · viikko ${w}</div>`+summaryHTML(S,true); }
function renderWeeklyList(ti){ const cw=weekOf(ti); const ws=[]; for(let w=cw-1;w>=Math.max(1,cw-4);w--) if(weekSummary(w).planned) ws.push(w);
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


