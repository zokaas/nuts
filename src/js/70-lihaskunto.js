/* ===== Lihaskunto: ohjelmat ja treenitila ===== */
const WARMUP = "Lämmittely 5 min: reipas kävely, hyppynaru tai kuntopyörä. Sitten 10 jalkaheilautusta eteen ja sivulle per jalka, 10 lantion pyöritystä ja 10 kyykkyä ilman painoa.";
const STRENGTH = {
  A:{name:"Pohja", when:"Viikot 1–16 · 2× viikossa talvella", time:"30 min", goal:"Rakentaa perusvoiman jalkoihin, pakaroihin ja keskivartaloon. Valmistaa jänteet ja nivelet juoksun iskutukseen.",
    ex:[
      {n:"Kyykky",s:3,r:"10–12",t:"3 s alas, 1 s ylös",rest:60,c:["Jalat hartioiden levyisesti, varpaat hieman ulospäin","Lantio taakse kuin istuisit tuolille, rintakehä pystyssä","Polvet varpaiden suuntaan, paino koko jalkapohjalla"],e:"Kyykky tuolille ja ylös",h:"Kahvakuula rinnan edessä (8–16 kg)",w:"Reisien ja pakaroiden perusvoima"},
      {n:"Askelkyykky taakse",s:3,r:"8 / jalka",t:"rauhallisesti",rest:60,c:["Astu pitkä askel taakse","Takapolvi lähes lattiaan, etupolvi pysyy nilkan päällä","Ponnista etujalan kantapäällä takaisin ylös"],e:"Ota tuesta kiinni",h:"Käsipainot käsissä",w:"Yhden jalan voima ja tasapaino"},
      {n:"Lantionnosto",s:3,r:"12–15",t:"pito 2 s ylhäällä",rest:45,c:["Selinmakuu, kantapäät lähellä pakaroita","Työnnä kantapäillä ja purista pakarat","Älä notkista selkää: kylkiluut alas"],e:"Pienempi liikerata",h:"Yhdellä jalalla",w:"Pakarat kantavat juoksussa lantiota"},
      {n:"Pohjenousu portaalla",s:3,r:"15",t:"1 s ylös, 3 s alas",rest:45,c:["Päkiät portaan reunalla, polvet suorina","Nouse täysin varpaille","Laske hitaasti, kantapää portaan alapuolelle"],e:"Lattialla, kahdella jalalla",h:"Yhdellä jalalla",w:"Akillesjänne ja pohkeet: yleisimmät juoksijan kipupaikat"},
      {n:"Lankku",s:3,r:"30–45 s",t:"pito",rest:30,c:["Kyynärpäät olkapäiden alla","Vatsa ja pakarat tiukkana","Suora linja päästä kantapäihin, lantio ei roiku"],e:"Polvet maassa",h:"Nosta vuorotellen jalkaa",w:"Keskivartalo pitää askeleen ryhdikkäänä väsyneenä"},
      {n:"Kylkilankku",s:2,r:"20–30 s / puoli",t:"pito",rest:30,c:["Kyynärpää olkapään alla","Lantio ylhäällä, vartalo suorana","Hengitä normaalisti"],e:"Alempi polvi maassa",h:"Nosta ylempi jalka",w:"Lantion tuki, estää polven kiertymistä"},
      {n:"Yhden jalan seisonta",s:2,r:"30 s / jalka",t:"pito",rest:15,c:["Polvi pehmeänä","Katse eteenpäin","Pidä lantio suorassa"],e:"Kevyt tuki sormilla",h:"Silmät kiinni tai tyynyn päällä",w:"Nilkan hallinta kivikkoon ja juurakkoon"},
    ]},
  B:{name:"Juoksijan voima", when:"Viikot 17–24 · 1–2× viikossa", time:"35 min", goal:"Yhden jalan voima, koska juoksu on hyppelyä yhdeltä jalalta toiselle. Tukee maratonjaksoa.",
    ex:[
      {n:"Bulgarialainen askelkyykky",s:3,r:"8 / jalka",t:"3 s alas, 1 s ylös",rest:90,c:["Takajalan päkiä penkillä tai tuolilla","Laskeudu suoraan alas, etupolvi linjassa varpaiden kanssa","Ylävartalo hieman eteenpäin kallistettuna"],e:"Ilman painoja, tuki kädellä",h:"Käsipainot (2 × 6–12 kg)",w:"Tehokkain yksittäinen juoksijan jalkaliike"},
      {n:"Askelnousu korkealle",s:3,r:"10 / jalka",t:"rauhallinen lasku",rest:60,c:["Polvenkorkuinen taso","Nouse etujalan voimalla, älä ponnista takajalalla","Laske hitaasti takaisin alas"],e:"Matalampi taso",h:"Käsipainot",w:"Suoraan ylämäkivoimaa tuntureille"},
      {n:"Yhden jalan maastaveto",s:3,r:"8 / jalka",t:"hitaasti",rest:60,c:["Kallista ylävartaloa eteen, vapaa jalka taakse","Selkä suorana, lantio suorassa","Nouse puristamalla pakaraa"],e:"Ota seinästä tuki",h:"Kahvakuula vastakkaisessa kädessä",w:"Takareidet ja tasapaino"},
      {n:"Yhden jalan lantionnosto",s:3,r:"10 / jalka",t:"pito 2 s",rest:45,c:["Toinen jalka suorana ilmassa","Työnnä kantapäällä","Lantio pysyy vaakasuorassa"],e:"Kahdella jalalla",h:"Kantapää penkillä",w:"Pakaroiden voima väsyneenä"},
      {n:"Yhden jalan pohjenousu",s:3,r:"12 / jalka",t:"1 s ylös, 3 s alas",rest:45,c:["Suorin polvin portaan reunalla","Täysi liikerata","Lopuksi 1 sarja polvi koukussa (syvä pohje)"],e:"Kahdella jalalla",h:"Käsipaino samassa kädessä",w:"Pohje kantaa maratonin lopussa"},
      {n:"Lankku olkapääkosketuksin",s:3,r:"10 / puoli",t:"rauhallisesti",rest:30,c:["Punnerrusasento, jalat leveämmällä","Kosketa vuorotellen vastakkaista olkapäätä","Lantio ei saa heilua"],e:"Polvet maassa",h:"Jalat lähempänä toisiaan",w:"Keskivartalon kiertojäykkyys"},
    ]},
  C:{name:"Alamäkivoima", when:"Viikot 25–33 · 1× viikossa", time:"30 min", goal:"Valmistaa reidet tunturin alamäkiin. Nutsissa jalat hajoavat yleensä alamäissä, eivät ylämäissä.",
    ex:[
      {n:"Hidas lasku portaalta",s:3,r:"8 / jalka",t:"4 s alas",rest:60,c:["Seiso portaalla yhdellä jalalla","Laske toisen jalan kantapää lattiaan 4 sekunnissa","Polvi pysyy linjassa, ei kierry sisään"],e:"Matalampi porras",h:"Korkeampi taso tai paino",w:"Eksentrinen voima = alamäkikestävyys"},
      {n:"Bulgarialainen askelkyykky",s:3,r:"8 / jalka",t:"3 s alas",rest:90,c:["Kuten ohjelmassa B","Painot käsiin","Hidas, hallittu lasku"],e:"Ilman painoja",h:"Raskaammat painot",w:"Reisien voima"},
      {n:"Seinäistunta",s:3,r:"45–60 s",t:"pito",rest:45,c:["Selkä seinää vasten","Reidet vaakatasossa, polvet 90°","Paino kantapäillä"],e:"Korkeampi asento",h:"Yhdellä jalalla 15 s / jalka",w:"Reisien sitkeys pitkiin laskuihin"},
      {n:"Hyppykyykky",s:3,r:"8",t:"räjähtävä ylös, pehmeä alas",rest:60,c:["Kyykkyyn ja räjähtävä hyppy ylös","Laskeudu pehmeästi päkiöiden kautta","Jatka suoraan seuraavaan"],e:"Nousu varpaille hypyn sijaan",h:"Korkeampi hyppy",w:"Jalkojen jousto ja reaktiivisuus"},
      {n:"Nilkkahypyt (pogo)",s:3,r:"20 s",t:"nopea",rest:40,c:["Pienet nopeat hypyt päkiöillä","Polvet lähes suorina","Kosketus maahan mahdollisimman lyhyt"],e:"Hyppy paikallaan hitaammin",h:"Yhdellä jalalla",w:"Akillesjänteen jousto ja kivikkojuoksu"},
      {n:"Yhden jalan pohjenousu",s:3,r:"15 / jalka",t:"3 s alas",rest:45,c:["Kuten ohjelmassa B","Täysi liikerata","Hidas lasku"],e:"Kahdella jalalla",h:"Käsipaino",w:"Pohkeet kestävät 66 km"},
      {n:"Kylkilankku",s:3,r:"45 s / puoli",t:"pito",rest:30,c:["Kyynärpää olkapään alla","Lantio ylhäällä","Ylempi jalka voi nousta"],e:"Polvi maassa",h:"Jalan nosto",w:"Lantion tuki väsyneenä"},
    ]},
  D:{name:"Pikapaketti 10 min", when:"Lenkin perään tai kiireisenä päivänä", time:"10 min", goal:"Kun aikaa on vähän: tärkeimmät liikkeet nilkoille, pohkeille ja keskivartalolle.",
    ex:[
      {n:"Pohjenousu portaalla",s:2,r:"15",t:"3 s alas",rest:20,c:["Polvet suorina","Täysi liikerata","Hidas lasku"],e:"Kahdella jalalla",h:"Yhdellä jalalla",w:"Akillesjänne"},
      {n:"Yhden jalan seisonta",s:2,r:"30 s / jalka",t:"pito",rest:10,c:["Polvi pehmeänä","Silmät kiinni, jos helppoa","Lantio suorassa"],e:"Tuki sormilla",h:"Silmät kiinni",w:"Nilkan hallinta"},
      {n:"Lankku",s:2,r:"30 s",t:"pito",rest:20,c:["Suora linja","Vatsa tiukkana","Hengitä"],e:"Polvet maassa",h:"60 s",w:"Keskivartalo"},
      {n:"Kylkilankku",s:1,r:"20 s / puoli",t:"pito",rest:10,c:["Lantio ylhäällä","Suora linja","Hengitä"],e:"Polvi maassa",h:"Jalan nosto",w:"Lantion tuki"},
    ]},
};
const PROGRESS = ["Viikot 1–2: tee 2 sarjaa jokaisesta liikkeestä. Opettele tekniikka.","Kun viimeinen sarja tuntuu helpolta kahdella peräkkäisellä kerralla, lisää 2 toistoa tai 2–4 kg.","Kevyellä viikolla tee 2 sarjaa.","Ei raskasta jalkatreeniä päivää ennen pitkää lenkkiä.","Lihasarkuus 1–2 päivää on normaalia. Nivel- tai jännekipu ei ole: kevennä ja kirjaa kipu."];
const LS_WO="pallas.workout.v1";
let wo = load(LS_WO, null); // {p, d:{exIdx:[bool]}, started}
let restT=null, restLeft=0;
function progForWeek(w){ return w<=16?"A":w<=24?"B":"C"; }
function progFromText(text,w){ const m=(text||"").match(/lihaskunto\s+([ABCD])\b/i); return m?m[1].toUpperCase():progForWeek(w); }
let opasProg=null;
function renderStrength(){
  const t=T0(); const cur=progForWeek(weekOf(t)); const p = opasProg || (wo&&wo.p) || cur; const P=STRENGTH[p];
  $("sProgs").innerHTML=Object.keys(STRENGTH).map(k=>`<button data-prog="${k}" aria-pressed="${k===p}">${k} · ${STRENGTH[k].name}${k===cur?" ★":""}</button>`).join("");
  const active = wo && wo.p===p;
  const doneSets = active ? Object.values(wo.d).flat().filter(Boolean).length : 0, allSets=P.ex.reduce((a,e)=>a+e.s,0);
  $("sHead").innerHTML=`<h3>${p} · ${P.name}</h3><p class="tip">${esc(P.when)} · noin ${P.time}</p><p class="target">${esc(P.goal)}</p><p class="tip">🔥 ${esc(WARMUP)}</p>`;
  const curEx= active ? P.ex.findIndex((e,i)=>(wo.d[i]||[]).filter(Boolean).length<e.s) : -1;
  $("sList").innerHTML=P.ex.map((e,i)=>{ const d=active?(wo.d[i]||[]):[]; const nd=d.filter(Boolean).length; const finished=active&&nd>=e.s;
    return `<li class="ex${finished?" fin":""}${i===curEx?" cur":""}" id="ex${i}"><details${i===curEx?" open":""}><summary class="exhead"><span class="exn">${finished?"✓":i+1}</span><div><b>${esc(e.n)}</b><div class="dose"><span>${e.s} × ${esc(e.r)}</span>${active?`<span>${nd}/${e.s}</span>`:`<span>lepo ${e.rest} s</span>`}</div></div></summary>
      <div class="exbody"><p class="tip">${esc(e.t)} · lepo ${e.rest} s · ${esc(e.w)}</p><ul class="cues">${e.c.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <p class="tip"><b>Helpompi:</b> ${esc(e.e)} · <b>Vaikeampi:</b> ${esc(e.h)}</p>
      ${active?`<div class="sets">${Array.from({length:e.s},(_,k)=>`<button class="set" data-set="${i}:${k}" aria-pressed="${!!d[k]}">Sarja ${k+1}${d[k]?" ✓":""}</button>`).join("")}</div>`:""}</div></details></li>`; }).join("");
  $("sList").classList.toggle("active",!!active);
  $("sStart").hidden=active; $("sFinish").hidden=!active; $("sCancel").hidden=!active;
  $("sStart").textContent = wo&&wo.p!==p ? `Aloita ${p} (keskeneräinen ${wo.p} poistuu)` : `Aloita treeni ${p}`;
  $("sProgress").textContent = active?`${doneSets}/${allSets} sarjaa tehty`:"";
  $("sRules").innerHTML=PROGRESS.map(x=>`<li>${esc(x)}</li>`).join("");
  const cnt=entries().filter(e=>e.l.strength).length; $("sCount").textContent=cnt?`Lihaskuntotreenejä kirjattu: ${cnt}`:"";
}
function saveWo(){ try{ wo?localStorage.setItem(LS_WO,JSON.stringify(wo)):localStorage.removeItem(LS_WO); }catch(e){} }
function startRest(sec){ clearInterval(restT); restLeft=sec; $("restBar").hidden=false; tick(); restT=setInterval(tick,1000);
  function tick(){ $("restTxt").textContent=`Lepo ${restLeft} s`; $("restFill").style.width=`${Math.max(0,restLeft/sec*100)}%`; if(restLeft<=0){ clearInterval(restT); $("restTxt").textContent="Seuraava sarja!"; if(navigator.vibrate) navigator.vibrate([80,60,80]); setTimeout(()=>$("restBar").hidden=true,2500); } restLeft--; } }
document.addEventListener("click",e=>{
  const pr=e.target.closest("[data-prog]"); if(pr){ opasProg=pr.dataset.prog; renderStrength(); return; }
  const st=e.target.closest("[data-set]"); if(st&&wo){ const [i,k]=st.dataset.set.split(":").map(Number); wo.d[i]=wo.d[i]||[]; wo.d[i][k]=!wo.d[i][k]; saveWo(); const ex=STRENGTH[wo.p].ex[i]; const fin=wo.d[i].filter(Boolean).length>=ex.s; if(wo.d[i][k]) startRest(ex.rest); renderStrength(); if(wo.d[i][k]&&fin){ const n=$("sList").querySelector(".ex.cur"); if(n) setTimeout(()=>n.scrollIntoView({behavior:"smooth",block:"center"}),60); } return; }
  const go=e.target.closest("[data-gostrength]"); if(go){ opasProg=go.dataset.gostrength; location.hash="#opas"; setTimeout(()=>$("strength").scrollIntoView({behavior:"smooth"}),80); }
});
$("sStart").onclick=()=>{ const p=opasProg||progForWeek(weekOf(T0())); wo={p,d:{},started:new Date().toISOString()}; saveWo(); renderStrength(); const n=$("sList").querySelector(".ex.cur"); (n||$("sList")).scrollIntoView({behavior:"smooth",block:"center"}); };
$("sCancel").onclick=()=>{ wo=null; saveWo(); clearInterval(restT); $("restBar").hidden=true; renderStrength(); };
$("restSkip").onclick=()=>{ clearInterval(restT); $("restBar").hidden=true; };
$("sFinish").onclick=()=>{
  const P=STRENGTH[wo.p]; const done=Object.values(wo.d).flat().filter(Boolean).length, all=P.ex.reduce((a,e)=>a+e.s,0);
  const t=todayIdx(); if(t<0||t>=BASE.length){ wo=null; saveWo(); renderStrength(); return; }
  const key=isoOfIdx(t); const code=BASE[t][0]; const prev=logs[key]||{};
  const strengthy=["T","TL","K","SL","LH"].includes(code); const mins=Math.round((Date.now()-new Date(wo.started).getTime())/60000);
  const doc={...prev, type:prev.type||code, strength:wo.p, strengthSets:`${done}/${all}`, status: prev.status && prev.status!=="note" ? prev.status : (strengthy?"done":(prev.status||"note")), flags:prev.flags||[], note: prev.note||"", min: prev.min ?? (strengthy?Math.min(mins,120):prev.min??null), updatedAt:new Date().toISOString()};
  logs[key]=doc; persist(); wo=null; saveWo(); clearInterval(restT); $("restBar").hidden=true; render(); celebrate(); toast(`Lihaskunto ${doc.strength} kirjattu (${done}/${all} sarjaa). 💪`);
};


