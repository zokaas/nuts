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
  return `${half?`<p class="note">Tavoitteena puolimaraton la 17.4. Välitarkistukset ovat suuntaa antavia.</p>`:""}${(()=>{ const nxt=S.find(x=>x.st!=="ok"&&x.st!=="miss"); const top=S.filter(x=>x.st==="miss"&&ti-x.by<=28).concat(nxt?[nxt]:[]); const okN=S.filter(x=>x.st==="ok").length; const li=x=>`<li class="cp-${x.st}"><span class="cpi">${ic[x.st]}</span><span><b>${x.t}</b><small>${fmt(x.by)} mennessä · ${x.st==="ok"?"tehty":`nyt ${n1(x.val)} ${x.u}`}</small>${x.st!=="ok"&&x.goal?`<span class="cpbar"><i style="width:${Math.min(100,x.val/x.goal*100)}%"></i></span>`:""}</span></li>`;
      return `${okN?`<p class="tip">✓ ${okN}/${S.length} tarkistusta tehty</p>`:""}<ul class="cps">${top.map(li).join("")}</ul><details class="fold"><summary>Kaikki välitarkistukset</summary><ul class="cps">${S.map(li).join("")}</ul></details>`; })()}<ul class="cps" hidden>${S.map(x=>`<li class="cp-${x.st}"><span class="cpi">${ic[x.st]}</span><span><b>${x.t}</b><small>${fmt(x.by)} mennessä · ${x.st==="ok"?"tehty":`nyt ${n1(x.val)} ${x.u}`}</small></span></li>`).join("")}</ul>
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
/* Nutsin tavoite: alle tämän (min), naisten top 30 (päätös 19.11.2026). Alle 10 h on varatavoite. */
const NUTS_GOAL=540;
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
    <li><b>Tavoite:</b> alle ${hm(NUTS_GOAL)} (keskivauhti alle ${pace(1,NUTS_GOAL/66)}/km), naisten top 30. Varatavoite alle 10 h. Mittari: kesäkuun 30 km:n testi alle 3:25.</li>
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
