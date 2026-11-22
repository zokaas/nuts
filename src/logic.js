/* ===== Ohjelmalogiikka: mukautuva ohjelma, varoitukset, analyysi ===== */
const START_UTC = Date.UTC(2026, 10, 17); // ti 17.11.2026 = indeksi 0
const TARGET = [0,12,12,20,22,23,27,9,13,12,31,25,36,40,45,33,53,57,61,46,34,56,5,28,44,54,61,40,65,70,44,55,50,43,25,10];
const RUN = new Set(["J","JL","P","X","R"]);
const KEY = new Set(["P","X","R"]);
const TIRED_FLAGS = ["tired","sleep","stress","hangover"];
function idxOfISO(s){ const [y,m,d]=s.slice(0,10).split("-").map(Number); return Math.round((Date.UTC(y,m-1,d)-START_UTC)/864e5); }
function isoOfIdx(i){ return new Date(START_UTC + i*864e5).toISOString().slice(0,10); }
function weekOf(i){ return Math.floor((i+1)/7)+1; }
function weekRange(w){ const a=(w-1)*7-1; return [Math.max(0,a), a+6]; }
function flagsOf(l){ if(!l) return []; const f=Array.isArray(l.flags)?l.flags.slice():[]; if(l.pain && !f.includes("pain")) f.push("pain"); return f; }
function painLevel(l){ if(!l) return 0; const f=flagsOf(l); if(!f.includes("pain")) return 0; return l.painLevel||2; }
function hasIntensity(text){ return /veto|vedo|maratonvauh|reippaa|sykkeen nosto|kovaa|kynnys|tavoiteteho|TESTI/i.test(text||""); }
function scaleText(code, text, f, noInt){
  const m = (text||"").match(/(\d+(?:[,.]\d+)?)(?:[–-](\d+(?:[,.]\d+)?))?\s?(km|min|h)\b/);
  let qty="";
  if(m){ const v=parseFloat((m[2]||m[1]).replace(",",".")); let s=v*f;
    if(m[3]==="km") s=Math.max(2,Math.round(s)); else if(m[3]==="min") s=Math.max(15,Math.round(s/5)*5); else s=Math.max(.5,Math.round(s*2)/2);
    qty=`${String(s).replace(".",",")} ${m[3]}`; }
  else qty = "20–30 min";
  const base = code==="P" ? `Lyhennetty pitkä: ${qty} rauhallisesti, kävele ylämäet.` : `${qty} ${noInt?"hyvin kevyesti, ei vetoja":"rauhallisesti"}.`;
  const lk=(text||"").match(/lihaskunto\s+([A-D])\b/i);
  return base + (lk && code!=="P" ? ` Perään lihaskunto ${lk[1].toUpperCase()}.` : "");
}
/* Mukautukset: lasketaan päivä kerrallaan, koska väliin jääneet riippuvat aiemmista mukautuksista. */
function buildAdapt(plan, logs, adjOff, today){
  const upto = today + 21;
  const res = {}; // idx -> {code,text,reason,kind}
  const last = Math.min(plan.length-1, upto);
  const logAt = i => logs[isoOfIdx(i)];
  for(let i=0;i<=last;i++){
    if(adjOff && adjOff[isoOfIdx(i)]) continue;
    const [code,text] = plan[i]; if(code==="L"||code==="R") { /* kisapäivää ei muuteta */ 
      if(code==="R"){ const s=lastFlag(i,"sick",2); if(s>=0) res[i]={code, text, reason:"Olet ollut sairaana aivan kisan alla. Mieti, onko starttaaminen järkevää.", kind:"note"}; }
      continue; }
    // 1) sairaus
    const ls = lastFlag(i,"sick",14);
    if(ls>=0){
      if(ls>=i-1){ res[i]={code:"L", text:"Sairaana: lepoa. Kevyt kävely ok, jos oireet ovat vain kaulan yläpuolella eikä ole kuumetta.", reason:"Sairaus", kind:"sick"}; continue; }
      let len=0; for(let k=ls;k>=Math.max(0,ls-14);k--){ if(flagsOf(logAt(k)).includes("sick")) len++; else if(k<ls-1) break; }
      let fev=false; for(let k=ls;k>=Math.max(0,ls-len-1);k--){ if(flagsOf(logAt(k)).includes("fever")) fev=true; }
      const rec = sickRec(len,fev); const since = i-ls;
      if(since<=rec){ if(RUN.has(code)||code==="PT"){ const f = since<=Math.ceil(rec/2)?0.5:0.75; res[i]={code: code==="X"?"J":code, text: scaleText(code,text,f,true)+(code==="X"?" Testi siirtyy myöhemmäksi.":""), reason:`Paluu sairastelusta (${len} pv): ${Math.round(f*100)} % määrästä, ei vetoja`, kind:"sick"}; }
        else if(/Tribe|kuntopiiri|Kuntopiiri/.test(text)) res[i]={code:"S", text:"Kevyt spinning tai kävely 30 min.", reason:"Paluu sairastelusta", kind:"sick"};
        continue; }
    }
    // 2) kipu
    let lp=-1, lvl=0, painDays=0;
    for(let k=i;k>=Math.max(0,i-7);k--){ const pl=painLevel(logAt(k)); if(pl){ if(lp<0){ lp=k; lvl=pl; } if(k>=i-3) painDays++; } }
    if(lp>=0 && RUN.has(code)){
      const d=i-lp, severe = lvl>=3 || painDays>=2;
      if(severe && d<=3){ res[i]={code:"S", text:"Ei juoksua. Spinning tai kävely 30–45 min, jos se on kivutonta.", reason:`Kipu (${painArea(logAt(lp))}): juoksutauko`, kind:"pain"}; continue; }
      if(severe && d<=6){ res[i]={code:code==="X"?"J":code, text:scaleText(code,text,0.5,true), reason:"Varovainen paluu kivusta: 50 %, ei vetoja. Lopeta, jos kipu palaa.", kind:"pain"}; continue; }
      if(lvl===2 && d<=2){ res[i]={code:code==="X"?"J":code, text:scaleText(code,text,code==="P"?0.6:0.5,true), reason:`Kipu (${painArea(logAt(lp))}): kevennetty`, kind:"pain"}; continue; }
      if(lvl===1 && d<=1 && hasIntensity(text)){ res[i]={code, text:scaleText(code,text,1,true), reason:"Lievä kipu: tänään ilman vetoja, seuraa tilannetta", kind:"pain"}; continue; }
    }
    // 3) monta väliin jäänyttä
    let missed=0; for(let k=Math.max(0,i-7);k<i;k++){ if(isMissed(k)) missed++; }
    if(missed>=3 && RUN.has(code) && i>=today && i<=today+6){ res[i]={code:code==="X"?code:code, text:scaleText(code,text,0.8,hasIntensity(text)), reason:`${missed} treeniä väliin viikon sisällä: maltillinen paluu (80 %)`, kind:"missed"}; continue; }
    // 4) väsymys, uni, stressi, darra, leposyke
    let tired=0; for(let k=Math.max(0,i-2);k<=i;k++) tired+=flagsOf(logAt(k)).filter(f=>TIRED_FLAGS.includes(f)).length;
    const rhrHigh = rhrElevated(i);
    const feels=[]; for(let k=i-1;k>=Math.max(0,i-10)&&feels.length<3;k--){ const l=logAt(k); if(l&&l.status==="done"&&typeof l.feel==="number") feels.push(l.feel); }
    const lowFeel = feels.length===3 && feels.reduce((a,b)=>a+b,0)/3<=2;
    if((tired>=2||rhrHigh||lowFeel) && RUN.has(code) && (hasIntensity(text)||code==="P"||code==="X")){
      const f = code==="P" && (tired>=3||rhrHigh) ? 0.75 : 1;
      res[i]={code:code==="X"?"J":code, text:scaleText(code,text,f,true)+(code==="X"?" Testi myöhemmin, kun olet levännyt.":""), reason: rhrHigh?"Leposyke koholla: kevyt päivä":lowFeel?"Treenit tuntuneet raskailta: kevyt päivä":"Väsymys, uni tai stressi: kevyt päivä", kind:"tired"}; continue;
    }
  }
  return res;
  function lastFlag(i,flag,win){ for(let k=i;k>=Math.max(0,i-win);k--){ if(flagsOf(logAt(k)).includes(flag)) return k; } return -1; }
  function isMissed(k){ const eff = res[k] ? res[k].code : plan[k][0]; if(eff==="L") return false; const l=logAt(k); const fl=flagsOf(l);
    if(fl.includes("sick")||fl.includes("pain")) return false; if(l && l.status==="skip") return true; if(l && (l.status==="done"||l.status==="moved")) return false; return k < today - 1; }
  function rhrElevated(i){ const l=logAt(i); if(!l||typeof l.rhr!=="number") return false; const vals=[]; for(let k=i-1;k>=Math.max(0,i-21);k--){ const x=logAt(k); if(x&&typeof x.rhr==="number") vals.push(x.rhr); } if(vals.length<4) return false; vals.sort((a,b)=>a-b); const med=vals[Math.floor(vals.length/2)]; return l.rhr>=med+7; }
}
function painArea(l){ return (l&&l.painArea)||"kipu"; }
function effective(plan, adapt, i){ const [c,t,n]=plan[i]; const a=adapt[i]; return a? {code:a.code, text:a.text, note:n, orig:{code:c,text:t}, reason:a.reason, kind:a.kind} : {code:c, text:t, note:n}; }
function logType(plan, key, l){ if(l && l.type) return l.type; const i=idxOfISO(key); if(key.endsWith("~m")) return plan[i-1]?plan[i-1][0]:"J"; return plan[i]?plan[i][0]:"L"; }
function weekKm(plan, logs, w){ const [a,b]=weekRange(w); let s=0; for(const k in logs){ const i=idxOfISO(k); if(i<a||i>b) continue; const l=logs[k]; if(l.status==="done" && RUN.has(logType(plan,k,l)) && typeof l.km==="number") s+=l.km; } return Math.round(s*10)/10; }
function sessionsOn(plan, logs, adapt, i){
  const out=[]; if(i<0||i>=plan.length) return out;
  const e=effective(plan,adapt,i); out.push({key:isoOfIdx(i), idx:i, ...e, moved:false});
  if(i>0){ const pl=logs[isoOfIdx(i-1)]; if(pl && pl.status==="moved"){ const pe=effective(plan,adapt,i-1); out.push({key:isoOfIdx(i)+"~m", idx:i, code:pe.code, text:pe.text, note:"Siirretty edelliseltä päivältä", moved:true}); } }
  return out;
}
function computeWarnings(plan, logs, adapt, today){
  const out=[]; const add=(level,title,detail)=>out.push({level,title,detail});
  if(today<1) return out;
  let missed=0, keyMissed=0;
  for(let i=Math.max(0,today-7); i<today && i<plan.length; i++){
    for(const s of sessionsOn(plan,logs,adapt,i)){ if(s.code==="L") continue; const l=logs[s.key]; const fl=flagsOf(l);
      if(fl.includes("sick")||fl.includes("pain")) continue;
      const m=(l&&l.status==="skip")||((!l||!["done","moved","skip"].includes(l.status)) && i<today-1); if(m){ missed++; if(KEY.has(s.code)) keyMissed++; } }
  }
  if(missed>=3) add("crit",`${missed} treeniä väliin viimeisen viikon aikana`,"Ohjelma on kevennetty automaattisesti seuraaville päiville. Älä yritä kuroa kiinni.");
  else if(missed===2) add("warn","2 treeniä väliin viimeisen viikon aikana","Pidä seuraavat treenit kiinni. Kolmas väliin jäänyt keventää ohjelmaa.");
  if(keyMissed) add("warn","Pitkä lenkki tai testi jäi väliin","Tee seuraava pitkä normaalisti, älä tuplaa.");
  const y=today-1; if(y>=0 && y<plan.length && sessionsOn(plan,logs,adapt,y).some(s=>s.code!=="L" && !logs[s.key])) add("info","Eilinen treeni on kirjaamatta","Kuittaa se, merkitse väliin jääneeksi tai siirrä tälle päivälle.");
  const lw=weekOf(today)-1;
  if(lw>=1 && lw<=36){ const act=weekKm(plan,logs,lw), tgt=(typeof TARGET_EFF!=="undefined"?TARGET_EFF:TARGET)[lw-1];
    if(tgt>=10 && act<0.7*tgt && !recentFlag(logs,today,"sick",10)) add("warn",`Viikko ${lw}: ${act} / ${tgt} km`,"Juoksukilometrit jäivät alle 70 % tavoitteesta.");
    if(tgt>=5 && act>1.2*tgt) add("warn",`Viikko ${lw}: ${act} km, tavoite ${tgt} km`,"Yli 20 % yli ohjelman. Liian nopea nousu on yleisin rasitusvammojen syy.");
  }
  // kuorman tasapaino (akuutti 7 pv vs krooninen 28 pv)
  const acwr = loadRatio(plan,logs,today); if(acwr && acwr.ratio>1.5 && acwr.acute>=15) add("warn","Kuorma nousi jyrkästi",`Viimeiset 7 pv ${acwr.acute} km, kun 4 viikon keskiarvo on ${acwr.chronic} km/vk. Pidä seuraavat päivät kevyinä.`);
  // kipu toistuu samassa paikassa
  const areas={}; for(let k=Math.max(0,today-14);k<=today;k++){ const l=logs[isoOfIdx(k)]; if(painLevel(l)){ const a=painArea(l); areas[a]=(areas[a]||0)+1; } }
  for(const a in areas) if(areas[a]>=3) add("crit",`Kipu toistuu: ${a} (${areas[a]}× 2 viikossa)`,"Toistuva kipu samassa paikassa on rasitusvamman merkki. Varaa aika fysioterapeutille.");
  if(recentFlag(logs,today,"sick",1)) add("info","Sairastuminen kirjattu","Ohjelma on vaihdettu lepoon ja sen jälkeen kevyeen paluuseen. Kirjaa, kun olet taas terve.");
  const act = Object.keys(adapt).map(Number).filter(i=>i>=today&&i<=today+7&&adapt[i].kind!=="note");
  if(act.length) add("info",`Ohjelmaa mukautettu ${act.length} päivälle`,[...new Set(act.map(i=>adapt[i].reason))].join(" · "));
  return out;
}
/* Paluun pituus: 2 pv jokaista sairaspäivää kohden; kuumeen jälkeen vähintään viikko. */
function sickRec(len,fev){ return fev ? Math.min(14, Math.max(7, len*2)) : Math.min(10, Math.max(3, len*2)); }
function recentFlag(logs,today,flag,win){ for(let k=today;k>=Math.max(0,today-win);k--){ if(flagsOf(logs[isoOfIdx(k)]).includes(flag)) return true; } return false; }
function loadRatio(plan,logs,today){ const kmDay=k=>{ let s=0; const d=isoOfIdx(k); for(const key in logs){ if(key.slice(0,10)!==d) continue; const l=logs[key]; if(l&&l.status==="done"&&RUN.has(logType(plan,key,l))&&typeof l.km==="number") s+=l.km; } return s; };
  if(today<21) return null; let a=0,c=0; for(let k=today-6;k<=today;k++) a+=kmDay(k); for(let k=today-27;k<=today;k++) c+=kmDay(k); c=c/4; if(c<5) return null; return {acute:Math.round(a), chronic:Math.round(c), ratio:a/c}; }
if(typeof module!=="undefined") module.exports={buildAdapt,computeWarnings,weekKm,sessionsOn,effective,idxOfISO,isoOfIdx,weekOf,weekRange,TARGET,RUN,scaleText,loadRatio,sickRec,hasIntensity};
