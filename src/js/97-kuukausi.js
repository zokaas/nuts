/* ===== v11: kuukausikatsaus ===== */
const KK=["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"];
const KKP=["tammikuuhun","helmikuuhun","maaliskuuhun","huhtikuuhun","toukokuuhun","kesäkuuhun","heinäkuuhun","elokuuhun","syyskuuhun","lokakuuhun","marraskuuhun","joulukuuhun"];
function mIso(y,m){ return `${y}-${String(m+1).padStart(2,"0")}-01`; }
function mPrev(y,m){ return m?[y,m-1]:[y-1,11]; } function mNext(y,m){ return m===11?[y+1,0]:[y,m+1]; }
function monthSum(y,m){ const ti=todayIdx(); const a0=idxOfISO(mIso(y,m)), b=idxOfISO(mIso(...mNext(y,m)))-1, a=Math.max(FIRST,a0); const upto=Math.min(b,ti);
  if(b<0||a0>ti) return null;
  let plan=0,done=0,km=0,min=0,longKm=0,cont=0;
  for(let i=a;i<=Math.min(upto,BASE.length-1);i++) for(const s of sessionsOn(BASE,logs,ADAPT,i)){ if(s.code!=="L") plan++; }
  entries().forEach(e=>{ if(e.idx<a||e.idx>b||e.l.status!=="done"||e.code==="L") return; done++; if(typeof e.l.min==="number") min+=e.l.min;
    if(RUN.has(e.code)){ if(typeof e.l.km==="number"){ km+=e.l.km; longKm=Math.max(longKm,e.l.km); } const c=contOf(e); if(c!=null) cont=Math.max(cont,c); } });
  let need=0,got=0,full=0,days=0; const hs=habits().filter(h=>!h.off&&!h.task);
  for(let i=a;i<=upto;i++){ const req=hs.filter(h=>{ const on=habitOn(h,i); return on&&!on.opt; }); if(!req.length) continue; days++; let k=0; req.forEach(h=>{ need++; if(habDone(h.id,i)){ got++; k++; } }); if(k===req.length) full++; }
  const rh=[],sl=[]; for(let i=a;i<=upto;i++){ const l=logs[isoOfIdx(i)]; if(l&&typeof l.rhr==="number") rh.push(l.rhr); if(l&&typeof l.sleepH==="number") sl.push(l.sleepH); }
  const av=x=>x.length?x.reduce((s,v)=>s+v,0)/x.length:null;
  return {y,m,a,b,open:b>ti,plan,done,km,min,longKm,cont,need,got,full,days,rhr:av(rh),sleep:av(sl)}; }
function monthHigh(S){ const c=[];
  if(S.cont>=30) c.push(`Juoksit <b>${S.cont} min yhtäjaksoisesti</b>. Se on jo kunnon lenkki.`);
  else if(S.cont>=10) c.push(`Pisin yhtäjaksoinen juoksu: <b>${S.cont} min</b>.`);
  if(S.plan>=4&&S.done/S.plan>=.9) c.push(`Teit <b>${S.done}/${S.plan}</b> suunnitellusta treenistä. Juuri tämä tasaisuus rakentaa Nutsin.`);
  if(S.longKm>=10) c.push(`Pisin lenkki <b>${n1(S.longKm)} km</b>.`);
  if(S.days>=7&&S.full/S.days>=.8) c.push(`Tavat kunnossa <b>${S.full}/${S.days}</b> päivänä.`);
  if(!c.length&&S.done) c.push(`<b>${S.done} treeniä</b> tehty. Jokainen niistä on askel kohti Pallasta.`);
  return c[0]||""; }
function monthHTML(S,{nav=false,compact=false,title=null}={}){ if(!S) return "";
  const P=monthSum(...mPrev(S.y,S.m)); const pct=S.need?Math.round(S.got/S.need*100):null; const hrs=S.min/60;
  const d=(v,u,f=x=>x)=>v>0?`<span class="up">+${f(v)}${u}</span>`:v<0?`<span class="dn">${f(v)}${u}</span>`:`±0${u}`;
  const cmp=P&&(P.done||P.km)?`<p class="mdelta">Verrattuna ${KKP[P.m]}: treenejä ${d(S.done-P.done,"")}, juoksua ${d(Math.round((S.km-P.km)*10)/10," km",n1)}${S.open?" (kuukausi kesken)":""}</p>`:"";
  const tiles=[[`Treenit`,`${S.done}${S.plan?`/${S.plan}`:""}`],["Juostu",`${n1(S.km)} km`],["Liikuntaa",hrs>=1?`${n1(hrs)} h`:`${Math.round(S.min)} min`],
    S.cont?["Pisin putki",`${S.cont} min`]:["Pisin lenkki",`${n1(S.longKm)} km`], pct!=null?["Tavat",`${pct} %`]:null, S.rhr!=null?["Leposyke ka",`${Math.round(S.rhr)}`]:S.sleep!=null?["Uni ka",`${n1(S.sleep)} h`]:null].filter(Boolean);
  const hi=monthHigh(S);
  const [py,pm]=mPrev(S.y,S.m), [ny,nm]=mNext(S.y,S.m); const ti=todayIdx();
  const canP=idxOfISO(mIso(S.y,S.m))>FIRST, canN=idxOfISO(mIso(ny,nm))<=ti;
  return `<div class="mhead"><h2>${title||KK[S.m]}${title?"":S.y!==new Date().getFullYear()?` ${S.y}`:""}${S.open?` <small class="tip">kesken</small>`:""}</h2>${nav?`<span class="mnav"><button type="button" data-mon="${py}-${pm}" aria-label="Edellinen kuukausi" ${canP?"":"disabled"}>‹</button><button type="button" data-mon="${ny}-${nm}" aria-label="Seuraava kuukausi" ${canN?"":"disabled"}>›</button></span>`:""}</div>
    ${hi?`<p class="mhi">${hi}</p>`:""}
    <div class="tiles mtiles">${tiles.slice(0,compact?4:6).map(([k,v])=>`<div class="tile"><span>${k}</span><b class="num">${v}</b></div>`).join("")}</div>${cmp}`; }
let monSel=null;
function renderMonth(){ const el=$("aMonth"); if(!el) return; const n=new Date(); if(!monSel) monSel=[n.getFullYear(),n.getMonth()];
  const S=monthSum(...monSel); el.hidden=!S; el.innerHTML=`<div class="eyebrow">Kuukausikatsaus</div>`+monthHTML(S,{nav:true}); }
function renderMonthCard(){ const el=$("monthCard"); if(!el) return; const n=new Date(); const [py,pm]=mPrev(n.getFullYear(),n.getMonth()); const key=`${py}-${pm}`;
  const show=n.getDate()<=3&&meta.monthSeen!==key; const S=show?monthSum(py,pm):null; el.hidden=!(S&&(S.done||S.plan));
  if(!el.hidden) el.innerHTML=monthHTML(S,{compact:true,title:`${KK[pm]} takana`})+`<div class="row"><button class="btn ghost" data-monseen="${key}">Selvä, piilota</button></div>`; }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-mon]"); if(b&&!b.disabled){ monSel=b.dataset.mon.split("-").map(Number); renderMonth(); return; }
  const s=e.target.closest("[data-monseen]"); if(s){ meta.monthSeen=s.dataset.monseen; persist(); renderMonthCard(); } });

